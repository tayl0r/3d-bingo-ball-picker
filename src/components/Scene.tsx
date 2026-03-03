import { useRef } from "react";
import { RotatingMesh } from "./RotatingMesh";

function randomSpeed() {
  const speed = (Math.random() - 0.5) * 2; // range: -1 to 1
  return Math.abs(speed) < 0.3 ? (speed < 0 ? -0.3 : 0.3) : speed;
}

export function Scene() {
  const rotationSpeeds = useRef({
    x: randomSpeed(),
    y: randomSpeed(),
    z: randomSpeed(),
  }).current;

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1} />

      <RotatingMesh position={[-2, 0, 0]} rotationSpeeds={rotationSpeeds}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#6c63ff" />
      </RotatingMesh>

      <RotatingMesh position={[2, 0, 0]} rotationSpeeds={rotationSpeeds}>
        <torusGeometry args={[0.8, 0.35, 16, 32]} />
        <meshStandardMaterial color="#ff6584" />
      </RotatingMesh>
    </>
  );
}
