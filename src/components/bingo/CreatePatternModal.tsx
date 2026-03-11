import { useState, useEffect, useCallback, type CSSProperties } from "react";
import { PatternGrid } from "./PatternGrid";
import { saveCustomPattern, generateCustomPatternId } from "../../utils/customPatterns";
import { soundManager } from "../../audio/soundManager";

interface CreatePatternModalProps {
  onSave: () => void;
  onClose: () => void;
}

const EMPTY_GRID = (): number[][] =>
  Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => 0));

export function CreatePatternModal({ onSave, onClose }: CreatePatternModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [grid, setGrid] = useState<number[][]>(EMPTY_GRID);

  const hasActiveCells = grid.flat().some((v) => v === 1);
  const canSave = name.trim().length > 0 && hasActiveCells;

  const closeWithSound = useCallback(() => {
    soundManager.playDialogClose();
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeWithSound();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeWithSound]);

  const handleToggle = (row: number, col: number) => {
    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = next[row][col] === 1 ? 0 : 1;
      return next;
    });
  };

  const handleSave = () => {
    if (!canSave) return;
    saveCustomPattern({
      id: generateCustomPatternId(),
      name: name.trim(),
      description: description.trim(),
      grid,
      tags: ["custom"],
    });
    soundManager.playPatternSelect();
    onSave();
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "16px 20px",
    borderRadius: 12,
    fontSize: 36,
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "white",
    outline: "none",
  };

  const buttonBase: CSSProperties = {
    padding: "16px 48px",
    fontSize: 36,
    fontWeight: 600,
    borderRadius: 12,
    cursor: "pointer",
    border: "none",
    letterSpacing: 2,
    textTransform: "uppercase",
  };

  return (
    <div
      onClick={closeWithSound}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(20, 20, 35, 0.98)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          borderRadius: 16,
          padding: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
          minWidth: 420,
          boxShadow: "0 0 60px rgba(0,0,0,0.5), 0 0 20px rgba(245,158,11,0.1)",
        }}
      >
        <h2
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: "rgba(245, 158, 11, 0.9)",
            letterSpacing: 4,
            margin: 0,
            textTransform: "uppercase",
          }}
        >
          Create Pattern
        </h2>

        <input
          type="text"
          placeholder="Pattern name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.5)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"; }}
        />

        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.5)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"; }}
        />

        <div style={{ padding: "8px 0" }}>
          <PatternGrid grid={grid} size={300} onToggle={handleToggle} />
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          <button
            onClick={closeWithSound}
            style={{
              ...buttonBase,
              background: "rgba(255, 255, 255, 0.06)",
              color: "rgba(255, 255, 255, 0.6)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              ...buttonBase,
              background: canSave ? "rgba(245, 158, 11, 0.2)" : "rgba(255, 255, 255, 0.04)",
              color: canSave ? "rgba(245, 158, 11, 0.9)" : "rgba(255, 255, 255, 0.2)",
              border: canSave ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid transparent",
              cursor: canSave ? "pointer" : "not-allowed",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
