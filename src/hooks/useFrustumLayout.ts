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
 */
export function computeFrustumLayout(
  cameraPosition: [number, number, number],
  fovDeg: number,
  aspect: number,
): FrustumLayout {
  const [camX, camY, camZ] = cameraPosition;
  const fovRad = (fovDeg * Math.PI) / 180;

  // Helper: visible rect at a given world-space Z coordinate
  function visibleAt(z: number) {
    const dist = camZ - z; // positive when element is in front of camera
    if (dist <= 0) return { w: 0, h: 0 };
    const h = 2 * Math.tan(fovRad / 2) * dist;
    const w = h * aspect;
    return { w, h };
  }

  // --- Logo (top-left at LOGO_Z) ---
  const logoView = visibleAt(LOGO_Z);
  const logoScale = 0.55; // preserve existing visual scale
  const logoH = LOGO_BASE_HEIGHT * logoScale;
  const logoW = logoH * LOGO_ASPECT;
  const logoPadX = logoView.w * PADDING;
  const logoPadY = logoView.h * PADDING;
  const logoX = camX - logoView.w / 2 + logoPadX + logoW / 2;
  const logoY = camY + logoView.h / 2 - logoPadY - logoH / 2;

  // --- Last Ball (top-right at LAST_BALL_Z) ---
  const ballView = visibleAt(LAST_BALL_Z);
  const lastBallScale = 0.96;
  const ballR = BALL_DISPLAY_RADIUS * lastBallScale;
  const ballPadX = ballView.w * PADDING;
  const ballPadY = ballView.h * PADDING;
  const ballX = camX + ballView.w / 2 - ballPadX - ballR;
  const ballY = camY + ballView.h / 2 - ballPadY - ballR;

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
  const sphereView = visibleAt(SPHERE_Z);
  // Center the sphere in the frustum, offset slightly below center
  // to account for the sphere sitting "on the ground" visually
  const sphereY = camY - sphereView.h * 0.05;

  return {
    logoPosition: [logoX, logoY, LOGO_Z],
    logoScale,
    lastBallPosition: [ballX, ballY, LAST_BALL_Z],
    lastBallScale,
    lastBallQuaternion,
    spherePosition: [camX, sphereY, SPHERE_Z],
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
    return computeFrustumLayout(pos, camera.fov, size.width / size.height);
  }, [camera.position.x, camera.position.y, camera.position.z, camera.fov, size.width, size.height]);
}
