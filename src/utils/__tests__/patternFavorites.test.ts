import { describe, it, expect, beforeEach } from "vitest";
import {
  getFavorites,
  toggleFavorite,
  isFavorite,
} from "../patternFavorites";

describe("patternFavorites", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty set initially", () => {
    expect(getFavorites()).toEqual(new Set());
  });

  it("toggleFavorite adds and removes", () => {
    toggleFavorite("letter-x");
    expect(isFavorite("letter-x")).toBe(true);

    toggleFavorite("letter-x");
    expect(isFavorite("letter-x")).toBe(false);
  });
});
