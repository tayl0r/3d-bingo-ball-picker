import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("zzfx", () => ({
  zzfx: vi.fn(),
}));

import { useSoundSettings } from "../useSoundSettings";
import { soundManager } from "../../audio/soundManager";

describe("useSoundSettings", () => {
  beforeEach(() => {
    localStorage.clear();
    soundManager.reset();
    vi.clearAllMocks();
  });

  it("returns default volume and unmuted state", () => {
    const { result } = renderHook(() => useSoundSettings());
    expect(result.current.volume).toBe(0.7);
    expect(result.current.muted).toBe(false);
  });

  it("setVolume updates the volume", () => {
    const { result } = renderHook(() => useSoundSettings());
    act(() => {
      result.current.setVolume(0.3);
    });
    expect(result.current.volume).toBe(0.3);
    expect(soundManager.getVolume()).toBe(0.3);
  });

  it("setVolume clamps values via soundManager", () => {
    const { result } = renderHook(() => useSoundSettings());
    act(() => {
      result.current.setVolume(2);
    });
    expect(result.current.volume).toBe(1);
    act(() => {
      result.current.setVolume(-1);
    });
    expect(result.current.volume).toBe(0);
  });

  it("setMuted updates the muted state", () => {
    const { result } = renderHook(() => useSoundSettings());
    act(() => {
      result.current.setMuted(true);
    });
    expect(result.current.muted).toBe(true);
    expect(soundManager.isMuted()).toBe(true);

    act(() => {
      result.current.setMuted(false);
    });
    expect(result.current.muted).toBe(false);
    expect(soundManager.isMuted()).toBe(false);
  });
});
