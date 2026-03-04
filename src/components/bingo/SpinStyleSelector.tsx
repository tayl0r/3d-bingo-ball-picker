import { soundManager } from "../../audio/soundManager";

interface SpinStyleSelectorProps {
  spinSpeed: number;
  setSpinSpeed: (v: number) => void;
  spinTime: number;
  setSpinTime: (v: number) => void;
}

const STRENGTHS = [
  { label: "Soft", value: 1.5 },
  { label: "Medium", value: 3 },
  { label: "Hard", value: 5 },
] as const;

const DURATIONS = [
  { label: "Quick", value: 2 },
  { label: "Medium", value: 5 },
  { label: "Long", value: 10 },
] as const;

function ToggleGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { label: string; value: number }[];
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        style={{
          fontSize: 11,
          fontFamily: "var(--font-mono)",
          color: "var(--text-muted)",
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: "flex",
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid var(--border)",
        }}
      >
        {options.map((opt, i) => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              onClick={() => { soundManager.playToggleSwitch(i / (options.length - 1)); onChange(opt.value); }}
              style={{
                flex: 1,
                padding: "6px 14px",
                fontSize: 13,
                fontFamily: "var(--font-mono)",
                letterSpacing: 1,
                textTransform: "uppercase",
                background: selected
                  ? "rgba(6, 182, 212, 0.15)"
                  : "rgba(255, 255, 255, 0.03)",
                color: selected ? "var(--cyan)" : "var(--text-dim)",
                border: "none",
                borderRight:
                  i < options.length - 1
                    ? "1px solid var(--border)"
                    : "none",
                cursor: "pointer",
                transition: "all 0.15s",
                fontWeight: selected ? 600 : 400,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SpinStyleSelector({
  spinSpeed,
  setSpinSpeed,
  spinTime,
  setSpinTime,
}: SpinStyleSelectorProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "14px 16px",
        background: "rgba(10, 10, 20, 0.8)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid var(--border-light)",
        borderRadius: 12,
        minWidth: 260,
      }}
    >
      <ToggleGroup
        label="Strength"
        options={STRENGTHS}
        value={spinSpeed}
        onChange={setSpinSpeed}
      />
      <ToggleGroup
        label="Duration"
        options={DURATIONS}
        value={spinTime}
        onChange={setSpinTime}
      />
    </div>
  );
}
