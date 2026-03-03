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

// -- PhaseController: drives game loop inside Physics --

interface PhaseControllerProps {
  phase: GamePhase;
  setPhase: (p: GamePhase) => void;
  activeBallNumbers: number[];
  ballBodiesRef: React.MutableRefObject<Map<number, RapierRigidBody>>;
  selectBall: (num: number, position: [number, number, number]) => void;
  quaternionRef: React.MutableRefObject<THREE.Quaternion>;
  spinTime: number;
  spinSpeed: number;
}

function PhaseController({
  phase,
  setPhase,
  activeBallNumbers,
  ballBodiesRef,
  selectBall,
  quaternionRef: _quaternionRef,
  spinTime: _spinTime,
  spinSpeed: _spinSpeed,
}: PhaseControllerProps) {
  const mixStartRef = useRef<number | null>(null);
  const lastImpulseRef = useRef<number | null>(null);
  const settleStartRef = useRef<number | null>(null);
  // Guard: prevents firing phase transitions multiple frames before React re-renders
  const transitionedRef = useRef(false);

  // Clear the guard when phase actually changes (React re-rendered with new prop)
  useEffect(() => {
    transitionedRef.current = false;
  }, [phase]);

  useFrame(({ clock }) => {
    if (transitionedRef.current) return;

    const now = clock.elapsedTime;
    const bodies = ballBodiesRef.current;

    if (phase === "mixing") {
      // Initialize on first frame of mixing
      if (mixStartRef.current === null) {
        mixStartRef.current = now;
        lastImpulseRef.current = null;
      }

      const elapsed = now - mixStartRef.current;

      // Apply impulses every 0.25s
      if (lastImpulseRef.current === null || now - lastImpulseRef.current >= 0.25) {
        lastImpulseRef.current = now;
        const nums = [...activeBallNumbers];
        for (let i = 0; i < Math.min(5, nums.length); i++) {
          const idx = Math.floor(Math.random() * nums.length);
          const num = nums.splice(idx, 1)[0];
          const body = bodies.get(num);
          if (body) {
            const strength = 15 + Math.random() * 10;
            const dir = {
              x: (Math.random() - 0.5) * 2,
              y: (Math.random() - 0.5) * 2,
              z: (Math.random() - 0.5) * 2,
            };
            const len = Math.sqrt(dir.x ** 2 + dir.y ** 2 + dir.z ** 2) || 1;
            body.applyImpulse(
              {
                x: (dir.x / len) * strength,
                y: (dir.y / len) * strength,
                z: (dir.z / len) * strength,
              },
              true
            );
          }
        }
      }

      // After 5 seconds, move to settling
      if (elapsed >= 5) {
        mixStartRef.current = null;
        transitionedRef.current = true;
        setPhase("settling");
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
      let lowestY = Infinity;
      let lowestNum = -1;
      let lowestPos: [number, number, number] = [0, 0, 0];

      for (const num of activeBallNumbers) {
        const body = bodies.get(num);
        if (body) {
          const pos = body.translation();
          if (pos.y < lowestY) {
            lowestY = pos.y;
            lowestNum = num;
            lowestPos = [pos.x, pos.y, pos.z];
          }
        }
      }

      transitionedRef.current = true;
      if (lowestNum !== -1) {
        selectBall(lowestNum, lowestPos);
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
  registerBody: (num: number, body: RapierRigidBody | null) => void;
  selectBall: (num: number, position: [number, number, number]) => void;
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
  registerBody,
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
          <PhaseController
            phase={phase}
            setPhase={setPhase}
            activeBallNumbers={activeBallNumbers}
            ballBodiesRef={ballBodiesRef}
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
            />
          ))}
        </Physics>
      </Suspense>
      {selectedBall && (
        <BingoBallAnimated
          number={selectedBall.number}
          startPosition={selectedBall.startPosition}
          onComplete={onAnimationComplete}
        />
      )}
    </Canvas>
  );
}
