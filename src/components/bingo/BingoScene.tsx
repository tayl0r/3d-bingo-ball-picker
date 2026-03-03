import { Suspense, useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { BingoMachine } from "./BingoMachine";
import { BingoBall } from "./BingoBall";
import { BingoBallAnimated } from "./BingoBallAnimated";
import { HoloLogo, OrbitingLookAtTarget } from "./HoloLogo";
import type { GamePhase, SelectedBall } from "../../hooks/useBingoGameState";
import { useSphereRotation } from "../../hooks/useSphereRotation";

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

const INITIAL_POSITIONS = generateBallPositions(75, 2.0);

const SPIN_AXIS = Object.freeze(new THREE.Vector3(1, 0, 1).normalize());
const _worldPos = new THREE.Vector3();

// -- PhaseController: drives game loop inside Physics --

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
  const spinQuatRef = useRef(new THREE.Quaternion());
  const spinTimeSnapshotRef = useRef(0);
  const spinSpeedSnapshotRef = useRef(0);
  const settleStartRef = useRef<number | null>(null);
  // Guard: prevents firing phase transitions multiple frames before React re-renders
  const transitionedRef = useRef(false);

  // Clear the guard when phase actually changes (React re-rendered with new prop)
  useEffect(() => {
    transitionedRef.current = false;
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
      }

      const elapsed = now - mixStartRef.current;
      const t = elapsed / spinTimeSnapshotRef.current;

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
      const angle = factor * baseSpeed * spinSpeedSnapshotRef.current * delta;
      spinQuatRef.current.setFromAxisAngle(SPIN_AXIS, angle);
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

      if (allSettled || settleElapsed > 10) {
        settleStartRef.current = null;
        transitionedRef.current = true;
        setPhase("selecting");
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

// -- BingoScene: main exported component --

interface BingoSceneProps {
  phase: GamePhase;
  setPhase: (p: GamePhase) => void;
  activeBallNumbers: number[];
  selectedBall: SelectedBall | null;
  ballBodiesRef: React.MutableRefObject<Map<number, RapierRigidBody>>;
  ballMeshesRef: React.MutableRefObject<Map<number, THREE.Mesh>>;
  registerBody: (num: number, body: RapierRigidBody | null) => void;
  registerMesh: (num: number, mesh: THREE.Mesh | null) => void;
  selectBall: (num: number, position: [number, number, number], rotation: [number, number, number, number]) => void;
  onAnimationComplete: () => void;
  spinTime: number;
  spinSpeed: number;
}

export function BingoScene({
  phase,
  setPhase,
  activeBallNumbers,
  selectedBall,
  ballBodiesRef,
  ballMeshesRef,
  registerBody,
  registerMesh,
  selectBall,
  onAnimationComplete,
  spinTime,
  spinSpeed,
}: BingoSceneProps) {
  const { quaternionRef, pointerHandlers, isDragging } = useSphereRotation();
  const lookAtTargetRef = useRef<THREE.Object3D>(null!);

  const ballPositionMap = useMemo(() => {
    const map = new Map<number, [number, number, number]>();
    for (let i = 0; i < 75; i++) {
      map.set(i + 1, INITIAL_POSITIONS[i]);
    }
    return map;
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 2, 8], fov: 50 }}
      style={{ touchAction: "none", cursor: isDragging ? "grabbing" : "grab" }}
      {...pointerHandlers}
    >
      {/* Lights outside Suspense so BingoBallAnimated is always lit */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <OrbitingLookAtTarget targetRef={lookAtTargetRef} />
      <Suspense fallback={null}>
        <HoloLogo position={[-4.5, 2.8, -2]} scale={0.7} targetRef={lookAtTargetRef} />
        <HoloLogo position={[4.5, 2.8, -2]} scale={0.7} targetRef={lookAtTargetRef} />
      </Suspense>
      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]}>
          <group position={[0, 0.5, 0]}>
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
          </group>
        </Physics>
      </Suspense>
      {selectedBall && (
        <BingoBallAnimated
          number={selectedBall.number}
          startPosition={selectedBall.startPosition}
          startRotation={selectedBall.startRotation}
          onComplete={onAnimationComplete}
        />
      )}
    </Canvas>
  );
}
