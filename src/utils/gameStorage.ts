const STORAGE_KEY = "bingo_games";
const ACTIVE_GAME_KEY = "bingo_active_game";

export interface SavedGame {
  id: string;
  drawnBalls: number[];
  patternId: string;
  seed: number;
  createdAt: number;
  updatedAt: number;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function getAllGames(): SavedGame[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const games: SavedGame[] = JSON.parse(raw);
    let migrated = false;
    for (const g of games) {
      if (g.seed == null) {
        g.seed = Math.random() * 2**32 >>> 0;
        migrated = true;
      }
    }
    if (migrated) saveAllGames(games);
    return games.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

function saveAllGames(games: SavedGame[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

export function createGame(patternId: string): SavedGame {
  const game: SavedGame = {
    id: generateId(),
    drawnBalls: [],
    patternId,
    seed: Math.random() * 2**32 >>> 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const games = getAllGames();
  games.unshift(game);
  saveAllGames(games);
  setActiveGameId(game.id);
  return game;
}

export function updateGame(id: string, drawnBalls: number[]): void {
  const games = getAllGames();
  const idx = games.findIndex((g) => g.id === id);
  if (idx !== -1) {
    games[idx].drawnBalls = drawnBalls;
    games[idx].updatedAt = Date.now();
    saveAllGames(games);
  }
}

export function updateGamePattern(id: string, patternId: string): void {
  const games = getAllGames();
  const idx = games.findIndex((g) => g.id === id);
  if (idx !== -1) {
    games[idx].patternId = patternId;
    games[idx].updatedAt = Date.now();
    saveAllGames(games);
  }
}

export function deleteGame(id: string): void {
  const games = getAllGames().filter((g) => g.id !== id);
  saveAllGames(games);
  if (getActiveGameId() === id) {
    clearActiveGameId();
  }
}

export function getGameById(id: string): SavedGame | undefined {
  return getAllGames().find((g) => g.id === id);
}

export function getActiveGameId(): string | null {
  return localStorage.getItem(ACTIVE_GAME_KEY);
}

export function setActiveGameId(id: string): void {
  localStorage.setItem(ACTIVE_GAME_KEY, id);
}

export function clearActiveGameId(): void {
  localStorage.removeItem(ACTIVE_GAME_KEY);
}

export function purgeEmptyGames(): void {
  const activeId = getActiveGameId();
  const games = getAllGames().filter((g) => g.drawnBalls.length > 0 || g.id === activeId);
  saveAllGames(games);
}

export function getOrCreateActiveGame(): SavedGame {
  const activeId = getActiveGameId();
  if (activeId) {
    const game = getGameById(activeId);
    if (game) return game;
  }
  return createGame("any-line");
}
