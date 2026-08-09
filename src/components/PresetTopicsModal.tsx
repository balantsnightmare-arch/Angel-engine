import React from "react";
import { PRESET_TOPICS } from "../lib/constants";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { playBeep } from "../lib/sound";

interface PresetTopicsModalProps {
  onSelectTopic: (topic: string) => void;
  onClose: () => void;
}

export const PresetTopicsModal: React.FC<PresetTopicsModalProps> = ({
  onSelectTopic,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono"
      style={{ background: "rgba(0,0,0,0.88)" }}
    >
      <div
        className="w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
        style={{
          background: "var(--nerv-bg2)",
          border: "2px solid var(--nerv-orange)",
          boxShadow: "0 0 40px rgba(184,98,26,0.2)",
        }}
      >
        {/* Header */}
        <div
          className="p-4 flex items-center justify-between shrink-0 relative"
          style={{
            background: "var(--nerv-bg3)",
            borderBottom: "1px solid var(--nerv-orange-dim)",
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-0.5"
            style={{
              backgroundImage: "repeating-linear-gradient(90deg, var(--nerv-orange) 0, var(--nerv-orange) 8px, transparent 8px, transparent 16px)",
            }}
          />
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5" style={{ color: "var(--nerv-orange)" }} />
            <h2
              className="text-base font-black uppercase tracking-widest"
              style={{ color: "var(--nerv-amber)" }}
            >
              SELECT PRESET DELIBERATION TOPIC
            </h2>
          </div>
          <button
            onClick={() => { playBeep(700, 0.04); onClose(); }}
            className="p-1 transition cursor-pointer"
            style={{ color: "var(--nerv-text-dim)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--nerv-orange)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--nerv-text-dim)")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Topics List */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {PRESET_TOPICS.map((cat, i) => (
            <div key={i} className="space-y-2">
              <h3
                className="font-bold uppercase tracking-wider flex items-center space-x-2"
                style={{ color: "var(--nerv-orange)" }}
              >
                <span
                  className="w-2 h-2"
                  style={{ background: "var(--nerv-orange-dim)" }}
                />
                <span>{cat.category}</span>
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {cat.topics.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      playBeep(1000, 0.05);
                      onSelectTopic(t);
                      onClose();
                    }}
                    className="p-3 text-left transition flex items-center justify-between group cursor-pointer"
                    style={{
                      background: "#050506",
                      border: "1px solid var(--nerv-orange-dim)",
                      color: "var(--nerv-text)",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = "var(--nerv-orange)";
                      e.currentTarget.style.color = "var(--nerv-amber)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = "var(--nerv-orange-dim)";
                      e.currentTarget.style.color = "var(--nerv-text)";
                    }}
                  >
                    <span className="leading-relaxed">"{t}"</span>
                    <ArrowRight
                      className="w-4 h-4 shrink-0 ml-2 transition-transform group-hover:translate-x-1"
                      style={{ color: "var(--nerv-text-dim)" }}
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
