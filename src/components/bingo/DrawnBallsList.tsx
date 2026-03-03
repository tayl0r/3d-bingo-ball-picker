import { getBallColor } from "../../utils/ballTexture";

function getBallLetter(num: number): string {
  if (num <= 15) return "B";
  if (num <= 30) return "I";
  if (num <= 45) return "N";
  if (num <= 60) return "G";
  return "O";
}

export function DrawnBallsList({ balls }: { balls: number[] }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        right: 20,
        maxHeight: "calc(100vh - 40px)",
        overflowY: "auto",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 70,
      }}
    >
      <div style={{ color: "#fff", fontSize: 14, fontWeight: "bold", textAlign: "center", marginBottom: 4 }}>
        DRAWN ({balls.length})
      </div>
      {[...balls].reverse().map((num) => (
        <div
          key={num}
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: getBallColor(num),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid rgba(255,255,255,0.3)",
          }}
        >
          <span style={{ fontSize: 10, fontWeight: "bold", color: "#000", lineHeight: 1 }}>
            {getBallLetter(num)}
          </span>
          <span style={{ fontSize: 18, fontWeight: "bold", color: "#000", lineHeight: 1 }}>
            {num}
          </span>
        </div>
      ))}
    </div>
  );
}
