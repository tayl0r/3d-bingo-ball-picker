import { useMemo } from "react";
import patterns from "../../data/bingoPatterns.json";
import type { BingoPattern } from "../../data/bingoPatterns.types";
import { PatternGrid } from "./PatternGrid";
import { getCustomPatterns } from "../../utils/customPatterns";

const builtInPatterns = patterns as BingoPattern[];

interface CurrentPatternDisplayProps {
  patternId: string;
  onEdit?: () => void;
  editDisabled?: boolean;
}

export function CurrentPatternDisplay({ patternId, onEdit, editDisabled }: CurrentPatternDisplayProps) {
  const allPatterns = useMemo(() => [...builtInPatterns, ...getCustomPatterns()], [patternId]);
  const patternsById = useMemo(() => new Map(allPatterns.map((p) => [p.id, p])), [allPatterns]);

  const pattern = allPatterns.find((p) => p.id === patternId);
  if (!pattern) return null;

  const altGrids = pattern.alternatives
    ?.map((id) => patternsById.get(id)?.grid)
    .filter((g): g is number[][] => !!g);

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
      {altGrids && altGrids.length > 2 ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, auto)",
          gap: 10,
          justifyItems: "center",
          alignItems: "center",
        }}>
          {altGrids.map((g, i) => (
            <PatternGrid key={i} grid={g} size={120} />
          ))}
        </div>
      ) : altGrids && altGrids.length > 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {altGrids.map((g, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {i > 0 && (
                <span style={{
                  color: "rgba(245, 158, 11, 0.6)",
                  fontSize: 20,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}>
                  or
                </span>
              )}
              <PatternGrid grid={g} size={200} />
            </div>
          ))}
        </div>
      ) : (
        <PatternGrid grid={pattern.grid} size={260} />
      )}
    </div>
  );
}
