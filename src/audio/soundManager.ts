import { zzfx } from "zzfx";
import { GAME_SOUNDS, UI_SOUNDS, type SoundParams } from "./sounds";

const STORAGE_KEY = "bingo_sound_settings";
const BALL_FREQ_MIN_HZ = 40;
const BALL_FREQ_MAX_HZ = 2000;
const MAX_BALL_INDEX = 74; // 75 balls, 0-indexed

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
        // Interpolate frequency: ball 1 → MIN, ball 75 → MAX
        const t = (ballNumber - 1) / MAX_BALL_INDEX;
        p[2] = BALL_FREQ_MIN_HZ + t * (BALL_FREQ_MAX_HZ - BALL_FREQ_MIN_HZ);
      }
      play(p);
    },
    playSpinTick: () => play(GAME_SOUNDS.spinTick),
    playButtonClick: () => play(UI_SOUNDS.buttonClick),
    playToggleSwitch: (intensity?: number) => {
      const p = [...UI_SOUNDS.toggleSwitch];
      if (intensity != null) {
        // Low intensity = lower pitch, high intensity = higher pitch
        p[2] = 600 + intensity * 800;
      }
      play(p);
    },
    playPatternSelect: () => play(UI_SOUNDS.patternSelect),
    isMuted: () => settings.muted,
    setMuted: (muted: boolean) => { settings.muted = muted; saveSettings(settings); },
    getVolume: () => settings.volume,
    setVolume: (volume: number) => { settings.volume = Math.max(0, Math.min(1, volume)); saveSettings(settings); },
    reset: () => { settings = loadSettings(); },
  };
}

export const soundManager = createSoundManager();
