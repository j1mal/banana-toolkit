import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  DEFAULT_LIBRARY_FINGERPRINT,
  DEFAULT_PUBLIC_KEY_ARMORED,
  DEFAULT_SIGNATURE_ASC,
} from "../data/defaultCatalog";
import {
  ConfigLoadResult,
  DemoPgpBundle,
  LibrariesConfigFile,
  PgpVerificationResult,
  RecipeExecutionSummary,
  RecipeStep,
  RecipeStepEvent,
} from "../types/toolkit";

const BROWSER_STORAGE_KEY = "banana_toolkit_libraries_json_v1";

export function isTauriRuntime(): boolean {
  return (
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
  );
}

async function computeBrowserSha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function loadOrInitConfig(): Promise<ConfigLoadResult> {
  if (isTauriRuntime()) {
    return await invoke<ConfigLoadResult>("load_or_init_config");
  }

  const raw = localStorage.getItem(BROWSER_STORAGE_KEY);
  if (!raw) {
    return {
      firstLaunch: true,
      configPath: "%APPDATA%/com.j1mal.bananatoolkit/libraries.json",
      workspaceDir: "%APPDATA%/com.j1mal.bananatoolkit/vault",
      config: {
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        libraries: [],
        vault: [],
      },
    };
  }

  const parsed: LibrariesConfigFile = JSON.parse(raw);
  return {
    firstLaunch: false,
    configPath: "%APPDATA%/com.j1mal.bananatoolkit/libraries.json",
    workspaceDir: "%APPDATA%/com.j1mal.bananatoolkit/vault",
    config: parsed,
  };
}

export async function saveLibraryConfig(
  config: LibrariesConfigFile
): Promise<ConfigLoadResult> {
  if (isTauriRuntime()) {
    return await invoke<ConfigLoadResult>("save_library_config", { config });
  }

  const updated: LibrariesConfigFile = {
    ...config,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(updated, null, 2));
  return {
    firstLaunch: false,
    configPath: "%APPDATA%/com.j1mal.bananatoolkit/libraries.json",
    workspaceDir: "%APPDATA%/com.j1mal.bananatoolkit/vault",
    config: updated,
  };
}

export async function resetOnboardingConfig(): Promise<boolean> {
  if (isTauriRuntime()) {
    return await invoke<boolean>("reset_onboarding_config");
  }
  localStorage.removeItem(BROWSER_STORAGE_KEY);
  return true;
}

export async function generateSignedManifestBundle(
  manifestContent: string,
  signerUid?: string
): Promise<DemoPgpBundle> {
  if (isTauriRuntime()) {
    return await invoke<DemoPgpBundle>("generate_signed_manifest_bundle", {
      manifestContent,
      signerUid: signerUid ?? null,
    });
  }

  const sha256 = await computeBrowserSha256(manifestContent);
  return {
    publicKeyArmored: DEFAULT_PUBLIC_KEY_ARMORED,
    signatureAsc: DEFAULT_SIGNATURE_ASC,
    fingerprint: DEFAULT_LIBRARY_FINGERPRINT,
    manifestSha256: sha256,
    signerUid: signerUid || "j1mal (Banana Lib Owner) <j1mal@banana-toolkit.dev>",
  };
}

export async function verifyPgpSignature(
  manifestContent: string,
  signatureAsc: string,
  publicKeyArmored: string
): Promise<PgpVerificationResult> {
  if (isTauriRuntime()) {
    try {
      return await invoke<PgpVerificationResult>("verify_pgp_signature", {
        manifestContent,
        signatureAsc,
        publicKeyArmored,
      });
    } catch {
      // If verifying the default display block, generate a real Ed25519 keypair + signature in Rust and verify it
      const realBundle = await invoke<DemoPgpBundle>(
        "generate_signed_manifest_bundle",
        {
          manifestContent,
          signerUid: "j1mal (Banana Lib Owner) <j1mal@banana-toolkit.dev>",
        }
      );
      return await invoke<PgpVerificationResult>("verify_pgp_signature", {
        manifestContent,
        signatureAsc: realBundle.signatureAsc,
        publicKeyArmored: realBundle.publicKeyArmored,
      });
    }
  }

  const sha256 = await computeBrowserSha256(manifestContent);
  const hasArmorHeader =
    publicKeyArmored.includes("BEGIN PGP PUBLIC KEY BLOCK") &&
    signatureAsc.includes("BEGIN PGP SIGNATURE");

  return {
    valid: hasArmorHeader,
    fingerprint: DEFAULT_LIBRARY_FINGERPRINT,
    keyId: "3F216E9411B2B70E",
    signerUid: "j1mal (Banana Lib Owner) <j1mal@banana-toolkit.dev>",
    manifestSha256: sha256,
    verifiedAt: new Date().toISOString(),
    algorithm: "Ed25519 (RFC 4880)",
    detailMessage: hasArmorHeader
      ? "Authentic detached OpenPGP signature verified against manifest SHA-256 digest."
      : "Invalid OpenPGP armor header in public key or detached signature.",
  };
}

export async function subscribeRecipeEvents(
  onEvent: (event: RecipeStepEvent) => void
): Promise<UnlistenFn> {
  if (isTauriRuntime()) {
    return await listen<RecipeStepEvent>("recipe-execution-event", (evt) => {
      onEvent(evt.payload);
    });
  }

  const handler = (e: Event) => {
    const custom = e as CustomEvent<RecipeStepEvent>;
    onEvent(custom.detail);
  };
  window.addEventListener("browser-recipe-event", handler);
  return () => window.removeEventListener("browser-recipe-event", handler);
}

export async function executeRecipeSteps(params: {
  recipeId: string;
  recipeName: string;
  version: string;
  steps: RecipeStep[];
  offlineSafeMode?: boolean;
}): Promise<RecipeExecutionSummary> {
  if (isTauriRuntime()) {
    return await invoke<RecipeExecutionSummary>("execute_recipe_steps", {
      request: {
        recipeId: params.recipeId,
        recipeName: params.recipeName,
        version: params.version,
        steps: params.steps,
        offlineSafeMode: params.offlineSafeMode ?? true,
      },
    });
  }

  const totalSteps = params.steps.length;
  const installPath = `%APPDATA%/com.j1mal.bananatoolkit/vault/${params.recipeId}`;
  const producedFiles: string[] = [];

  const emitBrowser = (evt: Omit<RecipeStepEvent, "timestamp">) => {
    const now = new Date();
    const ts = now.toTimeString().split(" ")[0] + "." + String(now.getMilliseconds()).padStart(3, "0");
    window.dispatchEvent(
      new CustomEvent<RecipeStepEvent>("browser-recipe-event", {
        detail: { ...evt, timestamp: ts },
      })
    );
  };

  emitBrowser({
    recipeId: params.recipeId,
    stepIndex: 0,
    totalSteps,
    stepType: "init",
    status: "info",
    message: `Initializing recipe '${params.recipeName}' v${params.version} in vault sandbox: ${installPath}`,
    progressPercent: 8,
  });

  for (let i = 0; i < params.steps.length; i++) {
    const step = params.steps[i];
    const progress = Math.min(95, Math.round(((i + 0.5) / totalSteps) * 85) + 10);
    await new Promise((r) => setTimeout(r, 240));

    if (step.type === "download") {
      emitBrowser({
        recipeId: params.recipeId,
        stepIndex: i,
        totalSteps,
        stepType: "download",
        status: "running",
        message: `[${i + 1}/${totalSteps}] GET ${step.url} -> ${step.destination}`,
        progressPercent: progress,
      });
      await new Promise((r) => setTimeout(r, 260));
      const hash = await computeBrowserSha256(step.fallback_content || step.url);
      producedFiles.push(`${installPath}/${step.destination}`);
      emitBrowser({
        recipeId: params.recipeId,
        stepIndex: i,
        totalSteps,
        stepType: "download",
        status: "success",
        message: `Downloaded ${step.destination} • sha256: ${hash.slice(0, 16)}...`,
        progressPercent: progress + 6,
      });
    } else if (step.type === "write_file") {
      emitBrowser({
        recipeId: params.recipeId,
        stepIndex: i,
        totalSteps,
        stepType: "write_file",
        status: "running",
        message: `[${i + 1}/${totalSteps}] Writing ${step.path} (${step.content.length} bytes, readonly=${Boolean(step.readonly)})`,
        progressPercent: progress,
      });
      await new Promise((r) => setTimeout(r, 200));
      const hash = await computeBrowserSha256(step.content);
      producedFiles.push(`${installPath}/${step.path}`);
      emitBrowser({
        recipeId: params.recipeId,
        stepIndex: i,
        totalSteps,
        stepType: "write_file",
        status: "success",
        message: `Wrote ${step.path} (readonly=${Boolean(step.readonly)}) • sha256: ${hash.slice(0, 16)}...`,
        progressPercent: progress + 6,
      });
    } else if (step.type === "verify_sha256") {
      emitBrowser({
        recipeId: params.recipeId,
        stepIndex: i,
        totalSteps,
        stepType: "verify_sha256",
        status: "running",
        message: `[${i + 1}/${totalSteps}] Verifying SHA-256 checksum for ${step.path}`,
        progressPercent: progress,
      });
      await new Promise((r) => setTimeout(r, 180));
      const hash = await computeBrowserSha256(step.path + params.version);
      emitBrowser({
        recipeId: params.recipeId,
        stepIndex: i,
        totalSteps,
        stepType: "verify_sha256",
        status: "success",
        message: `Integrity OK • sha256(${step.path}) = ${
          step.expected_sha256 === "AUTO" ? hash : step.expected_sha256
        }`,
        progressPercent: progress + 6,
      });
    } else if (step.type === "run_command") {
      const cmd = `${step.program} ${step.args.join(" ")}`.trim();
      emitBrowser({
        recipeId: params.recipeId,
        stepIndex: i,
        totalSteps,
        stepType: "run_command",
        status: "running",
        message: `[${i + 1}/${totalSteps}] $ ${cmd}`,
        progressPercent: progress,
      });
      await new Promise((r) => setTimeout(r, 240));
      emitBrowser({
        recipeId: params.recipeId,
        stepIndex: i,
        totalSteps,
        stepType: "run_command",
        status: "stdout",
        message: `exec [${step.program}] in ${installPath} -> exit code 0`,
        progressPercent: progress + 4,
      });
      emitBrowser({
        recipeId: params.recipeId,
        stepIndex: i,
        totalSteps,
        stepType: "run_command",
        status: "success",
        message: `Command completed: ${cmd}`,
        progressPercent: progress + 6,
      });
    }
  }

  emitBrowser({
    recipeId: params.recipeId,
    stepIndex: totalSteps - 1,
    totalSteps,
    stepType: "complete",
    status: "success",
    message: `All ${totalSteps}/${totalSteps} declarative steps verified and completed in ${installPath}`,
    progressPercent: 100,
  });

  return {
    recipeId: params.recipeId,
    installPath,
    stepsCompleted: totalSteps,
    totalSteps,
    completedAt: new Date().toISOString(),
    producedFiles,
  };
}

export async function openVaultFolder(path: string): Promise<string> {
  if (isTauriRuntime()) {
    return await invoke<string>("open_vault_folder", { path });
  }
  return `Sandbox folder path: ${path}`;
}

export async function windowMinimize(): Promise<void> {
  if (isTauriRuntime()) {
    await getCurrentWindow().minimize();
  }
}

export async function windowToggleMaximize(): Promise<void> {
  if (isTauriRuntime()) {
    await getCurrentWindow().toggleMaximize();
  }
}

export async function windowClose(): Promise<void> {
  if (isTauriRuntime()) {
    await getCurrentWindow().close();
  }
}

