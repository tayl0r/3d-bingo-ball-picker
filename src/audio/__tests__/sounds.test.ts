import { describe, it, expect } from "vitest";
import { GAME_SOUNDS, UI_SOUNDS, type SoundParams } from "../sounds";

describe("sounds", () => {
  describe("GAME_SOUNDS", () => {
    const expectedKeys = ["ballDraw", "mixing", "ballLaunch", "ballLand"];

    it("exports all required game sound keys", () => {
      for (const key of expectedKeys) {
        expect(GAME_SOUNDS).toHaveProperty(key);
      }
    });

    it.each(expectedKeys)("%s is an array of numbers or undefined", (key) => {
      const params = GAME_SOUNDS[key as keyof typeof GAME_SOUNDS] as SoundParams;
      expect(Array.isArray(params)).toBe(true);
      expect(params.length).toBeGreaterThan(0);
      for (const val of params) {
        expect(val === undefined || typeof val === "number").toBe(true);
      }
    });
  });

  describe("UI_SOUNDS", () => {
    const expectedKeys = [
      "buttonClick",
      "modalOpen",
      "modalClose",
      "toggleSwitch",
      "patternSelect",
    ];

    it("exports all required UI sound keys", () => {
      for (const key of expectedKeys) {
        expect(UI_SOUNDS).toHaveProperty(key);
      }
    });

    it.each(expectedKeys)("%s is an array of numbers or undefined", (key) => {
      const params = UI_SOUNDS[key as keyof typeof UI_SOUNDS] as SoundParams;
      expect(Array.isArray(params)).toBe(true);
      expect(params.length).toBeGreaterThan(0);
      for (const val of params) {
        expect(val === undefined || typeof val === "number").toBe(true);
      }
    });
  });
});
