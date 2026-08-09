import React, { useState, useEffect, useRef } from "react";
import { FinalVerdict, CouncilNodeConfig, SpeechTurn } from "../types";
import {
  ShieldCheck,
  CheckCircle,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  Send,
  MessageCircle,
  Loader2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { playBeep, speakText, stopSpeaking, isSpeaking } from "../lib/sound";

interface FollowUpAnswer {
  nodeId: string;
  codeName: string;
  answer: string;
}

interface FollowUpExchange {
  question: string;
  answers: FollowUpAnswer[];
}

interface VerdictDisplayProps {
  verdict: FinalVerdict;
  topic: string;
  nodes: CouncilNodeConfig[];
  turns: SpeechTurn[];
  onNewDeliberation: () => void;
}

const NODE_COLORS: Record<string, string> = {
  node1: "#b86030",
  node2: "#7a3060",
  node3: "#305060",
};

export const VerdictDisplay: React.FC<VerdictDisplayProps> = ({
  verdict,
  topic,
  nodes,
  turns,
  onNewDeliberation,
}) => {
  const [copied, setCopied] = useState(false);
  const [followUps, setFollowUps] = useState<FollowUpExchange[]>([]);
  const [followUpInput, setFollowUpInput] = useState("");
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
  const [thinkingNode, setThinkingNode] = useState<string | null>(null);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const voiceMutedRef = useRef(false);
  voiceMutedRef.current = voiceMuted;
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(
    () => new Set(nodes.map((n) => n.id))
  );
  const followUpEndRef = useRef<HTMLDivElement>(null);

  const toggleNodeSelection = (nodeId: string) => {
    setSelectedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        if (next.size > 1) next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!voiceMutedRef.current) {
        speakText(verdict.summary, "node3");
      }
    }, 500);
    return () => { clearTimeout(timer); stopSpeaking(); };
  }, [verdict.summary]);

  useEffect(() => {
    if (followUpEndRef.current) {
      followUpEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [followUps, thinkingNode]);

  const handleCopyReport = () => {
    playBeep(1000, 0.05);
    const text = `=== TRIAD AI COUNCIL FINAL VERDICT ===
STATUS: ${verdict.finalScore}
TOPIC: "${topic}"
TIMESTAMP: ${verdict.timestamp}

EXECUTIVE SUMMARY:
${verdict.summary}

CONSENSUS ACTION POINTS:
${verdict.consensusPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

${
  verdict.dissentingViews && verdict.dissentingViews.length > 0
    ? `DISSENTING VIEWS & CAUTIONS:\n${verdict.dissentingViews.map((d) => `- ${d}`).join("\n")}`
    : ""
}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAskFollowUp = async () => {
    const question = followUpInput.trim();
    if (!question || isAskingFollowUp) return;

    stopSpeaking();
    setIsAskingFollowUp(true);
    setFollowUpInput("");

    const exchange: FollowUpExchange = { question, answers: [] };
    setFollowUps(prev => [...prev, exchange]);

    const targetNodes = nodes.filter((n) => selectedNodeIds.has(n.id));

    try {
      const response = await fetch("/api/followup-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          topic,
          nodes: targetNodes,
          previousTurns: turns,
          verdictSummary: verdict.summary,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (!reader) throw new Error("No response stream");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ") && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6));
              if (currentEvent === "node_thinking") {
                setThinkingNode(data.codeName);
              } else if (currentEvent === "followup_answer") {
                setThinkingNode(null);
                const newAnswer: FollowUpAnswer = {
                  nodeId: data.nodeId,
                  codeName: data.codeName,
                  answer: data.answer,
                };
                setFollowUps(prev =>
                  prev.map((ex, i) =>
                    i === prev.length - 1
                      ? { ...ex, answers: [...ex.answers, newAnswer] }
                      : ex
                  )
                );
                if (!voiceMutedRef.current) speakText(data.answer, data.nodeId);
              }
            } catch {}
            currentEvent = "";
          }
        }
      }
    } catch (error: any) {
      console.error("Follow-up error:", error);
    } finally {
      setIsAskingFollowUp(false);
      setThinkingNode(null);
    }
  };

  return (
    <div
      className="w-full relative overflow-hidden font-mono p-4 sm:p-5"
      style={{
        background: "#030304",
        border: "2px solid #1e4a1e",
        boxShadow: "0 0 20px rgba(30,74,30,0.2)",
      }}
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(30,74,30,0.04) 2px, rgba(30,74,30,0.04) 4px)",
        }}
      />

      {/* Verdict Header */}
      {(() => {
        const isVetoed = verdict.finalScore.includes("BLOCKED");
        const headerColor = isVetoed ? "#ff4040" : "#4ab84a";
        const headerBg = isVetoed ? "#200404" : "var(--nerv-green-dim)";
        const headerBorder = isVetoed ? "#ff2020" : "#1e5a1e";
        const headerBorderBottom = isVetoed ? "1px solid rgba(255,32,32,0.4)" : "1px solid rgba(30,90,30,0.4)";
        const codeLabel = isVetoed ? "CODE 666" : "CODE 601";
        const titleText = isVetoed
          ? "DECISION BLOCKED — VETO INVOKED"
          : verdict.unanimous
          ? "UNANIMOUS CONSENSUS ACHIEVED"
          : "COUNCIL MAJORITY VERDICT REACHED";
        return (
      <div
        className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 relative z-10"
        style={{ borderBottom: headerBorderBottom }}
      >
        <div className="flex items-center space-x-3">
          <div
            className="p-2"
            style={{
              background: headerBg,
              border: `2px solid ${headerBorder}`,
            }}
          >
            <ShieldCheck className="w-6 h-6" style={{ color: headerColor }} />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span
                className="px-1.5 py-0.5 text-[10px] font-black tracking-widest uppercase"
                style={{ background: headerBorder, color: headerColor }}
              >
                {codeLabel}
              </span>
              <h2
                className="text-base sm:text-lg font-black tracking-wider uppercase"
                style={{ color: headerColor }}
              >
                {titleText}
              </h2>
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: isVetoed ? "#aa2020" : "#2a7a2a" }}>
              Triad AI Council Node Alignment • Score: {verdict.finalScore}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = !voiceMuted;
              setVoiceMuted(next);
              if (next) stopSpeaking();
            }}
            className="flex items-center space-x-1.5 px-3 py-1 text-xs font-bold transition cursor-pointer"
            style={{
              background: voiceMuted ? "#050506" : "var(--nerv-green-dim)",
              border: `1px solid ${voiceMuted ? "#333" : "#1e5a1e"}`,
              color: voiceMuted ? "#555" : "#4ab84a",
            }}
            title={voiceMuted ? "Unmute verdict voice" : "Mute verdict voice"}
          >
            {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleCopyReport}
            className="flex items-center space-x-1.5 px-3 py-1 text-xs font-bold transition cursor-pointer"
            style={{
              background: "var(--nerv-green-dim)",
              border: "1px solid #1e5a1e",
              color: "#4ab84a",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#1a3a1a")}
            onMouseLeave={e => (e.currentTarget.style.background = "var(--nerv-green-dim)")}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" style={{ color: "#4ab84a" }} />
                <span>REPORT COPIED</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>COPY REPORT</span>
              </>
            )}
          </button>
        </div>
      </div>
        );
      })()}

      {/* Topic Banner */}
      <div
        className="mb-4 p-2.5 text-xs relative z-10"
        style={{
          background: "var(--nerv-bg2)",
          border: "1px solid rgba(30,90,30,0.3)",
        }}
      >
        <span
          className="block uppercase tracking-wider text-[10px] mb-1 font-bold"
          style={{ color: "#2a7a2a" }}
        >
          DELIBERATION TOPIC:
        </span>
        <span className="text-xs font-bold" style={{ color: "var(--nerv-text)" }}>
          "{topic}"
        </span>
      </div>

      {/* Executive Summary */}
      <div className="mb-4 relative z-10">
        <h3
          className="text-xs font-bold uppercase tracking-widest mb-1.5 flex items-center space-x-2"
          style={{ color: "#4ab84a" }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>SYNTHESIZED EXECUTIVE SUMMARY</span>
        </h3>
        <p
          className="p-3 text-xs leading-relaxed"
          style={{
            background: "#050506",
            border: "1px solid rgba(30,90,30,0.2)",
            color: "var(--nerv-text)",
          }}
        >
          {verdict.summary}
        </p>
      </div>

      {/* Consensus Points */}
      <div className="mb-4 relative z-10">
        <h3
          className="text-xs font-bold uppercase tracking-widest mb-1.5 flex items-center space-x-2"
          style={{ color: "#4ab84a" }}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>CONSENSUS RESOLUTION POINTS</span>
        </h3>
        <div className="space-y-1.5">
          {verdict.consensusPoints.map((point, index) => (
            <div
              key={index}
              className="flex items-start space-x-2.5 p-2 text-xs"
              style={{
                background: "rgba(30,74,30,0.1)",
                border: "1px solid rgba(30,90,30,0.25)",
                color: "var(--nerv-text)",
              }}
            >
              <span
                className="font-bold px-1 text-[10px] shrink-0"
                style={{
                  background: "#050506",
                  border: "1px solid #1e5a1e",
                  color: "#4ab84a",
                }}
              >
                0{index + 1}
              </span>
              <span className="leading-relaxed">{point}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dissenting Views */}
      {verdict.dissentingViews && verdict.dissentingViews.length > 0 && (
        <div className="mb-4 relative z-10">
          <h3
            className="text-xs font-bold uppercase tracking-widest mb-1.5 flex items-center space-x-2"
            style={{ color: "var(--nerv-amber)" }}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>OPERATIONAL CAUTIONS &amp; DISSENTING NOTES</span>
          </h3>
          <div className="space-y-1.5">
            {verdict.dissentingViews.map((dissent, index) => (
              <div
                key={index}
                className="p-2 text-xs"
                style={{
                  background: "rgba(42,26,4,0.5)",
                  border: "1px solid var(--nerv-amber-dim)",
                  color: "var(--nerv-amber)",
                }}
              >
                • {dissent}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Follow-Up Q&A Section */}
      <div className="mb-4 relative z-10">
        <h3
          className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center space-x-2"
          style={{ color: "var(--nerv-amber)" }}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>ASK THE COUNCIL</span>
        </h3>

        {/* Previous follow-up exchanges */}
        {followUps.map((exchange, eIdx) => (
          <div key={eIdx} className="mb-3">
            {/* User question */}
            <div
              className="p-2 mb-2 text-xs font-bold"
              style={{
                background: "rgba(184,98,26,0.1)",
                border: "1px solid var(--nerv-orange-dim)",
                color: "var(--nerv-amber)",
              }}
            >
              YOU: {exchange.question}
            </div>

            {/* Node answers */}
            {exchange.answers.map((ans, aIdx) => {
              const color = NODE_COLORS[ans.nodeId] || "#b86030";
              return (
                <div key={aIdx} className="flex items-start gap-2 mb-2">
                  <div
                    className="shrink-0 w-7 h-7 flex items-center justify-center text-[10px] font-black uppercase"
                    style={{
                      background: `${color}20`,
                      border: `2px solid ${color}`,
                      color,
                      borderRadius: "50%",
                    }}
                  >
                    {ans.codeName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>
                      {ans.codeName}
                    </span>
                    <p className="text-xs leading-relaxed mt-0.5" style={{ color: "var(--nerv-text)" }}>
                      {ans.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Thinking indicator */}
        {thinkingNode && (
          <div
            className="flex items-center space-x-2 p-2 mb-2 text-xs animate-pulse"
            style={{
              background: "var(--nerv-bg2)",
              border: "1px solid var(--nerv-orange-dim)",
              color: "var(--nerv-amber)",
            }}
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="font-bold uppercase tracking-wider">{thinkingNode} is responding...</span>
          </div>
        )}

        {/* Node selection toggles */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span
            className="text-[10px] font-bold uppercase tracking-widest mr-1"
            style={{ color: "var(--nerv-text-dim)" }}
          >
            ASK:
          </span>
          {nodes.map((node) => {
            const color = NODE_COLORS[node.id] || "#b86030";
            const isSelected = selectedNodeIds.has(node.id);
            return (
              <button
                key={node.id}
                onClick={() => toggleNodeSelection(node.id)}
                className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                style={{
                  background: isSelected ? `${color}25` : "#050506",
                  border: `1px solid ${isSelected ? color : "#333"}`,
                  color: isSelected ? color : "#555",
                  opacity: isSelected ? 1 : 0.6,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ background: isSelected ? color : "#333" }}
                />
                {node.codeName}
              </button>
            );
          })}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={followUpInput}
            onChange={(e) => setFollowUpInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAskFollowUp(); }}
            placeholder="Ask a follow-up question..."
            disabled={isAskingFollowUp}
            className="flex-1 px-3 py-2 text-xs focus:outline-none disabled:opacity-40"
            style={{
              background: "#0C0800",
              border: "1px solid var(--nerv-orange-dim)",
              color: "var(--nerv-amber)",
              caretColor: "var(--nerv-orange)",
            }}
            onFocus={e => (e.target.style.borderColor = "var(--nerv-orange)")}
            onBlur={e => (e.target.style.borderColor = "var(--nerv-orange-dim)")}
          />
          <button
            onClick={handleAskFollowUp}
            disabled={!followUpInput.trim() || isAskingFollowUp}
            className="px-3 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-40"
            style={{
              background: "var(--nerv-orange-dim)",
              border: "1px solid var(--nerv-orange)",
              color: "var(--nerv-amber)",
            }}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        <div ref={followUpEndRef} />
      </div>

      {/* Footer */}
      <div
        className="pt-3 flex justify-end relative z-10"
        style={{ borderTop: "1px solid rgba(30,90,30,0.3)" }}
      >
        <button
          onClick={() => {
            playBeep(900, 0.05);
            stopSpeaking();
            onNewDeliberation();
          }}
          className="px-4 py-1.5 font-black text-xs uppercase tracking-widest transition cursor-pointer"
          style={{
            background: "#1e5a1e",
            border: "1px solid #2a8a2a",
            color: "#050506",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#2a7a2a")}
          onMouseLeave={e => (e.currentTarget.style.background = "#1e5a1e")}
        >
          START NEW DELIBERATION
        </button>
      </div>
    </div>
  );
};
