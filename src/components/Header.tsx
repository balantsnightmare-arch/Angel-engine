import React from "react";
import { Cpu, Volume2, VolumeX, Settings, Sparkles, RefreshCw, UserCheck, LogIn } from "lucide-react";
import { setSoundEnabled, playBeep } from "../lib/sound";
import { GoogleUser } from "./GoogleAuthModal";

interface HeaderProps {
  soundOn: boolean;
  onToggleSound: (enabled: boolean) => void;
  onOpenConfig: () => void;
  onOpenPresets: () => void;
  onOpenGoogleAuth: () => void;
  googleUser: GoogleUser | null;
  onReset: () => void;
  status: string;
  round: number;
  maxRounds: number;
}

export const Header: React.FC<HeaderProps> = ({
  soundOn,
  onToggleSound,
  onOpenConfig,
  onOpenPresets,
  onOpenGoogleAuth,
  googleUser,
  onReset,
  status,
  round,
  maxRounds,
}) => {
  return (
    <header
      className="shrink-0 relative overflow-hidden font-mono"
      style={{
        background: "var(--nerv-bg2)",
        borderBottom: "2px solid var(--nerv-orange)",
      }}
    >
      {/* Hazard stripe top edge */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 pointer-events-none"
        style={{
          backgroundImage: "repeating-linear-gradient(90deg, var(--nerv-orange) 0, var(--nerv-orange) 10px, transparent 10px, transparent 18px)",
        }}
      />

      {/* NGE diagonal grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "repeating-linear-gradient(135deg, rgba(184,98,26,0.04) 0, rgba(184,98,26,0.04) 1px, transparent 1px, transparent 20px)",
        }}
      />

      <div className="max-w-7xl mx-auto px-3 py-2 sm:px-4 flex flex-wrap items-center justify-between gap-2 relative z-10">

        {/* NERV Brand */}
        <div className="flex items-center space-x-2.5">
          <div
            className="relative flex items-center justify-center w-8 h-8"
            style={{
              background: "#0a0805",
              border: "2px solid var(--nerv-orange)",
              boxShadow: "0 0 10px rgba(184,98,26,0.5)",
            }}
          >
            <Cpu className="w-5 h-5" style={{ color: "var(--nerv-amber)" }} />
            <span
              className="absolute -bottom-1 -right-1 text-[7px] font-bold px-0.5"
              style={{ background: "var(--nerv-red)", color: "#f0a0a0" }}
            >
              3.0
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1
                className="text-lg sm:text-xl font-black tracking-widest uppercase eva-flicker"
                style={{ color: "var(--nerv-amber)" }}
              >
                ANGEL ENGINE
              </h1>
              <span
                className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold tracking-wider"
                style={{
                  background: "var(--nerv-red)",
                  border: "1px solid var(--nerv-red-bright)",
                  color: "#e08080",
                }}
              >
                SYNAPSE CORE
              </span>
            </div>
            <p
              className="text-[9px] tracking-tight hidden sm:block"
              style={{ color: "var(--nerv-text-dim)" }}
            >
              MULTI-PERSPECTIVE AI DELIBERATION • TRIAD AI COUNCIL
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className="flex items-center space-x-2 px-2.5 py-1 text-[10px]"
          style={{
            background: "#050506",
            border: "1px solid var(--nerv-orange-dim)",
          }}
        >
          <span
            className={`w-2 h-2 ${
              status === "DELIBERATING" ? "animate-ping" : ""
            }`}
            style={{
              background:
                status === "DELIBERATING"
                  ? "var(--nerv-orange)"
                  : status === "CONSENSUS_REACHED"
                  ? "#2a8a2a"
                  : status === "SPLIT_DECISION"
                  ? "var(--nerv-red-bright)"
                  : "var(--nerv-orange-dim)",
              boxShadow:
                status === "CONSENSUS_REACHED"
                  ? "0 0 8px rgba(42,138,42,0.8)"
                  : status === "SPLIT_DECISION"
                  ? "0 0 8px rgba(192,48,48,0.8)"
                  : undefined,
            }}
          />
          <span
            className="font-bold tracking-wider uppercase"
            style={{ color: "var(--nerv-amber)" }}
          >
            {status === "IDLE"
              ? "SYSTEM READY"
              : status === "DELIBERATING"
              ? (round > maxRounds ? `OVERTIME ROUND` : `DEBATING (ROUND ${round}/${maxRounds})`)
              : status === "CONSENSUS_REACHED"
              ? "CODE 601: CONSENSUS ACHIEVED"
              : status === "SPLIT_DECISION"
              ? "CODE 602: SPLIT DECISION"
              : "SYSTEM ACTIVE"}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Google Auth */}
          <button
            onClick={() => {
              playBeep(1100, 0.05);
              onOpenGoogleAuth();
            }}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold transition cursor-pointer"
            style={
              googleUser
                ? {
                    background: "var(--nerv-green-dim)",
                    border: "1px solid #1e5a1e",
                    color: "#4ab84a",
                    boxShadow: "0 0 8px rgba(42,138,42,0.2)",
                  }
                : {
                    background: "#1a1a1c",
                    border: "1px solid #333",
                    color: "#aaa",
                  }
            }
            title={googleUser ? `Signed in as ${googleUser.email}` : "Sign in with Google"}
          >
            {googleUser ? (
              <>
                <UserCheck className="w-3.5 h-3.5" style={{ color: "#4ab84a" }} />
                <span className="hidden lg:inline">{googleUser.email.split("@")[0]}</span>
                <span className="lg:hidden">PRO</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>SIGN IN GOOGLE</span>
              </>
            )}
          </button>

          {/* Presets */}
          <button
            onClick={() => {
              playBeep(900, 0.05);
              onOpenPresets();
            }}
            className="px-2.5 py-1 text-xs font-bold transition cursor-pointer flex items-center space-x-1"
            style={{
              background: "#050506",
              border: "1px solid var(--nerv-orange-dim)",
              color: "var(--nerv-text)",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--nerv-orange)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--nerv-orange-dim)")}
            title="Load Preset Topics"
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--nerv-orange)" }} />
            <span className="hidden md:inline">PRESETS</span>
          </button>

          {/* Node Config */}
          <button
            onClick={() => {
              playBeep(950, 0.05);
              onOpenConfig();
            }}
            className="px-2.5 py-1 text-xs font-bold transition cursor-pointer flex items-center space-x-1"
            style={{
              background: "#050506",
              border: "1px solid var(--nerv-orange-dim)",
              color: "var(--nerv-text)",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--nerv-orange)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--nerv-orange-dim)")}
            title="Configure AI Council Nodes"
          >
            <Settings className="w-3.5 h-3.5" style={{ color: "var(--nerv-amber)" }} />
            <span className="hidden sm:inline">NODES</span>
          </button>

          {/* Audio Toggle */}
          <button
            onClick={() => {
              const next = !soundOn;
              onToggleSound(next);
              setSoundEnabled(next);
              if (next) playBeep(1200, 0.08);
            }}
            className="p-1 transition cursor-pointer"
            style={{
              background: soundOn ? "var(--nerv-orange-dim)" : "#050506",
              border: `1px solid ${soundOn ? "var(--nerv-orange)" : "#222"}`,
              color: soundOn ? "var(--nerv-amber)" : "#444",
            }}
            title={soundOn ? "Mute Sound" : "Enable Sound"}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Reset */}
          <button
            onClick={() => {
              playBeep(700, 0.06);
              onReset();
            }}
            className="p-1 transition cursor-pointer"
            style={{
              background: "#050506",
              border: "1px solid var(--nerv-red)",
              color: "var(--nerv-red-bright)",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--nerv-red)")}
            onMouseLeave={e => (e.currentTarget.style.background = "#050506")}
            title="Reset Session"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
