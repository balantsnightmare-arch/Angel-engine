import React, { useState, useRef, useEffect } from "react";
import { Header } from "./components/Header";
import { CouncilNodeGrid } from "./components/CouncilNodeGrid";
import { RealTimeTerminal } from "./components/RealTimeTerminal";
import { VerdictDisplay } from "./components/VerdictDisplay";
import { NodeConfigModal } from "./components/NodeConfigModal";
import { PresetTopicsModal } from "./components/PresetTopicsModal";
import { GoogleAuthModal, GoogleUser } from "./components/GoogleAuthModal";
import { HistoryModal } from "./components/HistoryModal";
import {
  HistoryEntry,
  HistoryStatus,
  loadHistory,
  saveHistoryEntry,
  deleteHistoryEntry,
  clearHistory,
} from "./lib/history";
import { DEFAULT_NODES, NORMAL_MODE_MODELS, ADVANCED_MODE_MODELS } from "./lib/constants";
import { CouncilNodeConfig, SpeechTurn, FinalVerdict, CouncilMode, ModelOptionId } from "./types";
import { playAlarm, playBeep, playChime, playCodeType, stopSpeaking } from "./lib/sound";
import {
  Zap,
  AlertOctagon,
  Brain,
  Flame,
  CheckCircle,
  FileText,
  UserCheck,
  RefreshCw,
} from "lucide-react";

export default function App() {
  const [soundOn, setSoundOn] = useState(true);
  const [mode, setMode] = useState<CouncilMode>("NORMAL");
  const [topic, setTopic] = useState(
    "How should society regulate and govern frontier autonomous AI decision-making systems?"
  );
  const [context, setContext] = useState("");
  const [maxRounds, setMaxRounds] = useState(3); // Always 3 rounds, overtime (4th) if no consensus

  const [nodes, setNodes] = useState<CouncilNodeConfig[]>(DEFAULT_NODES);

  const handleSelectMode = (newMode: CouncilMode) => {
    setMode(newMode);
    playBeep(newMode === "ADVANCED" ? 1200 : 1000, 0.03);
    const targetMap = newMode === "ADVANCED" ? ADVANCED_MODE_MODELS : NORMAL_MODE_MODELS;
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        modelId: targetMap[n.id] || n.modelId,
      }))
    );
  };

  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(() => {
    try {
      const saved = localStorage.getItem("angel_engine_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showGoogleAuthModal, setShowGoogleAuthModal] = useState(false);

  const [turns, setTurns] = useState<SpeechTurn[]>([]);
  const [verdict, setVerdict] = useState<FinalVerdict | null>(null);
  const [status, setStatus] = useState<
    "IDLE" | "DELIBERATING" | "CONSENSUS_REACHED" | "SPLIT_DECISION" | "ERROR"
  >("IDLE");
  const [currentRound, setCurrentRound] = useState(1);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [thinkingNodeName, setThinkingNodeName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"TERMINAL" | "VERDICT">("TERMINAL");

  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<
    "node1" | "node2" | "node3" | null
  >(null);
  const [showPresets, setShowPresets] = useState(false);

  const [disabledNodeIds, setDisabledNodeIds] = useState<Set<string>>(new Set());
  const isDeliberatingRef = useRef(false);

  // ── Deliberation history ──
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [showHistory, setShowHistory] = useState(false);
  const sessionRef = useRef<{
    id: string;
    topic: string;
    context: string;
    mode: CouncilMode;
    nodes: CouncilNodeConfig[];
    createdAt: string;
    turns: SpeechTurn[];
    rounds: number;
  } | null>(null);

  const archiveSession = (
    finalStatus: HistoryStatus,
    finalVerdict: FinalVerdict | null,
    error?: string
  ) => {
    const s = sessionRef.current;
    if (!s) return;
    sessionRef.current = null;
    if (s.turns.length === 0 && !finalVerdict) return; // nothing worth saving
    const entry: HistoryEntry = {
      id: s.id,
      topic: s.topic,
      context: s.context || undefined,
      mode: s.mode,
      status: finalStatus,
      rounds: s.rounds,
      nodes: s.nodes,
      turns: s.turns,
      verdict: finalVerdict,
      errorMessage: error,
      createdAt: s.createdAt,
    };
    setHistory(saveHistoryEntry(entry));
  };

  const handleOpenHistoryEntry = (entry: HistoryEntry) => {
    stopSpeaking();
    setTopic(entry.topic);
    setContext(entry.context || "");
    setMode(entry.mode);
    if (entry.nodes?.length) setNodes(entry.nodes);
    setTurns(entry.turns);
    setVerdict(entry.verdict);
    setStatus(entry.status);
    setCurrentRound(entry.rounds || 1);
    setActiveNodeId(null);
    setThinkingNodeName(null);
    setErrorMessage(entry.errorMessage ?? null);
    setActiveTab(entry.verdict ? "VERDICT" : "TERMINAL");
    setShowHistory(false);
  };

  const handleToggleNode = (nodeId: string) => {
    setDisabledNodeIds((prev) => {
      const next = new Set(prev);
      const enabledCount = nodes.length - next.size;
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        if (enabledCount > 1) next.add(nodeId);
      }
      return next;
    });
  };

  const handleSignInGoogle = (user: GoogleUser) => {
    setGoogleUser(user);
    try {
      localStorage.setItem("angel_engine_user", JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSignOutGoogle = () => {
    setGoogleUser(null);
    try {
      localStorage.removeItem("angel_engine_user");
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectModel = (nodeId: "node1" | "node2" | "node3", modelId: ModelOptionId) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, modelId } : n))
    );
  };

  const runDeliberationRound = async (
    targetRound: number,
    accumulatedTurns: SpeechTurn[]
  ) => {
    try {
      setStatus("DELIBERATING");
      setCurrentRound(targetRound);

      const activeNodes = nodes.filter((n) => !disabledNodeIds.has(n.id));
      const response = await fetch("/api/deliberate-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          context,
          mode,
          nodes: activeNodes,
          round: targetRound,
          maxRounds: activeNodes.length === 1 ? 1 : maxRounds,
          previousTurns: accumulatedTurns,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentRoundTurns: SpeechTurn[] = [];
      let roundFinishedUnanimous = false;
      let overtimeTriggered = false;
      let finalVerdictReceived: FinalVerdict | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;

          let eventType = "message";
          let eventDataRaw = "";

          const eventMatch = line.match(/^event:\s*(.+)$/m);
          if (eventMatch) eventType = eventMatch[1].trim();

          const dataMatch = line.match(/^data:\s*(.+)$/m);
          if (dataMatch) eventDataRaw = dataMatch[1].trim();

          if (!eventDataRaw) continue;

          let data: any;
          try {
            data = JSON.parse(eventDataRaw);
          } catch (e: any) {
            console.error("Parse SSE error:", e);
            continue;
          }

          if (eventType === "error") {
            throw new Error(data.message || "Deliberation error");
          } else if (eventType === "node_thinking") {
            setActiveNodeId(data.nodeId);
            setThinkingNodeName(data.codeName);
            playBeep(800, 0.03);
          } else if (eventType === "node_turn") {
            const newTurn: SpeechTurn = data.speechTurn;
            currentRoundTurns.push(newTurn);
            if (sessionRef.current) {
              sessionRef.current.turns = [...sessionRef.current.turns, newTurn];
              sessionRef.current.rounds = Math.max(sessionRef.current.rounds, newTurn.round || targetRound);
            }
            setTurns((prev) => [...prev, newTurn]);
            playCodeType();
            setActiveNodeId(null);
            setThinkingNodeName(null);
          } else if (eventType === "verdict_thinking") {
            setThinkingNodeName("SYNAPSE SYNTHESIS CORE");
          } else if (eventType === "round_complete") {
            overtimeTriggered = data.overtime || false;
          } else if (eventType === "verdict_complete") {
            finalVerdictReceived = data.verdict;
            roundFinishedUnanimous = data.unanimousAgree;
            setVerdict(data.verdict);
            playChime();
          }
        }
      }

      const totalTurns = [...accumulatedTurns, ...currentRoundTurns];

      if (finalVerdictReceived) {
        const finalStatus = finalVerdictReceived.unanimous ? "CONSENSUS_REACHED" : "SPLIT_DECISION";
        setStatus(finalStatus);
        archiveSession(finalStatus, finalVerdictReceived);
        setActiveNodeId(null);
        setThinkingNodeName(null);
      } else if (overtimeTriggered) {
        // Overtime round — one extra chance
        playAlarm();
        await new Promise((res) => setTimeout(res, 800));
        await runDeliberationRound(targetRound + 1, totalTurns);
      } else if (targetRound < maxRounds && !roundFinishedUnanimous) {
        await new Promise((res) => setTimeout(res, 800));
        await runDeliberationRound(targetRound + 1, totalTurns);
      } else {
        setStatus("SPLIT_DECISION");
        archiveSession("SPLIT_DECISION", null);
        setActiveNodeId(null);
        setThinkingNodeName(null);
      }
    } catch (err: any) {
      console.error("Deliberation failed:", err);
      setStatus("ERROR");
      setErrorMessage(err.message || "Connection to Council Supercomputer lost.");
      archiveSession("ERROR", null, err.message || "Connection to Council Supercomputer lost.");
      setActiveNodeId(null);
      setThinkingNodeName(null);
    }
  };

  const handleStartDeliberation = async () => {
    if (!topic.trim()) return;
    playAlarm();
    setTurns([]);
    setVerdict(null);
    setErrorMessage(null);
    setActiveTab("TERMINAL");
    isDeliberatingRef.current = true;
    sessionRef.current = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      topic,
      context,
      mode,
      nodes: nodes.filter((n) => !disabledNodeIds.has(n.id)),
      createdAt: new Date().toISOString(),
      turns: [],
      rounds: 1,
    };
    await runDeliberationRound(1, []);
  };

  const handleReset = () => {
    stopSpeaking();
    setTurns([]);
    setVerdict(null);
    setStatus("IDLE");
    setCurrentRound(1);
    setActiveNodeId(null);
    setThinkingNodeName(null);
    setErrorMessage(null);
    setActiveTab("TERMINAL");
  };

  return (
    <div
      className="min-h-screen md:h-screen w-screen flex flex-col md:overflow-hidden overflow-y-auto relative"
      style={{ background: "#130800", color: "var(--nerv-text)", fontFamily: "'Share Tech Mono', monospace" }}
    >
      {/* Solid dark background — no grid */}
      {/* Corner accent stripes top */}
      <div className="absolute top-0 left-0 w-24 h-1 pointer-events-none" style={{ background: "var(--nerv-orange)" }} />
      <div className="absolute top-0 right-0 w-24 h-1 pointer-events-none" style={{ background: "var(--nerv-orange)" }} />

      {/* Header */}
      <Header
        soundOn={soundOn}
        onToggleSound={setSoundOn}
        onOpenConfig={() => {
          setEditingNodeId("node1");
          setShowNodeConfig(true);
        }}
        onOpenPresets={() => setShowPresets(true)}
        onOpenHistory={() => setShowHistory(true)}
        historyCount={history.length}
        onOpenGoogleAuth={() => setShowGoogleAuthModal(true)}
        googleUser={googleUser}
        onReset={handleReset}
        status={status}
        round={currentRound}
        maxRounds={maxRounds}
      />

      {/* Main layout */}
      <main className="flex-1 md:min-h-0 max-w-7xl w-full mx-auto p-2 sm:p-3 flex flex-col gap-2.5 md:overflow-hidden relative z-10">

        {/* Error Banner */}
        {errorMessage && (
          <div
            className="border p-2 font-mono text-xs flex items-center justify-between shrink-0"
            style={{
              background: "rgba(90,10,10,0.9)",
              borderColor: "var(--nerv-red-bright)",
              color: "#e06060",
              boxShadow: "0 0 12px rgba(192,48,48,0.3)",
            }}
          >
            <div className="flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4 shrink-0" style={{ color: "#e06060" }} />
              <span className="font-bold">SYSTEM FAULT: {errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs font-bold uppercase cursor-pointer hover:opacity-70 transition"
              style={{ color: "#e06060" }}
            >
              DISMISS
            </button>
          </div>
        )}

        {/* Topic / Control Bar */}
        <div
          className="shrink-0 relative overflow-hidden p-2.5 sm:p-3"
          style={{
            background: "var(--nerv-bg2)",
            border: "1px solid var(--nerv-orange-dim)",
            boxShadow: "0 0 18px rgba(184,98,26,0.12)",
          }}
        >
          {/* Hazard stripe right accent */}
          <div
            className="absolute top-0 right-0 w-10 h-full pointer-events-none"
            style={{
              backgroundImage: "repeating-linear-gradient(45deg, var(--nerv-orange) 0, var(--nerv-orange) 4px, transparent 4px, transparent 9px)",
              opacity: 0.25,
            }}
          />

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 relative z-10">
            {/* Topic Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter topic or dilemma for the Angel Engine council..."
                className="w-full px-4 py-3 focus:outline-none font-mono"
                style={{
                  background: "#0C0800",
                  border: "2px solid var(--nerv-amber-dim)",
                  color: "var(--nerv-amber)",
                  caretColor: "var(--nerv-orange)",
                  fontSize: 14,
                  letterSpacing: "0.04em",
                  fontWeight: 600,
                }}
                onFocus={e => {
                  e.target.style.borderColor = "var(--nerv-amber)";
                  e.target.style.boxShadow = "0 0 16px rgba(184,90,32,0.35), inset 0 0 10px rgba(184,90,32,0.06)";
                }}
                onBlur={e => {
                  e.target.style.borderColor = "var(--nerv-amber-dim)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Mode Switcher */}
            <div
              className="flex items-center p-1 shrink-0"
              style={{ background: "#050506", border: "1px solid #1a1410" }}
            >
              <button
                type="button"
                onClick={() => handleSelectMode("NORMAL")}
                className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold transition cursor-pointer"
                style={
                  mode === "NORMAL"
                    ? { background: "var(--nerv-orange-dim)", border: "1px solid var(--nerv-orange)", color: "var(--nerv-amber)" }
                    : { background: "transparent", border: "1px solid transparent", color: "var(--nerv-text-dim)" }
                }
                title="Normal Mode"
              >
                <Zap className="w-3 h-3" />
                <span>NORMAL</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMode("ADVANCED")}
                className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold transition cursor-pointer"
                style={
                  mode === "ADVANCED"
                    ? { background: "var(--nerv-red)", border: "1px solid var(--nerv-red-bright)", color: "#e08080" }
                    : { background: "transparent", border: "1px solid transparent", color: "var(--nerv-text-dim)" }
                }
                title="Advanced Mode"
              >
                <Brain className="w-3 h-3" />
                <span>ADVANCED</span>
              </button>
            </div>

            {/* Rounds indicator (fixed at 3) */}
            <div className="shrink-0 flex items-center space-x-1">
              <span
                className="px-2 py-1.5 text-xs font-bold"
                style={{
                  background: "#050506",
                  border: "1px solid var(--nerv-orange-dim)",
                  color: "var(--nerv-amber)",
                }}
              >
                3 ROUNDS
              </span>
            </div>

            {/* Initiate Button */}
            <button
              onClick={handleStartDeliberation}
              disabled={status === "DELIBERATING" || !topic.trim()}
              className="flex items-center justify-center space-x-1.5 px-4 py-2 font-black text-xs tracking-wider uppercase transition cursor-pointer shrink-0 disabled:opacity-40"
              style={{
                background: status === "DELIBERATING" ? "var(--nerv-red)" : "var(--nerv-orange)",
                border: "2px solid var(--nerv-amber)",
                color: "#000",
                boxShadow: "0 0 14px rgba(184,98,26,0.4)",
              }}
            >
              <Flame className="w-3.5 h-3.5" style={{ fill: "#000" }} />
              <span>{status === "DELIBERATING" ? "DEBATING..." : "START COUNCIL"}</span>
            </button>

            {/* Reset Button */}
            {status !== "IDLE" && (
              <button
                onClick={() => { playBeep(700, 0.06); handleReset(); }}
                className="flex items-center justify-center space-x-1.5 px-3 py-2 font-black text-xs tracking-wider uppercase transition cursor-pointer shrink-0"
                style={{
                  background: "#050506",
                  border: "2px solid var(--nerv-red-bright)",
                  color: "var(--nerv-red-bright)",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--nerv-red)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#050506"; e.currentTarget.style.color = "var(--nerv-red-bright)"; }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>RESET</span>
              </button>
            )}
          </div>
        </div>

        {/* Main split: Nodes left, Terminal right */}
        <div className="flex-1 md:min-h-0 flex flex-col md:flex-row gap-3 md:overflow-hidden">
          {/* Left: Council Node Grid — centered in its half */}
          <div className="md:w-[50%] lg:w-[48%] flex flex-col justify-center overflow-y-auto" style={{ paddingRight: "12px" }}>
            <CouncilNodeGrid
              nodes={nodes}
              turns={turns}
              activeNodeId={activeNodeId}
              status={status}
              disabledNodeIds={disabledNodeIds}
              onToggleNode={handleToggleNode}
              onConfigureNode={(nodeId) => {
                setEditingNodeId(nodeId);
                setShowNodeConfig(true);
              }}
              onSelectModel={handleSelectModel}
            />
          </div>

          {/* Right: Console */}
          <div
            className="flex-1 min-h-[400px] md:min-h-0 flex flex-col overflow-hidden font-mono"
            style={{
              background: "#050506",
              border: "1px solid var(--nerv-orange-dim)",
              boxShadow: "0 0 24px rgba(184,98,26,0.08)",
            }}
          >
            {/* Console Header */}
            <div
              className="px-3 py-2 flex items-center justify-between shrink-0"
              style={{
                background: "var(--nerv-bg2)",
                borderBottom: "1px solid var(--nerv-orange-dim)",
              }}
            >
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab("TERMINAL")}
                  className="flex items-center space-x-1.5 px-3 py-1 text-xs font-bold transition cursor-pointer"
                  style={
                    activeTab === "TERMINAL"
                      ? { background: "var(--nerv-bg3)", border: "1px solid var(--nerv-orange-dim)", color: "var(--nerv-amber)" }
                      : { background: "transparent", border: "1px solid transparent", color: "var(--nerv-text-dim)" }
                  }
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>CONVERSATION LOG ({turns.length})</span>
                </button>

                {verdict && (
                  <button
                    onClick={() => setActiveTab("VERDICT")}
                    className="flex items-center space-x-1.5 px-3 py-1 text-xs font-bold transition cursor-pointer"
                    style={
                      activeTab === "VERDICT"
                        ? { background: "var(--nerv-green-dim)", border: "1px solid #1e6a1e", color: "#4ab84a" }
                        : { background: "transparent", border: "1px solid transparent", color: "#2a6a2a" }
                    }
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>FINAL VERDICT</span>
                  </button>
                )}
              </div>

              <span className="text-[10px] uppercase font-bold hidden sm:inline" style={{ color: "var(--nerv-text-dim)" }}>
                MODE: <strong style={{ color: "var(--nerv-amber)" }}>{mode}</strong>
              </span>
            </div>

            {/* Console Body */}
            <div
              className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 relative"
              style={{ background: "#050506" }}
            >
              {activeTab === "TERMINAL" ? (
                <RealTimeTerminal
                  turns={turns}
                  nodes={nodes}
                  thinkingNodeName={thinkingNodeName}
                  isDeliberating={status === "DELIBERATING"}
                  topic={topic}
                >
                  {verdict && (
                    <VerdictDisplay
                      verdict={verdict}
                      topic={topic}
                      nodes={nodes}
                      turns={turns}
                      onNewDeliberation={handleReset}
                    />
                  )}
                </RealTimeTerminal>
              ) : (
                verdict && (
                  <VerdictDisplay
                    verdict={verdict}
                    topic={topic}
                    nodes={nodes}
                    turns={turns}
                    onNewDeliberation={handleReset}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showGoogleAuthModal && (
        <GoogleAuthModal
          currentUser={googleUser}
          onSignIn={handleSignInGoogle}
          onSignOut={handleSignOutGoogle}
          onClose={() => setShowGoogleAuthModal(false)}
        />
      )}

      {showNodeConfig && (
        <NodeConfigModal
          nodes={nodes}
          editingNodeId={editingNodeId}
          onClose={() => setShowNodeConfig(false)}
          onSaveNode={(updatedNode) => {
            setNodes((prev) =>
              prev.map((n) => (n.id === updatedNode.id ? updatedNode : n))
            );
          }}
          onResetNodes={() => setNodes(DEFAULT_NODES)}
        />
      )}

      {showHistory && (
        <HistoryModal
          entries={history}
          onOpenEntry={handleOpenHistoryEntry}
          onDeleteEntry={(id) => setHistory(deleteHistoryEntry(id))}
          onClearAll={() => setHistory(clearHistory())}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showPresets && (
        <PresetTopicsModal
          onSelectTopic={(selectedTopic) => {
            setTopic(selectedTopic);
            handleReset();
          }}
          onClose={() => setShowPresets(false)}
        />
      )}
    </div>
  );
}
