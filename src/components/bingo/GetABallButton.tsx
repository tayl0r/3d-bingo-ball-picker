import type { GamePhase } from "../../hooks/useBingoGameState";

interface GetABallButtonProps {
  onClick: () => void;
  disabled: boolean;
  phase: GamePhase;
}

const phaseText: Record<GamePhase, string> = {
  idle: "GET A BALL",
  mixing: "MIXING...",
  settling: "SETTLING...",
  selecting: "SELECTING...",
  animating: "WATCH...",
};

export function GetABallButton({ onClick, disabled, phase }: GetABallButtonProps) {
  const isIdle = phase === "idle";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "24px 72px",
        fontSize: 36,
        fontFamily: "var(--font-display)",
        fontWeight: 400,
        letterSpacing: 5,
        borderRadius: 16,
        border: disabled
          ? "2px solid var(--text-dim)"
          : "2px solid var(--amber)",
        background: disabled
          ? "rgba(60, 60, 80, 0.5)"
          : "rgba(245, 158, 11, 0.12)",
        color: disabled ? "var(--text-dim)" : "var(--amber)",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.25s ease",
        boxShadow: disabled
          ? "none"
          : isIdle
            ? "0 0 20px var(--amber-glow), inset 0 0 20px rgba(245, 158, 11, 0.06)"
            : "0 0 10px var(--amber-glow)",
        textShadow: disabled ? "none" : "0 0 12px var(--amber-glow)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {phaseText[phase]}
    </button>
  );
}
