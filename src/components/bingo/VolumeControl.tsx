import type { SpinMode } from "../../hooks/useBingoGameState";
import { useSoundSettings } from "../../hooks/useSoundSettings";

interface VolumeControlProps {
  paddleEnabled: boolean;
  onPaddleToggle: (enabled: boolean) => void;
  spinMode?: SpinMode;
}

export function VolumeControl({ paddleEnabled, onPaddleToggle, spinMode }: VolumeControlProps) {
  const paddleForceOn = spinMode === "auto";
  const paddleActive = paddleForceOn || paddleEnabled;
  const { volume, muted, setVolume, setMuted } = useSoundSettings();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        background: "rgba(10, 10, 20, 0.8)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid var(--border-light)",
        borderRadius: 10,
      }}
    >
      <button
        onClick={() => setMuted(!muted)}
        style={{
          background: "none",
          border: "none",
          color: muted ? "var(--text-dim)" : "var(--cyan)",
          fontSize: 18,
          cursor: "pointer",
          padding: "2px 4px",
          lineHeight: 1,
        }}
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? "\u{1F507}" : volume > 0.5 ? "\u{1F50A}" : "\u{1F509}"}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={muted ? 0 : volume}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (muted && v > 0) setMuted(false);
          setVolume(v);
        }}
        style={{
          flex: 1,
          accentColor: "var(--cyan)",
          cursor: "pointer",
        }}
      />
      <div
        style={{
          width: 1,
          height: 20,
          background: "var(--border-light)",
          flexShrink: 0,
        }}
      />
      <button
        onClick={() => { if (!paddleForceOn) onPaddleToggle(!paddleEnabled); }}
        disabled={paddleForceOn}
        style={{
          background: "none",
          border: "none",
          color: paddleActive ? "var(--cyan)" : "var(--text-dim)",
          fontSize: 16,
          cursor: paddleForceOn ? "default" : "pointer",
          padding: "2px 4px",
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          gap: 4,
          opacity: paddleForceOn ? 0.6 : 1,
        }}
        title={paddleForceOn ? "Paddle always on in auto mode" : paddleActive ? "Disable ball paddle" : "Enable ball paddle"}
      >
        <span style={{
          fontSize: 18,
          filter: paddleActive ? "none" : "grayscale(1)",
          opacity: paddleActive ? 1 : 0.5,
        }}>🏓</span>
        <span
          style={{
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            letterSpacing: 1,
            textTransform: "uppercase",
            opacity: paddleActive ? 1 : 0.5,
            width: 24,
            textAlign: "center",
          }}
        >
          {paddleActive ? "on" : "off"}
        </span>
      </button>
    </div>
  );
}
