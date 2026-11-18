import React, { useState } from "react";
import {
  HardDrive,
  Play,
  FolderOpen,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  Clock,
  KeyRound,
  Hash,
  Terminal,
  Compass,
  RefreshCw,
} from "lucide-react";
import { InstalledVaultItem, PgpVerificationResult } from "../types/toolkit";

interface VaultViewProps {
  vaultItems: InstalledVaultItem[];
  onLaunchTool: (item: InstalledVaultItem) => void;
  onOpenFolder: (item: InstalledVaultItem) => void;
  onReverifySignature: (
    item: InstalledVaultItem
  ) => Promise<PgpVerificationResult>;
  onUninstallTool: (item: InstalledVaultItem) => void;
  onNavigateExplore: () => void;
}

export const VaultView: React.FC<VaultViewProps> = ({
  vaultItems,
  onLaunchTool,
  onOpenFolder,
  onReverifySignature,
  onUninstallTool,
  onNavigateExplore,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(
    vaultItems[0]?.id ?? null
  );
  const [verifyFeedback, setVerifyFeedback] = useState<{
    itemId: string;
    result: PgpVerificationResult;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const activeItem =
    vaultItems.find((item) => item.id === selectedId) ?? vaultItems[0] ?? null;

  const handleReverify = async (item: InstalledVaultItem) => {
    setIsVerifying(true);
    setStatusBanner(null);
    try {
      const result = await onReverifySignature(item);
      setVerifyFeedback({ itemId: item.id, result });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLaunch = (item: InstalledVaultItem) => {
    onLaunchTool(item);
    setStatusBanner(
      `Launched ${item.name} (${item.executableHint}) inside sandboxed environment.`
    );
  };

  const handleOpenFolder = (item: InstalledVaultItem) => {
    onOpenFolder(item);
    setStatusBanner(`Opened vault workspace folder: ${item.installPath}`);
  };

  if (vaultItems.length === 0) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl bg-[#121215] border border-white/[0.08] p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#09090B] border border-[#FACC15]/30 flex items-center justify-center mx-auto text-[#FACC15] shadow-banana-glow">
            <HardDrive className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-semibold text-zinc-100">
              Your Vault is Empty
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Install or run any PGP-verified recipe from the Explore catalog to
              provision an isolated tool environment here.
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateExplore}
            className="px-4 py-2.5 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] text-[#09090B] font-semibold text-xs shadow-banana-glow inline-flex items-center gap-2 transition-all"
          >
            <Compass className="w-4 h-4" />
            <span>Browse Explore Catalog</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-6 gap-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
            Vault (Installed Environments)
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage provisioned tools, inspect sandbox directories, and
            re-verify detached OpenPGP signatures on demand.
          </p>
        </div>
        <div className="px-3 py-1 rounded-lg bg-[#121215] border border-white/[0.08] font-mono text-xs text-zinc-300">
          {vaultItems.length} Installed
        </div>
      </div>

      {/* Split-Pane Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden">
        {/* Left Pane: Installed Tools List (5 columns) */}
        <div className="lg:col-span-5 overflow-y-auto space-y-2.5 pr-1">
          {vaultItems.map((item) => {
            const isSelected = activeItem?.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedId(item.id);
                  setStatusBanner(null);
                }}
                className={`w-full text-left p-4 rounded-xl transition-all border ${
                  isSelected
                    ? "bg-[#121215] border-[#FACC15]/45 shadow-card-subtle"
                    : "bg-[#121215]/70 hover:bg-[#121215] border-white/[0.08] hover:border-[#FACC15]/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                      <span>{item.name}</span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                      {item.libraryName} • v{item.version}
                    </div>
                  </div>

                  {item.pgpVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-[10px] font-medium shrink-0">
                      <ShieldCheck className="w-3 h-3" />
                      PGP Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] text-[10px] font-medium shrink-0">
                      <ShieldAlert className="w-3 h-3" />
                      Unverified
                    </span>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span className="truncate max-w-[230px]">
                    {item.installPath}
                  </span>
                  <span>
                    {new Date(item.installedAt).toLocaleDateString()}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Pane: Detailed Inspector (7 columns) */}
        {activeItem && (
          <div className="lg:col-span-7 rounded-2xl bg-[#121215] border border-white/[0.08] p-6 overflow-y-auto flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Top Inspector Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-white/[0.08]">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#09090B] border border-white/[0.08] font-mono text-xs text-[#FACC15]">
                      v{activeItem.version}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">
                      {activeItem.category}
                    </span>
                    {activeItem.pgpVerified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-xs font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        PGP Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] text-xs font-medium">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Unverified / Untrusted
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-zinc-100">
                    {activeItem.name}
                  </h2>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {activeItem.description}
                  </p>
                </div>
              </div>

              {/* Four One-Click Action Buttons: Launch, Open Folder, Re-verify Signature, Uninstall */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleLaunch(activeItem)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] text-[#09090B] font-semibold text-xs shadow-banana-glow flex items-center justify-center gap-1.5 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Launch</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenFolder(activeItem)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#09090B] hover:bg-[#18181C] border border-white/[0.1] hover:border-[#FACC15]/35 text-xs font-medium text-zinc-200 flex items-center justify-center gap-1.5 transition-all"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#FACC15]" />
                  <span>Open Folder</span>
                </button>

                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={() => handleReverify(activeItem)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#09090B] hover:bg-[#18181C] border border-white/[0.1] hover:border-[#10B981]/40 text-xs font-medium text-zinc-200 flex items-center justify-center gap-1.5 transition-all"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-[#10B981] ${
                      isVerifying ? "animate-spin" : ""
                    }`}
                  />
                  <span>Re-verify Signature</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUninstallTool(activeItem)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#09090B] hover:bg-red-500/15 border border-white/[0.1] hover:border-red-500/40 text-xs font-medium text-zinc-300 hover:text-red-400 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Uninstall</span>
                </button>
              </div>

              {/* Action Feedback Banner */}
              {statusBanner && (
                <div className="p-3 rounded-xl bg-[#09090B] border border-[#FACC15]/35 text-xs font-mono text-[#FACC15] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{statusBanner}</span>
                </div>
              )}

              {/* Live Re-verification Feedback */}
              {verifyFeedback && verifyFeedback.itemId === activeItem.id && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-mono space-y-1 ${
                    verifyFeedback.result.valid
                      ? "bg-[#10B981]/10 border-[#10B981]/35 text-[#10B981]"
                      : "bg-[#F59E0B]/10 border-[#F59E0B]/35 text-[#F59E0B]"
                  }`}
                >
                  <div className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{verifyFeedback.result.detailMessage}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 pl-6">
                    Fingerprint: {verifyFeedback.result.fingerprint} • SHA-256:{" "}
                    {verifyFeedback.result.manifestSha256.slice(0, 24)}...
                  </div>
                </div>
              )}

              {/* Environment & Cryptographic Metadata Table */}
              <div className="rounded-xl bg-[#09090B] border border-white/[0.08] p-4 space-y-3 font-mono text-xs">
                <div className="text-[11px] font-sans font-semibold uppercase tracking-wider text-zinc-400">
                  Environment & Cryptographic Audit
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-[#121215] border border-white/[0.05] gap-1">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-[#FACC15]" />
                      Entrypoint Command
                    </span>
                    <span className="text-zinc-200">
                      {activeItem.executableHint}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-[#121215] border border-white/[0.05] gap-1">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <FolderOpen className="w-3.5 h-3.5 text-[#FACC15]" />
                      Install Path
                    </span>
                    <span className="text-zinc-300 break-all">
                      {activeItem.installPath}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-[#121215] border border-white/[0.05] gap-1">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#FACC15]" />
                      Signer PGP Fingerprint
                    </span>
                    <span className="text-[#FACC15]">
                      {activeItem.fingerprint}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-[#121215] border border-white/[0.05] gap-1">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-[#10B981]" />
                      Manifest SHA-256
                    </span>
                    <span className="text-zinc-300 break-all">
                      {activeItem.manifestSha256}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-[#121215] border border-white/[0.05] gap-1">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      Provisioned Timestamp
                    </span>
                    <span className="text-zinc-400">
                      {new Date(activeItem.installedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

