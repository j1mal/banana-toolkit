import React from "react";
import {
  ShieldCheck,
  KeyRound,
  Globe,
  Lock,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import {
  DEFAULT_LIBRARY_FINGERPRINT,
  DEFAULT_LIBRARY_OWNER_LABEL,
  DEFAULT_LIBRARY_URL,
} from "../data/defaultCatalog";

interface OnboardingModalProps {
  isOpen: boolean;
  configPath: string;
  onAcceptDefaultLibrary: () => void;
  onDeclineDefaultLibrary: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  configPath,
  onAcceptDefaultLibrary,
  onDeclineDefaultLibrary,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
      {/* Subtle Ambient Banana Gold Halo */}
      <div className="relative w-full max-w-xl rounded-2xl bg-[#121215]/95 border border-white/[0.12] shadow-2xl overflow-hidden">
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-96 h-36 bg-[#FACC15]/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#FACC15]/15 border border-[#FACC15]/40 flex items-center justify-center text-[#FACC15] shadow-banana-glow">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#FACC15]/10 text-[#FACC15] border border-[#FACC15]/30">
                  First-Launch Trust Setup
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  OpenPGP RFC 4880
                </span>
              </div>
              <h2 className="text-xl font-semibold text-zinc-100 mt-1">
                Initialize Default Library
              </h2>
            </div>
          </div>

          <p className="text-sm text-zinc-400 leading-relaxed">
            Banana Toolkit verifies all community libraries and automation
            recipes via detached{" "}
            <span className="text-zinc-200 font-medium">
              OpenPGP signatures (.asc)
            </span>{" "}
            before execution. Nothing runs blindly—every step is declarative,
            hash-checked, and auditable.
          </p>
        </div>

        {/* Source Card */}
        <div className="p-7 space-y-5">
          <div className="rounded-xl bg-[#09090B] border border-white/[0.08] p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#FACC15]" />
                <span className="text-xs font-semibold text-zinc-200">
                  j1mal/banana-library (Official Community Index)
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                <CheckCircle2 className="w-3 h-3" />
                PGP Verified
              </span>
            </div>

            {/* Manifest URL */}
            <div className="space-y-1">
              <div className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">
                Manifest URL (index.json)
              </div>
              <div className="px-3 py-2 rounded-lg bg-[#121215] border border-white/[0.06] font-mono text-xs text-zinc-300 break-all">
                {DEFAULT_LIBRARY_URL}
              </div>
            </div>

            {/* PGP Fingerprint */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#FACC15]" />
                  Author Public PGP Fingerprint
                </span>
                <span className="font-mono text-[10px] text-zinc-400">
                  Ed25519 / SHA-256
                </span>
              </div>
              <div className="px-3 py-2.5 rounded-lg bg-[#121215] border border-[#FACC15]/25 font-mono text-xs text-[#FACC15] flex flex-col gap-1">
                <span className="tracking-wide font-semibold">
                  {DEFAULT_LIBRARY_OWNER_LABEL}
                </span>
                <span className="text-[11px] text-zinc-400">
                  Full Key: {DEFAULT_LIBRARY_FINGERPRINT}
                </span>
              </div>
            </div>
          </div>

          {/* Local Config Path readout */}
          <div className="flex items-center gap-2 text-xs text-zinc-500 px-1">
            <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">
              Persists locally to{" "}
              <code className="font-mono text-zinc-300 bg-[#09090B] px-1.5 py-0.5 rounded border border-white/[0.06]">
                {configPath || "AppData/BananaToolkit/libraries.json"}
              </code>
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={onDeclineDefaultLibrary}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-transparent hover:bg-white/[0.05] border border-white/[0.08] hover:border-white/[0.18] text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-all flex items-center justify-center gap-2"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Decline (Advanced Users)</span>
            </button>

            <button
              type="button"
              onClick={onAcceptDefaultLibrary}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] text-[#09090B] font-semibold text-xs shadow-banana-glow transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Accept (Recommended)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

