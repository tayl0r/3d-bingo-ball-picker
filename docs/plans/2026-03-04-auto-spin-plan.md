# Auto-Spin Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Manual/Auto spin mode toggle so the bingo machine spins continuously in auto mode, making GET A BALL trigger immediate ease-down + ball selection.

**Architecture:** New `auto-mixing` game phase for continuous spinning. PhaseController gains an auto-mixing handler that spins indefinitely with ease-in. When startDraw is called from auto-mixing, it transitions to the existing mixing phase at the ease-down portion. A 3-second timer auto-restarts spinning after each ball is drawn.

**Tech Stack:** React 19, TypeScript, Three.js (React Three Fiber), @react-three/rapier, vitest

---

### Task 1: Add `auto-mixing` to GamePhase type and update `startDraw`

**Files:**
- Modify: `src/hooks/useBingoGameState.ts`
- Test: `src/hooks/__tests__/useBingoGameState.test.ts`

**Step 1: Write the failing tests**

Add to `src/hooks/__tests__/useBingoGameState.test.ts`:

```ts
it("startDraw transitions from auto-mixing to mixing", () => {
  const { result } = renderHook(() => useBingoGameState());
  act(() => result.current.setPhase("auto-mixing"));
  act(() => result.current.startDraw());
  expect(result.current.phase).toBe("mixing");
});

it("startDraw does nothing during animating phase", () => {
  const { result } = renderHook(() => useBingoGameState());
  act(() => result.current.startDraw());
  act(() => result.current.selectBall(1, [0, 0, 0], [0, 0, 0, 1]));
  expect(result.current.phase).toBe("animating");
  act(() => result.current.startDraw());
  expect(result.current.phase).toBe("animating");
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm run test -- --run src/hooks/__tests__/useBingoGameState.test.ts`
Expected: FAIL — `auto-mixing` is not a valid GamePhase

**Step 3: Update GamePhase type and startDraw**

In `src/hooks/useBingoGameState.ts`:

Line 13 — change the type:
```ts
export type GamePhase = "idle" | "auto-mixing" | "mixing" | "settling" | "selecting" | "animating";
```

Lines 62-65 — update `startDraw` to accept `auto-mixing` as a valid starting phase:
```ts
const startDraw = useCallback(() => {
  if ((phase !== "idle" && phase !== "auto-mixing") || activeBallNumbers.length === 0) return;
  setPhaseTracked("mixing");
}, [phase, activeBallNumbers.length, setPhaseTracked]);
```

**Step 4: Run tests to verify they pass**

Run: `pnpm run test -- --run src/hooks/__tests__/useBingoGameState.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/hooks/useBingoGameState.ts src/hooks/__tests__/useBingoGameState.test.ts
git commit -m "feat: add auto-mixing to GamePhase, allow startDraw from auto-mixing"
```

---

### Task 2: Add `spinMode` state to BingoPage with localStorage persistence

**Files:**
- Modify: `src/pages/BingoPage.tsx`

**Step 1: Add spinMode state and localStorage persistence**

In `src/pages/BingoPage.tsx`, after the `paddleEnabled` state (line 50), add:

```ts
const [spinMode, setSpinMode] = useState<"manual" | "auto">(() => {
  try { const v = localStorage.getItem("bingo_spin_mode"); return v === "manual" ? "manual" : "auto"; } catch { return "auto"; }
});
```

After the paddle localStorage effect (line 54), add:

```ts
useEffect(() => { try { localStorage.setItem("bingo_spin_mode", spinMode); } catch {} }, [spinMode]);
```

**Step 2: Pass spinMode to SpinStyleSelector**

Update the SpinStyleSelector usage (lines 183-188):

```tsx
<SpinStyleSelector
  spinSpeed={spinSpeed}
  setSpinSpeed={setSpinSpeed}
  spinTime={spinTime}
  setSpinTime={setSpinTime}
  spinMode={spinMode}
  setSpinMode={setSpinMode}
/>
```

**Step 3: Pass spinMode to BingoScene**

Add `spinMode` prop to the BingoScene component (line 119-136):

```tsx
<BingoScene
  phase={game.phase}
  setPhase={game.setPhase}
  activeBallNumbers={game.activeBallNumbers}
  drawnBalls={game.drawnBalls}
  selectedBall={game.selectedBall}
  ballBodiesRef={game.ballBodiesRef}
  ballMeshesRef={game.ballMeshesRef}
  registerBody={game.registerBody}
  registerMesh={game.registerMesh}
  selectBall={game.selectBall}
  onAnimationComplete={game.onAnimationComplete}
  spinTime={spinTime}
  spinSpeed={spinSpeed}
  spinMode={spinMode}
  logoUrl={customLogo?.dataUrl}
  logoAspect={customLogo?.aspect}
  paddleEnabled={paddleEnabled}
/>
```

**Step 4: Update GetABallButton disabled logic**

Change the `disabled` prop on GetABallButton (line 179):

```tsx
disabled={(game.phase !== "idle" && game.phase !== "auto-mixing") || game.activeBallNumbers.length === 0}
```

**Step 5: Update other idle-only guards**

Update CurrentPatternDisplay `editDisabled` (line 168):
```tsx
editDisabled={game.phase !== "idle" && game.phase !== "auto-mixing"}
```

Update the pattern edit onClick guard (line 169):
```tsx
onEdit={() => {
  if (game.phase !== "idle" && game.phase !== "auto-mixing") return;
```

Update New Game and History button `disabled` props (lines 196, 203):
```tsx
disabled={game.phase !== "idle" && game.phase !== "auto-mixing"}
```

**Step 6: Commit**

```bash
git add src/pages/BingoPage.tsx
git commit -m "feat: add spinMode state with localStorage, pass to components"
```

---

### Task 3: Add Spin Mode toggle to SpinStyleSelector

**Files:**
- Modify: `src/components/bingo/SpinStyleSelector.tsx`

**Step 1: Update props interface**

```ts
interface SpinStyleSelectorProps {
  spinSpeed: number;
  setSpinSpeed: (v: number) => void;
  spinTime: number;
  setSpinTime: (v: number) => void;
  spinMode: "manual" | "auto";
  setSpinMode: (v: "manual" | "auto") => void;
}
```

**Step 2: Add SPIN_MODES constant**

After the DURATIONS constant (line 19), add:

```ts
const SPIN_MODES = [
  { label: "Manual", value: "manual" as const },
  { label: "Auto", value: "auto" as const },
] as const;
```

**Step 3: Make ToggleGroup generic**

The existing ToggleGroup only supports `number` values. Update it to support `string | number`:

```ts
function ToggleGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
```

The rest of ToggleGroup body stays the same — `opt.value === value` works for both types.

**Step 4: Render Spin Mode toggle as first row**

In the SpinStyleSelector component, add the spin mode toggle before the Strength toggle:

```tsx
export function SpinStyleSelector({
  spinSpeed,
  setSpinSpeed,
  spinTime,
  setSpinTime,
  spinMode,
  setSpinMode,
}: SpinStyleSelectorProps) {
  return (
    <div style={{ /* same styles */ }}>
      <ToggleGroup
        label="Spin Mode"
        options={SPIN_MODES}
        value={spinMode}
        onChange={setSpinMode}
      />
      <ToggleGroup
        label="Strength"
        options={STRENGTHS}
        value={spinSpeed}
        onChange={setSpinSpeed}
      />
      <ToggleGroup
        label="Duration"
        options={DURATIONS}
        value={spinTime}
        onChange={setSpinTime}
      />
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add src/components/bingo/SpinStyleSelector.tsx
git commit -m "feat: add Spin Mode toggle to SpinStyleSelector"
```

---

### Task 4: Update GetABallButton for auto-mixing phase

**Files:**
- Modify: `src/components/bingo/GetABallButton.tsx`

**Step 1: Update phaseText record**

Add entry for `auto-mixing` in the `phaseText` record (line 9):

```ts
const phaseText: Record<GamePhase, string> = {
  idle: "GET A BALL",
  "auto-mixing": "GET A BALL",
  mixing: "MIXING...",
  settling: "SETTLING...",
  selecting: "SETTLING...",
  animating: "WATCH...",
};
```

**Step 2: Update isIdle check**

Line 19 — treat auto-mixing like idle for visual styling:

```ts
const isIdle = phase === "idle" || phase === "auto-mixing";
```

**Step 3: Commit**

```bash
git add src/components/bingo/GetABallButton.tsx
git commit -m "feat: GetABallButton supports auto-mixing phase"
```

---

### Task 5: Update PhaseController for auto-mixing and auto-transition

This is the core logic task. PhaseController needs:
- An `auto-mixing` handler that spins indefinitely with ease-in
- Modified `mixing` handler that, when coming from auto-mixing, handles elapsed time correctly
- Auto-restart timer (3s after animation completes)

**Files:**
- Modify: `src/components/bingo/BingoScene.tsx`

**Step 1: Add spinMode prop to PhaseController and BingoScene**

Update `PhaseControllerProps` (line 38):

```ts
interface PhaseControllerProps {
  phase: GamePhase;
  setPhase: (p: GamePhase) => void;
  activeBallNumbers: number[];
  ballBodiesRef: React.MutableRefObject<Map<number, RapierRigidBody>>;
  ballMeshesRef: React.MutableRefObject<Map<number, THREE.Mesh>>;
  selectBall: (num: number, position: [number, number, number], rotation: [number, number, number, number]) => void;
  quaternionRef: React.MutableRefObject<THREE.Quaternion>;
  spinTime: number;
  spinSpeed: number;
  spinMode: "manual" | "auto";
}
```

Update `BingoSceneProps` (line 197) — add `spinMode: "manual" | "auto";`

Update `SceneContentProps` — it extends BingoSceneProps, so it inherits automatically.

**Step 2: Add auto-mixing refs to PhaseController**

After the existing refs (line 69), add:

```ts
const autoMixStartRef = useRef<number | null>(null);
const fromAutoMixRef = useRef(false);
const autoMixElapsedRef = useRef(0);
```

**Step 3: Add auto-mixing handler in useFrame**

Before the existing `if (phase === "mixing")` block (line 82), add:

```ts
if (phase === "auto-mixing") {
  if (autoMixStartRef.current === null) {
    autoMixStartRef.current = now;
    spinSpeedSnapshotRef.current = spinSpeed;
    const theta = Math.random() * Math.PI * 2;
    spinAxisRef.current.set(Math.cos(theta), 0.2, Math.sin(theta)).normalize();
    spinDistanceRef.current = 0;
  }

  const elapsed = now - autoMixStartRef.current;
  autoMixElapsedRef.current = elapsed;

  // Ease-in over 0.5s
  const easeInDuration = 0.5;
  const factor = elapsed < easeInDuration
    ? Math.pow(elapsed / easeInDuration, 3)
    : 1;

  const baseSpeed = 3;
  const angle = factor * baseSpeed * spinSpeedSnapshotRef.current * delta;

  const TICK_INTERVAL = 1.2;
  spinDistanceRef.current += angle;
  if (spinDistanceRef.current >= TICK_INTERVAL) {
    spinDistanceRef.current -= TICK_INTERVAL;
    soundManager.playSpinTick();
  }

  spinQuatRef.current.setFromAxisAngle(spinAxisRef.current, angle);
  quaternionRef.current.premultiply(spinQuatRef.current);
  return;
}
```

**Step 4: Modify mixing handler to support auto-mixing transition**

Replace the mixing handler (lines 82-125) with:

```ts
if (phase === "mixing") {
  if (mixStartRef.current === null) {
    mixStartRef.current = now;
    spinTimeSnapshotRef.current = spinTime;
    spinSpeedSnapshotRef.current = spinSpeed;

    if (fromAutoMixRef.current) {
      // Coming from auto-mixing: inherit axis, calculate time offset
      // If we've already spun for >= spinTime, jump to ease-down start (t=0.8)
      const autoElapsed = autoMixElapsedRef.current;
      if (autoElapsed >= spinTimeSnapshotRef.current) {
        // Min time met: start at beginning of ease-down (t=0.8)
        mixStartRef.current = now - (0.8 * spinTimeSnapshotRef.current);
      } else {
        // Min time not met: continue from where we are
        mixStartRef.current = now - autoElapsed;
      }
      fromAutoMixRef.current = false;
    } else {
      const theta = Math.random() * Math.PI * 2;
      spinAxisRef.current.set(Math.cos(theta), 0.2, Math.sin(theta)).normalize();
    }
    spinDistanceRef.current = 0;
  }

  const elapsed = now - mixStartRef.current;
  const t = elapsed / spinTimeSnapshotRef.current;

  if (t >= 1) {
    mixStartRef.current = null;
    transitionedRef.current = true;
    setPhase("settling");
    return;
  }

  let factor: number;
  if (t < 0.2) {
    const s = t / 0.2;
    factor = s * s * s;
  } else if (t < 0.8) {
    factor = 1;
  } else {
    const s = 1 - (t - 0.8) / 0.2;
    factor = s * s * s;
  }

  const baseSpeed = 3;
  const angle = factor * baseSpeed * spinSpeedSnapshotRef.current * delta;

  const TICK_INTERVAL = 1.2;
  spinDistanceRef.current += angle;
  if (spinDistanceRef.current >= TICK_INTERVAL) {
    spinDistanceRef.current -= TICK_INTERVAL;
    soundManager.playSpinTick();
  }

  spinQuatRef.current.setFromAxisAngle(spinAxisRef.current, angle);
  quaternionRef.current.premultiply(spinQuatRef.current);
}
```

**Step 5: Reset auto-mix refs on phase transitions**

In the existing `useEffect` that resets on phase change (line 71-74), add:

```ts
useEffect(() => {
  transitionedRef.current = false;
  settledAtRef.current = null;
  if (phase === "mixing" && autoMixStartRef.current !== null) {
    fromAutoMixRef.current = true;
  }
  if (phase !== "auto-mixing") {
    autoMixStartRef.current = null;
  }
}, [phase]);
```

**Step 6: Add auto-restart timer**

Add a new `useEffect` after the phase-reset effect:

```ts
useEffect(() => {
  if (phase !== "idle" || spinMode !== "auto") return;
  const timer = setTimeout(() => {
    setPhase("auto-mixing");
  }, 3000);
  return () => clearTimeout(timer);
}, [phase, spinMode, setPhase]);
```

**Step 7: Handle spinMode toggle to/from auto**

Add another effect that handles live toggling:

```ts
useEffect(() => {
  if (spinMode === "auto" && phase === "idle") {
    setPhase("auto-mixing");
  }
  if (spinMode === "manual" && phase === "auto-mixing") {
    // Trigger ease-down by going through mixing phase briefly
    setPhase("idle");
  }
}, [spinMode]);
```

Note: The ease-down on manual toggle is a nice-to-have. For now, snapping to idle is acceptable; a smooth ease-down would require a dedicated "auto-stopping" phase which adds complexity. We can add it later if needed.

**Step 8: Pass spinMode through component tree**

In SceneContent, destructure `spinMode` and pass it to PhaseController:

```tsx
<PhaseController
  phase={phase}
  setPhase={setPhase}
  activeBallNumbers={activeBallNumbers}
  ballBodiesRef={ballBodiesRef}
  ballMeshesRef={ballMeshesRef}
  selectBall={selectBall}
  quaternionRef={quaternionRef}
  spinTime={spinTime}
  spinSpeed={spinSpeed}
  spinMode={spinMode}
/>
```

**Step 9: Commit**

```bash
git add src/components/bingo/BingoScene.tsx
git commit -m "feat: PhaseController auto-mixing handler and auto-restart timer"
```

---

### Task 6: Update paddle visibility for auto-mixing

**Files:**
- Modify: `src/components/bingo/BingoScene.tsx`

**Step 1: Update paddle guard**

Line 320 — the paddle is already hidden during settling and selecting. During auto-mixing, balls are moving, so paddle should be visible. No change needed — the current guard `phase !== "settling" && phase !== "selecting"` already allows `auto-mixing`. Verify this is correct and that auto-mixing doesn't interfere.

Actually, the paddle should probably be hidden during `auto-mixing` since the sphere is spinning. Let's check the design doc... The design says "Paddle: visible during `auto-mixing`". The balls are bouncing around in the spinning sphere, so the paddle makes sense. The current code already allows it. **No change needed.**

**Step 2: Commit (skip if no changes)**

No commit needed for this task.

---

### Task 7: Update useBingoGameState idle-only guards for auto-mixing

**Files:**
- Modify: `src/hooks/useBingoGameState.ts`
- Test: `src/hooks/__tests__/useBingoGameState.test.ts`

**Step 1: Write failing tests**

```ts
it("changePattern works during auto-mixing", () => {
  const { result } = renderHook(() => useBingoGameState());
  act(() => result.current.setPhase("auto-mixing"));
  act(() => result.current.changePattern("full-card"));
  expect(result.current.patternId).toBe("full-card");
});

it("newGame works during auto-mixing", () => {
  const { result } = renderHook(() => useBingoGameState());
  act(() => result.current.setPhase("auto-mixing"));
  act(() => result.current.newGame("full-card"));
  expect(result.current.drawnBalls).toHaveLength(0);
  expect(result.current.activeBallNumbers).toHaveLength(75);
});

it("loadGame works during auto-mixing", () => {
  const { result } = renderHook(() => useBingoGameState());
  act(() => result.current.setPhase("auto-mixing"));
  act(() => result.current.loadGame({
    id: "test-id",
    drawnBalls: [1, 2, 3],
    timestamp: Date.now(),
    patternId: "any-line",
  }));
  expect(result.current.drawnBalls).toEqual([1, 2, 3]);
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm run test -- --run src/hooks/__tests__/useBingoGameState.test.ts`
Expected: FAIL — changePattern, newGame, loadGame reject non-idle phases

**Step 3: Update guards**

In `src/hooks/useBingoGameState.ts`:

`changePattern` (line 91):
```ts
const changePattern = useCallback((newPatternId: string) => {
  if (phase !== "idle" && phase !== "auto-mixing") return;
```

`newGame` (line 97):
```ts
const newGame = useCallback((selectedPatternId: string) => {
  if (phase !== "idle" && phase !== "auto-mixing") return;
```

`loadGame` (line 105):
```ts
const loadGame = useCallback((game: SavedGame) => {
  if (phase !== "idle" && phase !== "auto-mixing") return;
```

**Step 4: Run tests to verify they pass**

Run: `pnpm run test -- --run src/hooks/__tests__/useBingoGameState.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/hooks/useBingoGameState.ts src/hooks/__tests__/useBingoGameState.test.ts
git commit -m "feat: allow game actions during auto-mixing phase"
```

---

### Task 8: Run full test suite and type-check

**Step 1: Run type check**

Run: `pnpm run build`
Expected: No TypeScript errors

**Step 2: Run all tests**

Run: `pnpm run test -- --run`
Expected: ALL PASS

**Step 3: Fix any failures**

If type errors: likely missing `auto-mixing` in exhaustive checks or Record types. Add the missing entries.

**Step 4: Commit fixes if any**

```bash
git add -u
git commit -m "fix: resolve type errors and test failures for auto-spin"
```

---

### Task 9: Manual verification

**Step 1: Start dev server**

Run: `./start.local.sh`

**Step 2: Verify these scenarios:**

1. Page loads → sphere starts spinning automatically (auto mode is default)
2. Click GET A BALL → sphere eases down, ball selected, animation plays
3. After animation → 3 second pause → sphere starts spinning again
4. Click GET A BALL before min time → queues draw, completes when min time met
5. Toggle to Manual → sphere stops, button works like before (click → full spin cycle)
6. Toggle back to Auto → sphere starts spinning
7. Change spin speed/duration while auto-spinning → settings saved
8. Refresh page → spin mode persisted from localStorage
9. New Game button works during auto-mixing
10. History button works during auto-mixing

---

### Task 10: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add auto-spin documentation**

Add to the Key Patterns section:

```
- **Auto-spin**: Default spin mode. Sphere spins continuously in `auto-mixing` phase. GET A BALL triggers ease-down without full spin cycle. 3s auto-restart after each ball draw. Toggle in SpinStyleSelector, persisted in `bingo_spin_mode` localStorage key.
```

Add `auto-mixing` to the Game phases line:

```
- **Game phases**: `idle` → `auto-mixing` → `mixing` → `settling` → `selecting` → `animating` → `idle`. Phase drives sphere rotation, ball selection, and paddle visibility.
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add auto-spin to CLAUDE.md"
```
