# Auto-Spin Feature Design

## Summary

Add a Manual/Auto spin mode toggle. In auto mode, the bingo machine sphere spins continuously. Clicking GET A BALL triggers the ease-down and ball selection without waiting for a full spin cycle.

## Game Phase Changes

New phase `auto-mixing` added to `GamePhase`:

```
idle → auto-mixing → mixing (ease-down) → settling → selecting → animating → idle → (3s) → auto-mixing
```

- Auto mode ON + idle: transition to `auto-mixing`
- `auto-mixing`: continuous spin at configured speed, tracks elapsed time
- GET A BALL click: `auto-mixing` → `mixing` (ease-down portion or continues until min time met)
- After ball animation completes: idle → 3s delay → `auto-mixing`

## GET A BALL Flow (Auto Mode)

1. Button shows "GET A BALL" and is clickable during `auto-mixing`
2. Click calls `startDraw()`:
   - If min spin time met: transition to `mixing` at ease-down portion (last 20% of spin time)
   - If not met: transition to `mixing`, continuing from current elapsed time until full spin time completes, then ease-down
3. From `mixing` onward: settling → selecting → animating → idle (same as manual)

## Phase Guards / Button State

- `GetABallButton`: enabled when `idle` OR `auto-mixing` (with active balls)
- `auto-mixing` treated like `idle` for UI: button shows "GET A BALL" with glow/sheen
- Paddle: visible during `auto-mixing`

## Auto-Spin Toggle

- State: `spinMode: "manual" | "auto"`, localStorage key `bingo_spin_mode`, default `"auto"`
- UI: first row in SpinStyleSelector panel ("Spin Mode: Manual | Auto")
- Toggle to Auto: if idle, ease-in to `auto-mixing`
- Toggle to Manual: if `auto-mixing`, ease-down to `idle`

## PhaseController Changes

### New `auto-mixing` handler:
- Tracks `autoMixStartTime` ref
- Ease-in over ~0.5s (cubic ramp-up)
- Full speed: same rotation logic as `mixing` (random axis, baseSpeed * spinSpeed)
- No automatic end — spins until `startDraw()`

### Modified `mixing` handler:
- When entering from `auto-mixing`: inherit rotation axis and speed, apply ease-down
- Keep normal ease-down (last 20% of configured spin time)

## 3-Second Auto-Restart

- After `onAnimationComplete` (animating → idle), if auto mode on:
  - 3-second timeout, then idle → `auto-mixing`
  - Cancel if user toggles to manual during wait

## localStorage

| Key | Type | Default | Values |
|-----|------|---------|--------|
| `bingo_spin_mode` | string | `"auto"` | `"manual"`, `"auto"` |

## Files to Modify

1. `useBingoGameState.ts` — add `auto-mixing` to GamePhase, update `startDraw()` logic
2. `BingoScene.tsx` (PhaseController) — add `auto-mixing` handler, modify `mixing` for auto transition
3. `SpinStyleSelector.tsx` — add Spin Mode toggle as first row
4. `BingoPage.tsx` — add `spinMode` state + localStorage persistence, pass to components
5. `GetABallButton.tsx` — enable during `auto-mixing`, show "GET A BALL"
6. `BingoMachine.tsx` — paddle visibility during `auto-mixing`
7. Tests — update phase-related tests
