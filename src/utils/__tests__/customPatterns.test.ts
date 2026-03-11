import { describe, it, expect, beforeEach } from "vitest";
import {
  getCustomPatterns,
  saveCustomPattern,
  deleteCustomPattern,
  generateCustomPatternId,
} from "../customPatterns";
import type { BingoPattern } from "../../data/bingoPatterns.types";

function makePattern(overrides: Partial<BingoPattern> = {}): BingoPattern {
  return {
    id: generateCustomPatternId(),
    name: "Test Pattern",
    description: "",
    grid: Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => 0)),
    tags: ["custom"],
    ...overrides,
  };
}

describe("customPatterns", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty array initially", () => {
    expect(getCustomPatterns()).toEqual([]);
  });

  it("saves and retrieves a pattern", () => {
    const pattern = makePattern({ name: "My Pattern" });
    saveCustomPattern(pattern);
    const result = getCustomPatterns();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("My Pattern");
    expect(result[0].id).toBe(pattern.id);
  });

  it("saves multiple patterns", () => {
    saveCustomPattern(makePattern({ name: "First" }));
    saveCustomPattern(makePattern({ name: "Second" }));
    expect(getCustomPatterns()).toHaveLength(2);
  });

  it("deletes a pattern by id", () => {
    const p1 = makePattern({ name: "Keep" });
    const p2 = makePattern({ name: "Delete" });
    saveCustomPattern(p1);
    saveCustomPattern(p2);
    deleteCustomPattern(p2.id);
    const result = getCustomPatterns();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(p1.id);
  });

  it("delete is a no-op for unknown id", () => {
    saveCustomPattern(makePattern());
    deleteCustomPattern("nonexistent");
    expect(getCustomPatterns()).toHaveLength(1);
  });

  it("generateCustomPatternId produces unique prefixed ids", () => {
    const id1 = generateCustomPatternId();
    const id2 = generateCustomPatternId();
    expect(id1).toMatch(/^custom-/);
    expect(id2).toMatch(/^custom-/);
    expect(id1).not.toBe(id2);
  });

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem("bingo_custom_patterns", "not-json");
    expect(getCustomPatterns()).toEqual([]);
  });
});
