import patterns from "../../data/bingoPatterns.json";
import type { BingoPattern } from "../../data/bingoPatterns.types";
import { PatternGrid } from "./PatternGrid";

interface CurrentPatternDisplayProps {
  patternId: string;
}

export function CurrentPatternDisplay({ patternId }: CurrentPatternDisplayProps) {
  const pattern = (patterns as BingoPattern[]).find((p) => p.id === patternId);
  if (!pattern) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <span style={{
        color: "rgba(245, 158, 11, 0.9)",
        fontSize: 40,
        fontWeight: 700,
        letterSpacing: 3,
        textTransform: "uppercase",
      }}>
        {pattern.name}
      </span>
      <PatternGrid grid={pattern.grid} size={260} />
    </div>
  );
}
