import patterns from "../../data/bingoPatterns.json";
import type { BingoPattern } from "../../data/bingoPatterns.types";
import { PatternGrid } from "./PatternGrid";

interface CurrentPatternDisplayProps {
  patternId: string;
  onEdit?: () => void;
  editDisabled?: boolean;
}

export function CurrentPatternDisplay({ patternId, onEdit, editDisabled }: CurrentPatternDisplayProps) {
  const pattern = (patterns as BingoPattern[]).find((p) => p.id === patternId);
  if (!pattern) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{
          color: "rgba(245, 158, 11, 0.9)",
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: 3,
          textTransform: "uppercase",
        }}>
          {pattern.name}
        </span>
        {onEdit && (
          <button
            onClick={onEdit}
            disabled={editDisabled}
            aria-label="Change pattern"
            title="Change pattern"
            style={{
              background: "none",
              border: "1px solid rgba(245, 158, 11, 0.4)",
              borderRadius: 8,
              color: editDisabled ? "var(--text-dim)" : "rgba(245, 158, 11, 0.9)",
              fontSize: 20,
              cursor: editDisabled ? "not-allowed" : "pointer",
              padding: "4px 10px",
              lineHeight: 1,
              pointerEvents: "auto",
              opacity: editDisabled ? 0.4 : 1,
              transition: "all 0.2s",
            }}
          >
            &#9998;
          </button>
        )}
      </div>
      <PatternGrid grid={pattern.grid} size={260} />
    </div>
  );
}
