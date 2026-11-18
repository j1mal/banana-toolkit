import React from "react";
import {
  Search,
  Minus,
  Square,
  X,
  ShieldCheck,
  Terminal,
  RotateCcw,
} from "lucide-react";
import {
  windowClose,
  windowMinimize,
  windowToggleMaximize,
} from "../services/tauriBridge";

interface TitlebarProps {
  searchQuery: string;
  onOpenCommandPalette: () => void;
  trustedLibraryCount: number;
  isTerminalOpen: boolean;
  onToggleTerminal: () => void;
  onTriggerOnboardingPreview: () => void;
}

export const Titlebar: React.FC<TitlebarProps> = ({
  searchQuery,
  onOpenCommandPalette,
  trustedLibraryCount,
  isTerminalOpen,
  onToggleTerminal,
  onTriggerOnboardingPreview,
}) => {
  return (
    <header
      data-tauri-drag-region
      className="h-12 bg-[#09090B]/95 backdrop-blur-md border-b border-white/[0.08] flex items-center justify-between px-3.5 select-none z-30 shrink-0"
    >
      {/* Left: App Branding */}
      <div
        data-tauri-drag-region
        className="flex items-center gap-2.5 min-w-[215px]"
      >
        <div className="w-7 h-7 rounded-lg bg-[#121215] border border-[#FACC15]/40 flex items-center justify-center shadow-banana-glow">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-[#FACC15] to-[#EAB308] rotate-45" />
        </div>
        <div data-tauri-drag-region className="flex items-center gap-2">
          <span
            data-tauri-drag-region
            className="text-sm font-semibold tracking-tight text-zinc-100"
          >
            Banana Toolkit
          </span>
          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#121215] border border-white/[0.08] text-[#FACC15]">
            v0.1.0
          </span>
        </div>
      </div>

      {/* Center: Global Search Bar (Ctrl+K) */}
      <div className="flex-1 max-w-md mx-4">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full h-8 px-3 rounded-lg bg-[#121215] hover:bg-[#18181C] border border-white/[0.08] hover:border-[#FACC15]/35 transition-all flex items-center justify-between text-xs text-zinc-400 group"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#FACC15] transition-colors" />
            <span className="truncate">
              {searchQuery
                ? `Filter: "${searchQuery}"`
                : "Search verified recipes, SHA-256 digests, or commands..."}
            </span>
          </span>
          <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-mono rounded bg-[#09090B] border border-white/[0.08] text-zinc-400 group-hover:text-[#FACC15] group-hover:border-[#FACC15]/30">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: PGP Status Pill, Terminal Toggle & Frameless Window Controls */}
      <div className="flex items-center gap-1.5">
        <div
          title="Active OpenPGP Verified Sources"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#121215] border border-white/[0.08] text-[11px] font-mono"
        >
          <ShieldCheck
            className={`w-3.5 h-3.5 ${
              trustedLibraryCount > 0 ? "text-[#10B981]" : "text-[#F59E0B]"
            }`}
          />
          <span className="text-zinc-300">
            {trustedLibraryCount > 0
              ? `${trustedLibraryCount} PGP Source`
              : "Zero-Trust Mode"}
          </span>
        </div>

        <button
          type="button"
          onClick={onTriggerOnboardingPreview}
          title="Re-open First-Launch Opt-In Trust Flow Modal"
          className="h-7 px-2 rounded-md bg-[#121215] hover:bg-[#18181C] border border-white/[0.08] hover:border-[#FACC15]/35 text-[11px] text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3 text-[#FACC15]" />
          <span className="hidden md:inline">Trust Flow</span>
        </button>

        <button
          type="button"
          onClick={onToggleTerminal}
          title="Toggle Execution Terminal Drawer"
          className={`h-7 px-2 rounded-md border text-[11px] font-mono flex items-center gap-1.5 transition-colors ${
            isTerminalOpen
              ? "bg-[#FACC15]/15 border-[#FACC15]/40 text-[#FACC15]"
              : "bg-[#121215] hover:bg-[#18181C] border-white/[0.08] text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Runner</span>
        </button>

        <div className="h-4 w-[1px] bg-white/[0.08] mx-1" />

        {/* Window Controls */}
        <button
          type="button"
          onClick={() => windowMinimize()}
          aria-label="Minimize Window"
          className="w-7 h-7 rounded-md hover:bg-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => windowToggleMaximize()}
          aria-label="Maximize Window"
          className="w-7 h-7 rounded-md hover:bg-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => windowClose()}
          aria-label="Close Window"
          className="w-7 h-7 rounded-md hover:bg-red-500/20 flex items-center justify-center text-zinc-400 hover:text-red-400 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};

