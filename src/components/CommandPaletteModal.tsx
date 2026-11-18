import React, { useEffect, useState } from "react";
import {
  Search,
  ShieldCheck,
  Compass,
  HardDrive,
  KeyRound,
  Play,
  Eye,
  X,
} from "lucide-react";
import { NavigationTab, RecipeCatalogItem } from "../types/toolkit";

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: RecipeCatalogItem[];
  onInspectRecipe: (recipe: RecipeCatalogItem) => void;
  onExecuteRecipe: (recipe: RecipeCatalogItem) => void;
  onSelectTab: (tab: NavigationTab) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  recipes,
  onInspectRecipe,
  onExecuteRecipe,
  onSelectTab,
}) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const normalized = query.trim().toLowerCase();
  const filteredRecipes = recipes.filter(
    (r) =>
      !normalized ||
      r.name.toLowerCase().includes(normalized) ||
      r.category.toLowerCase().includes(normalized) ||
      r.shortDescription.toLowerCase().includes(normalized) ||
      r.tags.some((t) => t.toLowerCase().includes(normalized)) ||
      r.manifestSha256.toLowerCase().includes(normalized)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-2xl bg-[#121215] border border-white/[0.12] shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="px-4 py-3 border-b border-white/[0.08] flex items-center gap-3">
          <Search className="w-4 h-4 text-[#FACC15]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a recipe name, SHA-256 hash, category, or view..."
            className="flex-1 bg-transparent text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {/* Recipes Section */}
          <div className="space-y-1.5">
            <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Declarative Recipes ({filteredRecipes.length})
            </div>
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="p-2.5 rounded-xl bg-[#09090B]/70 hover:bg-[#09090B] border border-white/[0.06] hover:border-[#FACC15]/35 flex items-center justify-between gap-3 transition-all"
              >
                <div
                  onClick={() => {
                    onInspectRecipe(recipe);
                    onClose();
                  }}
                  className="flex-1 min-w-0 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-100 truncate">
                      {recipe.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#121215] font-mono text-[10px] text-[#FACC15]">
                      v{recipe.version}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#10B981]">
                      <ShieldCheck className="w-3 h-3" />
                      PGP
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                    {recipe.shortDescription}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onInspectRecipe(recipe);
                      onClose();
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#121215] hover:bg-[#18181C] border border-white/[0.08] text-[11px] text-zinc-300 flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3 text-[#FACC15]" />
                    <span>Steps</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onExecuteRecipe(recipe);
                      onClose();
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-[#09090B] font-semibold text-[11px] flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick View Navigation */}
          <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
            <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Quick Navigation
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  onSelectTab("explore");
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-[#09090B] hover:border-[#FACC15]/35 border border-white/[0.06] text-xs text-zinc-300 flex items-center gap-2"
              >
                <Compass className="w-3.5 h-3.5 text-[#FACC15]" />
                <span>Explore</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectTab("vault");
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-[#09090B] hover:border-[#FACC15]/35 border border-white/[0.06] text-xs text-zinc-300 flex items-center gap-2"
              >
                <HardDrive className="w-3.5 h-3.5 text-[#FACC15]" />
                <span>Vault</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectTab("libraries");
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-[#09090B] hover:border-[#FACC15]/35 border border-white/[0.06] text-xs text-zinc-300 flex items-center gap-2"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#FACC15]" />
                <span>Libraries</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

