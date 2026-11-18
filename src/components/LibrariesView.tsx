import React, { useState } from "react";
import {
  KeyRound,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Clock,
  CheckCircle2,
  X,
  Sparkles,
  Trash2,
} from "lucide-react";
import { LibraryEntry, PgpVerificationResult } from "../types/toolkit";
import { generateSignedManifestBundle } from "../services/tauriBridge";

interface LibrariesViewProps {
  libraries: LibraryEntry[];
  onToggleLibrary: (libraryId: string) => void;
  onRefreshAndVerifyLibrary: (
    library: LibraryEntry
  ) => Promise<PgpVerificationResult>;
  onAddLibrary: (newLib: {
    name: string;
    manifestUrl: string;
    publicKeyArmored: string;
    signatureAsc?: string;
    fingerprint?: string;
  }) => Promise<void>;
  onRemoveLibrary: (libraryId: string) => void;
}

export const LibrariesView: React.FC<LibrariesViewProps> = ({
  libraries,
  onToggleLibrary,
  onRefreshAndVerifyLibrary,
  onAddLibrary,
  onRemoveLibrary,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationMap, setVerificationMap] = useState<
    Record<string, PgpVerificationResult>
  >({});

  // "+ Add Library" Modal state
  const [libName, setLibName] = useState("");
  const [manifestUrl, setManifestUrl] = useState("");
  const [publicKeyArmored, setPublicKeyArmored] = useState("");
  const [generatedSig, setGeneratedSig] = useState<string | undefined>(
    undefined
  );
  const [generatedFp, setGeneratedFp] = useState<string | undefined>(undefined);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleRefreshVerify = async (lib: LibraryEntry) => {
    setVerifyingId(lib.id);
    try {
      const result = await onRefreshAndVerifyLibrary(lib);
      setVerificationMap((prev) => ({ ...prev, [lib.id]: result }));
    } finally {
      setVerifyingId(null);
    }
  };

  const handleGenerateSampleKey = async () => {
    setIsGeneratingSample(true);
    setFormError(null);
    try {
      const targetName = libName.trim() || "community/retro-tweaks";
      const samplePayload = JSON.stringify({
        library: targetName,
        schemaVersion: 1,
      });
      const bundle = await generateSignedManifestBundle(
        samplePayload,
        `${targetName} Maintainer <maintainer@banana-toolkit.dev>`
      );
      if (!libName.trim()) setLibName(targetName);
      if (!manifestUrl.trim()) {
        setManifestUrl(
          `https://raw.githubusercontent.com/${targetName}/main/index.json`
        );
      }
      setPublicKeyArmored(bundle.publicKeyArmored);
      setGeneratedSig(bundle.signatureAsc);
      setGeneratedFp(bundle.fingerprint);
    } finally {
      setIsGeneratingSample(false);
    }
  };

  const handleCreateLibrary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!libName.trim() || !manifestUrl.trim() || !publicKeyArmored.trim()) {
      setFormError(
        "Please provide a Library Name, Manifest URL (index.json), and Author Public PGP Key."
      );
      return;
    }

    await onAddLibrary({
      name: libName.trim(),
      manifestUrl: manifestUrl.trim(),
      publicKeyArmored: publicKeyArmored.trim(),
      signatureAsc: generatedSig,
      fingerprint: generatedFp,
    });

    setLibName("");
    setManifestUrl("");
    setPublicKeyArmored("");
    setGeneratedSig(undefined);
    setGeneratedFp(undefined);
    setFormError(null);
    setIsAddModalOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/[0.08]">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
            Libraries (Sources & OpenPGP Keys)
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage community manifest endpoints and verify detached{" "}
            <code className="font-mono text-zinc-300">.asc</code> OpenPGP
            signatures against pinned author keys.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] text-[#09090B] font-semibold text-xs shadow-banana-glow inline-flex items-center gap-1.5 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Library</span>
        </button>
      </div>

      {/* Libraries List */}
      <div className="space-y-4">
        {libraries.map((lib) => {
          const isVerifying = verifyingId === lib.id;
          const latestAudit = verificationMap[lib.id];

          return (
            <div
              key={lib.id}
              className="banana-card rounded-2xl p-5 space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Name, Status Badge, Manifest URL */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-base font-semibold text-zinc-100">
                      {lib.name}
                    </span>

                    {lib.pgpVerified && lib.trusted ? (
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

                    <span className="px-2 py-0.5 rounded bg-[#09090B] border border-white/[0.08] font-mono text-[11px] text-zinc-400">
                      {lib.recipeCount} recipes
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono truncate">
                    <Globe className="w-3.5 h-3.5 text-[#FACC15] shrink-0" />
                    <span className="truncate">{lib.manifestUrl}</span>
                  </div>
                </div>

                {/* Right: Toggle Switch, Refresh & Verify Button, Delete */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {/* Enable/Disable Switch */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-xs text-zinc-400">
                      {lib.enabled ? "Enabled" : "Disabled"}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={lib.enabled}
                      onClick={() => onToggleLibrary(lib.id)}
                      className={`w-10 h-5 rounded-full transition-colors p-0.5 ${
                        lib.enabled
                          ? "bg-[#FACC15]"
                          : "bg-[#09090B] border border-white/[0.15]"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full transition-transform ${
                          lib.enabled
                            ? "translate-x-5 bg-[#09090B]"
                            : "translate-x-0 bg-zinc-500"
                        }`}
                      />
                    </button>
                  </label>

                  <button
                    type="button"
                    disabled={isVerifying}
                    onClick={() => handleRefreshVerify(lib)}
                    className="px-3.5 py-2 rounded-xl bg-[#09090B] hover:bg-[#18181C] border border-white/[0.1] hover:border-[#FACC15]/40 text-xs font-medium text-zinc-200 flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 text-[#FACC15] ${
                        isVerifying ? "animate-spin" : ""
                      }`}
                    />
                    <span>
                      {isVerifying ? "Verifying PGP..." : "Refresh & Verify"}
                    </span>
                  </button>

                  {lib.id !== "j1mal-banana-library" && (
                    <button
                      type="button"
                      onClick={() => onRemoveLibrary(lib.id)}
                      title="Remove Library"
                      className="p-2 rounded-xl bg-[#09090B] hover:bg-red-500/15 border border-white/[0.08] hover:border-red-500/40 text-zinc-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* PGP Fingerprint & Last-Synced Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-white/[0.06] font-mono text-xs">
                <div className="md:col-span-2 p-2.5 rounded-xl bg-[#09090B] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#FACC15]" />
                    PGP Fingerprint
                  </span>
                  <span className="text-[#FACC15] text-[11px] tracking-wide">
                    {lib.fingerprint}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#09090B] border border-white/[0.06] flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    Last Synced
                  </span>
                  <span className="text-zinc-300 text-[11px]">
                    {lib.lastSynced
                      ? new Date(lib.lastSynced).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      : "Never"}
                  </span>
                </div>
              </div>

              {/* Verification Result Readout */}
              {latestAudit && (
                <div
                  className={`p-3.5 rounded-xl border font-mono text-xs flex items-start gap-2.5 ${
                    latestAudit.valid
                      ? "bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]"
                      : "bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-[11px]">
                    <div className="font-semibold">
                      {latestAudit.detailMessage}
                    </div>
                    <div className="text-zinc-400">
                      Key ID: {latestAudit.keyId} • Algorithm:{" "}
                      {latestAudit.algorithm} • Manifest SHA-256:{" "}
                      {latestAudit.manifestSha256.slice(0, 32)}...
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* "+ Add Library" Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl bg-[#121215] border border-white/[0.12] shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FACC15]/15 border border-[#FACC15]/40 flex items-center justify-center text-[#FACC15]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-100">
                    Add Community Library Source
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Pin an author&apos;s ASCII-armored OpenPGP public key for
                    manifest verification
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-[#09090B] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLibrary} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Library Name
                </label>
                <input
                  type="text"
                  value={libName}
                  onChange={(e) => setLibName(e.target.value)}
                  placeholder="e.g. community/retro-tweaks"
                  className="w-full h-9 px-3 rounded-xl bg-[#09090B] border border-white/[0.1] focus:border-[#FACC15]/50 focus:outline-none text-xs text-zinc-100 placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Manifest URL (index.json)
                </label>
                <input
                  type="url"
                  value={manifestUrl}
                  onChange={(e) => setManifestUrl(e.target.value)}
                  placeholder="https://raw.githubusercontent.com/owner/repo/main/index.json"
                  className="w-full h-9 px-3 rounded-xl bg-[#09090B] border border-white/[0.1] focus:border-[#FACC15]/50 focus:outline-none font-mono text-xs text-zinc-100 placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-zinc-300">
                    Author Public PGP Key (ASCII Armored block)
                  </label>
                  <button
                    type="button"
                    disabled={isGeneratingSample}
                    onClick={handleGenerateSampleKey}
                    className="text-[11px] font-mono text-[#FACC15] hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>
                      {isGeneratingSample
                        ? "Generating Ed25519 Key..."
                        : "Generate Valid Ed25519 PGP Key"}
                    </span>
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={publicKeyArmored}
                  onChange={(e) => setPublicKeyArmored(e.target.value)}
                  placeholder={`-----BEGIN PGP PUBLIC KEY BLOCK-----\n...\n-----END PGP PUBLIC KEY BLOCK-----`}
                  className="w-full p-3 rounded-xl bg-[#09090B] border border-white/[0.1] focus:border-[#FACC15]/50 focus:outline-none font-mono text-[11px] text-zinc-200 placeholder:text-zinc-600"
                />
              </div>

              {formError && (
                <div className="p-2.5 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-xs text-[#F59E0B]">
                  {formError}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#09090B] hover:bg-white/[0.06] border border-white/[0.08] text-xs font-medium text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] text-[#09090B] font-semibold text-xs shadow-banana-glow"
                >
                  Save & Verify Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

