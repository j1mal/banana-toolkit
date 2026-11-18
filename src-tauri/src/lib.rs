pub mod config;
pub mod crypto;
pub mod runner;

use config::{load_or_init_config, reset_onboarding_config, save_library_config};
use crypto::{generate_signed_manifest_bundle, verify_pgp_signature};
use runner::{execute_recipe_steps, open_vault_folder};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            load_or_init_config,
            save_library_config,
            reset_onboarding_config,
            verify_pgp_signature,
            generate_signed_manifest_bundle,
            execute_recipe_steps,
            open_vault_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Banana Toolkit Tauri application");
}

