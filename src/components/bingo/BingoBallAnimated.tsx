import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createBallTexture } from "../../utils/ballTexture";
import { BALL_RADIUS } from "./BingoBall";

interface BingoBallAnimatedProps {
  number: number;
  startPosition: [number, number, number];
  startRotation: [number, number, number, number];
  onComplete: () => void;
}

const TARGET = new THREE.Vector3(0, 1.5, 6);
const DIP_Y = -2; // how far below the midpoint the curve dips
const FLY_DURATION = 2.0;
const HOLD_DURATION = 1.0;
const _targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 16, -Math.PI / 2, 0));
const _bezierTemp = new THREE.Vector3();

// Quadratic bezier: P(t) = (1-t)²·P0 + 2(1-t)t·P1 + t²·P2
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
  // Control point at the midpoint x/z, dipping below in y
  return new THREE.Vector3(
    (start.x + target.x) / 2,
    Math.min(start.y, target.y) + DIP_Y,
    (start.z + target.z) / 2,
  );
}

export function BingoBallAnimated({ number, startPosition, startRotation, onComplete }: BingoBallAnimatedProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);
  const startRef = useRef(new THREE.Vector3(...startPosition));
  const controlRef = useRef(computeControl(new THREE.Vector3(...startPosition), TARGET));
  const startQuatRef = useRef(new THREE.Quaternion(...startRotation));
  const texture = createBallTexture(number);
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
      quadraticBezier(_bezierTemp, startRef.current, controlRef.current, TARGET, eased);
      meshRef.current.position.copy(_bezierTemp);
      const scale = 1 + 1.5 * eased; // scale 1x -> 2.5x
      meshRef.current.scale.setScalar(scale);
      meshRef.current.quaternion.slerpQuaternions(startQuatRef.current, _targetQuat, eased);
    }
  });

  return (
    <mesh ref={meshRef} position={startPosition}>
      <sphereGeometry args={[BALL_RADIUS, 16, 16]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}
