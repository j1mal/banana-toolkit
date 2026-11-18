use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryEntry {
    pub id: String,
    pub name: String,
    pub owner: String,
    pub manifest_url: String,
    pub fingerprint: String,
    pub public_key_armored: String,
    pub signature_asc: Option<String>,
    pub enabled: bool,
    pub trusted: bool,
    pub pgp_verified: bool,
    pub last_synced: Option<String>,
    pub recipe_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledVaultItem {
    pub id: String,
    pub recipe_id: String,
    pub name: String,
    pub version: String,
    pub author: String,
    pub library_id: String,
    pub library_name: String,
    pub category: String,
    pub description: String,
    pub install_path: String,
    pub installed_at: String,
    pub pgp_verified: bool,
    pub fingerprint: String,
    pub manifest_sha256: String,
    pub executable_hint: String,
    pub manifest_json: String,
    pub signature_asc: String,
    pub public_key_armored: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LibrariesConfigFile {
    pub schema_version: u32,
    pub updated_at: String,
    pub libraries: Vec<LibraryEntry>,
    #[serde(default)]
    pub vault: Vec<InstalledVaultItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigLoadResult {
    pub first_launch: bool,
    pub config_path: String,
    pub workspace_dir: String,
    pub config: LibrariesConfigFile,
}

pub fn get_config_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app_data_dir: {e}"))?;
    fs::create_dir_all(&app_data)
        .map_err(|e| format!("Failed to create app data directory: {e}"))?;
    Ok(app_data.join("libraries.json"))
}

pub fn get_vault_workspace_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app_data_dir: {e}"))?;
    let vault_dir = app_data.join("vault");
    fs::create_dir_all(&vault_dir)
        .map_err(|e| format!("Failed to create vault directory: {e}"))?;
    Ok(vault_dir)
}

#[tauri::command]
pub async fn load_or_init_config(app: AppHandle) -> Result<ConfigLoadResult, String> {
    let config_path = get_config_file_path(&app)?;
    let workspace_dir = get_vault_workspace_dir(&app)?;

    if !config_path.exists() {
        let empty_config = LibrariesConfigFile {
            schema_version: 1,
            updated_at: Utc::now().to_rfc3339(),
            libraries: Vec::new(),
            vault: Vec::new(),
        };
        return Ok(ConfigLoadResult {
            first_launch: true,
            config_path: config_path.to_string_lossy().to_string(),
            workspace_dir: workspace_dir.to_string_lossy().to_string(),
            config: empty_config,
        });
    }

    let raw = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read libraries.json: {e}"))?;
    let parsed: LibrariesConfigFile = serde_json::from_str(&raw)
        .map_err(|e| format!("Failed to parse libraries.json: {e}"))?;

    Ok(ConfigLoadResult {
        first_launch: false,
        config_path: config_path.to_string_lossy().to_string(),
        workspace_dir: workspace_dir.to_string_lossy().to_string(),
        config: parsed,
    })
}

#[tauri::command]
pub async fn save_library_config(
    app: AppHandle,
    mut config: LibrariesConfigFile,
) -> Result<ConfigLoadResult, String> {
    let config_path = get_config_file_path(&app)?;
    let workspace_dir = get_vault_workspace_dir(&app)?;

    config.updated_at = Utc::now().to_rfc3339();

    let serialized = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize libraries.json: {e}"))?;

    fs::write(&config_path, serialized)
        .map_err(|e| format!("Failed to write libraries.json: {e}"))?;

    Ok(ConfigLoadResult {
        first_launch: false,
        config_path: config_path.to_string_lossy().to_string(),
        workspace_dir: workspace_dir.to_string_lossy().to_string(),
        config,
    })
}

#[tauri::command]
pub async fn reset_onboarding_config(app: AppHandle) -> Result<bool, String> {
    let config_path = get_config_file_path(&app)?;
    if config_path.exists() {
        fs::remove_file(&config_path)
            .map_err(|e| format!("Failed to remove libraries.json: {e}"))?;
    }
    Ok(true)
}

