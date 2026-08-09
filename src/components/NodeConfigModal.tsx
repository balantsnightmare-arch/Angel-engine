import React, { useState } from "react";
import { CouncilNodeConfig, ModelOptionId } from "../types";
import { MODEL_OPTIONS } from "../lib/constants";
import { X, Sliders, Cpu, Save, RotateCcw } from "lucide-react";
import { playBeep } from "../lib/sound";

interface NodeConfigModalProps {
  nodes: CouncilNodeConfig[];
  editingNodeId: "node1" | "node2" | "node3" | null;
  onClose: () => void;
  onSaveNode: (updatedNode: CouncilNodeConfig) => void;
  onResetNodes: () => void;
}

export const NodeConfigModal: React.FC<NodeConfigModalProps> = ({
  nodes,
  editingNodeId,
  onClose,
  onSaveNode,
  onResetNodes,
}) => {
  const selectedNode = nodes.find((n) => n.id === editingNodeId) || nodes[0];

  const [activeTab, setActiveTab] = useState<"node1" | "node2" | "node3">(
    editingNodeId || "node1"
  );
  const [modelId, setModelId] = useState<ModelOptionId>(selectedNode.modelId);
  const [temperature, setTemperature] = useState<number>(selectedNode.temperature);
  const [archetype, setArchetype] = useState<string>(selectedNode.archetype);
  const [customSystemPrompt, setCustomSystemPrompt] = useState<string>(
    selectedNode.customSystemPrompt || ""
  );

  const handleTabChange = (nodeId: "node1" | "node2" | "node3") => {
    playBeep(900, 0.03);
    setActiveTab(nodeId);
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      setModelId(node.modelId);
      setTemperature(node.temperature);
      setArchetype(node.archetype);
      setCustomSystemPrompt(node.customSystemPrompt || "");
    }
  };

  const handleSave = () => {
    playBeep(1100, 0.05);
    const currentNode = nodes.find((n) => n.id === activeTab);
    if (currentNode) {
      onSaveNode({ ...currentNode, modelId, temperature, archetype, customSystemPrompt });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono"
      style={{ background: "rgba(0,0,0,0.88)" }}
    >
      <div
        className="w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          background: "var(--nerv-bg2)",
          border: "2px solid var(--nerv-orange)",
          boxShadow: "0 0 40px rgba(184,98,26,0.2)",
        }}
      >
        {/* Modal Header */}
        <div
          className="p-4 flex items-center justify-between shrink-0 relative"
          style={{
            background: "var(--nerv-bg3)",
            borderBottom: "1px solid var(--nerv-orange-dim)",
          }}
        >
          {/* Hazard stripe */}
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{
            backgroundImage: "repeating-linear-gradient(90deg, var(--nerv-orange) 0, var(--nerv-orange) 8px, transparent 8px, transparent 16px)",
          }} />

          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5" style={{ color: "var(--nerv-orange)" }} />
            <h2 className="text-base font-black uppercase tracking-widest" style={{ color: "var(--nerv-amber)" }}>
              COUNCIL NODE CONFIGURATION PANEL
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

        {/* Node Tabs */}
        <div
          className="flex p-2 gap-2"
          style={{
            background: "#050506",
            borderBottom: "1px solid var(--nerv-orange-dim)",
          }}
        >
          {nodes.map((node) => (
            <button
              key={node.id}
              onClick={() => handleTabChange(node.id)}
              className="flex-1 py-2 px-3 text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5"
              style={
                activeTab === node.id
                  ? {
                      background: "var(--nerv-bg3)",
                      border: "1px solid var(--nerv-orange)",
                      color: "var(--nerv-amber)",
                    }
                  : {
                      background: "transparent",
                      border: "1px solid var(--nerv-orange-dim)",
                      color: "var(--nerv-text-dim)",
                    }
              }
            >
              <span
                className="w-2.5 h-2.5"
                style={{ background: node.colorHex }}
              />
              <span>{node.codeName}</span>
            </button>
          ))}
        </div>

        {/* Form Controls */}
        <div
          className="p-6 overflow-y-auto space-y-6 flex-1 text-xs"
          style={{ color: "var(--nerv-text)" }}
        >
          {/* Model Selector */}
          <div>
            <label
              className="block font-bold uppercase tracking-wider mb-2"
              style={{ color: "var(--nerv-orange)" }}
            >
              SELECT AI MODEL / PERSONA CORE
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MODEL_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { playBeep(950, 0.03); setModelId(opt.id); }}
                  className="p-3 text-left transition cursor-pointer flex flex-col justify-between"
                  style={
                    modelId === opt.id
                      ? {
                          background: "var(--nerv-bg3)",
                          border: "1px solid var(--nerv-orange)",
                          color: "var(--nerv-amber)",
                          boxShadow: "0 0 10px rgba(184,98,26,0.2)",
                        }
                      : {
                          background: "#050506",
                          border: "1px solid #1a1410",
                          color: "var(--nerv-text-dim)",
                        }
                  }
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold" style={{ color: "var(--nerv-text)" }}>{opt.name}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5"
                      style={{
                        background: "var(--nerv-bg2)",
                        border: "1px solid var(--nerv-orange-dim)",
                        color: "var(--nerv-orange)",
                      }}
                    >
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-[11px] leading-tight" style={{ color: "var(--nerv-text-muted)" }}>
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Archetype */}
          <div>
            <label
              className="block font-bold uppercase tracking-wider mb-1"
              style={{ color: "var(--nerv-orange)" }}
            >
              ARCHETYPE DIRECTIVE
            </label>
            <input
              type="text"
              value={archetype}
              onChange={(e) => setArchetype(e.target.value)}
              className="w-full p-2.5 focus:outline-none font-mono"
              style={{
                background: "#050506",
                border: "1px solid var(--nerv-orange-dim)",
                color: "var(--nerv-text)",
              }}
              onFocus={e => (e.target.style.borderColor = "var(--nerv-orange)")}
              onBlur={e => (e.target.style.borderColor = "var(--nerv-orange-dim)")}
            />
          </div>

          {/* Temperature */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                className="font-bold uppercase tracking-wider"
                style={{ color: "var(--nerv-orange)" }}
              >
                TEMPERATURE (DIVERGENCE / CREATIVITY): {temperature}
              </label>
              <span className="text-[10px]" style={{ color: "var(--nerv-text-dim)" }}>
                {temperature <= 0.3
                  ? "Strict Analytical Logic"
                  : temperature <= 0.7
                  ? "Balanced Reasoning"
                  : "Expansive & Creative"}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full cursor-pointer"
              style={{ accentColor: "var(--nerv-orange)" }}
            />
          </div>

          {/* Custom Prompt */}
          <div>
            <label
              className="block font-bold uppercase tracking-wider mb-1"
              style={{ color: "var(--nerv-orange)" }}
            >
              CUSTOM SYSTEM PROMPT (OPTIONAL OVERRIDE)
            </label>
            <textarea
              rows={3}
              value={customSystemPrompt}
              onChange={(e) => setCustomSystemPrompt(e.target.value)}
              placeholder="e.g., Focus heavily on cybersecurity, cost efficiency, or extreme risk aversion..."
              className="w-full p-2.5 focus:outline-none font-mono"
              style={{
                background: "#050506",
                border: "1px solid var(--nerv-orange-dim)",
                color: "var(--nerv-text)",
              }}
              onFocus={e => (e.target.style.borderColor = "var(--nerv-orange)")}
              onBlur={e => (e.target.style.borderColor = "var(--nerv-orange-dim)")}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className="p-4 flex items-center justify-between shrink-0"
          style={{
            background: "#050506",
            borderTop: "1px solid var(--nerv-orange-dim)",
          }}
        >
          <button
            onClick={() => { playBeep(700, 0.05); onResetNodes(); onClose(); }}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold transition cursor-pointer"
            style={{
              background: "rgba(90,10,10,0.4)",
              border: "1px solid var(--nerv-red)",
              color: "#d06060",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(139,26,26,0.6)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(90,10,10,0.4)")}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET ALL DEFAULT NODES</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-5 py-2 font-black text-xs uppercase tracking-widest transition cursor-pointer"
            style={{
              background: "var(--nerv-orange)",
              border: "1px solid var(--nerv-amber)",
              color: "#000",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--nerv-amber)")}
            onMouseLeave={e => (e.currentTarget.style.background = "var(--nerv-orange)")}
          >
            <Save className="w-4 h-4" />
            <span>SAVE NODE CONFIG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
