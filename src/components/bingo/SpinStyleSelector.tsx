import { soundManager } from "../../audio/soundManager";
import type { SpinMode } from "../../hooks/useBingoGameState";

interface SpinStyleSelectorProps {
  spinSpeed: number;
  setSpinSpeed: (v: number) => void;
  spinTime: number;
  setSpinTime: (v: number) => void;
  spinMode: SpinMode;
  setSpinMode: (v: SpinMode) => void;
}

export const STRENGTHS = [
  { label: "Soft", value: 1.5 },
  { label: "Hard", value: 3 },
] as const;

export const DEFAULT_STRENGTH = STRENGTHS[0].value;

export const DURATIONS = [
  { label: "Quick", value: 2 },
  { label: "Medium", value: 5 },
  { label: "Long", value: 10 },
] as const;

export const DEFAULT_DURATION = DURATIONS[1].value;

const SPIN_MODES: readonly { label: string; value: SpinMode }[] = [
  { label: "Manual", value: "manual" },
  { label: "Auto", value: "auto" },
  { label: "AutoRandom", value: "auto-random" },
];

function ToggleGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: readonly { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, opacity: disabled ? 0.35 : 1 }}>
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
              disabled={disabled}
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
                cursor: disabled ? "not-allowed" : "pointer",
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
  spinMode,
  setSpinMode,
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
        label="Spin Mode"
        options={SPIN_MODES}
        value={spinMode}
        onChange={setSpinMode}
      />
      <ToggleGroup
        label="Strength"
        options={STRENGTHS}
        value={spinSpeed}
        onChange={setSpinSpeed}
        disabled={spinMode === "auto"}
      />
      <ToggleGroup
        label={spinMode !== "manual" ? "Auto Spin Delay" : "Duration"}
        options={DURATIONS}
        value={spinTime}
        onChange={setSpinTime}
      />
    </div>
  );
}
