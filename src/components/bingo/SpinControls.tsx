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
    <div style={{ position: "absolute", bottom: 12, right: 12, zIndex: 10 }}>
      {open && (
        <div style={{
          marginBottom: 8,
          padding: "12px 16px",
          background: "rgba(0,0,0,0.75)",
          borderRadius: 8,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          color: "white",
          fontFamily: "sans-serif",
          fontSize: 14,
        }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            Spin Time: {spinTime.toFixed(1)}s
            <input
              type="range"
              min={2} max={10} step={0.5}
              value={spinTime}
              onChange={(e) => setSpinTime(Number(e.target.value))}
              style={{ width: 140 }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            Spin Speed: {spinSpeed.toFixed(1)}x
            <input
              type="range"
              min={0.5} max={4} step={0.1}
              value={spinSpeed}
              onChange={(e) => setSpinSpeed(Number(e.target.value))}
              style={{ width: 140 }}
            />
          </label>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "block",
          marginLeft: "auto",
          padding: "4px 10px",
          background: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: 6,
          color: "rgba(255,255,255,0.6)",
          fontSize: 11,
          fontFamily: "sans-serif",
          cursor: "pointer",
        }}
      >
        debug
      </button>
    </div>
  );
}
