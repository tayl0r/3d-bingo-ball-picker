import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

interface RotatingMeshProps {
  position: [number, number, number];
  rotationSpeeds: { x: number; y: number; z: number };
  children: React.ReactNode;
}

export function RotatingMesh({
  position,
  rotationSpeeds,
  children,
}: RotatingMeshProps) {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += rotationSpeeds.x * delta;
    meshRef.current.rotation.y += rotationSpeeds.y * delta;
    meshRef.current.rotation.z += rotationSpeeds.z * delta;
  });

  return (
    <mesh ref={meshRef} position={position}>
      {children}
    </mesh>
  );
}
