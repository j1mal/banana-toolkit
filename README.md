# Banana Toolkit

A sleek, security-first community library manager and declarative recipe runner built with **Tauri v2 (Rust)** and **React + TypeScript + Tailwind CSS + Lucide Icons**.

## Highlights

- **Obsidian Dark Aesthetic (`#09090B` / `#121215` / `#FACC15`):** Frameless window with custom titlebar, `Ctrl+K` command palette, `Inter` UI typography, and `JetBrains Mono` for OpenPGP fingerprints, SHA-256 digests, and real-time runner stdout logs.
- **First-Launch Opt-In Trust Flow (`libraries.json`):** On initial launch (when `libraries.json` is absent in the app data directory), presents a glassmorphic trust modal for `j1mal/banana-library` (`https://raw.githubusercontent.com/j1mal/banana-library/main/index.json`) with `Accept (Recommended)` (`enabled: true, trusted: true`) and `Decline (Advanced Users)` (`enabled: false, trusted: false`, zero network calls).
- **Pure-Rust OpenPGP Detached Signature Verification (`src-tauri/src/crypto.rs`):** Uses the pure-Rust `pgp` crate (rPGP) to verify detached `.asc` OpenPGP signatures against ASCII-armored author public keys.
- **Declarative Recipe Step Runner (`src-tauri/src/runner.rs`):** Audits and executes `download`, `write_file` (with OS `readonly: true` enforcement), `run_command`, and `verify_sha256` steps while streaming real-time progress and stdout events (`recipe-execution-event`) to the UI terminal drawer.

## Development & Build

```bash
# Install frontend dependencies
npm install

# Run frontend in development mode
npm run dev

# Build frontend TypeScript & Vite production bundle
npm run build

# Run full Tauri v2 desktop application
npm run tauri dev
```
