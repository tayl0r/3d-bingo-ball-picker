# Sound Effects Design

## Summary

Add procedural synthesized sound effects to the 3D bingo ball picker using **zzfx** (~1KB library). Covers the core game loop (5 sounds) and UI feedback (5 sounds), with a volume slider + mute toggle persisted to localStorage.

## Library Choice: zzfx

- ~1KB, zero dependencies, purpose-built for game SFX
- Sounds defined as parameter arrays — no external audio files
- Retro-synth aesthetic fits the bingo game vibe

## Architecture

### Files

- **`src/audio/sounds.ts`** — zzfx parameter arrays organized by category (GAME_SOUNDS, UI_SOUNDS)
- **`src/audio/soundManager.ts`** — Central module: AudioContext init, volume/mute state (localStorage), named play functions
- **`src/hooks/useSoundSettings.ts`** — React hook exposing volume/mute state + setters for UI binding
- **`src/components/bingo/VolumeControl.tsx`** — Mute icon button + horizontal volume slider

### AudioContext Initialization

Browser policy requires AudioContext creation on user gesture. The sound manager lazily initializes on the first `play*()` call, which will always be triggered by a click.

## Sound Events

### Core Game Loop

| Sound | Trigger | File | Character |
|-------|---------|------|-----------|
| Ball draw click | `GetABallButton` onClick | BingoPage.tsx | Short punchy "boop" ~200ms |
| Machine mixing | Phase → `mixing` | BingoScene.tsx | Sustained whirring loop, intensity scales with spin strength, duration matches spin time |
| Settling fade | Phase → `settling` | BingoScene.tsx | Mixing sound fades out as balls slow |
| Ball launch whoosh | Phase → `animating` | BingoScene.tsx | Rising whoosh ~300ms |
| Ball landing | Animation complete | BingoBallAnimated.tsx | Satisfying thud/click ~150ms |

### UI Feedback

| Sound | Trigger | File | Character |
|-------|---------|------|-----------|
| Button click | New Game / History buttons | BingoPage.tsx | Soft click ~50ms |
| Modal open | Modal mount | PatternPickerModal / GameHistoryModal | Ascending chime ~200ms |
| Modal close | Modal dismiss | PatternPickerModal / GameHistoryModal | Descending tone ~200ms |
| Toggle switch | SpinStyleSelector change | SpinStyleSelector.tsx | Subtle tick ~50ms |
| Pattern select | Pattern card selection | PatternPickerModal.tsx | Bright confirmation ping ~150ms |

## Volume Control UI

- Mute/unmute icon button (speaker icon)
- Horizontal volume slider (0-100%)
- Placed near existing controls (top area or near SpinStyleSelector)
- Defaults: unmuted, 70% volume
- Persisted to localStorage under `soundSettings` key
- When muted, play functions are no-ops (not just volume=0)
- Mixing loop gain adjusts in real-time when volume changes mid-play

## Integration Points

The sound manager is a plain TypeScript module (not React) — components call `playBallDraw()` etc. directly. The `useSoundSettings` hook is only for the VolumeControl component to read/write settings.

Phase transitions in `BingoScene.tsx` (mixing/settling/animating) are the primary trigger points for game loop sounds. UI sounds are triggered in onClick/onChange handlers.
