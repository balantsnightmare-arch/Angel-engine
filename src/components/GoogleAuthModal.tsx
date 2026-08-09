import React, { useState } from "react";
import { X, ShieldCheck, CheckCircle2, LogOut, ArrowRight } from "lucide-react";
import { playBeep, playChime } from "../lib/sound";

export interface GoogleUser {
  name: string;
  email: string;
  picture?: string;
  authenticatedAt: string;
}

interface GoogleAuthModalProps {
  currentUser: GoogleUser | null;
  onSignIn: (user: GoogleUser) => void;
  onSignOut: () => void;
  onClose: () => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  currentUser,
  onSignIn,
  onSignOut,
  onClose,
}) => {
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulatedGoogleSignIn = (customEmail?: string, customName?: string) => {
    setIsSimulating(true);
    playBeep(1200, 0.05);

    setTimeout(() => {
      const email = customEmail || emailInput.trim() || "operator@synapse-council.org";
      const name = customName || nameInput.trim() || email.split("@")[0].toUpperCase();

      const user: GoogleUser = {
        name,
        email,
        picture: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`,
        authenticatedAt: new Date().toLocaleTimeString(),
      };

      playChime();
      onSignIn(user);
      setIsSimulating(false);
      onClose();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono"
      style={{ background: "rgba(0,0,0,0.88)" }}
    >
      <div
        className="w-full max-w-md overflow-hidden flex flex-col"
        style={{
          background: "var(--nerv-bg2)",
          border: "2px solid var(--nerv-orange)",
          boxShadow: "0 0 30px rgba(184,98,26,0.2)",
        }}
      >
        {/* Header */}
        <div
          className="p-3 flex items-center justify-between relative"
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
            <ShieldCheck className="w-5 h-5" style={{ color: "var(--nerv-orange)" }} />
            <h2
              className="text-sm font-black uppercase tracking-widest"
              style={{ color: "var(--nerv-amber)" }}
            >
              GOOGLE ACCOUNT AUTHENTICATION
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

        {/* Content */}
        <div className="p-5 space-y-4 text-xs" style={{ color: "var(--nerv-text)" }}>
          {currentUser ? (
            <div className="space-y-4 text-center">
              <div
                className="inline-flex items-center justify-center p-3 w-full"
                style={{
                  background: "var(--nerv-green-dim)",
                  border: "1px solid #1e5a1e",
                  color: "#4ab84a",
                }}
              >
                <CheckCircle2 className="w-5 h-5 mr-2 shrink-0" />
                <div className="text-left">
                  <div className="font-bold uppercase tracking-wider" style={{ color: "#4ab84a" }}>
                    AUTHENTICATED GOOGLE OPERATOR
                  </div>
                  <div className="text-[11px]" style={{ color: "#2a8a2a" }}>{currentUser.email}</div>
                </div>
              </div>

              <div
                className="p-3 text-left space-y-2"
                style={{
                  background: "var(--nerv-bg3)",
                  border: "1px solid var(--nerv-orange-dim)",
                }}
              >
                <div
                  className="font-bold uppercase tracking-wider text-[11px]"
                  style={{ color: "var(--nerv-orange)" }}
                >
                  UNLOCKED CAPABILITIES:
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px]" style={{ color: "var(--nerv-text)" }}>
                  <li>Access to Highest Tier Gemini 3.1 Pro Cores</li>
                  <li>Maximum Token Deliberation Context</li>
                  <li>Multi-Agent Reasoning Deep Protocol</li>
                </ul>
              </div>

              <button
                onClick={() => { playBeep(800, 0.05); onSignOut(); onClose(); }}
                className="w-full py-2.5 font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-2"
                style={{
                  background: "#2a0808",
                  border: "1px solid var(--nerv-red)",
                  color: "#d06060",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#3a0a0a")}
                onMouseLeave={e => (e.currentTarget.style.background = "#2a0808")}
              >
                <LogOut className="w-4 h-4" />
                <span>SIGN OUT OF GOOGLE ACCOUNT</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="leading-relaxed" style={{ color: "var(--nerv-text-dim)" }}>
                Authenticating with your Google Account unlocks access to the most advanced Gemini 3.1 Pro model cores for deep multi-node AI Council deliberation.
              </p>

              {/* Google Sign In */}
              <button
                onClick={() => handleSimulatedGoogleSignIn("user@gmail.com", "Google Account Operator")}
                disabled={isSimulating}
                className="w-full py-3 font-black uppercase tracking-wider flex items-center justify-center space-x-3 cursor-pointer transition"
                style={{
                  background: "#f8f8f8",
                  border: "2px solid #aaa",
                  color: "#111",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#e8e8e8")}
                onMouseLeave={e => (e.currentTarget.style.background = "#f8f8f8")}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isSimulating ? "CONNECTING TO GOOGLE..." : "SIGN IN WITH GOOGLE"}</span>
              </button>

              <div className="relative my-3 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full" style={{ borderTop: "1px solid var(--nerv-orange-dim)" }} />
                </div>
                <span
                  className="relative px-2 text-[10px] uppercase tracking-widest"
                  style={{ background: "var(--nerv-bg2)", color: "var(--nerv-text-muted)" }}
                >
                  OR ENTER CUSTOM GOOGLE EMAIL
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <label
                    className="block text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: "var(--nerv-orange)" }}
                  >
                    GOOGLE ACCOUNT EMAIL:
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="your.email@gmail.com"
                    className="w-full p-2 focus:outline-none font-mono"
                    style={{
                      background: "#050506",
                      border: "1px solid var(--nerv-orange-dim)",
                      color: "var(--nerv-text)",
                    }}
                    onFocus={e => (e.target.style.borderColor = "var(--nerv-orange)")}
                    onBlur={e => (e.target.style.borderColor = "var(--nerv-orange-dim)")}
                  />
                </div>

                <button
                  onClick={() => handleSimulatedGoogleSignIn()}
                  disabled={!emailInput.trim() || isSimulating}
                  className="w-full py-2 font-black uppercase tracking-wider cursor-pointer transition disabled:opacity-40 flex items-center justify-center space-x-1"
                  style={{
                    background: "var(--nerv-orange)",
                    border: "1px solid var(--nerv-amber)",
                    color: "#000",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--nerv-amber)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "var(--nerv-orange)")}
                >
                  <span>AUTHORIZE GOOGLE OPERATOR</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="p-3 flex items-center justify-between text-[10px]"
          style={{
            background: "#050506",
            borderTop: "1px solid var(--nerv-orange-dim)",
            color: "var(--nerv-text-muted)",
          }}
        >
          <span>SYNAPSE AUTH SYSTEM v3.0</span>
          <span>GOOGLE OAUTH 2.0 INTEGRATION</span>
        </div>
      </div>
    </div>
  );
};
