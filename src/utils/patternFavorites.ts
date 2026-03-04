const FAVORITES_KEY = "bingo_pattern_favorites";
const ACTIVE_TAG_KEY = "bingo_pattern_active_tag";

export function getFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveFavorites(favs: Set<string>): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favs]));
}

export function toggleFavorite(patternId: string): void {
  const favs = getFavorites();
  if (favs.has(patternId)) {
    favs.delete(patternId);
  } else {
    favs.add(patternId);
  }
  saveFavorites(favs);
}

export function isFavorite(patternId: string): boolean {
  return getFavorites().has(patternId);
}

export function getActiveTag(validTags: string[]): string | null {
  try {
    const stored = localStorage.getItem(ACTIVE_TAG_KEY);
    if (!stored) return null;
    if (stored === "favorites") return stored;
    return validTags.includes(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function setActiveTag(tag: string | null): void {
  try {
    if (tag === null) {
      localStorage.removeItem(ACTIVE_TAG_KEY);
    } else {
      localStorage.setItem(ACTIVE_TAG_KEY, tag);
    }
  } catch {
    // ignore storage errors
  }
}
