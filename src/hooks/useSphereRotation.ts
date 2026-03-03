import { useRef, useCallback, useState } from "react";
import * as THREE from "three";

const ROTATION_SPEED = 0.007; // rad/px
const _scratchEuler = new THREE.Euler();
const _scratchQuat = new THREE.Quaternion();

export function useSphereRotation() {
  const quaternionRef = useRef(new THREE.Quaternion());
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current || !lastPointerRef.current) return;

    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };

    // Horizontal drag → Y-axis rotation, vertical drag → X-axis rotation
    _scratchEuler.set(dy * ROTATION_SPEED, dx * ROTATION_SPEED, 0, "XYZ");
    _scratchQuat.setFromEuler(_scratchEuler);

    // premultiply so rotation is in world space
    quaternionRef.current.premultiply(_scratchQuat);
  }, []);

  const stopDrag = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = false;
    setIsDragging(false);
    lastPointerRef.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const pointerHandlers = {
    onPointerDown,
    onPointerMove,
    onPointerUp: stopDrag,
    onPointerCancel: stopDrag,
  };

  return { quaternionRef, pointerHandlers, isDragging };
}
