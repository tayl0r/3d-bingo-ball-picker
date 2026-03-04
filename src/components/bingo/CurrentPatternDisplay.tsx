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
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <PatternGrid grid={pattern.grid} size={64} />
      <span style={{
        color: "rgba(245, 158, 11, 0.9)",
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: 1,
        textTransform: "uppercase",
      }}>
        {pattern.name}
      </span>
    </div>
  );
}
