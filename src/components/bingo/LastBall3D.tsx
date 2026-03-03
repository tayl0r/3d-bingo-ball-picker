import { useRef, useCallback, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createBallTexture } from "../../utils/ballTexture";
import { BALL_RADIUS } from "./BingoBall";

// Shared constants for the "last ball" display position (right side of viewport)
export const LAST_BALL_REST_POS = new THREE.Vector3(2.25, 2.35, 5);
export const LAST_BALL_SCALE = 0.96;

// Quaternion that faces the camera from the rest position, then rotated a quarter turn right
const _camPos = new THREE.Vector3(0, 2, 8);
const _dir = _camPos.clone().sub(LAST_BALL_REST_POS).normalize();
const _quarterRight = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
export const LAST_BALL_QUAT = new THREE.Quaternion()
  .setFromUnitVectors(new THREE.Vector3(0, 0, 1), _dir)
  .premultiply(_quarterRight);

interface LastBallRestingProps {
  number: number;
  position: [number, number, number];
  scale: number;
  quaternion: THREE.Quaternion;
}

/**
 * Static 3D ball sitting at the "last ball" rest position.
 */
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

/**
 * Ball that flies off screen from the rest position when a new ball is incoming.
 */
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

    // Fade out
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
