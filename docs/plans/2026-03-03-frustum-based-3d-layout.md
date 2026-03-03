# Frustum-Based 3D Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace hardcoded 3D positions with frustum-computed positions so elements dock correctly at any resolution.

**Architecture:** A `useFrustumLayout` hook computes visible width/height at each element's Z-depth using `2 * tan(fov/2) * distance`. Elements are positioned as percentage offsets from frustum edges. The hook reads camera state via R3F's `useThree` and returns positions/scales for all three elements.

**Tech Stack:** React Three Fiber (`useThree`), Three.js, Vitest

---

### Task 1: Create `useFrustumLayout` hook with tests

**Files:**
- Create: `src/hooks/__tests__/useFrustumLayout.test.ts`
- Create: `src/hooks/useFrustumLayout.ts`

**Step 1: Write the failing test**

Create `src/hooks/__tests__/useFrustumLayout.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computeFrustumLayout } from "../useFrustumLayout";

// Camera: position [0, 2, 8], FOV 50deg, aspect 16/9
const CAM_POS: [number, number, number] = [0, 2, 8];
const FOV = 50;
const ASPECT = 16 / 9;

describe("computeFrustumLayout", () => {
  const layout = computeFrustumLayout(CAM_POS, FOV, ASPECT);

  it("logo position is in the top-left quadrant", () => {
    expect(layout.logoPosition[0]).toBeLessThan(0); // left of center
    expect(layout.logoPosition[1]).toBeGreaterThan(CAM_POS[1]); // above camera Y
  });

  it("lastBall position is in the top-right quadrant", () => {
    expect(layout.lastBallPosition[0]).toBeGreaterThan(0); // right of center
    expect(layout.lastBallPosition[1]).toBeGreaterThan(CAM_POS[1]); // above camera Y
  });

  it("sphere position is centered on camera X", () => {
    expect(layout.spherePosition[0]).toBe(0);
  });

  it("logo and lastBall are symmetric in Y", () => {
    // Both docked to top with same padding, so Y should be equal
    expect(layout.logoPosition[1]).toBeCloseTo(layout.lastBallPosition[1], 0);
  });

  it("returns positive scales", () => {
    expect(layout.logoScale).toBeGreaterThan(0);
    expect(layout.lastBallScale).toBeGreaterThan(0);
  });

  it("adapts to different aspect ratios", () => {
    const wide = computeFrustumLayout(CAM_POS, FOV, 21 / 9);
    const narrow = computeFrustumLayout(CAM_POS, FOV, 4 / 3);
    // Wider aspect → logo further left
    expect(wide.logoPosition[0]).toBeLessThan(narrow.logoPosition[0]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/hooks/__tests__/useFrustumLayout.test.ts`
Expected: FAIL — module not found

**Step 3: Write the implementation**

Create `src/hooks/useFrustumLayout.ts`:

```ts
import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

// Z-depths for each element (distance in front of camera along view axis)
const LOGO_Z = -1;
const LAST_BALL_Z = 5;
const SPHERE_Z = 0;

// Padding as fraction of visible area
const PADDING = 0.05;

// Logo intrinsic dimensions (aspect 744/267 ≈ 2.786, base height 1.8)
const LOGO_ASPECT = 744 / 267;
const LOGO_BASE_HEIGHT = 1.8;

// Ball radius for inset calculation
const BALL_DISPLAY_RADIUS = 0.25;

export interface FrustumLayout {
  logoPosition: [number, number, number];
  logoScale: number;
  lastBallPosition: [number, number, number];
  lastBallScale: number;
  lastBallQuaternion: THREE.Quaternion;
  spherePosition: [number, number, number];
}

/**
 * Pure function: compute layout from camera params.
 * Exported for testing without R3F context.
 */
export function computeFrustumLayout(
  cameraPosition: [number, number, number],
  fovDeg: number,
  aspect: number,
): FrustumLayout {
  const [camX, camY, camZ] = cameraPosition;
  const fovRad = (fovDeg * Math.PI) / 180;

  // Helper: visible rect at a given Z world-coordinate
  function visibleAt(z: number) {
    const dist = Math.abs(camZ - z);
    const h = 2 * Math.tan(fovRad / 2) * dist;
    const w = h * aspect;
    return { w, h, dist };
  }

  // --- Logo (top-left at LOGO_Z) ---
  const logoView = visibleAt(LOGO_Z);
  const logoScale = 0.55; // preserve existing visual scale
  const logoH = LOGO_BASE_HEIGHT * logoScale;
  const logoW = logoH * LOGO_ASPECT;
  const logoPadX = logoView.w * PADDING;
  const logoPadY = logoView.h * PADDING;
  const logoX = camX - logoView.w / 2 + logoPadX + logoW / 2;
  const logoY = camY + logoView.h / 2 - logoPadY - logoH / 2;

  // --- Last Ball (top-right at LAST_BALL_Z) ---
  const ballView = visibleAt(LAST_BALL_Z);
  const lastBallScale = 0.96;
  const ballR = BALL_DISPLAY_RADIUS * lastBallScale;
  const ballPadX = ballView.w * PADDING;
  const ballPadY = ballView.h * PADDING;
  const ballX = camX + ballView.w / 2 - ballPadX - ballR;
  const ballY = camY + ballView.h / 2 - ballPadY - ballR;

  // Quaternion: face camera then rotate quarter-turn right
  const restPos = new THREE.Vector3(ballX, ballY, LAST_BALL_Z);
  const camVec = new THREE.Vector3(...cameraPosition);
  const dir = camVec.clone().sub(restPos).normalize();
  const quarterRight = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    -Math.PI / 2,
  );
  const lastBallQuaternion = new THREE.Quaternion()
    .setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir)
    .premultiply(quarterRight);

  // --- Sphere (center at SPHERE_Z) ---
  const sphereView = visibleAt(SPHERE_Z);
  // Center the sphere in the frustum, offset slightly below center
  // to account for the sphere sitting "on the ground" visually
  const sphereY = camY - sphereView.h * 0.05;

  return {
    logoPosition: [logoX, logoY, LOGO_Z],
    logoScale,
    lastBallPosition: [ballX, ballY, LAST_BALL_Z],
    lastBallScale,
    lastBallQuaternion,
    spherePosition: [0, sphereY, SPHERE_Z],
  };
}

/**
 * R3F hook: reads camera and recomputes layout on viewport change.
 */
export function useFrustumLayout(): FrustumLayout {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  return useMemo(() => {
    const pos: [number, number, number] = [
      camera.position.x,
      camera.position.y,
      camera.position.z,
    ];
    return computeFrustumLayout(pos, camera.fov, size.width / size.height);
  }, [camera.position.x, camera.position.y, camera.position.z, camera.fov, size.width, size.height]);
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/hooks/__tests__/useFrustumLayout.test.ts`
Expected: All 6 tests PASS

**Step 5: Commit**

```bash
git add src/hooks/useFrustumLayout.ts src/hooks/__tests__/useFrustumLayout.test.ts
git commit -m "feat: add useFrustumLayout hook with frustum-based positioning"
```

---

### Task 2: Update `LastBall3D.tsx` to accept position/scale/quaternion as props

**Files:**
- Modify: `src/components/bingo/LastBall3D.tsx`

**Step 1: Refactor `LastBallResting` to accept props**

Replace the hardcoded constants with props. Keep the constants as fallback defaults for backwards compat during transition, but the primary interface is now props.

```tsx
import { useRef, useCallback, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createBallTexture } from "../../utils/ballTexture";
import { BALL_RADIUS } from "./BingoBall";

interface LastBallRestingProps {
  number: number;
  position: [number, number, number];
  scale: number;
  quaternion: THREE.Quaternion;
}

export function LastBallResting({ number, position, scale, quaternion }: LastBallRestingProps) {
  const texture = useMemo(() => createBallTexture(number), [number]);

  const setRef = useCallback((mesh: THREE.Mesh | null) => {
    if (mesh) mesh.quaternion.copy(quaternion);
  }, [quaternion]);

  return (
    <mesh ref={setRef} position={position} scale={scale}>
      <sphereGeometry args={[BALL_RADIUS, 16, 16]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

interface LastBallDepartingProps {
  number: number;
  position: [number, number, number];
  scale: number;
  quaternion: THREE.Quaternion;
  onComplete: () => void;
}

const DEPART_DURATION = 0.6;

export function LastBallDeparting({ number, position, scale, quaternion, onComplete }: LastBallDepartingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const texture = useMemo(() => createBallTexture(number), [number]);

  // Compute exit position relative to the rest position (fly up-right and away)
  const restPos = useMemo(() => new THREE.Vector3(...position), [position]);
  const exitPos = useMemo(
    () => new THREE.Vector3(position[0] + 1.75, position[1] + 2.65, position[2] + 2.5),
    [position],
  );

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const initRef = useRef(false);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (!initRef.current) {
      initRef.current = true;
      meshRef.current.quaternion.copy(quaternion);
    }

    if (completedRef.current) return;

    progressRef.current += delta;
    const t = Math.min(progressRef.current / DEPART_DURATION, 1);
    const eased = t * t * t;

    meshRef.current.position.lerpVectors(restPos, exitPos, eased);
    const s = scale * (1 - eased * 0.7);
    meshRef.current.scale.setScalar(s);

    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.opacity = 1 - eased;

    if (t >= 1) {
      completedRef.current = true;
      onCompleteRef.current();
    }
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <sphereGeometry args={[BALL_RADIUS, 16, 16]} />
      <meshStandardMaterial map={texture} transparent />
    </mesh>
  );
}
```

**Step 2: Run full test suite to check nothing breaks**

Run: `pnpm test`
Expected: PASS (no tests directly test LastBall3D)

**Step 3: Commit**

```bash
git add src/components/bingo/LastBall3D.tsx
git commit -m "refactor: make LastBall3D accept position/scale/quaternion as props"
```

---

### Task 3: Update `BingoBallAnimated.tsx` to accept target position/scale/quaternion as props

**Files:**
- Modify: `src/components/bingo/BingoBallAnimated.tsx`

**Step 1: Replace imported constants with props**

```tsx
import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createBallTexture } from "../../utils/ballTexture";
import { BALL_RADIUS } from "./BingoBall";

interface BingoBallAnimatedProps {
  number: number;
  startPosition: [number, number, number];
  startRotation: [number, number, number, number];
  targetPosition: [number, number, number];
  targetScale: number;
  targetQuaternion: THREE.Quaternion;
  onComplete: () => void;
}

const DIP_Y = -1.5;
const FLY_DURATION = 1.5;
const HOLD_DURATION = 0.3;
const _bezierTemp = new THREE.Vector3();

function quadraticBezier(out: THREE.Vector3, p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, t: number) {
  const inv = 1 - t;
  out.set(
    inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x,
    inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y,
    inv * inv * p0.z + 2 * inv * t * p1.z + t * t * p2.z,
  );
  return out;
}

function computeControl(start: THREE.Vector3, target: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3(
    (start.x + target.x) / 2,
    Math.min(start.y, target.y) + DIP_Y,
    (start.z + target.z) / 2,
  );
}

export function BingoBallAnimated({
  number,
  startPosition,
  startRotation,
  targetPosition,
  targetScale,
  targetQuaternion,
  onComplete,
}: BingoBallAnimatedProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);
  const targetPos = useMemo(() => new THREE.Vector3(...targetPosition), [targetPosition]);
  const startRef = useRef(new THREE.Vector3(...startPosition));
  const controlRef = useRef(computeControl(new THREE.Vector3(...startPosition), targetPos));
  const startQuatRef = useRef(new THREE.Quaternion(...startRotation));
  const texture = useMemo(() => createBallTexture(number), [number]);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useFrame((_, delta) => {
    if (!meshRef.current || completedRef.current) return;

    progressRef.current += delta;
    const totalDuration = FLY_DURATION + HOLD_DURATION;

    if (progressRef.current >= totalDuration) {
      completedRef.current = true;
      onCompleteRef.current();
      return;
    }

    if (progressRef.current < FLY_DURATION) {
      const t = progressRef.current / FLY_DURATION;
      const eased = 1 - Math.pow(1 - t, 3);
      quadraticBezier(_bezierTemp, startRef.current, controlRef.current, targetPos, eased);
      meshRef.current.position.copy(_bezierTemp);
      const scale = 1 + (targetScale - 1) * eased;
      meshRef.current.scale.setScalar(scale);
      meshRef.current.quaternion.slerpQuaternions(startQuatRef.current, targetQuaternion, eased);
    }
  });

  return (
    <mesh ref={meshRef} position={startPosition}>
      <sphereGeometry args={[BALL_RADIUS, 16, 16]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}
```

**Step 2: Run full test suite**

Run: `pnpm test`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/bingo/BingoBallAnimated.tsx
git commit -m "refactor: make BingoBallAnimated accept target position/scale/quaternion as props"
```

---

### Task 4: Wire `useFrustumLayout` into `BingoScene` and pass computed positions

**Files:**
- Modify: `src/components/bingo/BingoScene.tsx`

**Step 1: Import and use the hook, pass layout to children**

In `BingoScene.tsx`, inside the component (but inside the Canvas, since `useThree` requires R3F context), create an inner component that uses the hook:

Replace the return block of `BingoScene` to use a `SceneContent` inner component that calls `useFrustumLayout`:

```tsx
// Add to imports:
import { useFrustumLayout } from "../../hooks/useFrustumLayout";

// New inner component that has access to R3F context:
function SceneContent({
  phase, setPhase, activeBallNumbers, drawnBalls, selectedBall,
  ballBodiesRef, ballMeshesRef, registerBody, registerMesh,
  selectBall, onAnimationComplete, spinTime, spinSpeed,
}: BingoSceneProps) {
  const layout = useFrustumLayout();
  const { quaternionRef, pointerHandlers, isDragging } = useSphereRotation();
  const lookAtTargetRef = useRef<THREE.Object3D>(null!);

  const [restingBallNumber, setRestingBallNumber] = useState<number | null>(
    () => drawnBalls.length > 0 ? drawnBalls[drawnBalls.length - 1] : null,
  );
  const [departingBallNumber, setDepartingBallNumber] = useState<number | null>(null);

  const prevSelectedRef = useRef<SelectedBall | null>(null);
  useEffect(() => {
    if (selectedBall && !prevSelectedRef.current) {
      if (restingBallNumber !== null) {
        setDepartingBallNumber(restingBallNumber);
        setRestingBallNumber(null);
      }
    }
    prevSelectedRef.current = selectedBall;
  }, [selectedBall, restingBallNumber]);

  const handleAnimationComplete = useCallback(() => {
    if (selectedBall) {
      setRestingBallNumber(selectedBall.number);
    }
    onAnimationComplete();
  }, [selectedBall, onAnimationComplete]);

  const handleDepartComplete = useCallback(() => {
    setDepartingBallNumber(null);
  }, []);

  const ballPositionMap = useMemo(() => {
    const map = new Map<number, [number, number, number]>();
    for (let i = 0; i < 75; i++) {
      map.set(i + 1, INITIAL_POSITIONS[i]);
    }
    return map;
  }, []);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <OrbitingLookAtTarget targetRef={lookAtTargetRef} />
      <Suspense fallback={null}>
        <HoloLogo
          position={layout.logoPosition}
          scale={layout.logoScale}
          targetRef={lookAtTargetRef}
        />
      </Suspense>
      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]}>
          <group position={layout.spherePosition}>
            <PhaseController
              phase={phase} setPhase={setPhase}
              activeBallNumbers={activeBallNumbers}
              ballBodiesRef={ballBodiesRef} ballMeshesRef={ballMeshesRef}
              selectBall={selectBall} quaternionRef={quaternionRef}
              spinTime={spinTime} spinSpeed={spinSpeed}
            />
            <BingoMachine quaternionRef={quaternionRef} />
            {activeBallNumbers.map((num) => (
              <BingoBall
                key={num} number={num}
                initialPosition={ballPositionMap.get(num)!}
                registerBody={registerBody} registerMesh={registerMesh}
              />
            ))}
          </group>
        </Physics>
      </Suspense>

      {restingBallNumber !== null && (
        <LastBallResting
          number={restingBallNumber}
          position={layout.lastBallPosition}
          scale={layout.lastBallScale}
          quaternion={layout.lastBallQuaternion}
        />
      )}

      {departingBallNumber !== null && (
        <LastBallDeparting
          number={departingBallNumber}
          position={layout.lastBallPosition}
          scale={layout.lastBallScale}
          quaternion={layout.lastBallQuaternion}
          onComplete={handleDepartComplete}
        />
      )}

      {selectedBall && (
        <BingoBallAnimated
          number={selectedBall.number}
          startPosition={selectedBall.startPosition}
          startRotation={selectedBall.startRotation}
          targetPosition={layout.lastBallPosition}
          targetScale={layout.lastBallScale}
          targetQuaternion={layout.lastBallQuaternion}
          onComplete={handleAnimationComplete}
        />
      )}
    </>
  );
}

// Slim outer component: just Canvas + pointer handlers
export function BingoScene(props: BingoSceneProps) {
  const { pointerHandlers, isDragging } = useSphereRotation();

  return (
    <Canvas
      camera={{ position: [0, 2, 8], fov: 50 }}
      style={{ touchAction: "none", cursor: isDragging ? "grabbing" : "grab" }}
      {...pointerHandlers}
    >
      <SceneContent {...props} />
    </Canvas>
  );
}
```

Note: `useSphereRotation` is used in both the outer (for pointer handlers + cursor) and inner (for quaternionRef). This needs to be handled — either lift the hook to outer and pass down, or use a context. Simplest: keep it in outer, pass `quaternionRef`, `pointerHandlers`, `isDragging` into `SceneContent` as extra props.

**Step 2: Run the app and verify visually**

Run: `pnpm run dev`
Check: Logo docked top-left, last ball docked top-right, sphere centered

**Step 3: Run tests**

Run: `pnpm test`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/bingo/BingoScene.tsx
git commit -m "feat: wire frustum-based layout into BingoScene"
```

---

### Task 5: Clean up — remove dead exports from LastBall3D

**Files:**
- Modify: `src/components/bingo/LastBall3D.tsx`

**Step 1: Remove old constant exports**

Remove `LAST_BALL_REST_POS`, `LAST_BALL_SCALE`, `LAST_BALL_QUAT` exports since they're no longer imported anywhere.

**Step 2: Verify no remaining imports**

Run: `grep -r "LAST_BALL_REST_POS\|LAST_BALL_SCALE\|LAST_BALL_QUAT" src/`
Expected: No results

**Step 3: Run tests**

Run: `pnpm test`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/bingo/LastBall3D.tsx
git commit -m "chore: remove unused LastBall3D position constants"
```

---

### Task 6: Visual verification and fine-tuning

**Step 1: Run dev server**

Run: `pnpm run dev`

**Step 2: Verify at different resolutions**

- Default browser window
- Resize to narrow (4:3)
- Resize to ultrawide (21:9)
- Check: logo stays docked top-left, last ball stays docked top-right, sphere stays centered

**Step 3: Adjust padding/offsets if needed**

Tweak `PADDING` constant in `useFrustumLayout.ts` if spacing looks off. Tweak `sphereY` offset if sphere vertical centering needs adjustment.

**Step 4: Final commit if tuning was needed**

```bash
git add src/hooks/useFrustumLayout.ts
git commit -m "fix: fine-tune frustum layout padding and offsets"
```
