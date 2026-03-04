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
import type { GamePhase, SelectedBall } from "../../hooks/useBingoGameState";
import { useSphereRotation } from "../../hooks/useSphereRotation";
import { useFrustumLayout } from "../../hooks/useFrustumLayout";
import { soundManager } from "../../audio/soundManager";

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

const _worldPos = new THREE.Vector3();

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
}: PhaseControllerProps) {
  const mixStartRef = useRef<number | null>(null);
  const spinAxisRef = useRef(new THREE.Vector3(1, 0.2, 0).normalize());
  const spinQuatRef = useRef(new THREE.Quaternion());
  const spinTimeSnapshotRef = useRef(0);
  const spinSpeedSnapshotRef = useRef(0);
  const settleStartRef = useRef<number | null>(null);
  const settledAtRef = useRef<number | null>(null);
  const transitionedRef = useRef(false);
  const spinDistanceRef = useRef(0);

  useEffect(() => {
    transitionedRef.current = false;
    settledAtRef.current = null;
  }, [phase]);

  useFrame(({ clock, camera }, delta) => {
    if (transitionedRef.current) return;

    const now = clock.elapsedTime;
    const bodies = ballBodiesRef.current;

    if (phase === "mixing") {
      if (mixStartRef.current === null) {
        mixStartRef.current = now;
        spinTimeSnapshotRef.current = spinTime;
        spinSpeedSnapshotRef.current = spinSpeed;
        const theta = Math.random() * Math.PI * 2;
        spinAxisRef.current.set(Math.cos(theta), 0.2, Math.sin(theta)).normalize();
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
          if (speed > 0.5) {
            allSettled = false;
            break;
          }
        }
      }

      if (allSettled || settleElapsed > 5) {
        if (settledAtRef.current === null) {
          settledAtRef.current = now;
        }
        if (now - settledAtRef.current >= 0.25) {
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
      const camPos = camera.position;
      const meshes = ballMeshesRef.current;
      let closestDist = Infinity;
      let closestNum = -1;
      let closestPos: [number, number, number] = [0, 0, 0];
      let closestMesh: THREE.Mesh | null = null;

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
  logoUrl?: string;
  logoAspect?: number;
  paddleEnabled?: boolean;
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
  quaternionRef,
  isDraggingRef,
  logoUrl,
  logoAspect,
  paddleEnabled,
}: SceneContentProps) {
  const layout = useFrustumLayout();
  const lookAtTargetRef = useRef<THREE.Object3D>(null!);

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
            />
            <BingoMachine quaternionRef={quaternionRef} />
            {activeBallNumbers.map((num) => (
              <BingoBall
                key={num}
                number={num}
                initialPosition={ballPositionMap.get(num)!}
                registerBody={registerBody}
                registerMesh={registerMesh}
              />
            ))}
            {paddleEnabled && phase !== "settling" && phase !== "selecting" && (
              <PaddleCursor
                isDraggingRef={isDraggingRef}
                groupPosition={layout.spherePosition}
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
