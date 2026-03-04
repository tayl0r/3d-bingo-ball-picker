import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, BallCollider } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";

const PADDLE_RADIUS = 0.9;
const SPHERE_RADIUS = 3.0;
const MAX_OFFSET = SPHERE_RADIUS - PADDLE_RADIUS - 0.05;
const HIDDEN_POS = { x: 0, y: -100, z: 0 };

const _rayOrigin = new THREE.Vector3();
const _rayDir = new THREE.Vector3();
const _unprojectTarget = new THREE.Vector3();

interface PaddleCursorProps {
  isDraggingRef: React.RefObject<boolean>;
  groupPosition: [number, number, number];
  fixed?: boolean;
}

export function PaddleCursor({ isDraggingRef, groupPosition, fixed }: PaddleCursorProps) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const wasActiveRef = useRef(false);

  useFrame((state) => {
    const body = bodyRef.current;
    if (!body) return;

    // Fixed mode: place paddle at the bottom of the sphere
    if (fixed) {
      const bottomPos = {
        x: groupPosition[0],
        y: groupPosition[1] - MAX_OFFSET,
        z: groupPosition[2],
      };
      if (!wasActiveRef.current) {
        body.setTranslation(bottomPos, true);
        wasActiveRef.current = true;
      } else {
        body.setNextKinematicTranslation(bottomPos);
      }
      return;
    }

    if (isDraggingRef.current) {
      if (wasActiveRef.current) {
        body.setTranslation(HIDDEN_POS, false);
        wasActiveRef.current = false;
      }
      return;
    }

    const { pointer, camera } = state;

    // Build ray from camera through pointer
    _rayOrigin.copy(camera.position);
    _unprojectTarget.set(pointer.x, pointer.y, 0.5).unproject(camera);
    _rayDir.subVectors(_unprojectTarget, camera.position).normalize();

    // Intersect ray with the Z-plane through the sphere center
    const targetZ = groupPosition[2];
    if (Math.abs(_rayDir.z) < 1e-10) {
      // Ray parallel to plane — hide paddle
      if (wasActiveRef.current) {
        body.setTranslation(HIDDEN_POS, false);
        wasActiveRef.current = false;
      }
      return;
    }

    const t = (targetZ - _rayOrigin.z) / _rayDir.z;
    if (t < 0) {
      if (wasActiveRef.current) {
        body.setTranslation(HIDDEN_POS, false);
        wasActiveRef.current = false;
      }
      return;
    }

    // Hit point on the Z-plane (world space)
    let hx = _rayOrigin.x + _rayDir.x * t;
    let hy = _rayOrigin.y + _rayDir.y * t;

    // Offset from sphere center (X/Y only)
    const dx = hx - groupPosition[0];
    const dy = hy - groupPosition[1];
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > SPHERE_RADIUS) {
      // Pointer is outside the sphere — hide paddle
      if (wasActiveRef.current) {
        body.setTranslation(HIDDEN_POS, false);
        wasActiveRef.current = false;
      }
      return;
    }

    // Clamp so paddle stays fully inside the sphere
    if (dist > MAX_OFFSET) {
      const scale = MAX_OFFSET / dist;
      hx = groupPosition[0] + dx * scale;
      hy = groupPosition[1] + dy * scale;
    }

    const worldPos = { x: hx, y: hy, z: targetZ };

    if (!wasActiveRef.current) {
      body.setTranslation(worldPos, true);
      wasActiveRef.current = true;
    } else {
      body.setNextKinematicTranslation(worldPos);
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      position={[0, -100, 0]}
      colliders={false}
      ccd
    >
      <BallCollider args={[PADDLE_RADIUS]} />
      <mesh>
        <sphereGeometry args={[PADDLE_RADIUS, 16, 16]} />
        <meshStandardMaterial color="#c8b832" transparent opacity={0.6} wireframe />
      </mesh>
    </RigidBody>
  );
}
