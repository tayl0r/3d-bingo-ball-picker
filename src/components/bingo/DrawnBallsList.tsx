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
          padding: "16px 12px",
          display: "flex",
          gap: 4,
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
              gap: 2,
            }}
          >
            {/* Column header */}
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                color: col.color,
                lineHeight: 1,
                marginBottom: 6,
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
                  style={{
                    width: 44,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontFamily: "var(--font-mono)",
                    fontWeight: isDrawn ? 700 : 400,
                    color: isDrawn ? "#000" : "var(--text-dim)",
                    background: isDrawn ? col.color : "transparent",
                    borderRadius: 6,
                    transition: "all 0.3s ease",
                    opacity: isDrawn ? 1 : 0.4,
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
          fontSize: 18,
          color: "var(--text-muted)",
          letterSpacing: 1,
        }}
      >
        {balls.length}/75
      </div>
    </div>
  );
}
