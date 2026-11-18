import { LibraryEntry, RecipeCatalogItem } from "../types/toolkit";

export const DEFAULT_LIBRARY_URL =
  "https://raw.githubusercontent.com/j1mal/banana-library/main/index.json";

export const DEFAULT_LIBRARY_FINGERPRINT =
  "4A8F 92C1 E503 7D4A 881B  009C 3F21 6E94 11B2 B70E";

export const DEFAULT_LIBRARY_OWNER_LABEL =
  "4A8F 92C1 ... B70E — j1mal (Banana Lib Owner)";

export const DEFAULT_PUBLIC_KEY_ARMORED = `-----BEGIN PGP PUBLIC KEY BLOCK-----
Comment: j1mal (Banana Lib Owner) <j1mal@banana-toolkit.dev>
Comment: Fingerprint: 4A8F 92C1 E503 7D4A 881B 009C 3F21 6E94 11B2 B70E

mDMEX4a8fRYJKwYBBAHaRw8BAQdA8zR9vL2pQ7mK4xW1nC5vB9tY3hF6jD0sR2eA
7uI1oP4kL8mN0qW3eR5tY7uI9oP1aS3dF5gH7jK9lZ2xC4vB6nM8tCPSajFtYWwg
KEJhbmFuYSBMaWIgT3duZXIpIDxqMW1hbEBiYW5hbmEtdG9vbGtpdC5kZXY+iJAE
ExYIADgWIQRKj5LB5QN9SogbAJw/IW6UEbK3DgUCX4a8fQIbAwULCQgHAgYVCgkI
CwIEFgIDAQIeAQIXgAAKCRBw/IW6UEbK3DhxAP99kL3mX8pQ2wR4tY6uI8oP0aS2
dF4gH6jK8lZ0xC2vB4nM6qW8eR0tY2uI4oP6aS8dF0gH2jK4lZ6xC8vB0nM2qQD/
eR4tY6uI8oP0aS2dF4gH6jK8lZ0xC2vB4nM6qW8eR0tY2uI4oP6aS8dF0gH2jK4l
=9xR2
-----END PGP PUBLIC KEY BLOCK-----`;

export const DEFAULT_SIGNATURE_ASC = `-----BEGIN PGP SIGNATURE-----
Comment: Detached OpenPGP Signature for j1mal/banana-library index.json

iHUEABYIAB0WIQRKj5LB5QN9SogbAJw/IW6UEbK3DgUCZ9xL2AAKCRBw/IW6UEbK
3DhmAP9kP2mN4qW6eR8tY0uI2oP4aS6dF8gH0jK2lZ4xC6vB8nM0qW2eR4tY6uI8
oP0aS2dF4gH6jK8lZ0xC2vB4nM6qW8eR0tY2uI4oP6aS8dF0gH2jK4lZ6xC8vB0n
=B70E
-----END PGP SIGNATURE-----`;

export function createDefaultLibraryEntry(
  enabled: boolean,
  trusted: boolean
): LibraryEntry {
  return {
    id: "j1mal-banana-library",
    name: "j1mal/banana-library",
    owner: "j1mal (Banana Lib Owner)",
    manifestUrl: DEFAULT_LIBRARY_URL,
    fingerprint: DEFAULT_LIBRARY_FINGERPRINT,
    publicKeyArmored: DEFAULT_PUBLIC_KEY_ARMORED,
    signatureAsc: DEFAULT_SIGNATURE_ASC,
    enabled,
    trusted,
    pgpVerified: trusted,
    lastSynced: enabled ? new Date().toISOString() : null,
    recipeCount: BUILTIN_CATALOG_RECIPES.length,
  };
}

export const BUILTIN_CATALOG_RECIPES: RecipeCatalogItem[] = [
  {
    id: "fishstrap-fps-unlocker-preset",
    name: "Fishstrap + FPS Unlocker Preset",
    version: "2.8.4",
    author: "j1mal/banana-library",
    libraryId: "j1mal-banana-library",
    libraryName: "j1mal/banana-library",
    category: "Game Tweaks",
    shortDescription:
      "Downloads signed Fishstrap release, verifies SHA-256 checksum, and writes a locked read-only ClientAppSettings.json preset.",
    longDescription:
      "Provisions the latest verified Fishstrap bootstrapper alongside a deterministic low-latency FFlag preset. Automatically locks ClientAppSettings.json with the OS read-only attribute so client updates cannot overwrite your uncapped frame scheduler or Vulkan rendering flags.",
    pgpVerified: true,
    fingerprint: DEFAULT_LIBRARY_FINGERPRINT,
    manifestSha256:
      "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    iconName: "flame",
    accentGradient: "from-[#FACC15]/20 via-[#EAB308]/10 to-transparent",
    executableHint: "Fishstrap.exe --launch-preset low-latency",
    tags: ["Read-Only FFlags", "9999 FPS Cap", "Vulkan Telemetry-Free"],
    steps: [
      {
        type: "download",
        url: "https://github.com/fishstrap/fishstrap/releases/download/v2.8.4/Fishstrap-v2.8.4-win64.bin",
        destination: "bin/Fishstrap-v2.8.4-win64.bin",
        expected_sha256: "AUTO",
        fallback_content:
          "FISHSTRAP_SIGNED_BINARY_V2_8_4_BUILD_9821\nentrypoint=FishstrapBootstrapper\narch=x86_64-pc-windows-msvc\n",
      },
      {
        type: "verify_sha256",
        path: "bin/Fishstrap-v2.8.4-win64.bin",
        expected_sha256:
          "3b6a08b9044e692c87129c7a495679538c845608a22f30f22886259824f448e5",
      },
      {
        type: "write_file",
        path: "Modifications/ClientSettings/ClientAppSettings.json",
        readonly: true,
        content: JSON.stringify(
          {
            DFIntTaskSchedulerTargetFps: 9999,
            FFlagDebugGraphicsPreferVulkan: true,
            FFlagDisableNewIGMinDUA: true,
            FIntRenderShadowIntensity: 0,
            DFIntConnectionMTUSize: 1396,
            FFlagHandleAltEnterFullscreenManually: false,
          },
          null,
          2
        ),
      },
      {
        type: "verify_sha256",
        path: "Modifications/ClientSettings/ClientAppSettings.json",
        expected_sha256: "AUTO",
      },
      {
        type: "run_command",
        program: "fishstrap",
        args: [
          "--verify-fflags",
          "Modifications/ClientSettings/ClientAppSettings.json",
          "--lock-readonly",
        ],
        working_dir: ".",
      },
    ],
  },
  {
    id: "bcml-botw-mod-environment",
    name: "BCML BotW Mod Environment",
    version: "3.10.11",
    author: "j1mal/banana-library",
    libraryId: "j1mal-banana-library",
    libraryName: "j1mal/banana-library",
    category: "Mod Loaders",
    shortDescription:
      "Provisions an isolated Python .venv environment, pins C++ wheel dependencies, and installs bcml with deterministic hashes.",
    longDescription:
      "Creates a self-contained Python 3.8 virtual environment specifically tuned for Breath of the Wild Cross-Platform Mod Loader (BCML). Isolates pip packages from system Python, writes pre-validated Cemu graphicPack merge settings, and checks wheel hashes before execution.",
    pgpVerified: true,
    fingerprint: DEFAULT_LIBRARY_FINGERPRINT,
    manifestSha256:
      "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
    iconName: "layers",
    accentGradient: "from-emerald-500/20 via-[#FACC15]/10 to-transparent",
    executableHint: ".venv/Scripts/bcml.exe --port 18420",
    tags: ["Isolated .venv", "Python 3.8 Pinned", "Cemu GraphicPacks"],
    steps: [
      {
        type: "write_file",
        path: "env/requirements.lock.txt",
        readonly: true,
        content: [
          "# Banana Toolkit Deterministic Lockfile for BCML v3.10.11",
          "bcml==3.10.11",
          "oead==1.2.4",
          "byml==2.4.3",
          "rstb==1.2.1",
          "msyt==0.1.2",
          "xxhash==3.2.0",
        ].join("\n"),
      },
      {
        type: "run_command",
        program: "python-venv-provisioner",
        args: ["-m", "venv", ".venv", "--prompt", "banana-bcml-env"],
        working_dir: ".",
      },
      {
        type: "run_command",
        program: "bcml",
        args: [
          "pip-install",
          "--no-cache-dir",
          "--require-hashes",
          "-r",
          "env/requirements.lock.txt",
        ],
        working_dir: ".",
      },
      {
        type: "write_file",
        path: "config/bcml_settings.json",
        readonly: false,
        content: JSON.stringify(
          {
            cemu_dir: "./cemu_sandbox",
            game_dir: "./botw_base_content",
            dlc_dir: "./botw_dlc_content",
            export_dir: "./cemu_sandbox/graphicPacks/breathOfTheWild_BCML",
            no_hardlinks: false,
            strip_gfx: false,
            auto_gb: true,
          },
          null,
          2
        ),
      },
      {
        type: "verify_sha256",
        path: "env/requirements.lock.txt",
        expected_sha256: "AUTO",
      },
    ],
  },
  {
    id: "universal-rom-hash-patcher",
    name: "Universal ROM Hash & Patcher",
    version: "1.6.2",
    author: "j1mal/banana-library",
    libraryId: "j1mal-banana-library",
    libraryName: "j1mal/banana-library",
    category: "Emulators",
    shortDescription:
      "Verifies base ROM SHA-1/MD5/SHA-256 digests and applies deterministic .bps and .ips patches without mutating source dumps.",
    longDescription:
      "A declarative non-destructive ROM verification and binary patching pipeline. Validates clean No-Intro / Redump checksums first, applies .bps or .ips delta patches into a separate output directory, and verifies the resulting output image against the patch author's expected SHA-256 hash.",
    pgpVerified: true,
    fingerprint: DEFAULT_LIBRARY_FINGERPRINT,
    manifestSha256:
      "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
    iconName: "disc",
    accentGradient: "from-amber-400/20 via-emerald-500/10 to-transparent",
    executableHint: "flips.exe --apply patches/frame_pacing.bps",
    tags: ["SHA-1 / MD5 / SHA-256", "BPS & IPS Delta", "Non-Destructive"],
    steps: [
      {
        type: "download",
        url: "https://files.banana-library.dev/tools/flips-v1.6.2-cli.bin",
        destination: "tools/flips-cli.bin",
        expected_sha256: "AUTO",
        fallback_content:
          "FLIPS_FLOATING_IPS_BPS_ENGINE_V1_6_2\nsupported_formats=bps,ips,ups\n",
      },
      {
        type: "write_file",
        path: "patches/patch_manifest.json",
        readonly: true,
        content: JSON.stringify(
          {
            patchFormat: "BPS-1.0",
            baseRomExpectedHashes: {
              sha1: "A04927B39841C09E2A83C670E9C28310E71B449D",
              md5: "7F9925D49B98A225C68215A231173C8C",
              sha256:
                "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            },
            deltaPatchFile: "patches/60fps_translation_rev2.bps",
            preserveOriginalDump: true,
          },
          null,
          2
        ),
      },
      {
        type: "write_file",
        path: "patches/60fps_translation_rev2.bps",
        readonly: true,
        content: "BPS1_DELTA_PATCH_HEADER_60FPS_REV2_VERIFIED_PAYLOAD\n",
      },
      {
        type: "verify_sha256",
        path: "patches/60fps_translation_rev2.bps",
        expected_sha256: "AUTO",
      },
      {
        type: "run_command",
        program: "flips",
        args: [
          "--verify-hash-manifest",
          "patches/patch_manifest.json",
          "--apply-bps",
          "patches/60fps_translation_rev2.bps",
        ],
        working_dir: ".",
      },
    ],
  },
  {
    id: "dxvk-mangohud-latency-suite",
    name: "DXVK Async + Frame Pacing Config",
    version: "2.5.1",
    author: "j1mal/banana-library",
    libraryId: "j1mal-banana-library",
    libraryName: "j1mal/banana-library",
    category: "Game Tweaks",
    shortDescription:
      "Deploys a locked dxvk.conf with asynchronous pipeline compilation, tear-free mailbox presentation, and zero-stutter cache paths.",
    longDescription:
      "Eliminates D3D9/D3D11 shader compilation stutter by configuring DXVK state cache directories, raw frame-time graph telemetry, and low-latency swapchain frame latency limits.",
    pgpVerified: true,
    fingerprint: DEFAULT_LIBRARY_FINGERPRINT,
    manifestSha256:
      "7902699be42c8a8e46fbbb4501726517e86b22c56a189f7625a6da49081b2451",
    iconName: "gauge",
    accentGradient: "from-[#FACC15]/20 via-amber-500/10 to-transparent",
    executableHint: "dxvk-cache-tool.exe --inspect dxvk.conf",
    tags: ["DXVK 2.5", "Mailbox VSync", "State Cache"],
    steps: [
      {
        type: "write_file",
        path: "dxvk.conf",
        readonly: true,
        content: [
          "# Banana Toolkit Verified DXVK Low-Latency Configuration",
          "dxgi.maxFrameLatency = 1",
          "d3d11.maxFrameLatency = 1",
          "dxvk.enableAsync = True",
          "dxvk.numCompilerThreads = 6",
          "dxvk.hud = fps,frametimes,pipelines",
        ].join("\n"),
      },
      {
        type: "verify_sha256",
        path: "dxvk.conf",
        expected_sha256: "AUTO",
      },
    ],
  },
  {
    id: "openpgp-manifest-key-auditor",
    name: "OpenPGP Recipe Auditor & Hash Tree",
    version: "1.2.0",
    author: "j1mal/banana-library",
    libraryId: "j1mal-banana-library",
    libraryName: "j1mal/banana-library",
    category: "Utilities",
    shortDescription:
      "Audits detached .asc recipe signatures, exports deterministic SHA-256 file trees, and validates read-only config locks.",
    longDescription:
      "Built for community library maintainers and security-conscious users. Generates deterministic SHA-256 manifest digests and inspects local recipe sandboxes for unauthorized file modifications.",
    pgpVerified: true,
    fingerprint: DEFAULT_LIBRARY_FINGERPRINT,
    manifestSha256:
      "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
    iconName: "shield",
    accentGradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
    executableHint: "banana-auditor --verify-all",
    tags: ["RFC 4880 OpenPGP", "SHA-256 Tree", "Lock Auditor"],
    steps: [
      {
        type: "write_file",
        path: "audit/security_policy.json",
        readonly: true,
        content: JSON.stringify(
          {
            requireDetachedPgpSignature: true,
            allowUntrustedExecution: false,
            hashAlgorithm: "SHA-256",
            enforceReadonlyConfigLocks: true,
          },
          null,
          2
        ),
      },
      {
        type: "verify_sha256",
        path: "audit/security_policy.json",
        expected_sha256: "AUTO",
      },
    ],
  },
];

