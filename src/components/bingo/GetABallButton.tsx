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
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: "absolute",
        bottom: 40,
        left: 40,
        padding: "16px 48px",
        fontSize: 24,
        fontWeight: "bold",
        borderRadius: 12,
        border: "none",
        background: disabled ? "#555" : "#ff6b35",
        color: "white",
        cursor: disabled ? "not-allowed" : "pointer",
        zIndex: 10,
        letterSpacing: 2,
        transition: "background 0.2s",
      }}
    >
      {phaseText[phase]}
    </button>
  );
}
