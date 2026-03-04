import type { GamePhase } from "../../hooks/useBingoGameState";

interface GetABallButtonProps {
  onClick: () => void;
  disabled: boolean;
  phase: GamePhase;
}

const phaseText: Record<GamePhase, string> = {
  idle: "GET A BALL",
  "auto-mixing": "GET A BALL",
  mixing: "MIXING...",
  settling: "SETTLING...",
  selecting: "SETTLING...",
  animating: "WATCH...",
};


export function GetABallButton({ onClick, disabled, phase }: GetABallButtonProps) {
  const isIdle = phase === "idle" || phase === "auto-mixing";
  const sheenActive = isIdle && !disabled;

  return (
    <button
        onClick={onClick}
        disabled={disabled}
        style={{
          minWidth: 400,
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
          animation: isIdle && !disabled ? "squash-bounce 5s ease-in-out infinite" : "none",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "40%",
            height: "100%",
            background:
              "linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.18), transparent)",
            animation: sheenActive ? "sheen-sweep 4s ease-in-out infinite" : "none",
            opacity: sheenActive ? 1 : 0,
            transition: "opacity 0.3s ease",
            pointerEvents: "none",
          }}
        />
        {phaseText[phase]}
      </button>
  );
}
