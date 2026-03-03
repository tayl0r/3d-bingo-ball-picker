import { memo, useEffect, useRef, useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { createBallTexture } from "../../utils/ballTexture";

const BALL_RADIUS = 0.25;

interface BingoBallProps {
  number: number;
  initialPosition: [number, number, number];
  registerBody: (num: number, body: RapierRigidBody | null) => void;
}

export const BingoBall = memo(function BingoBall({ number, initialPosition, registerBody }: BingoBallProps) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const registeredRef = useRef(false);
  const texture = useMemo(() => createBallTexture(number), [number]);

  useFrame(() => {
    if (bodyRef.current && !registeredRef.current) {
      registeredRef.current = true;
      registerBody(number, bodyRef.current);
    }
  });

  useEffect(() => {
    return () => {
      registeredRef.current = false;
      registerBody(number, null);
    };
  }, [number, registerBody]);

  return (
    <RigidBody
      ref={bodyRef}
      type="dynamic"
      colliders="ball"
      position={initialPosition}
      restitution={0.3}
      linearDamping={0.5}
      angularDamping={0.5}
      ccd={true}
    >
      <mesh>
        <sphereGeometry args={[BALL_RADIUS, 16, 16]} />
        <meshStandardMaterial map={texture} />
      </mesh>
    </RigidBody>
  );
});

export { BALL_RADIUS };
