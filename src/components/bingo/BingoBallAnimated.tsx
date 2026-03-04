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

export function BingoBallAnimated({ number, startPosition, startRotation, targetPosition, targetScale, targetQuaternion, onComplete }: BingoBallAnimatedProps) {
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
      const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
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
