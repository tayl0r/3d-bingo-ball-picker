import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createBallTexture } from "../../utils/ballTexture";
import { BALL_RADIUS } from "./BingoBall";

// Squash-stretch keyframes matching the CSS squash-bounce timing (5s cycle).
// Values amplified ~3x vs CSS since spheres need stronger deformation to be visible.
// Each entry: [time (0-1), scaleXZ, scaleY]
const SQUASH_KEYS: [number, number, number][] = [
  [0.00, 1, 1],
  [0.10, 1.12, 0.88],
  [0.17, 0.91, 1.09],
  [0.23, 1.06, 0.94],
  [0.28, 0.97, 1.03],
  [0.33, 1, 1],
  [1.00, 1, 1],
];
const SQUASH_PERIOD = 5; // seconds, same as CSS animation duration

function sampleSquash(t: number): [number, number] {
  const frac = (t % SQUASH_PERIOD) / SQUASH_PERIOD;
  for (let i = 1; i < SQUASH_KEYS.length; i++) {
    if (frac <= SQUASH_KEYS[i][0]) {
      const prev = SQUASH_KEYS[i - 1];
      const next = SQUASH_KEYS[i];
      const seg = (frac - prev[0]) / (next[0] - prev[0]);
      // ease-in-out per segment
      const e = seg * seg * (3 - 2 * seg);
      return [prev[1] + (next[1] - prev[1]) * e, prev[2] + (next[2] - prev[2]) * e];
    }
  }
  return [1, 1];
}

interface LastBallRestingProps {
  number: number;
  position: [number, number, number];
  scale: number;
  quaternion: THREE.Quaternion;
}

export function LastBallResting({ number, position, scale, quaternion }: LastBallRestingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const texture = useMemo(() => createBallTexture(number), [number]);

  useEffect(() => {
    if (meshRef.current) meshRef.current.quaternion.copy(quaternion);
  }, [quaternion]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    timeRef.current += delta;
    const [sx, sy] = sampleSquash(timeRef.current);
    meshRef.current.scale.set(scale * sx, scale * sy, scale * sx);
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
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

const EXIT_OFFSET = new THREE.Vector3(1.75, 2.65, 2.5);
const DEPART_DURATION = 0.6;

export function LastBallDeparting({ number, position, scale, quaternion, onComplete }: LastBallDepartingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const texture = useMemo(() => createBallTexture(number), [number]);

  const restPos = useMemo(() => new THREE.Vector3(...position), [position]);
  const exitPos = useMemo(() => new THREE.Vector3(...position).add(EXIT_OFFSET), [position]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Set initial quaternion on first frame
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
    const eased = t * t * t; // cubic ease-in (accelerating away)

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
