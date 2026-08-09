import React from "react";
import { CouncilNodeConfig, SpeechTurn, VoteType, NodeState } from "../types";
import { MODEL_OPTIONS } from "../lib/constants";
import { Cpu, CheckCircle2, AlertTriangle, XCircle, Sliders } from "lucide-react";
import { playBeep } from "../lib/sound";

interface CouncilNodeGridProps {
  nodes: CouncilNodeConfig[];
  turns: SpeechTurn[];
  activeNodeId?: string | null;
  status: string;
  disabledNodeIds: Set<string>;
  onToggleNode: (nodeId: string) => void;
  onConfigureNode: (nodeId: "node1" | "node2" | "node3") => void;
  onSelectModel: (nodeId: "node1" | "node2" | "node3", modelId: any) => void;
}

const TEXT_COLOR   = "#E2D0F8";
const BORDER_IDLE  = "#3D1A60";
const BORDER_ACTIVE= "#7A4AAE";
const BG_IDLE      = "#160A26";
const BG_ACTIVE    = "#200E38";
const FONT         = "'Rajdhani', sans-serif";

export const CouncilNodeGrid: React.FC<CouncilNodeGridProps> = ({
  nodes,
  turns,
  activeNodeId,
  status,
  disabledNodeIds,
  onToggleNode,
  onConfigureNode,
  onSelectModel,
}) => {
  const getLatestVote = (nodeId: string): VoteType | null => {
    const nodeTurns = turns.filter((t) => t.nodeId === nodeId);
    if (nodeTurns.length === 0) return null;
    return nodeTurns[nodeTurns.length - 1].vote;
  };

  const getLatestNodeState = (nodeId: string): NodeState => {
    const nodeTurns = turns.filter((t) => t.nodeId === nodeId);
    if (nodeTurns.length === 0) return "STANDBY";
    const last = nodeTurns[nodeTurns.length - 1];
    return last.nodeState || "OK";
  };

  const renderNodeStateGlyph = (state: NodeState) => {
    if (state === "OK") return <span style={{ color: "#6ACD6A", fontSize: 10 }} title="Node OK">▪</span>;
    if (state === "COMPROMISED") return <span style={{ color: "#d060d0", fontSize: 10 }} title="Node Compromised">▓</span>;
    if (state === "DELIBERATING") return <span style={{ color: TEXT_COLOR, fontSize: 10 }} title="Deliberating">▨</span>;
    return null;
  };

  const renderVoteBadge = (vote: VoteType | null) => {
    const s: React.CSSProperties = {
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", fontSize: 13, fontFamily: FONT,
      fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
    };
    if (!vote)               return <span style={{ ...s, background: "#100820", border: `1px solid ${BORDER_IDLE}`, color: `${TEXT_COLOR}55` }}>STANDBY</span>;
    if (vote === "AGREE")    return <span style={{ ...s, background: "#081408", border: "1px solid #1A4A1A", color: "#6ACD6A" }}><CheckCircle2 size={12} /> AGREE</span>;
    if (vote === "VETO")     return <span style={{ ...s, background: "#200404", border: "1px solid #ff2020", color: "#ff4040" }}><XCircle size={12} /> VETO</span>;
    if (vote === "DISAGREE") return <span style={{ ...s, background: "#140820", border: `1px solid ${BORDER_ACTIVE}`, color: TEXT_COLOR }}><XCircle size={12} /> DISAGREE</span>;
    return                         <span style={{ ...s, background: "#120818", border: `1px solid ${BORDER_IDLE}`,   color: TEXT_COLOR }}><AlertTriangle size={12} /> AMEND</span>;
  };

  const C = 80;
  const C_NULL = 100;
  const cp = `${C}px`;
  const cpN = `${C_NULL}px`;
  const clips = [
    `polygon(0 0, 100% 0, 100% calc(100% - ${cp}), calc(100% - ${cp}) 100%, 0 100%)`,
    `polygon(0 0, 100% 0, 100% 100%, ${cp} 100%, 0 calc(100% - ${cp}))`,
    `polygon(${cpN} 0, calc(100% - ${cpN}) 0, 100% ${cpN}, 100% 100%, 0 100%, 0 ${cpN})`,
  ];

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 16 }}>
        {nodes.map((node, index) => {
          const isActive = activeNodeId === node.id;
          const isDisabled = disabledNodeIds.has(node.id);
          const vote = getLatestVote(node.id);
          const nodeState = getLatestNodeState(node.id);
          const isBottomNode = index === 2;
          const clip = clips[index];
          const borderColor = isDisabled ? "#1a1020" : isActive ? BORDER_ACTIVE : BORDER_IDLE;
          const bgColor     = isDisabled ? "#0c0814" : isActive ? BG_ACTIVE : BG_IDLE;

          const padding = isBottomNode
            ? `${C_NULL + 10}px 40px 28px`
            : "28px 28px 28px";

          return (
            <div
              key={node.id}
              style={{
                gridColumn: isBottomNode ? "1 / -1" : undefined,
                position: "relative",
                transition: "transform 0.4s ease, opacity 0.3s ease",
                transform: isActive ? "scale(1.02)" : "scale(1)",
                opacity: isDisabled ? 0.4 : 1,
                alignSelf: "stretch",
              }}
            >
              {/* Border shell */}
              <div style={{
                position: "absolute", inset: 0,
                clipPath: clip,
                background: borderColor,
                boxShadow: isActive ? "0 0 22px rgba(74,30,114,0.45)" : "none",
              }} />

              {/* Content card */}
              <div style={{
                position: "relative",
                margin: "2px",
                clipPath: clip,
                background: bgColor,
                minHeight: isBottomNode ? 280 : 260,
                height: isBottomNode ? undefined : "calc(100% - 4px)",
                boxSizing: "border-box",
                padding,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}>

                {/* Node name row with config button */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 10, marginBottom: 6, width: "100%", position: "relative",
                }}>
                  <div style={{ width: 10, height: 10, background: TEXT_COLOR, flexShrink: 0 }} />
                  <h3 style={{
                    margin: 0, fontFamily: FONT, fontWeight: 700,
                    fontSize: 28, letterSpacing: "0.18em",
                    textTransform: "uppercase", color: TEXT_COLOR, lineHeight: 1,
                  }}>
                    {node.codeName}
                  </h3>
                  <button
                    onClick={() => { playBeep(1000, 0.05); onConfigureNode(node.id); }}
                    style={{
                      padding: 5, cursor: "pointer",
                      color: TEXT_COLOR, background: "rgba(0,0,0,0.4)",
                      border: `1px solid ${BORDER_IDLE}`,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = TEXT_COLOR)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER_IDLE)}
                    title={`Configure ${node.codeName}`}
                  >
                    <Sliders size={14} />
                  </button>
                </div>

                {/* Archetype label */}
                <p style={{
                  margin: "0 0 16px",
                  fontFamily: FONT, fontSize: 13, fontWeight: 600,
                  letterSpacing: "0.22em", textTransform: "uppercase",
                  color: `${TEXT_COLOR}70`, lineHeight: 1,
                }}>
                  {node.archetype.split(" - ")[0]} ARCHETYPE
                </p>

                {/* Divider */}
                <div style={{ width: "100%", borderTop: `1px solid ${BORDER_IDLE}`, marginBottom: 18 }} />

                {/* Model label */}
                <label style={{
                  display: "block", width: "100%",
                  fontFamily: FONT, fontSize: 11, fontWeight: 600,
                  letterSpacing: "0.22em", textTransform: "uppercase",
                  color: `${TEXT_COLOR}55`, marginBottom: 10, textAlign: "center",
                }}>
                  ASSIGNED AI MODEL
                </label>

                {/* Model select */}
                <select
                  value={node.modelId}
                  onChange={(e) => { playBeep(900, 0.03); onSelectModel(node.id, e.target.value as any); }}
                  style={{
                    width: "100%", maxWidth: isBottomNode ? 400 : undefined,
                    padding: "9px 12px",
                    fontFamily: FONT, fontSize: 14, fontWeight: 600,
                    letterSpacing: "0.06em",
                    background: "#0A0614", border: `1px solid ${BORDER_IDLE}`,
                    color: TEXT_COLOR, outline: "none", cursor: "pointer",
                    textAlign: "center", marginBottom: "auto",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = TEXT_COLOR)}
                  onBlur={e => (e.currentTarget.style.borderColor = BORDER_IDLE)}
                >
                  {MODEL_OPTIONS.map((m) => (
                    <option key={m.id} value={m.id} style={{ background: "#100820" }}>
                      {m.name} ({m.provider.split(" ")[0]})
                    </option>
                  ))}
                </select>

                {/* Status & vote */}
                <div style={{
                  width: "100%", marginTop: 18, paddingTop: 14,
                  borderTop: `1px solid ${BORDER_IDLE}`,
                  display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 10, flexWrap: "wrap",
                }}>
                  <button
                    onClick={() => { playBeep(isDisabled ? 1000 : 600, 0.04); onToggleNode(node.id); }}
                    disabled={status === "DELIBERATING"}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      background: isDisabled ? "#0a0610" : "transparent",
                      border: isDisabled ? "1px solid #2a1040" : "1px solid transparent",
                      padding: "4px 10px",
                      cursor: status === "DELIBERATING" ? "default" : "pointer",
                      transition: "all 0.2s ease",
                    }}
                    title={isDisabled ? `Activate ${node.codeName}` : `Put ${node.codeName} on standby`}
                  >
                    {renderNodeStateGlyph(isDisabled ? "STANDBY" : isActive ? "DELIBERATING" : nodeState)}
                    <Cpu
                      size={14}
                      className={isActive ? "animate-spin" : ""}
                      style={{ color: isDisabled ? "#ff404080" : isActive ? TEXT_COLOR : `${TEXT_COLOR}35` }}
                    />
                    <span style={{
                      fontFamily: FONT, fontSize: 13, fontWeight: 700,
                      letterSpacing: "0.16em", textTransform: "uppercase",
                      color: isDisabled ? "#ff4040" : isActive ? TEXT_COLOR : nodeState === "COMPROMISED" ? "#d060d0" : `${TEXT_COLOR}35`,
                    }}>
                      {isDisabled ? "OFFLINE" : isActive ? "PROCESSING..." : nodeState === "COMPROMISED" ? "COMPROMISED" : status === "DELIBERATING" ? "READY" : "STANDBY"}
                    </span>
                  </button>
                  {renderVoteBadge(isDisabled ? null : vote)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
