import { useState } from "react";
import { getAllGames, deleteGame, type SavedGame } from "../../utils/gameStorage";
import { getBallColor } from "../../utils/ballTexture";
import patterns from "../../data/bingoPatterns.json";
import type { BingoPattern } from "../../data/bingoPatterns.types";
import { PatternGrid } from "./PatternGrid";

function getBallLetter(num: number): string {
  if (num <= 15) return "B";
  if (num <= 30) return "I";
  if (num <= 45) return "N";
  if (num <= 60) return "G";
  return "O";
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const hours = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");
  return `${month}/${day} ${hours}:${mins}`;
}

interface GameHistoryModalProps {
  onClose: () => void;
  onLoadGame: (game: SavedGame) => void;
  currentGameId: string;
}

export function GameHistoryModal({ onClose, onLoadGame, currentGameId }: GameHistoryModalProps) {
  const [games, setGames] = useState(getAllGames);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deleteGame(id);
    setGames(getAllGames());
    setConfirmDeleteId(null);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(900px, 80%)",
          maxHeight: "80%",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-light)",
          borderRadius: 20,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 0 60px rgba(0,0,0,0.5), 0 0 20px var(--amber-glow)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "28px 32px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 32,
              color: "var(--amber)",
              letterSpacing: 1,
              margin: 0,
            }}
          >
            GAME HISTORY
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              fontSize: 28,
              cursor: "pointer",
              padding: "8px 14px",
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {/* Games list */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {games.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 60, fontSize: 20 }}>
              No saved games yet.
            </div>
          )}
          {games.map((game) => {
            const isCurrent = game.id === currentGameId;
            const isConfirming = confirmDeleteId === game.id;
            return (
              <div
                key={game.id}
                style={{
                  background: isCurrent ? "rgba(245, 158, 11, 0.08)" : "var(--bg-elevated)",
                  border: isCurrent
                    ? "1px solid rgba(245, 158, 11, 0.3)"
                    : "1px solid var(--border)",
                  borderRadius: 14,
                  padding: "20px 24px",
                  transition: "border-color 0.2s",
                }}
              >
                {/* Top row: date + actions */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, color: "var(--text-muted)" }}>
                      {formatDate(game.createdAt)}
                    </span>
                    {isCurrent && (
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          textTransform: "uppercase",
                          letterSpacing: 1.5,
                          color: "var(--amber)",
                          background: "rgba(245, 158, 11, 0.15)",
                          padding: "4px 12px",
                          borderRadius: 4,
                        }}
                      >
                        Active
                      </span>
                    )}
                    {(() => {
                      const pattern = (patterns as BingoPattern[]).find(
                        (p) => p.id === (game.patternId ?? "any-line")
                      );
                      if (!pattern) return null;
                      return (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <PatternGrid grid={pattern.grid} size={28} />
                          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                            {pattern.name}
                          </span>
                        </div>
                      );
                    })()}
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, color: "var(--text-dim)" }}>
                      {game.drawnBalls.length}/75 drawn
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {!isCurrent && (
                      <button
                        onClick={() => { onLoadGame(game); onClose(); }}
                        style={{
                          padding: "8px 20px",
                          fontSize: 16,
                          fontFamily: "var(--font-mono)",
                          fontWeight: 500,
                          background: "rgba(245, 158, 11, 0.15)",
                          border: "1px solid rgba(245, 158, 11, 0.3)",
                          borderRadius: 10,
                          color: "var(--amber)",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        LOAD
                      </button>
                    )}
                    {isConfirming ? (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={() => handleDelete(game.id)}
                          style={{
                            padding: "8px 20px",
                            fontSize: 16,
                            fontFamily: "var(--font-mono)",
                            background: "rgba(239, 68, 68, 0.2)",
                            border: "1px solid rgba(239, 68, 68, 0.4)",
                            borderRadius: 10,
                            color: "var(--red)",
                            cursor: "pointer",
                          }}
                        >
                          YES
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          style={{
                            padding: "8px 20px",
                            fontSize: 16,
                            fontFamily: "var(--font-mono)",
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border-light)",
                            borderRadius: 10,
                            color: "var(--text-muted)",
                            cursor: "pointer",
                          }}
                        >
                          NO
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(game.id)}
                        style={{
                          padding: "8px 20px",
                          fontSize: 16,
                          fontFamily: "var(--font-mono)",
                          background: "none",
                          border: "1px solid var(--border)",
                          borderRadius: 10,
                          color: "var(--text-dim)",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        DEL
                      </button>
                    )}
                  </div>
                </div>

                {/* Ball preview strip */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {game.drawnBalls.length === 0 ? (
                    <span style={{ fontSize: 16, color: "var(--text-dim)", fontStyle: "italic" }}>
                      Empty game
                    </span>
                  ) : (
                    game.drawnBalls.map((num) => (
                      <div
                        key={num}
                        title={`${getBallLetter(num)}${num}`}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: getBallColor(num),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#000",
                          fontFamily: "var(--font-mono)",
                          border: "1.5px solid rgba(255,255,255,0.15)",
                        }}
                      >
                        {num}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
