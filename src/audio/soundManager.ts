import { zzfx } from "zzfx";
import { GAME_SOUNDS, UI_SOUNDS, type SoundParams } from "./sounds";

const STORAGE_KEY = "bingo_sound_settings";

interface SoundSettings {
  volume: number;
  muted: boolean;
}

function loadSettings(): SoundSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { volume: 0.7, muted: false };
}

function saveSettings(settings: SoundSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function createSoundManager() {
  let settings = loadSettings();

  function play(params: SoundParams): void {
    if (settings.muted) return;
    const p = [...params];
    const baseVolume = p[0] ?? 1;
    p[0] = baseVolume * settings.volume;
    zzfx(...p);
  }

  return {
    playBallDraw: () => play(GAME_SOUNDS.ballDraw),
    playBallLaunch: () => play(GAME_SOUNDS.ballLaunch),
    playBallLand: (ballNumber?: number) => {
      const p = [...GAME_SOUNDS.ballLand];
      if (ballNumber != null) {
        // Interpolate frequency: ball 1 = 40Hz, ball 75 = 2000Hz
        const t = (ballNumber - 1) / 74;
        p[2] = 40 + t * 1960;
      }
      play(p);
    },
    playSpinTick: () => play(GAME_SOUNDS.spinTick),
    playButtonClick: () => play(UI_SOUNDS.buttonClick),
    playToggleSwitch: () => play(UI_SOUNDS.toggleSwitch),
    playPatternSelect: () => play(UI_SOUNDS.patternSelect),
    isMuted: () => settings.muted,
    setMuted: (muted: boolean) => { settings.muted = muted; saveSettings(settings); },
    getVolume: () => settings.volume,
    setVolume: (volume: number) => { settings.volume = Math.max(0, Math.min(1, volume)); saveSettings(settings); },
    reset: () => { settings = loadSettings(); },
  };
}

export const soundManager = createSoundManager();
