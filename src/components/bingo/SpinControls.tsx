import { useState } from "react";

interface SpinControlsProps {
  spinTime: number;
  setSpinTime: (v: number) => void;
  spinSpeed: number;
  setSpinSpeed: (v: number) => void;
}

export function SpinControls({ spinTime, setSpinTime, spinSpeed, setSpinSpeed }: SpinControlsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ pointerEvents: "auto", position: "relative" }}>
      {open && (
        <div style={{
          position: "absolute",
          bottom: "100%",
          right: 0,
          marginBottom: 8,
          padding: "20px 24px",
          background: "rgba(10, 10, 20, 0.9)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid var(--border-light)",
          borderRadius: 14,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          color: "var(--text)",
          fontFamily: "var(--font-mono)",
          fontSize: 18,
        }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ color: "var(--text-muted)", letterSpacing: 0.5 }}>
              Spin Time: <span style={{ color: "var(--cyan)" }}>{spinTime.toFixed(1)}s</span>
            </span>
            <input
              type="range"
              min={2} max={10} step={0.5}
              value={spinTime}
              onChange={(e) => setSpinTime(Number(e.target.value))}
              style={{ width: 240, accentColor: "var(--cyan)" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ color: "var(--text-muted)", letterSpacing: 0.5 }}>
              Spin Speed: <span style={{ color: "var(--cyan)" }}>{spinSpeed.toFixed(1)}x</span>
            </span>
            <input
              type="range"
              min={0.5} max={4} step={0.1}
              value={spinSpeed}
              onChange={(e) => setSpinSpeed(Number(e.target.value))}
              style={{ width: 240, accentColor: "var(--cyan)" }}
            />
          </label>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "block",
          marginLeft: "auto",
          padding: "8px 18px",
          background: open ? "rgba(6, 182, 212, 0.1)" : "rgba(255,255,255,0.06)",
          border: open ? "1px solid rgba(6, 182, 212, 0.3)" : "1px solid var(--border)",
          borderRadius: 8,
          color: open ? "var(--cyan)" : "var(--text-dim)",
          fontSize: 16,
          fontFamily: "var(--font-mono)",
          letterSpacing: 1,
          cursor: "pointer",
          transition: "all 0.2s",
          textTransform: "uppercase",
        }}
      >
        debug
      </button>
    </div>
  );
}
