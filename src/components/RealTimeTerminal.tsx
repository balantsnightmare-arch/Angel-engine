import React, { useState, useEffect, useRef } from "react";
import { SpeechTurn, CouncilNodeConfig } from "../types";
import {
  Terminal,
  Copy,
  Check,
  Search,
  ArrowDownCircle,
  Brain,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { playBeep, speakText, stopSpeaking, isSpeaking } from "../lib/sound";

interface RealTimeTerminalProps {
  turns: SpeechTurn[];
  nodes: CouncilNodeConfig[];
  thinkingNodeName?: string | null;
  isDeliberating: boolean;
  topic: string;
  children?: React.ReactNode;
}

// Muted node colors matching CouncilNodeGrid
const NODE_COLORS: Record<string, string> = {
  node1: "#b86030",
  node2: "#7a3060",
  node3: "#305060",
};

export const RealTimeTerminal: React.FC<RealTimeTerminalProps> = ({
  turns,
  nodes,
  thinkingNodeName,
  isDeliberating,
  topic,
  children,
}) => {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedTurns, setExpandedTurns] = useState<Record<string, boolean>>({});
  const [speakingTurnId, setSpeakingTurnId] = useState<string | null>(null);
  const [autoVoice, setAutoVoice] = useState(true);
  const [revealedCount, setRevealedCount] = useState(0);
  const [ttsPlaying, setTtsPlaying] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Reset revealed count when turns are cleared (reset button)
  useEffect(() => {
    if (turns.length === 0) {
      setRevealedCount(0);
      setTtsPlaying(false);
      setSpeakingTurnId(null);
    }
  }, [turns.length]);

  // Queued reveal: show next turn only after TTS finishes the previous one
  useEffect(() => {
    if (!autoVoice) {
      setRevealedCount(turns.length);
      return;
    }
    if (revealedCount < turns.length && !ttsPlaying) {
      const nextTurn = turns[revealedCount];
      setTtsPlaying(true);
      setSpeakingTurnId(nextTurn.id);
      setRevealedCount(prev => prev + 1);
      speakText(nextTurn.statement, nextTurn.nodeId, () => {
        setTtsPlaying(false);
        setSpeakingTurnId(null);
      });
    }
  }, [turns, autoVoice, revealedCount, ttsPlaying]);

  const displayedTurns = autoVoice ? turns.slice(0, revealedCount) : turns;

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayedTurns, thinkingNodeName, autoScroll]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      speechSynthesis.getVoices();
      speechSynthesis.addEventListener("voiceschanged", () => speechSynthesis.getVoices());
    }
  }, []);

  const toggleReasoning = (turnId: string) => {
    playBeep(1100, 0.03);
    setExpandedTurns((prev) => ({ ...prev, [turnId]: !prev[turnId] }));
  };

  const handleSpeak = (turn: SpeechTurn) => {
    if (speakingTurnId === turn.id && isSpeaking()) {
      stopSpeaking();
      setSpeakingTurnId(null);
    } else {
      speakText(turn.statement, turn.nodeId);
      setSpeakingTurnId(turn.id);
      const checkDone = setInterval(() => {
        if (!isSpeaking()) {
          setSpeakingTurnId(null);
          clearInterval(checkDone);
        }
      }, 200);
    }
  };

  const handleCopyTranscript = () => {
    playBeep(1000, 0.05);
    const text = turns
      .map(
        (t) =>
          `[ROUND ${t.round} - ${t.codeName} | Vote: ${t.vote}]\nModel: ${t.modelUsed}\nStatement: ${t.statement}\nProposed Resolution: ${t.proposedResolution || "N/A"}\nReasoning: ${t.reasoning}\n---`
      )
      .join("\n\n");

    navigator.clipboard.writeText(
      `=== TRIAD AI COUNCIL REAL-TIME TRANSCRIPT ===\nTOPIC: "${topic}"\nTOTAL TURNS: ${turns.length}\n\n${text}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getNodeColor = (nodeId: string) => {
    return NODE_COLORS[nodeId] || "#b86030";
  };

  const filteredTurns = displayedTurns.filter(
    (t) =>
      t.statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.codeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.vote.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showThinking = thinkingNodeName && (!autoVoice || revealedCount >= turns.length);

  return (
    <div
      className="w-full h-full overflow-hidden flex flex-col min-h-0"
      style={{
        background: "#030304",
      }}
    >
      {/* Terminal Header */}
      <div
        className="p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shrink-0"
        style={{
          background: "var(--nerv-bg2)",
          borderBottom: "1px solid var(--nerv-orange-dim)",
          color: "var(--nerv-text)",
        }}
      >
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4" style={{ color: "var(--nerv-orange)" }} />
          <span className="font-black tracking-wider uppercase" style={{ color: "var(--nerv-amber)" }}>
            REAL-TIME CONVERSATION CONSOLE
          </span>
          <span
            className="px-2 py-0.5 text-[10px]"
            style={{
              background: "var(--nerv-bg3)",
              border: "1px solid var(--nerv-orange-dim)",
              color: "var(--nerv-text-dim)",
            }}
          >
            {turns.length} SPEECH TURNS
          </span>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Search */}
          <div className="relative">
            <Search
              className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2"
              style={{ color: "var(--nerv-text-dim)" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter log..."
              className="pl-7 pr-2 py-1 text-xs focus:outline-none w-28 sm:w-36"
              style={{
                background: "#050506",
                border: "1px solid var(--nerv-orange-dim)",
                color: "var(--nerv-text)",
              }}
            />
          </div>

          {/* Auto Voice */}
          <button
            onClick={() => {
              const next = !autoVoice;
              setAutoVoice(next);
              if (!next) { stopSpeaking(); setSpeakingTurnId(null); }
            }}
            className="p-1.5 transition cursor-pointer"
            style={{
              background: autoVoice ? "var(--nerv-orange-dim)" : "#050506",
              border: `1px solid ${autoVoice ? "var(--nerv-orange)" : "#222"}`,
              color: autoVoice ? "var(--nerv-amber)" : "#444",
            }}
            title={autoVoice ? "Auto-voice ON (click to mute)" : "Auto-voice OFF (click to enable)"}
          >
            {autoVoice ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Auto Scroll */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className="p-1.5 transition cursor-pointer"
            style={{
              background: autoScroll ? "var(--nerv-orange-dim)" : "#050506",
              border: `1px solid ${autoScroll ? "var(--nerv-orange)" : "#222"}`,
              color: autoScroll ? "var(--nerv-amber)" : "#444",
            }}
            title="Auto-scroll"
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
          </button>

          {/* Copy */}
          <button
            onClick={handleCopyTranscript}
            disabled={turns.length === 0}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold disabled:opacity-40 transition cursor-pointer"
            style={{
              background: "var(--nerv-bg3)",
              border: "1px solid var(--nerv-orange-dim)",
              color: "var(--nerv-text)",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--nerv-orange)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--nerv-orange-dim)")}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" style={{ color: "#4ab84a" }} />
                <span style={{ color: "#4ab84a" }}>COPIED</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">COPY</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div
        className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-mono relative"
        style={{ background: "#030304", color: "var(--nerv-text)" }}
      >
        {/* Scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(184,98,26,0.02) 2px, rgba(184,98,26,0.02) 4px)",
          }}
        />

        {/* Empty state */}
        {displayedTurns.length === 0 && !showThinking && (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
            <Terminal
              className="w-12 h-12 animate-pulse"
              style={{ color: "rgba(184,98,26,0.2)" }}
            />
            <div
              className="text-sm font-bold uppercase tracking-widest"
              style={{ color: "var(--nerv-text-dim)" }}
            >
              CONSOLE AWAITING INITIATION
            </div>
            <p className="text-xs max-w-md" style={{ color: "var(--nerv-text-muted)" }}>
              Enter a prompt or select a preset topic above, then press{" "}
              <span style={{ color: "var(--nerv-orange)", fontWeight: "bold" }}>START COUNCIL</span>{" "}
              to watch the 3 AI nodes debate in real time.
            </p>
          </div>
        )}

        {/* Speech turns */}
        {filteredTurns.map((turn) => {
          const nodeColor = getNodeColor(turn.nodeId);
          const isExpanded = expandedTurns[turn.id];

          return (
            <div
              key={turn.id}
              className="relative transition-all"
              style={{ padding: "4px 0" }}
            >
              {/* Chat-style message */}
              <div className="flex items-start gap-3">
                {/* Avatar / node indicator */}
                <div
                  className="shrink-0 w-9 h-9 flex items-center justify-center text-[11px] font-black uppercase tracking-wider"
                  style={{
                    background: `${nodeColor}20`,
                    border: `2px solid ${nodeColor}`,
                    color: nodeColor,
                    borderRadius: "50%",
                  }}
                >
                  {turn.codeName[0]}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Name + metadata row */}
                  <div className="flex flex-wrap items-baseline gap-2 mb-1">
                    <span
                      className="font-bold text-sm uppercase tracking-wide"
                      style={{ color: nodeColor }}
                    >
                      {turn.codeName}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--nerv-text-muted)" }}>
                      R{turn.round} &middot; {turn.timestamp}
                    </span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wider"
                      style={
                        turn.vote === "AGREE"
                          ? { background: "var(--nerv-green-dim)", border: "1px solid #1e5a1e", color: "#4ab84a" }
                          : turn.vote === "VETO"
                          ? { background: "#2a0404", border: "1px solid #ff2020", color: "#ff4040" }
                          : turn.vote === "DISAGREE"
                          ? { background: "#2a0808", border: "1px solid var(--nerv-red)", color: "#d06060" }
                          : { background: "#2a1804", border: "1px solid var(--nerv-amber-dim)", color: "var(--nerv-amber)" }
                      }
                    >
                      {turn.vote === "VETO" ? "⚠ VETO" : turn.vote}
                    </span>
                    {turn.nodeState === "COMPROMISED" && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wider"
                        style={{ background: "#2a0820", border: "1px solid #a030a0", color: "#d060d0" }}
                      >
                        COMPROMISED
                      </span>
                    )}
                    <button
                      onClick={() => handleSpeak(turn)}
                      className="p-0.5 transition cursor-pointer"
                      style={{ color: speakingTurnId === turn.id ? "var(--nerv-orange)" : "var(--nerv-text-muted)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--nerv-amber)")}
                      onMouseLeave={e => (e.currentTarget.style.color = speakingTurnId === turn.id ? "var(--nerv-orange)" : "var(--nerv-text-muted)")}
                      title={speakingTurnId === turn.id ? "Stop speaking" : "Read aloud"}
                    >
                      {speakingTurnId === turn.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Statement as conversational text */}
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ color: "var(--nerv-text)" }}
                  >
                    {turn.statement}
                  </p>

                  {/* Proposed Resolution — inline */}
                  {turn.proposedResolution && (
                    <div
                      className="mt-2 p-2 text-xs"
                      style={{
                        background: "#050506",
                        borderLeft: `2px solid ${nodeColor}40`,
                        color: "var(--nerv-text-dim)",
                      }}
                    >
                      <span className="font-bold" style={{ color: nodeColor }}>Proposal: </span>
                      {turn.proposedResolution}
                    </div>
                  )}

                  {/* Sub-aspects breakdown */}
                  {turn.subAspects && turn.subAspects.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {turn.subAspects.map((sa, i) => (
                        <div
                          key={i}
                          className="text-[10px] px-1.5 py-0.5 flex items-center gap-1"
                          style={{
                            background: "#050506",
                            border: `1px solid ${sa.status === "OK" ? "#1e5a1e" : sa.status === "CONCERN" ? "var(--nerv-amber-dim)" : "var(--nerv-red)"}`,
                            color: sa.status === "OK" ? "#4ab84a" : sa.status === "CONCERN" ? "var(--nerv-amber)" : "#d06060",
                          }}
                          title={sa.assessment}
                        >
                          <span style={{ fontSize: 8 }}>{sa.status === "OK" ? "▪" : sa.status === "CONCERN" ? "▨" : "▓"}</span>
                          <span className="font-bold uppercase tracking-wider">{sa.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Veto reason */}
                  {turn.vote === "VETO" && turn.vetoReason && (
                    <div
                      className="mt-2 p-2 text-xs font-bold"
                      style={{ background: "#1a0404", border: "1px solid #ff2020", color: "#ff4040" }}
                    >
                      VETO REASON: {turn.vetoReason}
                    </div>
                  )}

                  {/* Self-verification flag */}
                  {turn.selfVerification && !turn.selfVerification.consistent && (
                    <div
                      className="mt-1.5 text-[10px] flex items-center gap-1"
                      style={{ color: "#d060d0" }}
                    >
                      <span>▓</span>
                      <span className="font-bold uppercase tracking-wider">Self-check failed:</span>
                      <span style={{ color: "var(--nerv-text-dim)" }}>{turn.selfVerification.flaggedIssue || "Inconsistency detected"}</span>
                    </div>
                  )}

                  {/* Chain-of-thought toggle */}
                  <button
                    onClick={() => toggleReasoning(turn.id)}
                    className="flex items-center space-x-1 mt-1.5 text-[10px] transition cursor-pointer"
                    style={{ color: "var(--nerv-text-muted)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--nerv-amber)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--nerv-text-muted)")}
                  >
                    <Brain className="w-3 h-3" />
                    <span>{isExpanded ? "Hide reasoning" : "Show reasoning"}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {isExpanded && (
                    <div
                      className="mt-1.5 p-2.5 text-xs italic leading-relaxed"
                      style={{
                        background: "#050506",
                        borderLeft: `2px solid ${nodeColor}30`,
                        color: "var(--nerv-text-dim)",
                      }}
                    >
                      {turn.reasoning}
                    </div>
                  )}
                </div>
              </div>

              {/* Separator between messages */}
              <div
                className="mt-3"
                style={{ borderBottom: "1px solid rgba(184,98,26,0.08)" }}
              />
            </div>
          );
        })}

        {/* Thinking indicator */}
        {showThinking && (
          <div
            className="flex items-center space-x-3 p-4 animate-pulse"
            style={{
              background: "var(--nerv-bg2)",
              border: "1px solid var(--nerv-orange-dim)",
              borderLeft: "3px solid var(--nerv-orange)",
            }}
          >
            <Sparkles
              className="w-5 h-5 animate-spin"
              style={{ color: "var(--nerv-orange)" }}
            />
            <div>
              <div
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "var(--nerv-amber)" }}
              >
                {thinkingNodeName} IS DELIBERATING...
              </div>
              <div className="text-xs" style={{ color: "var(--nerv-text-dim)" }}>
                Evaluating peer arguments &amp; calculating vote position in real-time...
              </div>
            </div>
          </div>
        )}

        {children}

        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};
