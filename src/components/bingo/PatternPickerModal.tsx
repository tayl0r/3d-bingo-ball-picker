import { useState, useEffect, useMemo, useCallback, type CSSProperties } from "react";
import bingoPatterns from "../../data/bingoPatterns.json";
import type { BingoPattern } from "../../data/bingoPatterns.types";
import { PatternGrid } from "./PatternGrid";
import { getFavorites, toggleFavorite, getActiveTag, setActiveTag as saveActiveTag } from "../../utils/patternFavorites";
import { soundManager } from "../../audio/soundManager";
import { getCustomPatterns, deleteCustomPattern } from "../../utils/customPatterns";
import { CreatePatternModal } from "./CreatePatternModal";

interface PatternPickerModalProps {
  onSelect: (patternId: string) => void;
  onClose: () => void;
  currentPatternId?: string;
}

const builtInPatterns = bingoPatterns as BingoPattern[];

export function PatternPickerModal({ onSelect, onClose, currentPatternId }: PatternPickerModalProps) {
  const closeWithSound = () => {
    soundManager.playDialogClose();
    onClose();
  };

  const [customPatterns, setCustomPatterns] = useState<BingoPattern[]>(getCustomPatterns);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const patterns = useMemo(() => [...builtInPatterns, ...customPatterns], [customPatterns]);
  const patternsById = useMemo(() => new Map(patterns.map((p) => [p.id, p])), [patterns]);

  const getAlternativeGrids = useCallback((pattern: BingoPattern): number[][][] | null => {
    if (!pattern.alternatives || pattern.alternatives.length === 0) return null;
    const grids: number[][][] = [];
    for (const id of pattern.alternatives) {
      const alt = patternsById.get(id);
      if (alt) grids.push(alt.grid);
    }
    return grids.length > 0 ? grids : null;
  }, [patternsById]);

  const [searchQuery, setSearchQuery] = useState("");
  const uniqueTags = useMemo(() => Array.from(new Set(patterns.flatMap((p) => p.tags))), [patterns]);
  const [activeTag, setActiveTagState] = useState<string | null>(() => getActiveTag(uniqueTags));
  const setActiveTag = (tag: string | null) => {
    setActiveTagState(tag);
    saveActiveTag(tag);
  };
  const [favorites, setFavorites] = useState<Set<string>>(() => getFavorites());
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        soundManager.playDialogClose();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const filtered = patterns.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (activeTag === "favorites") {
      return favorites.has(p.id);
    }
    if (activeTag !== null) {
      return p.tags.includes(activeTag);
    }
    return true;
  });

  const handleToggleFavorite = (e: React.MouseEvent, patternId: string) => {
    e.stopPropagation();
    toggleFavorite(patternId);
    setFavorites(getFavorites());
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const chipStyle = (isActive: boolean): CSSProperties => ({
    background: isActive ? "rgba(245, 158, 11, 0.2)" : "rgba(255, 255, 255, 0.06)",
    color: isActive ? "rgba(245, 158, 11, 0.9)" : "rgba(255, 255, 255, 0.5)",
    border: isActive ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid transparent",
    padding: "16px 36px",
    borderRadius: 24,
    fontSize: 36,
    cursor: "pointer",
  });

  return (
    <div
      onClick={closeWithSound}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
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
          position: "absolute",
          inset: 20,
          background: "rgba(20, 20, 35, 0.98)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          borderRadius: 16,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 0 60px rgba(0,0,0,0.5), 0 0 20px rgba(245,158,11,0.1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 32px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              fontSize: 60,
              fontWeight: 700,
              color: "rgba(245, 158, 11, 0.9)",
              letterSpacing: 6,
              margin: 0,
              textTransform: "uppercase",
            }}
          >
            Choose a Pattern
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                background: "none",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                color: "rgba(245, 158, 11, 0.9)",
                fontSize: 36,
                fontWeight: 600,
                borderRadius: 12,
                padding: "12px 28px",
                cursor: "pointer",
                letterSpacing: 2,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              + Create Your Own
            </button>
            <button
              onClick={closeWithSound}
              style={{
                background: "none",
                border: "none",
                color: "rgba(245, 158, 11, 0.9)",
                fontSize: 72,
                cursor: "pointer",
                padding: "4px 10px",
                lineHeight: 1,
              }}
            >
              &times;
            </button>
          </div>
        </div>

        {/* Search + Filters + Grid */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 32px 32px",
          }}
        >
          <input
            type="text"
            placeholder="Search patterns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "24px 40px",
              borderRadius: 16,
              fontSize: 42,
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "white",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.5)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
            }}
          />

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              margin: "32px 0",
            }}
          >
            <button onClick={() => setActiveTag(null)} style={chipStyle(activeTag === null)}>
              All
            </button>
            {uniqueTags.map((tag) => (
              <button key={tag} onClick={() => setActiveTag(tag)} style={chipStyle(activeTag === tag)}>
                {capitalize(tag)}
              </button>
            ))}
            <button onClick={() => setActiveTag("favorites")} style={chipStyle(activeTag === "favorites")}>
              ♥ Favorites
            </button>
          </div>

          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: "rgba(255, 255, 255, 0.4)",
                padding: 60,
                fontSize: 42,
              }}
            >
              No patterns found
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
                gap: 32,
              }}
            >
              {filtered.map((pattern) => {
                const isHovered = hoveredCard === pattern.id;
                const isFav = favorites.has(pattern.id);
                const isCustom = pattern.tags.includes("custom");
                const isCurrentPattern = pattern.id === currentPatternId;

                return (
                  <div
                    key={pattern.id}
                    onClick={() => onSelect(pattern.id)}
                    onMouseEnter={() => setHoveredCard(pattern.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      position: "relative",
                      background: isHovered
                        ? "rgba(245, 158, 11, 0.08)"
                        : "rgba(255, 255, 255, 0.04)",
                      border: isHovered
                        ? "1px solid rgba(245, 158, 11, 0.3)"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: 24,
                      padding: 32,
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                  >
                    <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8 }}>
                      {isCustom && !isCurrentPattern && (
                        confirmDeleteId === pattern.id ? (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{ display: "flex", gap: 6 }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCustomPattern(pattern.id);
                                setCustomPatterns(getCustomPatterns());
                                setConfirmDeleteId(null);
                              }}
                              style={{
                                fontSize: 28,
                                background: "rgba(239, 68, 68, 0.2)",
                                border: "1px solid rgba(239, 68, 68, 0.4)",
                                borderRadius: 8,
                                color: "#ef4444",
                                cursor: "pointer",
                                padding: "4px 12px",
                                lineHeight: 1,
                              }}
                            >
                              Yes
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                              }}
                              style={{
                                fontSize: 28,
                                background: "rgba(255, 255, 255, 0.06)",
                                border: "1px solid rgba(255, 255, 255, 0.15)",
                                borderRadius: 8,
                                color: "rgba(255, 255, 255, 0.5)",
                                cursor: "pointer",
                                padding: "4px 12px",
                                lineHeight: 1,
                              }}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(pattern.id);
                            }}
                            title="Delete custom pattern"
                            style={{
                              fontSize: 28,
                              background: "none",
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                              borderRadius: 8,
                              cursor: "pointer",
                              color: "rgba(255, 255, 255, 0.3)",
                              padding: "4px 12px",
                              lineHeight: 1,
                            }}
                          >
                            &times;
                          </button>
                        )
                      )}
                      <button
                        onClick={(e) => handleToggleFavorite(e, pattern.id)}
                        style={{
                          width: 56,
                          height: 56,
                          fontSize: 56,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: isFav
                            ? "rgba(245, 158, 11, 0.9)"
                            : "rgba(255, 255, 255, 0.3)",
                          padding: 0,
                          lineHeight: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {"\u2665"}
                      </button>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      {(() => {
                        const altGrids = getAlternativeGrids(pattern);
                        if (!altGrids) return <PatternGrid grid={pattern.grid} size={240} />;
                        if (altGrids.length > 2) {
                          return (
                            <div style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(2, auto)",
                              gap: 8,
                              justifyItems: "center",
                              alignItems: "center",
                            }}>
                              {altGrids.map((g, i) => (
                                <PatternGrid key={i} grid={g} size={100} />
                              ))}
                            </div>
                          );
                        }
                        return altGrids.map((g, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {i > 0 && (
                              <span style={{
                                color: "rgba(245, 158, 11, 0.6)",
                                fontSize: 24,
                                fontWeight: 700,
                                textTransform: "uppercase",
                              }}>
                                or
                              </span>
                            )}
                            <PatternGrid grid={g} size={160} />
                          </div>
                        ));
                      })()}
                    </div>

                    <div
                      style={{
                        fontSize: 36,
                        fontWeight: 600,
                        color: "white",
                        marginTop: 20,
                      }}
                    >
                      {pattern.name}
                    </div>

                    <div
                      style={{
                        fontSize: 28,
                        color: "rgba(255, 255, 255, 0.4)",
                        marginTop: 8,
                      }}
                    >
                      {pattern.description}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreatePatternModal
          onSave={() => {
            setCustomPatterns(getCustomPatterns());
            setShowCreateModal(false);
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
