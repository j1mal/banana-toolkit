import React from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Play,
  Flame,
  Cpu,
  Disc,
  Layers,
  Gauge,
  Shield,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  FolderGit2,
  Search,
  Eye,
} from "lucide-react";
import {
  InstalledVaultItem,
  RecipeCatalogItem,
  RecipeCategory,
} from "../types/toolkit";

interface ExploreViewProps {
  recipes: RecipeCatalogItem[];
  selectedCategory: RecipeCategory;
  onSelectCategory: (cat: RecipeCategory) => void;
  searchQuery: string;
  onChangeSearchQuery: (q: string) => void;
  onInspectRecipe: (recipe: RecipeCatalogItem) => void;
  onRunRecipe: (recipe: RecipeCatalogItem, e: React.MouseEvent) => void;
  installedVault: InstalledVaultItem[];
  isDefaultLibraryEnabled: boolean;
  demoCatalogLoaded: boolean;
  onLoadDemoCatalog: () => void;
  onEnableDefaultLibrary: () => void;
  runningRecipeId: string | null;
}

const CATEGORIES: RecipeCategory[] = [
  "All",
  "Game Tweaks",
  "Mod Loaders",
  "Emulators",
  "Utilities",
];

function renderRecipeIcon(
  iconName: RecipeCatalogItem["iconName"],
  className = "w-5 h-5"
) {
  switch (iconName) {
    case "flame":
      return <Flame className={className} />;
    case "cpu":
      return <Cpu className={className} />;
    case "disc":
      return <Disc className={className} />;
    case "layers":
      return <Layers className={className} />;
    case "gauge":
      return <Gauge className={className} />;
    case "shield":
    default:
      return <Shield className={className} />;
  }
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  recipes,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onChangeSearchQuery,
  onInspectRecipe,
  onRunRecipe,
  installedVault,
  isDefaultLibraryEnabled,
  demoCatalogLoaded,
  onLoadDemoCatalog,
  onEnableDefaultLibrary,
  runningRecipeId,
}) => {
  const installedIds = new Set(installedVault.map((v) => v.recipeId));

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Top Hero / Filter Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
              Explore Verified Catalog
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-mono rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Detached OpenPGP
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Click any card to audit its declarative{" "}
            <code className="font-mono text-zinc-300">steps[]</code> manifest
            and SHA-256 digests before running.
          </p>
        </div>

        {/* Inline Quick Search Filter */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onChangeSearchQuery(e.target.value)}
              placeholder="Filter catalog recipes..."
              className="h-8 pl-8 pr-3 w-56 rounded-lg bg-[#121215] border border-white/[0.08] focus:border-[#FACC15]/50 focus:outline-none text-xs text-zinc-200 placeholder:text-zinc-500"
            />
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => onSelectCategory(category)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-[#FACC15] text-[#09090B] font-semibold shadow-banana-glow"
                    : "bg-[#121215] text-zinc-400 hover:text-zinc-100 border border-white/[0.08] hover:border-[#FACC15]/35"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="text-xs font-mono text-zinc-500">
          Showing <span className="text-zinc-200">{recipes.length}</span>{" "}
          declarative recipes
        </div>
      </div>

      {/* Fallback Banner if Default Library is Disabled and Demo Catalog Not Loaded */}
      {!isDefaultLibraryEnabled && !demoCatalogLoaded && (
        <div className="rounded-2xl bg-[#121215] border border-[#F59E0B]/35 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
              <ShieldAlert className="w-4 h-4 text-[#F59E0B]" />
              <span>Default Community Library is Currently Disabled</span>
            </div>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              You chose <span className="text-zinc-200">Decline</span> during
              first-launch setup or disabled{" "}
              <code className="font-mono text-zinc-300">
                j1mal/banana-library
              </code>
              . You can load the built-in offline demo catalog immediately or
              enable and trust the default OpenPGP library.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onLoadDemoCatalog}
              className="px-3.5 py-2 rounded-xl bg-[#18181C] hover:bg-[#1F1F25] border border-white/[0.12] hover:border-[#FACC15]/40 text-xs font-medium text-zinc-200 flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FACC15]" />
              <span>Load Demo Catalog</span>
            </button>
            <button
              type="button"
              onClick={onEnableDefaultLibrary}
              className="px-4 py-2 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] text-[#09090B] font-semibold text-xs shadow-banana-glow flex items-center gap-1.5 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Enable j1mal/banana-library</span>
            </button>
          </div>
        </div>
      )}

      {/* 3-Column Responsive Bento Grid */}
      {recipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {recipes.map((recipe) => {
            const isInstalled = installedIds.has(recipe.id);
            const isRunning = runningRecipeId === recipe.id;

            return (
              <div
                key={recipe.id}
                onClick={() => onInspectRecipe(recipe)}
                className="banana-card rounded-2xl p-5 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
              >
                {/* Top Ambient Gradient Header */}
                <div
                  className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${recipe.accentGradient} pointer-events-none opacity-75 group-hover:opacity-100 transition-opacity`}
                />

                <div className="relative space-y-4">
                  {/* Card Header Row: Icon + Version & PGP Shield */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#09090B] border border-white/[0.1] group-hover:border-[#FACC15]/40 flex items-center justify-center text-[#FACC15] transition-colors shrink-0">
                      {renderRecipeIcon(recipe.iconName, "w-5 h-5")}
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-[#09090B] border border-white/[0.08] font-mono text-[11px] text-zinc-300">
                        v{recipe.version}
                      </span>

                      {recipe.pgpVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-[11px] font-medium">
                          <ShieldCheck className="w-3 h-3" />
                          PGP Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] text-[11px] font-medium">
                          <ShieldAlert className="w-3 h-3" />
                          Unverified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tool Name & Author/Library Badge */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-zinc-100 group-hover:text-[#FACC15] transition-colors leading-snug">
                        {recipe.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#09090B] border border-white/[0.07] font-mono text-zinc-400">
                        <FolderGit2 className="w-3 h-3 text-[#FACC15]" />
                        {recipe.author}
                      </span>
                      <span className="text-zinc-500">•</span>
                      <span className="text-zinc-400 font-medium">
                        {recipe.category}
                      </span>
                    </div>
                  </div>

                  {/* Short Description */}
                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                    {recipe.shortDescription}
                  </p>

                  {/* Feature Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {recipe.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#09090B]/90 border border-white/[0.06] text-zinc-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Card Footer: Declarative Step Count & Install/Run CTA */}
                <div className="relative pt-4 mt-5 border-t border-white/[0.07] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 group-hover:text-zinc-200 transition-colors">
                    <Eye className="w-3.5 h-3.5 text-[#FACC15]" />
                    <span>{recipe.steps.length} steps[]</span>
                    <ChevronRight className="w-3 h-3 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  <div className="flex items-center gap-2">
                    {isInstalled && (
                      <span
                        title="Installed in Vault"
                        className="px-2 py-1 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-[11px] font-medium flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        In Vault
                      </span>
                    )}

                    <button
                      type="button"
                      disabled={isRunning}
                      onClick={(e) => onRunRecipe(recipe, e)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isRunning
                          ? "bg-[#FACC15]/40 text-[#09090B] cursor-wait"
                          : "bg-[#FACC15] hover:bg-[#EAB308] text-[#09090B] shadow-banana-glow"
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>
                        {isRunning
                          ? "Running..."
                          : isInstalled
                          ? "Re-run Recipe"
                          : "Install / Run Recipe"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-[#121215] border border-white/[0.08] p-12 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#09090B] border border-white/[0.08] flex items-center justify-center mx-auto text-zinc-500">
            <Search className="w-5 h-5" />
          </div>
          <div className="text-sm font-medium text-zinc-200">
            No matching declarative recipes found
          </div>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Try clearing your search filter, selecting the &ldquo;All&rdquo;
            category pill, or loading the built-in demo catalog.
          </p>
        </div>
      )}
    </div>
  );
};

