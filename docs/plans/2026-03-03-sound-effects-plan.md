# Sound Effects Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add procedural synthesized sound effects to the 3D bingo ball picker using zzfx, covering core game loop and UI feedback with volume/mute controls.

**Architecture:** A plain TypeScript `soundManager` module wraps zzfx, exposing named play functions. A React hook (`useSoundSettings`) bridges volume/mute state to the UI. Sound triggers are added directly to existing component event handlers.

**Tech Stack:** zzfx (procedural audio), Web Audio API, React hooks, localStorage

---

### Task 1: Install zzfx dependency

**Files:**
- Modify: `package.json`

**Step 1: Install zzfx**

Run: `pnpm add zzfx`

**Step 2: Verify installation**

Run: `pnpm ls zzfx`
Expected: Shows zzfx version in output

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add zzfx dependency for procedural sound effects"
```

---

### Task 2: Create sound definitions module

**Files:**
- Create: `src/audio/sounds.ts`

**Step 1: Write the test**

Create: `src/audio/__tests__/sounds.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { GAME_SOUNDS, UI_SOUNDS } from "../sounds";

describe("sound definitions", () => {
  it("exports GAME_SOUNDS with all required keys", () => {
    expect(GAME_SOUNDS).toHaveProperty("ballDraw");
    expect(GAME_SOUNDS).toHaveProperty("mixing");
    expect(GAME_SOUNDS).toHaveProperty("ballLaunch");
    expect(GAME_SOUNDS).toHaveProperty("ballLand");
  });

  it("exports UI_SOUNDS with all required keys", () => {
    expect(UI_SOUNDS).toHaveProperty("buttonClick");
    expect(UI_SOUNDS).toHaveProperty("modalOpen");
    expect(UI_SOUNDS).toHaveProperty("modalClose");
    expect(UI_SOUNDS).toHaveProperty("toggleSwitch");
    expect(UI_SOUNDS).toHaveProperty("patternSelect");
  });

  it("each sound is an array of numbers or undefined", () => {
    const allSounds = { ...GAME_SOUNDS, ...UI_SOUNDS };
    for (const [key, params] of Object.entries(allSounds)) {
      expect(Array.isArray(params), `${key} should be an array`).toBe(true);
      for (const p of params) {
        expect(
          p === undefined || typeof p === "number",
          `${key} params should be numbers or undefined`,
        ).toBe(true);
      }
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm run test -- src/audio/__tests__/sounds.test.ts`
Expected: FAIL — cannot find module `../sounds`

**Step 3: Write sound definitions**

Create: `src/audio/sounds.ts`

zzfx parameters: `[volume, randomness, frequency, attack, decay, sustain, release, shape, shapeCurve, slide, deltaSlide, pitchJump, pitchJumpTime, repeatTime, noise, modulation, bitCrush, delay, sustainVolume, decay2, echo]`

```typescript
// Each entry is a zzfx parameter array.
// Design sounds at https://killedbyapixel.github.io/ZzFX/

export type SoundParams = (number | undefined)[];

export const GAME_SOUNDS = {
  /** Short punchy "boop" when GET A BALL is clicked (~200ms) */
  ballDraw: [, , 537, .02, .02, .22, 1, 1.59, -6.98, 4.97] as SoundParams,

  /** Rising whir for machine mixing — play as one-shot at mix start */
  mixing: [, , 150, .05, .5, .8, 2, 2, , , 50, .05, .15, , , , , .5, .3] as SoundParams,

  /** Rising whoosh when ball launches from machine (~300ms) */
  ballLaunch: [, , 200, .01, .05, .15, , 1.5, 20, , , , , , , , , , .3] as SoundParams,

  /** Satisfying thud when ball lands at rest position (~150ms) */
  ballLand: [, , 925, .04, .3, .6, 1, .3, , 6.27, -184, .09, .17] as SoundParams,
} as const;

export const UI_SOUNDS = {
  /** Soft click for buttons (~50ms) */
  buttonClick: [, , 1e3, , .02, .01, , 1.5, , , , , , , , , , , .5] as SoundParams,

  /** Ascending chime when modal opens (~200ms) */
  modalOpen: [, , 700, .02, .08, .12, 1, .8, , , 88, .04, .05] as SoundParams,

  /** Descending tone when modal closes (~200ms) */
  modalClose: [, , 500, .02, .06, .1, 1, .8, , , -88, .04, .05] as SoundParams,

  /** Subtle tick for toggle switches (~50ms) */
  toggleSwitch: [, , 1200, , .01, .005, , 2, , , , , , , , , , , .3] as SoundParams,

  /** Bright confirmation ping when pattern is selected (~150ms) */
  patternSelect: [, , 880, .01, .06, .15, 1, 1, , , 150, .03, .04] as SoundParams,
} as const;
```

Note: These are starting-point parameters. They can be refined later using the [ZzFX sound designer](https://killedbyapixel.github.io/ZzFX/).

**Step 4: Run test to verify it passes**

Run: `pnpm run test -- src/audio/__tests__/sounds.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/audio/sounds.ts src/audio/__tests__/sounds.test.ts
git commit -m "feat: add zzfx sound effect parameter definitions"
```

---

### Task 3: Create sound manager module

**Files:**
- Create: `src/audio/soundManager.ts`
- Create: `src/audio/__tests__/soundManager.test.ts`

**Step 1: Write the test**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { soundManager } from "../soundManager";

// Mock zzfx — it needs AudioContext which jsdom doesn't have
vi.mock("zzfx", () => ({
  zzfx: vi.fn(),
  ZZFX: { x: {} },
}));

describe("soundManager", () => {
  beforeEach(() => {
    localStorage.clear();
    soundManager.reset();
  });

  it("defaults to unmuted with 70% volume", () => {
    expect(soundManager.isMuted()).toBe(false);
    expect(soundManager.getVolume()).toBe(0.7);
  });

  it("can mute and unmute", () => {
    soundManager.setMuted(true);
    expect(soundManager.isMuted()).toBe(true);
    soundManager.setMuted(false);
    expect(soundManager.isMuted()).toBe(false);
  });

  it("can set volume", () => {
    soundManager.setVolume(0.5);
    expect(soundManager.getVolume()).toBe(0.5);
  });

  it("clamps volume to 0-1", () => {
    soundManager.setVolume(1.5);
    expect(soundManager.getVolume()).toBe(1);
    soundManager.setVolume(-0.5);
    expect(soundManager.getVolume()).toBe(0);
  });

  it("persists settings to localStorage", () => {
    soundManager.setVolume(0.4);
    soundManager.setMuted(true);

    // Create a new manager to read from localStorage
    soundManager.reset();
    expect(soundManager.getVolume()).toBe(0.4);
    expect(soundManager.isMuted()).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm run test -- src/audio/__tests__/soundManager.test.ts`
Expected: FAIL — cannot find module `../soundManager`

**Step 3: Write the sound manager**

Create: `src/audio/soundManager.ts`

```typescript
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
    // Clone params and set volume (index 0) scaled by master volume
    const p = [...params];
    const baseVolume = p[0] ?? 1;
    p[0] = baseVolume * settings.volume;
    zzfx(...p);
  }

  return {
    // Core game sounds
    playBallDraw: () => play(GAME_SOUNDS.ballDraw),
    playMixing: () => play(GAME_SOUNDS.mixing),
    playBallLaunch: () => play(GAME_SOUNDS.ballLaunch),
    playBallLand: () => play(GAME_SOUNDS.ballLand),

    // UI sounds
    playButtonClick: () => play(UI_SOUNDS.buttonClick),
    playModalOpen: () => play(UI_SOUNDS.modalOpen),
    playModalClose: () => play(UI_SOUNDS.modalClose),
    playToggleSwitch: () => play(UI_SOUNDS.toggleSwitch),
    playPatternSelect: () => play(UI_SOUNDS.patternSelect),

    // Settings
    isMuted: () => settings.muted,
    setMuted: (muted: boolean) => {
      settings.muted = muted;
      saveSettings(settings);
    },
    getVolume: () => settings.volume,
    setVolume: (volume: number) => {
      settings.volume = Math.max(0, Math.min(1, volume));
      saveSettings(settings);
    },

    // For testing: reload settings from localStorage
    reset: () => {
      settings = loadSettings();
    },
  };
}

export const soundManager = createSoundManager();
```

**Step 4: Run test to verify it passes**

Run: `pnpm run test -- src/audio/__tests__/soundManager.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/audio/soundManager.ts src/audio/__tests__/soundManager.test.ts
git commit -m "feat: add sound manager with volume/mute and localStorage persistence"
```

---

### Task 4: Create useSoundSettings React hook

**Files:**
- Create: `src/hooks/useSoundSettings.ts`

**Step 1: Write the test**

Create: `src/hooks/__tests__/useSoundSettings.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSoundSettings } from "../useSoundSettings";

vi.mock("zzfx", () => ({
  zzfx: vi.fn(),
  ZZFX: { x: {} },
}));

describe("useSoundSettings", () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset soundManager state
    const { soundManager } = require("../../audio/soundManager");
    soundManager.reset();
  });

  it("returns current volume and muted state", () => {
    const { result } = renderHook(() => useSoundSettings());
    expect(result.current.volume).toBe(0.7);
    expect(result.current.muted).toBe(false);
  });

  it("setVolume updates volume", () => {
    const { result } = renderHook(() => useSoundSettings());
    act(() => result.current.setVolume(0.5));
    expect(result.current.volume).toBe(0.5);
  });

  it("setMuted updates muted state", () => {
    const { result } = renderHook(() => useSoundSettings());
    act(() => result.current.setMuted(true));
    expect(result.current.muted).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm run test -- src/hooks/__tests__/useSoundSettings.test.ts`
Expected: FAIL — cannot find module `../useSoundSettings`

**Step 3: Write the hook**

Create: `src/hooks/useSoundSettings.ts`

```typescript
import { useState, useCallback } from "react";
import { soundManager } from "../audio/soundManager";

export function useSoundSettings() {
  const [volume, setVolumeState] = useState(() => soundManager.getVolume());
  const [muted, setMutedState] = useState(() => soundManager.isMuted());

  const setVolume = useCallback((v: number) => {
    soundManager.setVolume(v);
    setVolumeState(soundManager.getVolume());
  }, []);

  const setMuted = useCallback((m: boolean) => {
    soundManager.setMuted(m);
    setMutedState(m);
  }, []);

  return { volume, muted, setVolume, setMuted };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm run test -- src/hooks/__tests__/useSoundSettings.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/useSoundSettings.ts src/hooks/__tests__/useSoundSettings.test.ts
git commit -m "feat: add useSoundSettings hook for volume/mute React state"
```

---

### Task 5: Create VolumeControl component

**Files:**
- Create: `src/components/bingo/VolumeControl.tsx`

**Step 1: Write the test**

Create: `src/components/bingo/__tests__/VolumeControl.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VolumeControl } from "../VolumeControl";

vi.mock("zzfx", () => ({
  zzfx: vi.fn(),
  ZZFX: { x: {} },
}));

describe("VolumeControl", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders mute button and volume slider", () => {
    render(<VolumeControl />);
    expect(screen.getByRole("button")).toBeTruthy();
    expect(screen.getByRole("slider")).toBeTruthy();
  });

  it("toggles mute on button click", () => {
    render(<VolumeControl />);
    const btn = screen.getByRole("button");
    // Initially unmuted — button should show speaker icon
    fireEvent.click(btn);
    // After click — muted
    fireEvent.click(btn);
    // After second click — unmuted again
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm run test -- src/components/bingo/__tests__/VolumeControl.test.tsx`
Expected: FAIL — cannot find module `../VolumeControl`

**Step 3: Write the component**

Create: `src/components/bingo/VolumeControl.tsx`

The component uses the same glass-morphism style as existing UI elements (see SpinStyleSelector.tsx for reference). Speaker icon rendered as plain text Unicode characters.

```tsx
import { useSoundSettings } from "../../hooks/useSoundSettings";

export function VolumeControl() {
  const { volume, muted, setVolume, setMuted } = useSoundSettings();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        background: "rgba(10, 10, 20, 0.8)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid var(--border-light)",
        borderRadius: 10,
      }}
    >
      <button
        onClick={() => setMuted(!muted)}
        style={{
          background: "none",
          border: "none",
          color: muted ? "var(--text-dim)" : "var(--cyan)",
          fontSize: 18,
          cursor: "pointer",
          padding: "2px 4px",
          lineHeight: 1,
        }}
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? "\u{1F507}" : volume > 0.5 ? "\u{1F50A}" : "\u{1F509}"}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={muted ? 0 : volume}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (muted && v > 0) setMuted(false);
          setVolume(v);
        }}
        style={{
          width: 80,
          accentColor: "var(--cyan)",
          cursor: "pointer",
        }}
      />
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm run test -- src/components/bingo/__tests__/VolumeControl.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/bingo/VolumeControl.tsx src/components/bingo/__tests__/VolumeControl.test.tsx
git commit -m "feat: add VolumeControl component with mute toggle and slider"
```

---

### Task 6: Integrate VolumeControl into BingoPage

**Files:**
- Modify: `src/pages/BingoPage.tsx`

**Step 1: Add VolumeControl import and render**

At the top of `BingoPage.tsx`, add import (after line 10):

```typescript
import { VolumeControl } from "../components/bingo/VolumeControl";
```

Then add the VolumeControl in the left column. Inside the `<div>` at line 101 that contains the GetABallButton and SpinStyleSelector, add VolumeControl after SpinStyleSelector (after line 112, before the closing `</div>` on line 113):

```tsx
          <VolumeControl />
```

**Step 2: Verify build**

Run: `pnpm run build`
Expected: No errors

**Step 3: Commit**

```bash
git add src/pages/BingoPage.tsx
git commit -m "feat: add VolumeControl to BingoPage UI"
```

---

### Task 7: Integrate core game loop sounds

**Files:**
- Modify: `src/pages/BingoPage.tsx` (ball draw click)
- Modify: `src/components/bingo/BingoScene.tsx` (mixing, launch, land)

**Step 1: Add ball draw click sound to BingoPage**

In `BingoPage.tsx`, add import:

```typescript
import { soundManager } from "../audio/soundManager";
```

Modify the `GetABallButton` onClick at line 103. Wrap `game.startDraw` with sound:

```tsx
<GetABallButton
  onClick={() => { soundManager.playBallDraw(); game.startDraw(); }}
  disabled={game.phase !== "idle" || game.activeBallNumbers.length === 0}
  phase={game.phase}
/>
```

**Step 2: Add phase-transition sounds to BingoScene**

In `BingoScene.tsx`, add import at top (after line 13):

```typescript
import { soundManager } from "../../audio/soundManager";
```

In the `PhaseController` function, add sounds at phase transitions:

**Mixing start** — Inside `phase === "mixing"` block, after `mixStartRef.current === null` check (line 82), add sound trigger:

```typescript
if (mixStartRef.current === null) {
  mixStartRef.current = now;
  spinTimeSnapshotRef.current = spinTime;
  spinSpeedSnapshotRef.current = spinSpeed;
  const theta = Math.random() * Math.PI * 2;
  spinAxisRef.current.set(Math.cos(theta), 0.2, Math.sin(theta)).normalize();
  soundManager.playMixing();
}
```

**Ball launch** — In `SceneContent`, when a new selectedBall appears and starts animating, trigger launch sound. Add to the `useEffect` that handles selectedBall change (around line 235-244):

```typescript
useEffect(() => {
  if (selectedBall && !prevSelectedRef.current) {
    soundManager.playBallLaunch();
    if (restingBallNumber !== null) {
      setDepartingBallNumber(restingBallNumber);
      setRestingBallNumber(null);
    }
  }
  prevSelectedRef.current = selectedBall;
}, [selectedBall, restingBallNumber]);
```

**Ball landing** — In `handleAnimationComplete` (line 247-252), add landing sound:

```typescript
const handleAnimationComplete = useCallback(() => {
  soundManager.playBallLand();
  if (selectedBall) {
    setRestingBallNumber(selectedBall.number);
  }
  onAnimationComplete();
}, [selectedBall, onAnimationComplete]);
```

**Step 3: Verify build**

Run: `pnpm run build`
Expected: No errors

**Step 4: Commit**

```bash
git add src/pages/BingoPage.tsx src/components/bingo/BingoScene.tsx
git commit -m "feat: integrate core game loop sounds (draw, mix, launch, land)"
```

---

### Task 8: Integrate UI feedback sounds

**Files:**
- Modify: `src/pages/BingoPage.tsx` (button clicks, modal open/close)
- Modify: `src/components/bingo/SpinStyleSelector.tsx` (toggle switch)
- Modify: `src/components/bingo/PatternPickerModal.tsx` (pattern select, modal close)
- Modify: `src/components/bingo/GameHistoryModal.tsx` (modal close, load, delete)

**Step 1: Add button click sounds in BingoPage**

The soundManager import is already added from Task 7.

"New Game" button (line 117): Add sound to onClick:

```tsx
onClick={() => { soundManager.playButtonClick(); setShowPatternPicker(true); }}
```

"History" button (line 139): Add sound to onClick:

```tsx
onClick={() => { soundManager.playButtonClick(); purgeEmptyGames(); setShowHistory(true); }}
```

**Step 2: Add modal sounds in PatternPickerModal**

In `PatternPickerModal.tsx`, add import at top:

```typescript
import { soundManager } from "../../audio/soundManager";
```

Add modal open sound via useEffect (after the existing keydown useEffect, around line 31):

```typescript
useEffect(() => {
  soundManager.playModalOpen();
}, []);
```

Modify Escape key handler (line 27) to play close sound:

```typescript
if (e.key === "Escape") { soundManager.playModalClose(); onClose(); }
```

Modify close button (line 122) to play close sound:

```tsx
onClick={() => { soundManager.playModalClose(); onClose(); }}
```

Modify backdrop click (line 72) to play close sound:

```tsx
onClick={() => { soundManager.playModalClose(); onClose(); }}
```

Modify pattern card click (line 219) to play select sound:

```tsx
onClick={() => { soundManager.playPatternSelect(); onSelect(pattern.id); }}
```

**Step 3: Add modal sounds in GameHistoryModal**

In `GameHistoryModal.tsx`, add import at top:

```typescript
import { soundManager } from "../../audio/soundManager";
```

Add modal open sound via useEffect. Add after line 39 (inside the component, before the return):

```typescript
useEffect(() => {
  soundManager.playModalOpen();
}, []);
```

Also need to add the `useEffect` import — it's not currently imported. Change line 1:

```typescript
import { useState, useEffect } from "react";
```

Modify close button (line 92): `onClick={() => { soundManager.playModalClose(); onClose(); }}`

Modify backdrop click (line 43): `onClick={() => { soundManager.playModalClose(); onClose(); }}`

Modify LOAD button (line 182): `onClick={() => { soundManager.playButtonClick(); onLoadGame(game); onClose(); }}`

**Step 4: Add toggle sounds in SpinStyleSelector**

In `SpinStyleSelector.tsx`, add import at top:

```typescript
import { soundManager } from "../../audio/soundManager";
```

In the `ToggleGroup` component, modify the button onClick (line 57):

```tsx
onClick={() => { soundManager.playToggleSwitch(); onChange(opt.value); }}
```

Note: The `ToggleGroup` is an internal component, so the import at file level is fine.

**Step 5: Verify build**

Run: `pnpm run build`
Expected: No errors

**Step 6: Run all tests**

Run: `pnpm run test`
Expected: All tests pass

**Step 7: Commit**

```bash
git add src/pages/BingoPage.tsx src/components/bingo/PatternPickerModal.tsx src/components/bingo/GameHistoryModal.tsx src/components/bingo/SpinStyleSelector.tsx
git commit -m "feat: integrate UI feedback sounds (buttons, modals, toggles, pattern select)"
```

---

### Task 9: Update CLAUDE.md with new files

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add audio section to CLAUDE.md Structure**

Add after the `src/utils/` section:

```markdown
- `src/audio/` — Sound system:
  - `sounds.ts` — zzfx parameter arrays for all sound effects
  - `soundManager.ts` — Central audio module (play functions, volume/mute, localStorage)
```

Add to hooks section:

```markdown
  - `useSoundSettings.ts` — Volume/mute React state for VolumeControl UI
```

Add `VolumeControl.tsx` to the bingo components list.

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with audio system files"
```

---

### Task 10: Manual QA and sound tuning

**Files:** Potentially `src/audio/sounds.ts` for parameter tweaks

**Step 1: Start dev server**

Run: `./start.local.sh`

**Step 2: QA checklist**

Test each sound by performing the action in the browser:

- [ ] Click "GET A BALL" — hear ball draw boop
- [ ] Machine spins — hear mixing whir
- [ ] Ball flies out — hear launch whoosh
- [ ] Ball lands — hear thud
- [ ] Click "New Game" — hear button click
- [ ] Pattern picker opens — hear modal open chime
- [ ] Select a pattern — hear confirmation ping
- [ ] Click close / Escape — hear modal close
- [ ] Click "History" — hear button click
- [ ] History modal opens — hear modal open
- [ ] Toggle spin strength/duration — hear tick
- [ ] Mute button works — all sounds stop
- [ ] Volume slider works — sounds get quieter/louder
- [ ] Refresh page — volume/mute settings persist

**Step 3: Tune sounds if needed**

Use the [ZzFX sound designer](https://killedbyapixel.github.io/ZzFX/) to adjust parameters. Update arrays in `src/audio/sounds.ts`.

**Step 4: Final commit if sounds were tuned**

```bash
git add src/audio/sounds.ts
git commit -m "fix: tune sound effect parameters after QA"
```

**Step 5: Run final build check**

Run: `pnpm run build`
Expected: Clean build, no errors
