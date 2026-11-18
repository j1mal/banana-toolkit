use chrono::Utc;
use pgp::composed::{
    ArmorOptions, Deserializable, KeyType, SecretKeyParamsBuilder, SignedPublicKey,
    SignedSecretKey, StandaloneSignature,
};
use pgp::crypto::hash::HashAlgorithm;
use pgp::packet::{SignatureConfig, SignatureType, Subpacket, SubpacketData, UserId};
use pgp::types::{PublicKeyTrait, SecretKeyTrait};
use rand::thread_rng;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use smallvec::smallvec;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PgpVerificationResult {
    pub valid: bool,
    pub fingerprint: String,
    pub key_id: String,
    pub signer_uid: String,
    pub manifest_sha256: String,
    pub verified_at: String,
    pub algorithm: String,
    pub detail_message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DemoPgpBundle {
    pub public_key_armored: String,
    pub signature_asc: String,
    pub fingerprint: String,
    pub manifest_sha256: String,
    pub signer_uid: String,
}

fn format_fingerprint_bytes(bytes: &[u8]) -> String {
    let hex_upper = hex::encode_upper(bytes);
    hex_upper
        .as_bytes()
        .chunks(4)
        .map(|chunk| std::str::from_utf8(chunk).unwrap_or(""))
        .collect::<Vec<&str>>()
        .join(" ")
}

pub fn compute_sha256_hex(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hex::encode(hasher.finalize())
}

fn verify_with_public_key(
    public_key: &SignedPublicKey,
    signature: &StandaloneSignature,
    payload: &[u8],
) -> Result<String, String> {
    if signature
        .verify(&public_key.primary_key, payload)
        .is_ok()
    {
        return Ok(format!("{:?}", public_key.primary_key.algorithm()));
    }

    for subkey in &public_key.public_subkeys {
        if signature.verify(&subkey.key, payload).is_ok() {
            return Ok(format!("{:?}", subkey.key.algorithm()));
        }
    }

    Err("Detached OpenPGP signature did not match primary key or any signing subkey".to_string())
}

/// Pure-Rust OpenPGP detached signature verifier using the `pgp` crate (rPGP 0.14.2).
#[tauri::command]
pub async fn verify_pgp_signature(
    manifest_content: String,
    signature_asc: String,
    public_key_armored: String,
) -> Result<PgpVerificationResult, String> {
    let manifest_sha256 = compute_sha256_hex(manifest_content.as_bytes());
    let now = Utc::now().to_rfc3339();

    let (public_key, _) = SignedPublicKey::from_string(public_key_armored.trim())
        .map_err(|e| format!("Invalid ASCII-armored OpenPGP public key: {e}"))?;

    let (detached_sig, _) = StandaloneSignature::from_string(signature_asc.trim())
        .map_err(|e| format!("Invalid ASCII-armored detached OpenPGP signature (.asc): {e}"))?;

    let fp_bytes = public_key.fingerprint();
    let fingerprint = format_fingerprint_bytes(fp_bytes.as_bytes());
    let key_id = hex::encode_upper(public_key.key_id().as_ref());

    let signer_uid = public_key
        .details
        .users
        .first()
        .map(|u| String::from_utf8_lossy(u.id.id()).to_string())
        .unwrap_or_else(|| "Unknown OpenPGP Signer".to_string());

    match verify_with_public_key(&public_key, &detached_sig, manifest_content.as_bytes()) {
        Ok(algo) => Ok(PgpVerificationResult {
            valid: true,
            fingerprint,
            key_id,
            signer_uid: signer_uid.clone(),
            manifest_sha256,
            verified_at: now,
            algorithm: algo.clone(),
            detail_message: format!(
                "Authentic detached OpenPGP signature verified with {algo} key ({signer_uid})."
            ),
        }),
        Err(reason) => Ok(PgpVerificationResult {
            valid: false,
            fingerprint,
            key_id,
            signer_uid,
            manifest_sha256,
            verified_at: now,
            algorithm: format!("{:?}", public_key.primary_key.algorithm()),
            detail_message: reason,
        }),
    }
}

/// Generates a real Ed25519 OpenPGP public key and detached `.asc` signature over `manifest_content`
/// so built-in catalogs and user test manifests can run genuine cryptographic verification through `verify_pgp_signature`.
#[tauri::command]
pub async fn generate_signed_manifest_bundle(
    manifest_content: String,
    signer_uid: Option<String>,
) -> Result<DemoPgpBundle, String> {
    let uid = signer_uid
        .unwrap_or_else(|| "j1mal (Banana Lib Owner) <j1mal@banana-toolkit.dev>".to_string());
    let mut rng = thread_rng();

    let key_params = SecretKeyParamsBuilder::default()
        .key_type(KeyType::EdDSALegacy)
        .can_sign(true)
        .can_certify(true)
        .primary_user_id(uid.clone())
        .preferred_hash_algorithms(smallvec![HashAlgorithm::SHA2_256])
        .build()
        .map_err(|e| format!("Failed to build OpenPGP key parameters: {e}"))?;

    let secret_key = key_params
        .generate(&mut rng)
        .map_err(|e| format!("Failed to generate Ed25519 OpenPGP secret key: {e}"))?;

    let signed_secret: SignedSecretKey = secret_key
        .sign(&mut rng, || String::new())
        .map_err(|e| format!("Failed to self-sign secret key: {e}"))?;

    let public_key = signed_secret.public_key();
    let signed_public: SignedPublicKey = public_key
        .sign(&mut rng, &signed_secret.primary_key, || String::new())
        .map_err(|e| format!("Failed to sign public key certificate: {e}"))?;

    let mut sig_config = SignatureConfig::v4(
        SignatureType::Binary,
        signed_secret.primary_key.algorithm(),
        HashAlgorithm::SHA2_256,
    );
    sig_config.hashed_subpackets = vec![
        Subpacket::regular(SubpacketData::SignatureCreationTime(Utc::now())),
        Subpacket::regular(SubpacketData::Issuer(signed_secret.key_id())),
        Subpacket::regular(SubpacketData::IssuerFingerprint(
            signed_secret.fingerprint(),
        )),
    ];

    let signature_packet = sig_config
        .sign(
            &signed_secret.primary_key,
            || String::new(),
            manifest_content.as_bytes(),
        )
        .map_err(|e| format!("Failed to sign manifest payload: {e}"))?;

    let standalone_sig = StandaloneSignature::new(signature_packet);

    let public_key_armored = signed_public
        .to_armored_string(ArmorOptions::default())
        .map_err(|e| format!("Failed to armor public key: {e}"))?;

    let signature_asc = standalone_sig
        .to_armored_string(ArmorOptions::default())
        .map_err(|e| format!("Failed to armor detached signature: {e}"))?;

    let fingerprint = format_fingerprint_bytes(signed_public.fingerprint().as_bytes());
    let manifest_sha256 = compute_sha256_hex(manifest_content.as_bytes());

    let _ = UserId::from_str(Default::default(), &uid);

    Ok(DemoPgpBundle {
        public_key_armored,
        signature_asc,
        fingerprint,
        manifest_sha256,
        signer_uid: uid,
    })
}
