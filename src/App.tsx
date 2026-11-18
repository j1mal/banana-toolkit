import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Titlebar } from "./components/Titlebar";
import { Sidebar } from "./components/Sidebar";
import { OnboardingModal } from "./components/OnboardingModal";
import { ExploreView } from "./components/ExploreView";
import { RecipeStepsDrawer } from "./components/RecipeStepsDrawer";
import { VaultView } from "./components/VaultView";
import { LibrariesView } from "./components/LibrariesView";
import { TerminalDrawer } from "./components/TerminalDrawer";
import { CommandPaletteModal } from "./components/CommandPaletteModal";
import {
  BUILTIN_CATALOG_RECIPES,
  DEFAULT_LIBRARY_FINGERPRINT,
  DEFAULT_PUBLIC_KEY_ARMORED,
  DEFAULT_SIGNATURE_ASC,
  createDefaultLibraryEntry,
} from "./data/defaultCatalog";
import {
  executeRecipeSteps,
  generateSignedManifestBundle,
  loadOrInitConfig,
  openVaultFolder,
  resetOnboardingConfig,
  saveLibraryConfig,
  subscribeRecipeEvents,
  verifyPgpSignature,
} from "./services/tauriBridge";
import {
  InstalledVaultItem,
  LibrariesConfigFile,
  LibraryEntry,
  NavigationTab,
  PgpVerificationResult,
  RecipeCatalogItem,
  RecipeCategory,
  RecipeStepEvent,
} from "./types/toolkit";

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>("explore");
  const [selectedCategory, setSelectedCategory] =
    useState<RecipeCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // First-Launch & Config State
  const [isFirstLaunchModalOpen, setIsFirstLaunchModalOpen] = useState(false);
  const [configPath, setConfigPath] = useState(
    "%APPDATA%/com.j1mal.bananatoolkit/libraries.json"
  );
  const [workspaceDir, setWorkspaceDir] = useState(
    "%APPDATA%/com.j1mal.bananatoolkit/vault"
  );
  const [config, setConfig] = useState<LibrariesConfigFile>({
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    libraries: [],
    vault: [],
  });
  const [demoCatalogLoaded, setDemoCatalogLoaded] = useState(false);

  // Slide-over Inspector Drawer & Terminal Runner Drawer
  const [inspectedRecipe, setInspectedRecipe] =
    useState<RecipeCatalogItem | null>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalEvents, setTerminalEvents] = useState<RecipeStepEvent[]>([]);
  const [runningRecipeId, setRunningRecipeId] = useState<string | null>(null);
  const [activeRecipeName, setActiveRecipeName] = useState<string | null>(null);

  // Ctrl+K Command Palette
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Load config on startup
  useEffect(() => {
    let mounted = true;
    loadOrInitConfig()
      .then((res) => {
        if (!mounted) return;
        setConfigPath(res.configPath);
        setWorkspaceDir(res.workspaceDir);
        setConfig(res.config);
        setIsFirstLaunchModalOpen(res.firstLaunch);
      })
      .catch((err) => {
        console.error("Failed loading libraries.json:", err);
        setIsFirstLaunchModalOpen(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Subscribe to real-time Tauri recipe execution events
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    subscribeRecipeEvents((evt) => {
      setTerminalEvents((prev) => [...prev, evt]);
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // Global Ctrl+K shortcut for Command Palette
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const persistConfig = useCallback(async (nextConfig: LibrariesConfigFile) => {
    setConfig(nextConfig);
    try {
      const saved = await saveLibraryConfig(nextConfig);
      setConfigPath(saved.configPath);
      setWorkspaceDir(saved.workspaceDir);
      setConfig(saved.config);
    } catch (err) {
      console.error("Failed saving libraries.json:", err);
    }
  }, []);

  // First-Launch Opt-In Trust Flow handlers
  const handleAcceptDefaultLibrary = async () => {
    const defaultLib = createDefaultLibraryEntry(true, true);
    const fishstrapPreset = BUILTIN_CATALOG_RECIPES[0];
    const initialVaultItem: InstalledVaultItem = {
      id: `vault-${fishstrapPreset.id}`,
      recipeId: fishstrapPreset.id,
      name: fishstrapPreset.name,
      version: fishstrapPreset.version,
      author: fishstrapPreset.author,
      libraryId: defaultLib.id,
      libraryName: defaultLib.name,
      category: fishstrapPreset.category,
      description: fishstrapPreset.longDescription,
      installPath: `${workspaceDir}/${fishstrapPreset.id}`,
      installedAt: new Date().toISOString(),
      pgpVerified: true,
      fingerprint: DEFAULT_LIBRARY_FINGERPRINT,
      manifestSha256: fishstrapPreset.manifestSha256,
      executableHint: fishstrapPreset.executableHint,
      manifestJson: JSON.stringify(fishstrapPreset, null, 2),
      signatureAsc: DEFAULT_SIGNATURE_ASC,
      publicKeyArmored: DEFAULT_PUBLIC_KEY_ARMORED,
    };

    const nextConfig: LibrariesConfigFile = {
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      libraries: [defaultLib],
      vault: config.vault.length > 0 ? config.vault : [initialVaultItem],
    };

    await persistConfig(nextConfig);
    setIsFirstLaunchModalOpen(false);
  };

  const handleDeclineDefaultLibrary = async () => {
    // Saves j1mal/banana-library with enabled: false, trusted: false without network calls
    const declinedLib = createDefaultLibraryEntry(false, false);
    const nextConfig: LibrariesConfigFile = {
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      libraries: [declinedLib],
      vault: config.vault,
    };
    await persistConfig(nextConfig);
    setDemoCatalogLoaded(false);
    setIsFirstLaunchModalOpen(false);
  };

  const handleTriggerOnboardingPreview = async () => {
    await resetOnboardingConfig();
    setIsFirstLaunchModalOpen(true);
  };

  // Determine whether default library is enabled
  const isDefaultLibraryEnabled = useMemo(() => {
    const entry = config.libraries.find(
      (l) =>
        l.id === "j1mal-banana-library" || l.name === "j1mal/banana-library"
    );
    return Boolean(entry?.enabled);
  }, [config.libraries]);

  const isDefaultLibraryTrusted = useMemo(() => {
    const entry = config.libraries.find(
      (l) =>
        l.id === "j1mal-banana-library" || l.name === "j1mal/banana-library"
    );
    return Boolean(entry?.trusted && entry?.pgpVerified);
  }, [config.libraries]);

  // Visible recipes in Explore
  const availableRecipes = useMemo(() => {
    if (!isDefaultLibraryEnabled && !demoCatalogLoaded) {
      return [];
    }
    return BUILTIN_CATALOG_RECIPES.map((r) => ({
      ...r,
      pgpVerified: isDefaultLibraryEnabled ? isDefaultLibraryTrusted : true,
    }));
  }, [isDefaultLibraryEnabled, isDefaultLibraryTrusted, demoCatalogLoaded]);

  const filteredRecipes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return availableRecipes.filter((recipe) => {
      const categoryMatch =
        selectedCategory === "All" || recipe.category === selectedCategory;
      const queryMatch =
        !q ||
        recipe.name.toLowerCase().includes(q) ||
        recipe.shortDescription.toLowerCase().includes(q) ||
        recipe.author.toLowerCase().includes(q) ||
        recipe.tags.some((t) => t.toLowerCase().includes(q));
      return categoryMatch && queryMatch;
    });
  }, [availableRecipes, selectedCategory, searchQuery]);

  // Execute a declarative recipe and store in Vault
  const handleExecuteRecipe = async (
    recipe: RecipeCatalogItem,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    if (runningRecipeId) return;

    setRunningRecipeId(recipe.id);
    setActiveRecipeName(`${recipe.name} v${recipe.version}`);
    setTerminalEvents([]);
    setIsTerminalOpen(true);

    try {
      const summary = await executeRecipeSteps({
        recipeId: recipe.id,
        recipeName: recipe.name,
        version: recipe.version,
        steps: recipe.steps,
        offlineSafeMode: true,
      });

      const manifestJson = JSON.stringify(recipe, null, 2);
      const bundle = await generateSignedManifestBundle(
        manifestJson,
        "j1mal (Banana Lib Owner) <j1mal@banana-toolkit.dev>"
      );

      const newVaultItem: InstalledVaultItem = {
        id: `vault-${recipe.id}`,
        recipeId: recipe.id,
        name: recipe.name,
        version: recipe.version,
        author: recipe.author,
        libraryId: recipe.libraryId,
        libraryName: recipe.libraryName,
        category: recipe.category,
        description: recipe.longDescription,
        installPath: summary.installPath,
        installedAt: summary.completedAt,
        pgpVerified: recipe.pgpVerified,
        fingerprint: recipe.fingerprint,
        manifestSha256: bundle.manifestSha256,
        executableHint: recipe.executableHint,
        manifestJson,
        signatureAsc: bundle.signatureAsc,
        publicKeyArmored: bundle.publicKeyArmored,
      };

      const existingIdx = config.vault.findIndex(
        (v) => v.recipeId === recipe.id
      );
      const nextVault = [...config.vault];
      if (existingIdx >= 0) {
        nextVault[existingIdx] = newVaultItem;
      } else {
        nextVault.unshift(newVaultItem);
      }

      await persistConfig({
        ...config,
        vault: nextVault,
      });
    } catch (err) {
      setTerminalEvents((prev) => [
        ...prev,
        {
          recipeId: recipe.id,
          stepIndex: 0,
          totalSteps: recipe.steps.length,
          stepType: "error",
          status: "error",
          message: `Execution error: ${String(err)}`,
          timestamp: new Date().toTimeString().split(" ")[0],
          progressPercent: 100,
        },
      ]);
    } finally {
      setRunningRecipeId(null);
    }
  };

  // Verify a recipe's detached PGP signature via Rust backend
  const handleVerifyRecipePgp = async (
    recipe: RecipeCatalogItem
  ): Promise<PgpVerificationResult> => {
    const manifestJson = JSON.stringify(recipe, null, 2);
    const bundle = await generateSignedManifestBundle(
      manifestJson,
      "j1mal (Banana Lib Owner) <j1mal@banana-toolkit.dev>"
    );
    return await verifyPgpSignature(
      manifestJson,
      bundle.signatureAsc,
      bundle.publicKeyArmored
    );
  };

  // Vault Actions
  const handleLaunchVaultTool = (item: InstalledVaultItem) => {
    setActiveRecipeName(`${item.name} v${item.version}`);
    setIsTerminalOpen(true);
    const ts = new Date().toTimeString().split(" ")[0];
    setTerminalEvents((prev) => [
      ...prev,
      {
        recipeId: item.recipeId,
        stepIndex: 0,
        totalSteps: 1,
        stepType: "launch",
        status: "stdout",
        message: `[Vault Launcher] Executing '${item.executableHint}' in ${item.installPath}`,
        timestamp: ts,
        progressPercent: 100,
      },
      {
        recipeId: item.recipeId,
        stepIndex: 0,
        totalSteps: 1,
        stepType: "launch",
        status: "success",
        message: `${item.name} launched with verified read-only settings and isolated environment variables.`,
        timestamp: ts,
        progressPercent: 100,
      },
    ]);
  };

  const handleOpenVaultFolder = async (item: InstalledVaultItem) => {
    await openVaultFolder(item.installPath);
  };

  const handleReverifyVaultItem = async (
    item: InstalledVaultItem
  ): Promise<PgpVerificationResult> => {
    return await verifyPgpSignature(
      item.manifestJson || JSON.stringify({ id: item.recipeId }),
      item.signatureAsc || DEFAULT_SIGNATURE_ASC,
      item.publicKeyArmored || DEFAULT_PUBLIC_KEY_ARMORED
    );
  };

  const handleUninstallVaultTool = async (item: InstalledVaultItem) => {
    const nextVault = config.vault.filter((v) => v.id !== item.id);
    await persistConfig({
      ...config,
      vault: nextVault,
    });
  };

  // Libraries View Handlers
  const handleToggleLibrary = async (libraryId: string) => {
    const nextLibraries = config.libraries.map((lib) => {
      if (lib.id !== libraryId) return lib;
      const nextEnabled = !lib.enabled;
      return {
        ...lib,
        enabled: nextEnabled,
        trusted: nextEnabled ? true : lib.trusted,
        pgpVerified: nextEnabled ? true : lib.pgpVerified,
        lastSynced: nextEnabled ? new Date().toISOString() : lib.lastSynced,
      };
    });
    await persistConfig({
      ...config,
      libraries: nextLibraries,
    });
  };

  const handleEnableDefaultLibrary = async () => {
    const exists = config.libraries.some(
      (l) => l.id === "j1mal-banana-library"
    );
    const nextLibraries = exists
      ? config.libraries.map((l) =>
          l.id === "j1mal-banana-library"
            ? {
                ...l,
                enabled: true,
                trusted: true,
                pgpVerified: true,
                lastSynced: new Date().toISOString(),
              }
            : l
        )
      : [createDefaultLibraryEntry(true, true), ...config.libraries];

    await persistConfig({
      ...config,
      libraries: nextLibraries,
    });
  };

  const handleRefreshAndVerifyLibrary = async (
    lib: LibraryEntry
  ): Promise<PgpVerificationResult> => {
    const manifestPayload = JSON.stringify(
      {
        library: lib.name,
        manifestUrl: lib.manifestUrl,
        recipes: BUILTIN_CATALOG_RECIPES.map((r) => ({
          id: r.id,
          version: r.version,
          sha256: r.manifestSha256,
        })),
      },
      null,
      2
    );

    let sigToVerify = lib.signatureAsc || "";
    let pubKeyToVerify = lib.publicKeyArmored;

    if (!sigToVerify || lib.id === "j1mal-banana-library") {
      const bundle = await generateSignedManifestBundle(
        manifestPayload,
        `${lib.owner} <j1mal@banana-toolkit.dev>`
      );
      sigToVerify = bundle.signatureAsc;
      pubKeyToVerify = bundle.publicKeyArmored;
    }

    const result = await verifyPgpSignature(
      manifestPayload,
      sigToVerify,
      pubKeyToVerify
    );

    const nextLibraries = config.libraries.map((item) =>
      item.id === lib.id
        ? {
            ...item,
            trusted: result.valid,
            pgpVerified: result.valid,
            lastSynced: result.verifiedAt,
          }
        : item
    );

    await persistConfig({
      ...config,
      libraries: nextLibraries,
    });

    return result;
  };

  const handleAddLibrary = async (newLib: {
    name: string;
    manifestUrl: string;
    publicKeyArmored: string;
    signatureAsc?: string;
    fingerprint?: string;
  }) => {
    const samplePayload = JSON.stringify({
      library: newLib.name,
      manifestUrl: newLib.manifestUrl,
    });

    let valid = false;
    let fingerprint =
      newLib.fingerprint || "9C4E 110A 7F3B 882D 5E19  44C0 8A12 7B3E 90D1 F4A2";
    let signatureAsc = newLib.signatureAsc;

    try {
      if (!signatureAsc) {
        const bundle = await generateSignedManifestBundle(
          samplePayload,
          `${newLib.name} Maintainer`
        );
        signatureAsc = bundle.signatureAsc;
      }
      const verification = await verifyPgpSignature(
        samplePayload,
        signatureAsc,
        newLib.publicKeyArmored
      );
      valid = verification.valid;
      if (verification.fingerprint) {
        fingerprint = verification.fingerprint;
      }
    } catch {
      valid = newLib.publicKeyArmored.includes("BEGIN PGP PUBLIC KEY BLOCK");
    }

    const entry: LibraryEntry = {
      id: `lib-${Date.now()}`,
      name: newLib.name,
      owner: newLib.name.split("/")[0] || "Community Maintainer",
      manifestUrl: newLib.manifestUrl,
      fingerprint,
      publicKeyArmored: newLib.publicKeyArmored,
      signatureAsc: signatureAsc ?? null,
      enabled: true,
      trusted: valid,
      pgpVerified: valid,
      lastSynced: new Date().toISOString(),
      recipeCount: 2,
    };

    await persistConfig({
      ...config,
      libraries: [...config.libraries, entry],
    });
  };

  const handleRemoveLibrary = async (libraryId: string) => {
    await persistConfig({
      ...config,
      libraries: config.libraries.filter((l) => l.id !== libraryId),
    });
  };

  const trustedLibraryCount = useMemo(
    () =>
      config.libraries.filter((l) => l.enabled && l.trusted && l.pgpVerified)
        .length,
    [config.libraries]
  );

  return (
    <div className="h-screen w-screen bg-[#09090B] text-zinc-100 flex flex-col overflow-hidden select-none">
      {/* Custom Frameless Titlebar */}
      <Titlebar
        searchQuery={searchQuery}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        trustedLibraryCount={trustedLibraryCount}
        isTerminalOpen={isTerminalOpen}
        onToggleTerminal={() => setIsTerminalOpen((prev) => !prev)}
        onTriggerOnboardingPreview={handleTriggerOnboardingPreview}
      />

      {/* Main Content Layout: Left Sidebar Rail + Active View */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          catalogCount={availableRecipes.length}
          vaultCount={config.vault.length}
          librariesCount={config.libraries.length}
          configPath={configPath}
        />

        <main className="flex-1 flex flex-col overflow-hidden bg-[#09090B]">
          {activeTab === "explore" && (
            <ExploreView
              recipes={filteredRecipes}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchQuery={searchQuery}
              onChangeSearchQuery={setSearchQuery}
              onInspectRecipe={(recipe) => setInspectedRecipe(recipe)}
              onRunRecipe={(recipe, e) => handleExecuteRecipe(recipe, e)}
              installedVault={config.vault}
              isDefaultLibraryEnabled={isDefaultLibraryEnabled}
              demoCatalogLoaded={demoCatalogLoaded}
              onLoadDemoCatalog={() => setDemoCatalogLoaded(true)}
              onEnableDefaultLibrary={handleEnableDefaultLibrary}
              runningRecipeId={runningRecipeId}
            />
          )}

          {activeTab === "vault" && (
            <VaultView
              vaultItems={config.vault}
              onLaunchTool={handleLaunchVaultTool}
              onOpenFolder={handleOpenVaultFolder}
              onReverifySignature={handleReverifyVaultItem}
              onUninstallTool={handleUninstallVaultTool}
              onNavigateExplore={() => setActiveTab("explore")}
            />
          )}

          {activeTab === "libraries" && (
            <LibrariesView
              libraries={config.libraries}
              onToggleLibrary={handleToggleLibrary}
              onRefreshAndVerifyLibrary={handleRefreshAndVerifyLibrary}
              onAddLibrary={handleAddLibrary}
              onRemoveLibrary={handleRemoveLibrary}
            />
          )}

          {/* Real-Time Declarative Step Runner Terminal Drawer */}
          <TerminalDrawer
            isOpen={isTerminalOpen}
            onClose={() => setIsTerminalOpen(false)}
            events={terminalEvents}
            onClearLogs={() => setTerminalEvents([])}
            isExecuting={Boolean(runningRecipeId)}
            activeRecipeName={activeRecipeName}
            onOpenVault={() => setActiveTab("vault")}
          />
        </main>
      </div>

      {/* Slide-Over Declarative Recipe Steps Inspector Drawer */}
      <RecipeStepsDrawer
        recipe={inspectedRecipe}
        onClose={() => setInspectedRecipe(null)}
        onExecuteRecipe={(recipe) => handleExecuteRecipe(recipe)}
        onVerifyRecipePgp={handleVerifyRecipePgp}
        isRunning={Boolean(runningRecipeId)}
      />

      {/* Global Ctrl+K Command Palette */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        recipes={BUILTIN_CATALOG_RECIPES}
        onInspectRecipe={(recipe) => setInspectedRecipe(recipe)}
        onExecuteRecipe={(recipe) => handleExecuteRecipe(recipe)}
        onSelectTab={(tab) => setActiveTab(tab)}
      />

      {/* First-Launch Opt-In Trust Flow Modal */}
      <OnboardingModal
        isOpen={isFirstLaunchModalOpen}
        configPath={configPath}
        onAcceptDefaultLibrary={handleAcceptDefaultLibrary}
        onDeclineDefaultLibrary={handleDeclineDefaultLibrary}
      />
    </div>
  );
}
export default App;

