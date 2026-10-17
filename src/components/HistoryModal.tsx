import React, { useState } from "react";
import { X, History, Trash2, Download, FileDown, ArrowRight } from "lucide-react";
import { playBeep } from "../lib/sound";
import { HistoryEntry, exportAllJson, exportEntryMarkdown } from "../lib/history";

interface HistoryModalProps {
  entries: HistoryEntry[];
  onOpenEntry: (entry: HistoryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

const STATUS_STYLE: Record<HistoryEntry["status"], { label: string; color: string; border: string }> = {
  CONSENSUS_REACHED: { label: "CONSENSUS", color: "#4ab84a", border: "#1e6a1e" },
  SPLIT_DECISION: { label: "SPLIT", color: "var(--nerv-amber)", border: "var(--nerv-orange-dim)" },
  ERROR: { label: "ERROR", color: "#e06060", border: "var(--nerv-red-bright)" },
};

export const HistoryModal: React.FC<HistoryModalProps> = ({
  entries,
  onOpenEntry,
  onDeleteEntry,
  onClearAll,
  onClose,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);
  const [filter, setFilter] = useState("");

  const shown = filter.trim()
    ? entries.filter((e) => e.topic.toLowerCase().includes(filter.trim().toLowerCase()))
    : entries;

  const smallBtn: React.CSSProperties = {
    background: "#050506",
    border: "1px solid var(--nerv-orange-dim)",
    color: "var(--nerv-text)",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono"
      style={{ background: "rgba(0,0,0,0.88)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
        style={{
          background: "var(--nerv-bg2)",
          border: "2px solid var(--nerv-orange)",
          boxShadow: "0 0 40px rgba(184,98,26,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-4 flex items-center justify-between shrink-0 relative"
          style={{ background: "var(--nerv-bg3)", borderBottom: "1px solid var(--nerv-orange-dim)" }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-0.5"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, var(--nerv-orange) 0, var(--nerv-orange) 8px, transparent 8px, transparent 16px)",
            }}
          />
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5" style={{ color: "var(--nerv-orange)" }} />
            <h2 className="text-base font-black uppercase tracking-widest" style={{ color: "var(--nerv-amber)" }}>
              DELIBERATION ARCHIVE ({entries.length})
            </h2>
          </div>
          <button
            onClick={() => { playBeep(700, 0.04); onClose(); }}
            className="p-1 transition cursor-pointer"
            style={{ color: "var(--nerv-text-dim)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--nerv-orange)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--nerv-text-dim)")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        {entries.length > 0 && (
          <div
            className="px-4 py-2 flex flex-wrap items-center gap-2 shrink-0 text-xs"
            style={{ borderBottom: "1px solid var(--nerv-orange-dim)" }}
          >
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search topics..."
              className="flex-1 min-w-[140px] px-2 py-1 focus:outline-none"
              style={{ background: "#0C0800", border: "1px solid var(--nerv-amber-dim)", color: "var(--nerv-amber)" }}
            />
            <button
              onClick={() => { playBeep(900, 0.04); exportAllJson(entries); }}
              className="px-2.5 py-1 font-bold flex items-center space-x-1 cursor-pointer"
              style={smallBtn}
              title="Download every saved debate as one JSON file"
            >
              <Download className="w-3.5 h-3.5" style={{ color: "var(--nerv-orange)" }} />
              <span>EXPORT ALL</span>
            </button>
            {confirmClear ? (
              <>
                <button
                  onClick={() => { playBeep(500, 0.08); onClearAll(); setConfirmClear(false); }}
                  className="px-2.5 py-1 font-bold cursor-pointer"
                  style={{ background: "var(--nerv-red)", border: "1px solid var(--nerv-red-bright)", color: "#fff" }}
                >
                  CONFIRM CLEAR
                </button>
                <button onClick={() => setConfirmClear(false)} className="px-2.5 py-1 font-bold cursor-pointer" style={smallBtn}>
                  CANCEL
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="px-2.5 py-1 font-bold flex items-center space-x-1 cursor-pointer"
                style={{ ...smallBtn, border: "1px solid var(--nerv-red-bright)", color: "var(--nerv-red-bright)" }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>CLEAR ALL</span>
              </button>
            )}
          </div>
        )}

        {/* List */}
        <div className="p-4 overflow-y-auto flex-1 text-xs space-y-2">
          {entries.length === 0 && (
            <div className="py-10 text-center leading-relaxed" style={{ color: "var(--nerv-text-dim)" }}>
              NO DELIBERATIONS ARCHIVED YET.
              <br />
              Finished council sessions are saved here automatically.
            </div>
          )}
          {entries.length > 0 && shown.length === 0 && (
            <div className="py-6 text-center" style={{ color: "var(--nerv-text-dim)" }}>
              No topics match "{filter}".
            </div>
          )}
          {shown.map((e) => {
            const s = STATUS_STYLE[e.status];
            return (
              <div
                key={e.id}
                className="p-3 flex items-start gap-3"
                style={{ background: "#050506", border: "1px solid var(--nerv-orange-dim)" }}
              >
                <button
                  onClick={() => { playBeep(1000, 0.05); onOpenEntry(e); }}
                  className="flex-1 text-left cursor-pointer group min-w-0"
                  title="Open this debate"
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-1.5 py-0.5 font-bold text-[10px]" style={{ color: s.color, border: `1px solid ${s.border}` }}>
                      {s.label}
                    </span>
                    {e.verdict?.finalScore && (
                      <span className="text-[10px] font-bold" style={{ color: s.color }}>{e.verdict.finalScore}</span>
                    )}
                    <span className="text-[10px]" style={{ color: "var(--nerv-text-dim)" }}>
                      {new Date(e.createdAt).toLocaleString()} · {e.mode} · {e.turns.length} turns
                    </span>
                  </div>
                  <div className="leading-relaxed flex items-center" style={{ color: "var(--nerv-text)" }}>
                    <span className="truncate">"{e.topic}"</span>
                    <ArrowRight
                      className="w-4 h-4 shrink-0 ml-2 transition-transform group-hover:translate-x-1"
                      style={{ color: "var(--nerv-text-dim)" }}
                    />
                  </div>
                </button>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => { playBeep(900, 0.04); exportEntryMarkdown(e); }}
                    className="p-1 cursor-pointer"
                    style={{ color: "var(--nerv-text-dim)" }}
                    title="Download as Markdown"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { playBeep(600, 0.05); onDeleteEntry(e.id); }}
                    className="p-1 cursor-pointer"
                    style={{ color: "var(--nerv-text-dim)" }}
                    onMouseEnter={(ev) => (ev.currentTarget.style.color = "var(--nerv-red-bright)")}
                    onMouseLeave={(ev) => (ev.currentTarget.style.color = "var(--nerv-text-dim)")}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
