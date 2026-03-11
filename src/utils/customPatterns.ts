import type { BingoPattern } from "../data/bingoPatterns.types";

const STORAGE_KEY = "bingo_custom_patterns";

export function getCustomPatterns(): BingoPattern[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveAll(patterns: BingoPattern[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
}

export function saveCustomPattern(pattern: BingoPattern): void {
  const patterns = getCustomPatterns();
  patterns.push(pattern);
  saveAll(patterns);
}

export function deleteCustomPattern(id: string): void {
  const patterns = getCustomPatterns().filter((p) => p.id !== id);
  saveAll(patterns);
}

export function generateCustomPatternId(): string {
  return "custom-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
