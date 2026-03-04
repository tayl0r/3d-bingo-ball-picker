import { soundManager } from "../../audio/soundManager";

const COLUMNS = [
  { letter: "B", range: [1, 15], color: "#1E90FF" },
  { letter: "I", range: [16, 30], color: "#FF4444" },
  { letter: "N", range: [31, 45], color: "#EEEEEE" },
  { letter: "G", range: [46, 60], color: "#32CD32" },
  { letter: "O", range: [61, 75], color: "#FFA500" },
] as const;

export function DrawnBallsList({ balls }: { balls: number[] }) {
  const drawnSet = new Set(balls);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        pointerEvents: "none",
      }}
    >
      {/* Compact BINGO board */}
      <div
        style={{
          background: "rgba(10, 10, 20, 0.85)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderRadius: 16,
          border: "1px solid var(--border)",
          padding: "24px 20px",
          display: "flex",
          gap: 8,
          pointerEvents: "auto",
        }}
      >
        {COLUMNS.map((col) => (
          <div
            key={col.letter}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            {/* Column header */}
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 30,
                color: col.color,
                lineHeight: 1,
                marginBottom: 10,
                textShadow: `0 0 8px ${col.color}55`,
              }}
            >
              {col.letter}
            </div>
            {/* Numbers in column */}
            {Array.from({ length: 15 }, (_, i) => {
              const num = col.range[0] + i;
              const isDrawn = drawnSet.has(num);
              return (
                <div
                  key={num}
                  onClick={() => soundManager.playBallLand(num)}
                  style={{
                    width: 60,
                    height: 42,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontFamily: "var(--font-mono)",
                    fontWeight: isDrawn ? 700 : 400,
                    color: isDrawn ? "#000" : "var(--text-dim)",
                    background: isDrawn ? col.color : "transparent",
                    borderRadius: 8,
                    transition: "all 0.3s ease",
                    opacity: isDrawn ? 1 : 0.4,
                    cursor: "pointer",
                  }}
                >
                  {num}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Count */}
      <div
        style={{
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: 22,
          color: "var(--text-muted)",
          letterSpacing: 1,
        }}
      >
        {balls.length}/75
      </div>
    </div>
  );
}
