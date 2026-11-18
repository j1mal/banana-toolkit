import React from "react";
import {
  Compass,
  HardDrive,
  KeyRound,
  ShieldCheck,
  Sparkles,
  FileCode2,
} from "lucide-react";
import { NavigationTab } from "../types/toolkit";

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  catalogCount: number;
  vaultCount: number;
  librariesCount: number;
  configPath: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  catalogCount,
  vaultCount,
  librariesCount,
  configPath,
}) => {
  const navItems: {
    id: NavigationTab;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeCount: number;
  }[] = [
    {
      id: "explore",
      label: "Explore",
      sublabel: "Catalog & Recipes",
      icon: Compass,
      badgeCount: catalogCount,
    },
    {
      id: "vault",
      label: "Vault",
      sublabel: "Installed Tools",
      icon: HardDrive,
      badgeCount: vaultCount,
    },
    {
      id: "libraries",
      label: "Libraries",
      sublabel: "Sources & PGP Keys",
      icon: KeyRound,
      badgeCount: librariesCount,
    },
  ];

  return (
    <aside className="w-60 bg-[#09090B] border-r border-white/[0.08] flex flex-col justify-between p-3 shrink-0 select-none">
      {/* Top Navigation */}
      <div className="space-y-5">
        <div className="px-2 pt-1">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Workspace Navigation
          </div>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group ${
                  isActive
                    ? "bg-[#121215] text-zinc-100 border border-[#FACC15]/35 shadow-card-subtle"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-[#121215]/60 border border-transparent"
                }`}
              >
                {/* Left Banana Gold Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-[#FACC15]" />
                )}

                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-[#FACC15]/15 text-[#FACC15]"
                        : "bg-[#121215] text-zinc-400 group-hover:text-zinc-200 border border-white/[0.06]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold leading-tight">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {item.sublabel}
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 text-[11px] font-mono rounded-md border ${
                    isActive
                      ? "bg-[#FACC15]/15 border-[#FACC15]/40 text-[#FACC15]"
                      : "bg-[#09090B] border-white/[0.06] text-zinc-400"
                  }`}
                >
                  {item.badgeCount}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Security & Cryptographic Engine Card */}
      <div className="space-y-2.5">
        <div className="p-3 rounded-xl bg-[#121215] border border-white/[0.08] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              OpenPGP Verifier
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
              rPGP Pure-Rust
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Detached <code className="font-mono text-zinc-300">.asc</code>{" "}
            signatures and step SHA-256 hashes are verified prior to execution.
          </p>

          <div className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-500">
            <span className="flex items-center gap-1 truncate" title={configPath}>
              <FileCode2 className="w-3 h-3 text-[#FACC15] shrink-0" />
              libraries.json
            </span>
            <span className="text-zinc-400 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-[#FACC15]" />
              Synced
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

