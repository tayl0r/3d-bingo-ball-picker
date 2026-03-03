import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

// World-space Z coordinates for each element's depth plane
const LOGO_Z = -1;
const LAST_BALL_Z = 5;
const SPHERE_Z = 0;

// Padding as fraction of visible area
const PADDING = 0.05;

// Logo intrinsic dimensions (aspect 744/267 ≈ 2.786, base height 1.8)
const LOGO_ASPECT = 744 / 267;
const LOGO_BASE_HEIGHT = 1.8;

// Ball radius for inset calculation (must match BingoBall.BALL_RADIUS)
const BALL_DISPLAY_RADIUS = 0.25;

export interface FrustumLayout {
  logoPosition: [number, number, number];
  logoScale: number;
  lastBallPosition: [number, number, number];
  lastBallScale: number;
  lastBallQuaternion: THREE.Quaternion;
  spherePosition: [number, number, number];
}

/**
 * Pure function: compute layout from camera params.
 * Exported for testing without R3F context.
 *
 * R3F calls camera.lookAt(0,0,0) by default, so the view center at each Z
 * plane is NOT at (camX, camY) — it's where the center ray hits that plane.
 */
export function computeFrustumLayout(
  cameraPosition: [number, number, number],
  fovDeg: number,
  aspect: number,
  lookAtTarget: [number, number, number] = [0, 0, 0],
): FrustumLayout {
  const [camX, camY, camZ] = cameraPosition;
  const [tX, tY, tZ] = lookAtTarget;
  const fovRad = (fovDeg * Math.PI) / 180;

  // Direction from camera to lookAt target
  const dirX = tX - camX;
  const dirY = tY - camY;
  const dirZ = tZ - camZ;

  const dirLen = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);

  // Helper: where the center ray hits a given world-space Z plane.
  // Assumes all Z planes are in front of the camera (t > 0).
  function centerAt(z: number): { cx: number; cy: number } {
    if (Math.abs(dirZ) < 1e-10) return { cx: camX, cy: camY };
    const t = (z - camZ) / dirZ;
    return { cx: camX + t * dirX, cy: camY + t * dirY };
  }

  // Helper: visible rect size at a given world-space Z coordinate.
  // Uses distance along view direction (not just Z delta) for correctness
  // when the camera is pitched.
  function visibleAt(z: number) {
    if (dirLen < 1e-10) return { w: 0, h: 0 };
    const t = (z - camZ) / dirZ;
    const dist = Math.abs(t) * dirLen;
    if (dist <= 0) return { w: 0, h: 0 };
    const h = 2 * Math.tan(fovRad / 2) * dist;
    const w = h * aspect;
    return { w, h };
  }

  // --- Logo (top-left at LOGO_Z) ---
  const logoCenter = centerAt(LOGO_Z);
  const logoView = visibleAt(LOGO_Z);
  const logoScale = 0.55;
  const logoH = LOGO_BASE_HEIGHT * logoScale;
  const logoW = logoH * LOGO_ASPECT;
  const logoPadX = logoView.w * (PADDING + 0.03);
  const logoPadY = logoView.h * (PADDING + 0.01);
  const logoX = logoCenter.cx - logoView.w / 2 + logoPadX + logoW / 2;
  const logoY = logoCenter.cy + logoView.h / 2 - logoPadY - logoH / 2;

  // --- Last Ball (top-right at LAST_BALL_Z) ---
  const ballCenter = centerAt(LAST_BALL_Z);
  const ballView = visibleAt(LAST_BALL_Z);
  const lastBallScale = 0.96;
  const ballR = BALL_DISPLAY_RADIUS * lastBallScale;
  const ballPadX = ballView.w * (PADDING + 0.05);
  const ballPadY = ballView.h * PADDING;
  const ballX = ballCenter.cx + ballView.w / 2 - ballPadX - ballR;
  const ballY = ballCenter.cy + ballView.h / 2 - ballPadY - ballR;

  // Quaternion: face camera then rotate quarter-turn right
  const restPos = new THREE.Vector3(ballX, ballY, LAST_BALL_Z);
  const camVec = new THREE.Vector3(...cameraPosition);
  const dir = camVec.clone().sub(restPos).normalize();
  const quarterRight = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    -Math.PI / 2,
  );
  const lastBallQuaternion = new THREE.Quaternion()
    .setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir)
    .premultiply(quarterRight);

  // --- Sphere (center at SPHERE_Z) ---
  const sphereCenter = centerAt(SPHERE_Z);
  const sphereView = visibleAt(SPHERE_Z);
  const sphereY = sphereCenter.cy + sphereView.h * 0.05;

  return {
    logoPosition: [logoX, logoY, LOGO_Z],
    logoScale,
    lastBallPosition: [ballX, ballY, LAST_BALL_Z],
    lastBallScale,
    lastBallQuaternion,
    spherePosition: [sphereCenter.cx, sphereY, SPHERE_Z],
  };
}

/**
 * R3F hook: reads camera and recomputes layout on viewport change.
 */
export function useFrustumLayout(): FrustumLayout {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  return useMemo(() => {
    const pos: [number, number, number] = [
      camera.position.x,
      camera.position.y,
      camera.position.z,
    ];
    const aspect = size.width / size.height;

    // Extract where the camera is looking by projecting a point from camera center
    const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const target: [number, number, number] = [
      pos[0] + lookDir.x,
      pos[1] + lookDir.y,
      pos[2] + lookDir.z,
    ];

    const layout = computeFrustumLayout(pos, camera.fov, aspect, target);
    return layout;
  }, [camera.position.x, camera.position.y, camera.position.z, camera.quaternion.x, camera.quaternion.y, camera.quaternion.z, camera.quaternion.w, camera.fov, size.width, size.height]);
}
