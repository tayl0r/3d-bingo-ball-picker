import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createBallTexture } from "../../utils/ballTexture";
import { BALL_RADIUS } from "./BingoBall";

interface BingoBallAnimatedProps {
  number: number;
  startPosition: [number, number, number];
  onComplete: () => void;
}

const TARGET = new THREE.Vector3(0, 1, 5);
const FLY_DURATION = 1.5;
const HOLD_DURATION = 1.0;

export function BingoBallAnimated({ number, startPosition, onComplete }: BingoBallAnimatedProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);
  const startRef = useRef(new THREE.Vector3(...startPosition));
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
      meshRef.current.position.lerpVectors(startRef.current, TARGET, eased);
      const scale = 1 + 1.5 * eased; // scale 1x -> 2.5x
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef} position={startPosition}>
      <sphereGeometry args={[BALL_RADIUS, 16, 16]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}
