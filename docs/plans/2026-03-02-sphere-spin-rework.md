# Sphere Spin Rework Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace ball-impulse mixing with sphere rotation, add spin controls, reposition button, and fix ball number orientation.

**Architecture:** PhaseController drives the sphere's quaternionRef each frame during mixing with eased angular velocity. Spin settings live as React state in BingoPage, passed through BingoScene props. Sliders are an HTML overlay component.

**Tech Stack:** React, Three.js, React Three Fiber, @react-three/rapier

---

### Task 1: Thread quaternionRef and spin settings into PhaseController

**Files:**
- Modify: `src/components/bingo/BingoScene.tsx:32-47` (PhaseControllerProps)
- Modify: `src/components/bingo/BingoScene.tsx:178-242` (BingoScene props)

**Step 1: Add quaternionRef and spin settings to PhaseControllerProps**

In `BingoScene.tsx`, update the `PhaseControllerProps` interface and the `PhaseController` destructuring:

```tsx
interface PhaseControllerProps {
  phase: GamePhase;
  setPhase: (p: GamePhase) => void;
  activeBallNumbers: number[];
  ballBodiesRef: React.MutableRefObject<Map<number, RapierRigidBody>>;
  selectBall: (num: number, position: [number, number, number]) => void;
  quaternionRef: React.RefObject<THREE.Quaternion>;
  spinTime: number;
  spinSpeed: number;
}
```

**Step 2: Add spinTime and spinSpeed to BingoSceneProps, pass through**

```tsx
interface BingoSceneProps {
  // ... existing props ...
  spinTime: number;
  spinSpeed: number;
}
```

Pass `quaternionRef`, `spinTime`, `spinSpeed` to `<PhaseController>`.

**Step 3: Verify** — `pnpm run build` should pass (no runtime change yet).

**Step 4: Commit** — `git commit -m "feat: thread spin settings into PhaseController"`

---

### Task 2: Replace impulse mixing with sphere rotation

**Files:**
- Modify: `src/components/bingo/BingoScene.tsx:59-108` (PhaseController useFrame mixing block)

**Step 1: Replace the mixing block in PhaseController's useFrame**

Remove the impulse logic (lines 65-108). Replace with sphere rotation:

```tsx
// Scratch quaternion for incremental rotation
const _spinAxis = new THREE.Vector3(1, 0, 1).normalize();
const _spinQuat = new THREE.Quaternion();
```

Put these outside the component (module-level constants).

Inside the `phase === "mixing"` block:

```tsx
if (phase === "mixing") {
  if (mixStartRef.current === null) {
    mixStartRef.current = now;
  }

  const elapsed = now - mixStartRef.current;
  const t = elapsed / spinTime;

  if (t >= 1) {
    mixStartRef.current = null;
    transitionedRef.current = true;
    setPhase("settling");
    return;
  }

  // Eased angular velocity: ease-in first 20%, full 20-80%, ease-out last 20%
  let factor: number;
  if (t < 0.2) {
    const s = t / 0.2;
    factor = s * s * s; // cubic ease-in
  } else if (t < 0.8) {
    factor = 1;
  } else {
    const s = 1 - (t - 0.8) / 0.2;
    factor = s * s * s; // cubic ease-out
  }

  const baseSpeed = 3; // rad/s base
  const angle = factor * baseSpeed * spinSpeed * delta;
  _spinQuat.setFromAxisAngle(_spinAxis, angle);
  quaternionRef.current.premultiply(_spinQuat);
}
```

Note: `useFrame` callback receives `(state, delta)` — need to destructure `delta` from the second arg. Currently the callback uses `({ clock })` for the first arg. Change to `({ clock }, delta)`.

**Step 2: Remove `lastImpulseRef`** — no longer needed.

**Step 3: Verify** — `pnpm run build`, then `pnpm run dev` and click "Get A Ball". The sphere should tumble on the Z/X axis with smooth ease-in/out. Balls should bounce around inside from the sphere's rotation.

**Step 4: Commit** — `git commit -m "feat: replace impulse mixing with sphere rotation"`

---

### Task 3: Add spin control sliders

**Files:**
- Create: `src/components/bingo/SpinControls.tsx`
- Modify: `src/pages/BingoPage.tsx`

**Step 1: Create SpinControls component**

```tsx
interface SpinControlsProps {
  spinTime: number;
  setSpinTime: (v: number) => void;
  spinSpeed: number;
  setSpinSpeed: (v: number) => void;
}

export function SpinControls({ spinTime, setSpinTime, spinSpeed, setSpinSpeed }: SpinControlsProps) {
  return (
    <div style={{
      position: "absolute",
      bottom: 40,
      right: 40,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      zIndex: 10,
      color: "white",
      fontFamily: "sans-serif",
      fontSize: 14,
    }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        Spin Time: {spinTime.toFixed(1)}s
        <input
          type="range"
          min={2} max={10} step={0.5}
          value={spinTime}
          onChange={(e) => setSpinTime(Number(e.target.value))}
          style={{ width: 140 }}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        Spin Speed: {spinSpeed.toFixed(1)}x
        <input
          type="range"
          min={0.5} max={3} step={0.1}
          value={spinSpeed}
          onChange={(e) => setSpinSpeed(Number(e.target.value))}
          style={{ width: 140 }}
        />
      </label>
    </div>
  );
}
```

**Step 2: Add state and wire up in BingoPage**

```tsx
const [spinTime, setSpinTime] = useState(5);
const [spinSpeed, setSpinSpeed] = useState(1);
```

Pass `spinTime` and `spinSpeed` to `<BingoScene>`.
Add `<SpinControls>` to the JSX.

**Step 3: Verify** — sliders appear bottom-right, changing values affects spin behavior.

**Step 4: Commit** — `git commit -m "feat: add spin time and speed slider controls"`

---

### Task 4: Move Get A Ball button to the left

**Files:**
- Modify: `src/components/bingo/GetABallButton.tsx:23-26`

**Step 1: Change positioning**

Replace:
```tsx
left: "50%",
transform: "translateX(-50%)",
```

With:
```tsx
left: 40,
```

Remove the `transform` property entirely.

**Step 2: Verify** — button appears bottom-left.

**Step 3: Commit** — `git commit -m "feat: move Get A Ball button to left side"`

---

### Task 5: Fix ball number orientation when facing camera

**Files:**
- Modify: `src/components/bingo/BingoBallAnimated.tsx`

**Step 1: Add target rotation constant**

The number texture center maps to the +X direction on the sphere. The camera looks from +Z. Rotating by -PI/2 around Y brings the +X face to point toward +Z.

```tsx
const TARGET_ROTATION = new THREE.Euler(0, -Math.PI / 2, 0);
```

**Step 2: Animate rotation during fly phase**

Inside the `if (progressRef.current < FLY_DURATION)` block, after position/scale, add rotation interpolation:

```tsx
// Slerp rotation so number faces camera
const targetQuat = new THREE.Quaternion().setFromEuler(TARGET_ROTATION);
meshRef.current.quaternion.slerp(targetQuat, eased);
```

Actually, allocating every frame is wasteful. Use a module-level constant:

```tsx
const _targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0));
```

Then in the frame loop:
```tsx
meshRef.current.quaternion.slerp(_targetQuat, eased);
```

**Step 3: Verify** — when ball flies to camera, number should face viewer directly.

**Step 4: Commit** — `git commit -m "fix: rotate ball number to face camera during animation"`

---

### Task 6: Final verification and cleanup

**Step 1:** Run `pnpm run build` — no type errors.

**Step 2:** Run `pnpm run lint` — no lint errors.

**Step 3:** Manual verification in browser:
- Click "Get A Ball" — sphere tumbles on Z/X axis with smooth ease-in/out
- Balls bounce naturally inside the rotating sphere
- After spin, ball settles and flies to camera with number facing viewer
- Sliders adjust spin time and speed
- Button is on the left side
- Sliders are on the bottom right

**Step 4:** Final commit if any cleanup needed.
