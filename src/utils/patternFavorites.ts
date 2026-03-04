const STORAGE_KEY = "bingo_pattern_favorites";

export function getFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveFavorites(favs: Set<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...favs]));
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
