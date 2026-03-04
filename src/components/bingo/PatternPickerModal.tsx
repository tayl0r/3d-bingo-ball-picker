import { useState, type CSSProperties } from "react";
import bingoPatterns from "../../data/bingoPatterns.json";
import type { BingoPattern } from "../../data/bingoPatterns.types";
import { PatternGrid } from "./PatternGrid";
import { getFavorites, toggleFavorite } from "../../utils/patternFavorites";

interface PatternPickerModalProps {
  onSelect: (patternId: string) => void;
  onClose: () => void;
}

const patterns = bingoPatterns as BingoPattern[];

export function PatternPickerModal({ onSelect, onClose }: PatternPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() => getFavorites());
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Derive unique tags from all patterns
  const uniqueTags = Array.from(
    new Set(patterns.flatMap((p) => p.tags))
  );

  // Filter patterns
  const filtered = patterns.filter((p) => {
    // Search filter (matches name or description)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) {
        return false;
      }
    }
    // Tag filter
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
      onClick={onClose}
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
          <button
            onClick={onClose}
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

        {/* Search + Filters + Grid */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 32px 32px",
          }}
        >
          {/* Search input */}
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

          {/* Tag filter chips */}
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

          {/* Pattern cards grid */}
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
                    {/* Heart toggle */}
                    <button
                      onClick={(e) => handleToggleFavorite(e, pattern.id)}
                      style={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        fontSize: 48,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: isFav
                          ? "rgba(245, 158, 11, 0.9)"
                          : "rgba(255, 255, 255, 0.3)",
                        padding: 2,
                        lineHeight: 1,
                      }}
                    >
                      {isFav ? "\u2665" : "\u2661"}
                    </button>

                    {/* Pattern grid preview */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <PatternGrid grid={pattern.grid} size={240} />
                    </div>

                    {/* Pattern name */}
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

                    {/* Pattern description */}
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
    </div>
  );
}
