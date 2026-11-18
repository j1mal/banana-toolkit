import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Play,
  Download,
  FileText,
  Terminal,
  Hash,
  Lock,
  CheckCircle2,
  KeyRound,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import {
  PgpVerificationResult,
  RecipeCatalogItem,
  RecipeStep,
} from "../types/toolkit";

interface RecipeStepsDrawerProps {
  recipe: RecipeCatalogItem | null;
  onClose: () => void;
  onExecuteRecipe: (recipe: RecipeCatalogItem) => void;
  onVerifyRecipePgp: (recipe: RecipeCatalogItem) => Promise<PgpVerificationResult>;
  isRunning: boolean;
}

function getStepBadgeMeta(step: RecipeStep) {
  switch (step.type) {
    case "download":
      return {
        label: "download",
        icon: Download,
        color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
      };
    case "write_file":
      return {
        label: "write_file",
        icon: FileText,
        color: "text-[#FACC15] bg-[#FACC15]/10 border-[#FACC15]/30",
      };
    case "run_command":
      return {
        label: "run_command",
        icon: Terminal,
        color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
      };
    case "verify_sha256":
      return {
        label: "verify_sha256",
        icon: Hash,
        color: "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30",
      };
  }
}

export const RecipeStepsDrawer: React.FC<RecipeStepsDrawerProps> = ({
  recipe,
  onClose,
  onExecuteRecipe,
  onVerifyRecipePgp,
  isRunning,
}) => {
  const [verificationResult, setVerificationResult] =
    useState<PgpVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  if (!recipe) return null;

  const handleVerifyClick = async () => {
    setIsVerifying(true);
    try {
      const res = await onVerifyRecipePgp(recipe);
      setVerificationResult(res);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopySha256 = () => {
    navigator.clipboard.writeText(recipe.manifestSha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/65 backdrop-blur-sm">
      {/* Backdrop click target */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-over Inspector Drawer */}
      <div className="w-full max-w-2xl bg-[#121215] border-l border-white/[0.1] h-full flex flex-col justify-between shadow-2xl overflow-hidden">
        {/* Top Drawer Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-start justify-between gap-4 bg-[#09090B]/60">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#121215] border border-white/[0.08] font-mono text-[11px] text-[#FACC15]">
                v{recipe.version}
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {recipe.libraryName}
              </span>
              {recipe.pgpVerified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-[11px] font-medium">
                  <ShieldCheck className="w-3 h-3" />
                  PGP Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] text-[11px] font-medium">
                  <ShieldAlert className="w-3 h-3" />
                  Unverified / Untrusted
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">
              {recipe.name}
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {recipe.longDescription}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#121215] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-zinc-100 shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body: Cryptographic Metadata + Declarative Steps[] */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Cryptographic Manifest Card */}
          <div className="rounded-xl bg-[#09090B] border border-white/[0.08] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <KeyRound className="w-3.5 h-3.5 text-[#FACC15]" />
                <span>Cryptographic Provenance & Detached Signature</span>
              </div>
              <button
                type="button"
                onClick={handleVerifyClick}
                disabled={isVerifying}
                className="px-2.5 py-1 rounded-lg bg-[#121215] hover:bg-[#18181C] border border-[#FACC15]/35 text-[11px] font-medium text-[#FACC15] flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>
                  {isVerifying
                    ? "Verifying via rPGP..."
                    : "Verify Detached .asc"}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 text-[11px] font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-lg bg-[#121215] border border-white/[0.05] gap-1">
                <span className="text-zinc-500">PGP Fingerprint:</span>
                <span className="text-[#FACC15]">{recipe.fingerprint}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-lg bg-[#121215] border border-white/[0.05] gap-1">
                <span className="text-zinc-500">Manifest SHA-256:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-300 truncate max-w-[320px]">
                    {recipe.manifestSha256}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySha256}
                    className="text-zinc-400 hover:text-[#FACC15]"
                    title="Copy SHA-256"
                  >
                    {copiedHash ? (
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Live Verification Result Banner */}
            {verificationResult && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                  verificationResult.valid
                    ? "bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]"
                    : "bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="font-semibold">
                    {verificationResult.detailMessage}
                  </div>
                  <div className="text-zinc-400">
                    Key ID: {verificationResult.keyId} • Algo:{" "}
                    {verificationResult.algorithm} • Verified:{" "}
                    {new Date(verificationResult.verifiedAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Declarative Steps Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Declarative Execution Pipeline (steps[{recipe.steps.length}])
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Every operation below is strictly scoped to the recipe vault
                  workspace and audited before execution.
                </p>
              </div>
              <span className="text-[11px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-[#09090B] border border-white/[0.08]">
                Zero Blind Execution
              </span>
            </div>

            {/* Step List */}
            <div className="space-y-3">
              {recipe.steps.map((step, index) => {
                const badge = getStepBadgeMeta(step);
                const StepIcon = badge.icon;

                return (
                  <div
                    key={index}
                    className="rounded-xl bg-[#09090B] border border-white/[0.08] p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-[#121215] border border-white/[0.08] font-mono text-[11px] text-zinc-400 flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border font-mono text-[11px] font-medium ${badge.color}`}
                        >
                          <StepIcon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      </div>

                      {step.type === "write_file" && step.readonly && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FACC15]/15 border border-[#FACC15]/30 text-[#FACC15] font-mono text-[10px]">
                          <Lock className="w-2.5 h-2.5" />
                          readonly: true
                        </span>
                      )}
                    </div>

                    {/* Step Type Details */}
                    {step.type === "download" && (
                      <div className="space-y-1.5 font-mono text-xs">
                        <div className="text-zinc-400 text-[11px]">
                          Source URL:{" "}
                          <span className="text-zinc-200 break-all">
                            {step.url}
                          </span>
                        </div>
                        <div className="text-zinc-400 text-[11px]">
                          Target Path:{" "}
                          <span className="text-[#FACC15]">
                            {step.destination}
                          </span>
                        </div>
                      </div>
                    )}

                    {step.type === "write_file" && (
                      <div className="space-y-2">
                        <div className="font-mono text-[11px] text-zinc-400">
                          File Path:{" "}
                          <span className="text-zinc-200">{step.path}</span>
                        </div>
                        <pre className="p-3 rounded-lg bg-[#121215] border border-white/[0.06] font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-44">
                          {step.content}
                        </pre>
                      </div>
                    )}

                    {step.type === "run_command" && (
                      <div className="space-y-1.5">
                        <div className="p-2.5 rounded-lg bg-[#121215] border border-white/[0.06] font-mono text-xs text-zinc-200">
                          <span className="text-[#FACC15] mr-2">$</span>
                          {step.program} {step.args.join(" ")}
                        </div>
                        {step.working_dir && (
                          <div className="text-[11px] font-mono text-zinc-500">
                            working_dir: {step.working_dir}
                          </div>
                        )}
                      </div>
                    )}

                    {step.type === "verify_sha256" && (
                      <div className="space-y-1 font-mono text-[11px]">
                        <div className="text-zinc-400">
                          Target File:{" "}
                          <span className="text-zinc-200">{step.path}</span>
                        </div>
                        <div className="text-zinc-400">
                          Expected SHA-256:{" "}
                          <span className="text-[#10B981] break-all">
                            {step.expected_sha256}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Drawer Action Bar */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-[#09090B] flex items-center justify-between gap-4">
          <div className="text-xs text-zinc-400">
            Executes in isolated vault directory with real-time stdout streaming
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#121215] hover:bg-[#18181C] border border-white/[0.08] text-xs font-medium text-zinc-300 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              disabled={isRunning}
              onClick={() => onExecuteRecipe(recipe)}
              className="px-5 py-2 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] text-[#09090B] font-semibold text-xs shadow-banana-glow flex items-center gap-2 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                {isRunning
                  ? "Executing Steps..."
                  : `Execute ${recipe.steps.length} Declarative Steps`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

