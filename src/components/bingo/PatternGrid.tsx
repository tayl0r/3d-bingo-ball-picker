import type { CSSProperties } from "react";

interface PatternGridProps {
  grid: number[][];
  size: number; // total size in px
  onToggle?: (row: number, col: number) => void;
}

export function PatternGrid({ grid, size, onToggle }: PatternGridProps) {
  const cellSize = size / 5;

  const containerStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(5, ${cellSize}px)`,
    gridTemplateRows: `repeat(5, ${cellSize}px)`,
    gap: 1,
    borderRadius: 4,
    overflow: "hidden",
  };

  return (
    <div style={containerStyle}>
      {grid.flatMap((row, r) =>
        row.map((cell, c) => (
          <div
            key={`${r}-${c}`}
            data-cell
            data-active={cell === 1 ? "true" : "false"}
            onClick={onToggle ? () => onToggle(r, c) : undefined}
            style={{
              width: cellSize,
              height: cellSize,
              backgroundColor: cell === 1
                ? "rgba(245, 158, 11, 0.85)"
                : "rgba(255, 255, 255, 0.08)",
              cursor: onToggle ? "pointer" : undefined,
            }}
          />
        ))
      )}
    </div>
  );
}
