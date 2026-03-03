import { useMemo, useRef } from "react";
import { RigidBody, MeshCollider } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createInvertedSphereGeometry } from "../../utils/sphereContainerGeometry";

const CONTAINER_RADIUS = 3;

interface BingoMachineProps {
  quaternionRef: React.RefObject<THREE.Quaternion>;
}

export function BingoMachine({ quaternionRef }: BingoMachineProps) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const invertedGeo = useMemo(
    () => createInvertedSphereGeometry(CONTAINER_RADIUS, 3),
    []
  );

  useFrame(() => {
    if (bodyRef.current && quaternionRef.current) {
      const q = quaternionRef.current;
      bodyRef.current.setNextKinematicRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
    }
  });

  return (
    <RigidBody ref={bodyRef} type="kinematicPosition" colliders={false}>
      {/* Physics collider - inverted trimesh */}
      <MeshCollider type="trimesh">
        <mesh geometry={invertedGeo}>
          <meshBasicMaterial visible={false} />
        </mesh>
      </MeshCollider>

      {/* Visible wireframe */}
      <mesh>
        <sphereGeometry args={[CONTAINER_RADIUS, 24, 24]} />
        <meshBasicMaterial
          wireframe
          color="#4488ff"
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Faint solid for depth */}
      <mesh>
        <sphereGeometry args={[CONTAINER_RADIUS, 24, 24]} />
        <meshStandardMaterial
          color="#4488ff"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </mesh>
    </RigidBody>
  );
}

export { CONTAINER_RADIUS };
