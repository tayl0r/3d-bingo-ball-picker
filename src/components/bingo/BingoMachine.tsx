import { useMemo } from "react";
import { RigidBody, MeshCollider } from "@react-three/rapier";
import * as THREE from "three";
import { createInvertedSphereGeometry } from "../../utils/sphereContainerGeometry";

const CONTAINER_RADIUS = 3;

export function BingoMachine() {
  const invertedGeo = useMemo(
    () => createInvertedSphereGeometry(CONTAINER_RADIUS, 3),
    []
  );

  return (
    <>
      {/* Physics collider - inverted trimesh, invisible */}
      <RigidBody type="fixed" colliders={false}>
        <MeshCollider type="trimesh">
          <mesh geometry={invertedGeo}>
            <meshBasicMaterial visible={false} />
          </mesh>
        </MeshCollider>
      </RigidBody>

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
    </>
  );
}

export { CONTAINER_RADIUS };
