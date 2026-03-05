import { Suspense, useMemo, useRef, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { BingoMachine } from "./BingoMachine";
import { BingoBall } from "./BingoBall";
import { BingoBallAnimated } from "./BingoBallAnimated";
import { LastBallResting, LastBallDeparting } from "./LastBall3D";
import { HoloLogo, OrbitingLookAtTarget } from "./HoloLogo";
import { PaddleCursor } from "./PaddleCursor";
import type { GamePhase, SelectedBall, SpinMode } from "../../hooks/useBingoGameState";
import { useSphereRotation } from "../../hooks/useSphereRotation";
import { useFrustumLayout } from "../../hooks/useFrustumLayout";
import { soundManager } from "../../audio/soundManager";
import { DEFAULT_STRENGTH } from "./SpinStyleSelector";
import { mulberry32 } from "../../utils/seededRng";

function generateBallPositions(count: number, maxRadius: number): [number, number, number][] {
  const positions: [number, number, number][] = [];
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  for (let i = 0; i < count; i++) {
    const theta = (2 * Math.PI * i) / goldenRatio;
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
    const r = maxRadius * Math.cbrt((i + 0.5) / count);
    positions.push([
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
    ]);
  }
  return positions;
}

const BALL_SPAWN_RADIUS = 2.0;
const INITIAL_POSITIONS = generateBallPositions(75, BALL_SPAWN_RADIUS);
const BASE_SPIN_SPEED = 3;
export const AUTO_SPIN_SPEED = DEFAULT_STRENGTH;
const TICK_INTERVAL = 1.2;
const AUTO_SPIN_SOUND_DURATION = 3;       // seconds of spin tick sound after auto-mix starts
const AUTO_RESTART_DELAY_FACTOR = 500;    // ms per spinTime unit (Quick=2→1s, Medium=5→2.5s, Long=10→5s)
const EASE_IN_DURATION = 0.5;             // seconds for cubic ease-in on auto-mix start
const EASE_IN_RAMP = 0.2;                 // fraction of spin time for ease-in ramp
const EASE_OUT_RAMP = 0.6;                // fraction of spin time for ease-out (slowdown) ramp
const SETTLE_SPEED_THRESHOLD = 0.5;       // ball speed below which it's considered settled
const SETTLE_TIMEOUT = 2;                 // seconds before forcing settle
const SETTLE_CONFIRMATION_DELAY = 0;      // seconds balls must stay settled before selecting

const SPIN_X_MAGNITUDE = 1.65;
const SPIN_YZ_AMPLITUDE = 0.4;
const SPIN_YZ_PERIOD = 10;

const _worldPos = new THREE.Vector3();
const _xAxis = new THREE.Vector3(1, 0, 0);
const _yAxis = new THREE.Vector3(0, 1, 0);
const _zAxis = new THREE.Vector3(0, 0, 1);
const _spinScratch = new THREE.Quaternion();

/** Apply per-axis rotation to the sphere quaternion and update the debug axis display. */
function applySpinRotation(
  sx: number, sy: number, sz: number, speed: number,
  quaternionRef: React.MutableRefObject<THREE.Quaternion>,
  spinDebugRef: React.MutableRefObject<THREE.Vector3>,
) {
  spinDebugRef.current.set(sx, sy, sz);
  _spinScratch.setFromAxisAngle(_xAxis, sx * speed);
  quaternionRef.current.premultiply(_spinScratch);
  _spinScratch.setFromAxisAngle(_yAxis, sy * speed);
  quaternionRef.current.premultiply(_spinScratch);
  _spinScratch.setFromAxisAngle(_zAxis, sz * speed);
  quaternionRef.current.premultiply(_spinScratch);
}

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
  spinMode: SpinMode;
  spinDebugRef: React.MutableRefObject<THREE.Vector3>;
  gameSeed: number;
  drawCount: number;
}

function PhaseController({
  phase,
  setPhase,
  activeBallNumbers,
  ballBodiesRef,
  ballMeshesRef,
  selectBall,
  quaternionRef,
  spinTime,
  spinSpeed,
  spinMode,
  spinDebugRef,
  gameSeed,
  drawCount,
}: PhaseControllerProps) {
  const mixStartRef = useRef<number | null>(null);

  const spinTimeSnapshotRef = useRef(0);
  const spinSpeedSnapshotRef = useRef(0);
  const settleStartRef = useRef<number | null>(null);
  const settledAtRef = useRef<number | null>(null);
  const transitionedRef = useRef(false);
  const spinDistanceRef = useRef(0);
  const autoMixStartRef = useRef<number | null>(null);
  const fromAutoMixRef = useRef(false);
  const autoMixElapsedRef = useRef(0);
  // Per-spin axis randomization
  const spinXSignRef = useRef(1);
  const spinYPhaseRef = useRef(0);
  const spinZPhaseRef = useRef(0);

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

  // Auto-spin phase management: handles auto-restart after draw
  // and live spinMode toggling. When auto+idle, delays then spins.
  // When manual+auto-mixing, snaps to idle immediately.
  useEffect(() => {
    if (spinMode === "manual" && phase === "auto-mixing") {
      setPhase("idle");
      return;
    }
    if ((spinMode === "auto" || spinMode === "auto-random") && phase === "idle") {
      const timer = setTimeout(() => {
        setPhase("auto-mixing");
      }, spinTime * AUTO_RESTART_DELAY_FACTOR);
      return () => clearTimeout(timer);
    }
  }, [phase, spinMode, spinTime, setPhase]);

  useFrame(({ clock, camera }, delta) => {
    if (transitionedRef.current) return;

    const now = clock.elapsedTime;
    const bodies = ballBodiesRef.current;

    // Y/Z use absolute clock time for continuous sine waves across phase transitions
    const sy = SPIN_YZ_AMPLITUDE * Math.sin(spinYPhaseRef.current + (now / SPIN_YZ_PERIOD) * Math.PI * 2);
    const sz = SPIN_YZ_AMPLITUDE * Math.sin(spinZPhaseRef.current + (now / SPIN_YZ_PERIOD) * Math.PI * 2);

    if (phase === "auto-mixing") {
      if (autoMixStartRef.current === null) {
        autoMixStartRef.current = now;
        spinDistanceRef.current = 0;
        // Only randomize X direction on resume; keep Y/Z continuous
        spinXSignRef.current = Math.random() < 0.5 ? -1 : 1;
      }

      const elapsed = now - autoMixStartRef.current;
      autoMixElapsedRef.current = elapsed;

      const factor = elapsed < EASE_IN_DURATION
        ? Math.pow(elapsed / EASE_IN_DURATION, 3)
        : 1;

      const sx = spinXSignRef.current * SPIN_X_MAGNITUDE;
      const effectiveSpeed = spinMode === "auto-random" ? spinSpeed * 0.5 : spinSpeed;
      const globalSpeed = factor * BASE_SPIN_SPEED * effectiveSpeed * delta;
      applySpinRotation(sx, sy, sz, globalSpeed, quaternionRef, spinDebugRef);

      // Only play spin sound for the first few seconds of auto-mixing
      if (elapsed <= AUTO_SPIN_SOUND_DURATION) {
        const totalAngle = (Math.abs(sx) + Math.abs(sy) + Math.abs(sz)) * globalSpeed;
        spinDistanceRef.current += totalAngle;
        if (spinDistanceRef.current >= TICK_INTERVAL) {
          spinDistanceRef.current -= TICK_INTERVAL;
          soundManager.playSpinTick();
        }
      }

      return;
    }

    if (phase === "mixing") {
      if (mixStartRef.current === null) {
        mixStartRef.current = now;
        spinTimeSnapshotRef.current = spinTime;
        spinSpeedSnapshotRef.current = spinSpeed;

        if (fromAutoMixRef.current) {
          // Coming from auto-mixing: inherit axis randomization, calculate time offset
          const autoElapsed = autoMixElapsedRef.current;
          if (autoElapsed >= spinTimeSnapshotRef.current) {
            mixStartRef.current = now - ((1 - EASE_OUT_RAMP) * spinTimeSnapshotRef.current);
          } else {
            mixStartRef.current = now - autoElapsed;
          }
          fromAutoMixRef.current = false;
        } else {
          // Fresh manual spin: randomize axis values
          spinXSignRef.current = Math.random() < 0.5 ? -1 : 1;
          spinYPhaseRef.current = Math.random() * Math.PI * 2;
          spinZPhaseRef.current = Math.random() * Math.PI * 2;
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
      if (t < EASE_IN_RAMP) {
        const s = t / EASE_IN_RAMP;
        factor = s * s * s;
      } else if (t < 1 - EASE_OUT_RAMP) {
        factor = 1;
      } else {
        const s = 1 - (t - (1 - EASE_OUT_RAMP)) / EASE_OUT_RAMP;
        factor = s * s * s;
      }

      const sx = spinXSignRef.current * SPIN_X_MAGNITUDE;
      const globalSpeed = factor * BASE_SPIN_SPEED * spinSpeedSnapshotRef.current * delta;
      applySpinRotation(sx, sy, sz, globalSpeed, quaternionRef, spinDebugRef);

      const totalAngle = (Math.abs(sx) + Math.abs(sy) + Math.abs(sz)) * globalSpeed;
      spinDistanceRef.current += totalAngle;
      if (spinDistanceRef.current >= TICK_INTERVAL) {
        spinDistanceRef.current -= TICK_INTERVAL;
        soundManager.playSpinTick();
      }
    }

    if (phase === "settling") {
      if (settleStartRef.current === null) {
        settleStartRef.current = now;
      }
      const settleElapsed = now - settleStartRef.current;
      let allSettled = true;

      for (const num of activeBallNumbers) {
        const body = bodies.get(num);
        if (body) {
          const vel = body.linvel();
          const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);
          if (speed > SETTLE_SPEED_THRESHOLD) {
            allSettled = false;
            break;
          }
        }
      }

      if (allSettled || settleElapsed > SETTLE_TIMEOUT) {
        if (settledAtRef.current === null) {
          settledAtRef.current = now;
        }
        if (now - settledAtRef.current >= SETTLE_CONFIRMATION_DELAY) {
          settleStartRef.current = null;
          settledAtRef.current = null;
          transitionedRef.current = true;
          setPhase("selecting");
        }
      } else {
        settledAtRef.current = null;
      }
    }

    if (phase === "selecting") {
      const meshes = ballMeshesRef.current;
      let closestNum = -1;
      let closestPos: [number, number, number] = [0, 0, 0];
      let closestMesh: THREE.Mesh | null = null;

      if (spinMode === "auto-random") {
        // Seeded random selection
        const rng = mulberry32(gameSeed);
        for (let i = 0; i < drawCount; i++) rng(); // advance past previous draws
        const idx = Math.floor(rng() * activeBallNumbers.length);
        closestNum = activeBallNumbers[idx];
        const mesh = meshes.get(closestNum);
        if (mesh) {
          mesh.getWorldPosition(_worldPos);
          closestPos = [_worldPos.x, _worldPos.y, _worldPos.z];
          closestMesh = mesh;
        }
      } else {
        // Closest-to-camera selection
        const camPos = camera.position;
        let closestDist = Infinity;
        for (const num of activeBallNumbers) {
          const mesh = meshes.get(num);
          if (mesh) {
            mesh.getWorldPosition(_worldPos);
            const dx = _worldPos.x - camPos.x, dy = _worldPos.y - camPos.y, dz = _worldPos.z - camPos.z;
            const dist = dx * dx + dy * dy + dz * dz;
            if (dist < closestDist) {
              closestDist = dist;
              closestNum = num;
              closestPos = [_worldPos.x, _worldPos.y, _worldPos.z];
              closestMesh = mesh;
            }
          }
        }
      }

      transitionedRef.current = true;
      if (closestNum !== -1 && closestMesh) {
        const wq = closestMesh.getWorldQuaternion(new THREE.Quaternion());
        selectBall(closestNum, closestPos, [wq.x, wq.y, wq.z, wq.w]);
      } else {
        setPhase("idle");
      }
    }
  });

  return null;
}

const AXLE_HALF_LEN = 3.0; // matches sphere radius

function SpinAxisLine({ spinDebugRef }: { spinDebugRef: React.MutableRefObject<THREE.Vector3> }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const _axis = useMemo(() => new THREE.Vector3(), []);
  const _up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const _quat = useMemo(() => new THREE.Quaternion(), []);

  useFrame(() => {
    const v = spinDebugRef.current;
    if (v.lengthSq() === 0) return;
    _axis.copy(v).normalize();
    _quat.setFromUnitVectors(_up, _axis);
    meshRef.current.quaternion.copy(_quat);
  });

  return (
    <mesh ref={meshRef}>
      <cylinderGeometry args={[0.005, 0.005, AXLE_HALF_LEN * 2, 4]} />
      <meshBasicMaterial wireframe color="#4488ff" transparent opacity={0.12} />
    </mesh>
  );
}

interface BingoSceneProps {
  phase: GamePhase;
  setPhase: (p: GamePhase) => void;
  activeBallNumbers: number[];
  drawnBalls: number[];
  selectedBall: SelectedBall | null;
  ballBodiesRef: React.MutableRefObject<Map<number, RapierRigidBody>>;
  ballMeshesRef: React.MutableRefObject<Map<number, THREE.Mesh>>;
  registerBody: (num: number, body: RapierRigidBody | null) => void;
  registerMesh: (num: number, mesh: THREE.Mesh | null) => void;
  selectBall: (num: number, position: [number, number, number], rotation: [number, number, number, number]) => void;
  onAnimationComplete: () => void;
  spinTime: number;
  spinSpeed: number;
  spinMode: SpinMode;
  logoUrl?: string;
  logoAspect?: number;
  paddleEnabled?: boolean;
  gameSeed: number;
  drawCount: number;
}

interface SceneContentProps extends BingoSceneProps {
  quaternionRef: React.MutableRefObject<THREE.Quaternion>;
  isDraggingRef: React.RefObject<boolean>;
}

function SceneContent({
  phase,
  setPhase,
  activeBallNumbers,
  drawnBalls,
  selectedBall,
  ballBodiesRef,
  ballMeshesRef,
  registerBody,
  registerMesh,
  selectBall,
  onAnimationComplete,
  spinTime,
  spinSpeed,
  spinMode,
  quaternionRef,
  isDraggingRef,
  logoUrl,
  logoAspect,
  paddleEnabled,
  gameSeed,
  drawCount,
}: SceneContentProps) {
  const layout = useFrustumLayout();
  const lookAtTargetRef = useRef<THREE.Object3D>(null!);
  const spinDebugRef = useRef(new THREE.Vector3());

  // Last ball state: resting (static display) and departing (flying off screen)
  const [restingBallNumber, setRestingBallNumber] = useState<number | null>(
    () => drawnBalls.length > 0 ? drawnBalls[drawnBalls.length - 1] : null,
  );
  const [departingBallNumber, setDepartingBallNumber] = useState<number | null>(null);

  // When a new ball is selected (animating in), start departing the old resting ball
  const prevSelectedRef = useRef<SelectedBall | null>(null);
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

  // Wrap onAnimationComplete to also set the new resting ball
  const handleAnimationComplete = useCallback(() => {
    soundManager.playBallLand(selectedBall?.number);
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
      <HoloLogo
        position={layout.logoPosition}
        scale={layout.logoScale}
        targetRef={lookAtTargetRef}
        logoUrl={logoUrl}
        logoAspect={logoAspect}
      />
      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]}>
          <group position={layout.spherePosition}>
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
              spinDebugRef={spinDebugRef}
              gameSeed={gameSeed}
              drawCount={drawCount}
            />
            <BingoMachine quaternionRef={quaternionRef} />
            <SpinAxisLine spinDebugRef={spinDebugRef} />
            {activeBallNumbers.map((num) => (
              <BingoBall
                key={num}
                number={num}
                initialPosition={ballPositionMap.get(num)!}
                registerBody={registerBody}
                registerMesh={registerMesh}
              />
            ))}
            {spinMode === "auto" && (
              <PaddleCursor
                isDraggingRef={isDraggingRef}
                groupPosition={layout.spherePosition}
                quaternionRef={quaternionRef}
                fixed
              />
            )}
            {(spinMode === "manual" || spinMode === "auto-random") && paddleEnabled && phase !== "settling" && phase !== "selecting" && (
              <PaddleCursor
                isDraggingRef={isDraggingRef}
                groupPosition={layout.spherePosition}
                quaternionRef={quaternionRef}
              />
            )}
          </group>
        </Physics>
      </Suspense>

      {/* Resting "last ball" 3D display */}
      {restingBallNumber !== null && (
        <LastBallResting
          number={restingBallNumber}
          position={layout.lastBallPosition}
          scale={layout.lastBallScale}
          quaternion={layout.lastBallQuaternion}
        />
      )}

      {/* Departing old ball flying off screen */}
      {departingBallNumber !== null && (
        <LastBallDeparting
          number={departingBallNumber}
          position={layout.lastBallPosition}
          scale={layout.lastBallScale}
          quaternion={layout.lastBallQuaternion}
          onComplete={handleDepartComplete}
        />
      )}

      {/* New ball flying to rest position */}
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

export function BingoScene(props: BingoSceneProps) {
  const { quaternionRef, pointerHandlers, isDragging, isDraggingRef } = useSphereRotation();

  return (
    <Canvas
      camera={{ position: [0, 2, 8], fov: 50 }}
      resize={{ offsetSize: true }}
      style={{ touchAction: "none", cursor: isDragging ? "grabbing" : "grab" }}
      {...pointerHandlers}
    >
      <SceneContent {...props} quaternionRef={quaternionRef} isDraggingRef={isDraggingRef} />
    </Canvas>
  );
}
