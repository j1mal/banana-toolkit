import React, { useEffect, useRef } from "react";
import {
  Terminal,
  X,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Trash2,
  HardDrive,
} from "lucide-react";
import { RecipeStepEvent } from "../types/toolkit";

interface TerminalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  events: RecipeStepEvent[];
  onClearLogs: () => void;
  isExecuting: boolean;
  activeRecipeName: string | null;
  onOpenVault: () => void;
}

export const TerminalDrawer: React.FC<TerminalDrawerProps> = ({
  isOpen,
  onClose,
  events,
  onClearLogs,
  isExecuting,
  activeRecipeName,
  onOpenVault,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events, isOpen]);

  if (!isOpen) return null;

  const latestEvent = events[events.length - 1];
  const progress = latestEvent?.progressPercent ?? 0;

  return (
    <div className="h-64 bg-[#09090B] border-t border-white/[0.12] flex flex-col shrink-0 z-20 shadow-2xl">
      {/* Drawer Header */}
      <div className="h-10 px-4 bg-[#121215] border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-zinc-200">
            <Terminal className="w-3.5 h-3.5 text-[#FACC15]" />
            <span>Declarative Recipe Step Runner</span>
          </div>

          {activeRecipeName && (
            <span className="px-2 py-0.5 rounded bg-[#09090B] border border-white/[0.08] font-mono text-[11px] text-[#FACC15]">
              {activeRecipeName}
            </span>
          )}

          {isExecuting ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#FACC15]">
              <Loader2 className="w-3 h-3 animate-spin" />
              Streaming stdout ({progress}%)
            </span>
          ) : events.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#10B981]">
              <CheckCircle2 className="w-3 h-3" />
              Ready ({events.length} events)
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {!isExecuting && events.length > 0 && (
            <button
              type="button"
              onClick={onOpenVault}
              className="px-2.5 py-1 rounded-md bg-[#FACC15]/15 hover:bg-[#FACC15]/25 border border-[#FACC15]/40 text-[11px] font-mono text-[#FACC15] flex items-center gap-1 transition-colors"
            >
              <HardDrive className="w-3 h-3" />
              <span>View in Vault</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClearLogs}
            title="Clear Terminal Output"
            className="p-1.5 rounded-md hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Minimize Terminal Drawer"
            className="p-1.5 rounded-md hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-0.5 w-full bg-[#121215]">
        <div
          className="h-full bg-gradient-to-r from-[#FACC15] to-[#10B981] transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Log Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1.5 select-text"
      >
        {events.length === 0 ? (
          <div className="text-zinc-500 text-xs">
            No recipe execution logs yet. Click{" "}
            <span className="text-[#FACC15]">Install / Run Recipe</span> on any
            catalog card to stream declarative step progress here.
          </div>
        ) : (
          events.map((evt, idx) => {
            let badgeColor = "text-zinc-400 border-white/[0.08] bg-[#121215]";
            if (evt.status === "running") {
              badgeColor =
                "text-[#FACC15] border-[#FACC15]/30 bg-[#FACC15]/10";
            } else if (evt.status === "success") {
              badgeColor =
                "text-[#10B981] border-[#10B981]/30 bg-[#10B981]/10";
            } else if (evt.status === "error") {
              badgeColor = "text-red-400 border-red-500/30 bg-red-500/10";
            } else if (evt.status === "stdout") {
              badgeColor = "text-sky-400 border-sky-500/30 bg-sky-500/10";
            }

            return (
              <div
                key={idx}
                className="flex items-start gap-2.5 leading-relaxed"
              >
                <span className="text-zinc-600 shrink-0 text-[11px]">
                  [{evt.timestamp}]
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded border text-[10px] uppercase shrink-0 ${badgeColor}`}
                >
                  {evt.stepType}
                </span>
                <span
                  className={`break-all text-[11px] ${
                    evt.status === "error"
                      ? "text-red-400"
                      : evt.status === "success"
                      ? "text-zinc-200"
                      : "text-zinc-300"
                  }`}
                >
                  {evt.status === "error" && (
                    <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-red-400" />
                  )}
                  {evt.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

