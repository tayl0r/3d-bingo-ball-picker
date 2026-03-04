import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("zzfx", () => ({
  zzfx: vi.fn(),
}));

import { zzfx } from "zzfx";

describe("soundManager", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Re-import to get fresh module with reset state
    vi.resetModules();
  });

  async function getSoundManager() {
    const mod = await import("../soundManager");
    mod.soundManager.reset();
    return mod.soundManager;
  }

  it("has default volume of 0.7", async () => {
    const sm = await getSoundManager();
    expect(sm.getVolume()).toBe(0.7);
  });

  it("is unmuted by default", async () => {
    const sm = await getSoundManager();
    expect(sm.isMuted()).toBe(false);
  });

  it("plays sound when unmuted", async () => {
    const sm = await getSoundManager();
    sm.playButtonClick();
    expect(zzfx).toHaveBeenCalled();
  });

  it("does not play sound when muted", async () => {
    const sm = await getSoundManager();
    sm.setMuted(true);
    sm.playButtonClick();
    expect(zzfx).not.toHaveBeenCalled();
  });

  it("setMuted toggles mute state", async () => {
    const sm = await getSoundManager();
    sm.setMuted(true);
    expect(sm.isMuted()).toBe(true);
    sm.setMuted(false);
    expect(sm.isMuted()).toBe(false);
  });

  it("setVolume updates volume", async () => {
    const sm = await getSoundManager();
    sm.setVolume(0.5);
    expect(sm.getVolume()).toBe(0.5);
  });

  it("setVolume clamps to [0, 1]", async () => {
    const sm = await getSoundManager();
    sm.setVolume(1.5);
    expect(sm.getVolume()).toBe(1);
    sm.setVolume(-0.5);
    expect(sm.getVolume()).toBe(0);
  });

  it("scales zzfx volume parameter by settings volume", async () => {
    const sm = await getSoundManager();
    sm.setVolume(0.5);
    sm.playButtonClick();
    const callArgs = (zzfx as ReturnType<typeof vi.fn>).mock.calls[0];
    // First param should be baseVolume * settings.volume
    // buttonClick has undefined as first param, so baseVolume = 1
    expect(callArgs[0]).toBeCloseTo(0.5);
  });

  it("persists settings to localStorage", async () => {
    const sm = await getSoundManager();
    sm.setMuted(true);
    sm.setVolume(0.3);
    const stored = JSON.parse(localStorage.getItem("bingo_sound_settings")!);
    expect(stored.muted).toBe(true);
    expect(stored.volume).toBe(0.3);
  });

  it("loads settings from localStorage", async () => {
    localStorage.setItem(
      "bingo_sound_settings",
      JSON.stringify({ volume: 0.4, muted: true })
    );
    const sm = await getSoundManager();
    expect(sm.getVolume()).toBe(0.4);
    expect(sm.isMuted()).toBe(true);
  });

  it("exposes all game sound play methods", async () => {
    const sm = await getSoundManager();
    expect(typeof sm.playBallDraw).toBe("function");
    expect(typeof sm.playBallLaunch).toBe("function");
    expect(typeof sm.playBallLand).toBe("function");
    expect(typeof sm.playSpinTick).toBe("function");
  });

  it("exposes all UI sound play methods", async () => {
    const sm = await getSoundManager();
    expect(typeof sm.playButtonClick).toBe("function");
    expect(typeof sm.playToggleSwitch).toBe("function");
    expect(typeof sm.playPatternSelect).toBe("function");
  });
});
