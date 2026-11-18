export type NavigationTab = "explore" | "vault" | "libraries";

export type RecipeCategory =
  | "All"
  | "Game Tweaks"
  | "Mod Loaders"
  | "Emulators"
  | "Utilities";

export type RecipeStep =
  | {
      type: "download";
      url: string;
      destination: string;
      expected_sha256?: string;
      fallback_content?: string;
    }
  | {
      type: "write_file";
      path: string;
      content: string;
      readonly?: boolean;
    }
  | {
      type: "run_command";
      program: string;
      args: string[];
      working_dir?: string;
    }
  | {
      type: "verify_sha256";
      path: string;
      expected_sha256: string;
    };

export interface RecipeCatalogItem {
  id: string;
  name: string;
  version: string;
  author: string;
  libraryId: string;
  libraryName: string;
  category: Exclude<RecipeCategory, "All">;
  shortDescription: string;
  longDescription: string;
  pgpVerified: boolean;
  fingerprint: string;
  manifestSha256: string;
  iconName: "flame" | "cpu" | "disc" | "layers" | "gauge" | "shield";
  accentGradient: string;
  executableHint: string;
  tags: string[];
  steps: RecipeStep[];
}

export interface LibraryEntry {
  id: string;
  name: string;
  owner: string;
  manifestUrl: string;
  fingerprint: string;
  publicKeyArmored: string;
  signatureAsc?: string | null;
  enabled: boolean;
  trusted: boolean;
  pgpVerified: boolean;
  lastSynced: string | null;
  recipeCount: number;
}

export interface InstalledVaultItem {
  id: string;
  recipeId: string;
  name: string;
  version: string;
  author: string;
  libraryId: string;
  libraryName: string;
  category: string;
  description: string;
  installPath: string;
  installedAt: string;
  pgpVerified: boolean;
  fingerprint: string;
  manifestSha256: string;
  executableHint: string;
  manifestJson: string;
  signatureAsc: string;
  publicKeyArmored: string;
}

export interface LibrariesConfigFile {
  schemaVersion: number;
  updatedAt: string;
  libraries: LibraryEntry[];
  vault: InstalledVaultItem[];
}

export interface ConfigLoadResult {
  firstLaunch: boolean;
  configPath: string;
  workspaceDir: string;
  config: LibrariesConfigFile;
}

export interface PgpVerificationResult {
  valid: boolean;
  fingerprint: string;
  keyId: string;
  signerUid: string;
  manifestSha256: string;
  verifiedAt: string;
  algorithm: string;
  detailMessage: string;
}

export interface DemoPgpBundle {
  publicKeyArmored: string;
  signatureAsc: string;
  fingerprint: string;
  manifestSha256: string;
  signerUid: string;
}

export interface RecipeStepEvent {
  recipeId: string;
  stepIndex: number;
  totalSteps: number;
  stepType: string;
  status: "running" | "info" | "stdout" | "success" | "error";
  message: string;
  timestamp: string;
  progressPercent: number;
}

export interface RecipeExecutionSummary {
  recipeId: string;
  installPath: string;
  stepsCompleted: number;
  totalSteps: number;
  completedAt: string;
  producedFiles: string[];
}

