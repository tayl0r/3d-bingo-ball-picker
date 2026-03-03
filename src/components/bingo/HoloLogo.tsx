import { useRef, useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { TextureLoader } from "three";

const BASE_URL = import.meta.env.BASE_URL;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vViewDir;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vViewDir;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  vec3 rainbow(float t) {
    vec3 a = vec3(0.5);
    vec3 b = vec3(0.5);
    vec3 c = vec3(1.0);
    vec3 d = vec3(0.0, 0.33, 0.67);
    return a + b * cos(6.28318 * (c * t + d));
  }

  void main() {
    vec4 tex = texture2D(uTexture, vUv);

    // Discard fully transparent pixels
    if (tex.a < 0.01) discard;

    // Fresnel for edge sheen
    float fresnel = 1.0 - max(dot(vNormal, vViewDir), 0.0);
    fresnel = pow(fresnel, 2.0);

    // Rainbow shift based on UV position and time
    float rainbowPhase = vUv.x * 2.0 + vUv.y * 1.0 + uTime * 0.3;
    vec3 holoColor = rainbow(rainbowPhase);

    // Moving light streak (like the card shine)
    float streak = sin(vUv.x * 12.0 - uTime * 1.5) * 0.5 + 0.5;
    streak = pow(streak, 8.0);

    // Radial glare from pointer/time-based position
    float glareX = 0.5 + sin(uTime * 0.7) * 0.3;
    float glareY = 0.5 + cos(uTime * 0.5) * 0.3;
    float glareDist = distance(vUv, vec2(glareX, glareY));
    float glare = 1.0 - smoothstep(0.0, 0.6, glareDist);
    glare = pow(glare, 2.0);

    // Scanline effect
    float scanlines = sin(vUv.y * 200.0) * 0.5 + 0.5;
    scanlines = mix(0.85, 1.0, scanlines);

    // Combine: base texture + holographic overlay
    vec3 base = tex.rgb;

    // Holo layer: rainbow + streak + fresnel, applied as color dodge
    vec3 holoLayer = holoColor * (0.15 + streak * 0.3 + fresnel * 0.6);
    holoLayer *= scanlines;

    // Glare adds bright white highlight
    vec3 glareLayer = vec3(1.0) * glare * 0.35;

    // Color dodge blend: result = base / (1 - overlay)
    vec3 dodged = base / max(vec3(1.0) - holoLayer * 0.5, vec3(0.01));
    dodged = clamp(dodged, 0.0, 1.5);

    // Mix between base and dodged based on holo intensity
    float holoStrength = 0.4 + fresnel * 0.4 + glare * 0.2;
    vec3 result = mix(base, dodged, holoStrength * 0.6);

    // Add glare on top
    result += glareLayer;

    // Slight brightness boost
    result *= 1.1;

    gl_FragColor = vec4(result, tex.a);
  }
`;

interface HoloLogoProps {
  position?: [number, number, number];
  scale?: number;
  targetRef: React.RefObject<THREE.Object3D>;
}

export function HoloLogo({
  position = [0, 2.5, -3.5],
  scale = 1,
  targetRef,
}: HoloLogoProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const logoTexture = useLoader(TextureLoader, `${BASE_URL}well80_logo.png`);

  const uniforms = useMemo(
    () => ({
      uTexture: { value: logoTexture },
      uTime: { value: 0 },
    }),
    [logoTexture]
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
    if (meshRef.current && targetRef.current) {
      meshRef.current.lookAt(targetRef.current.position);
    }
  });

  // Logo is 744x267, aspect ratio ~2.786
  const aspect = 744 / 267;
  const height = 1.8 * scale;
  const width = height * aspect;

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[width, height]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}

/**
 * Invisible object that orbits in a circle near the camera.
 * Logos lookAt this target to create a subtle animated tilt.
 */
export function OrbitingLookAtTarget({
  center = [0, 2, 7],
  radius = 2.5,
  speed = 0.4,
  targetRef,
}: {
  center?: [number, number, number];
  radius?: number;
  speed?: number;
  targetRef: React.RefObject<THREE.Object3D>;
}) {
  useFrame(({ clock }) => {
    if (targetRef.current) {
      const t = clock.elapsedTime * speed;
      targetRef.current.position.set(
        center[0] + Math.cos(t) * radius,
        center[1] + Math.sin(t) * radius * 0.5,
        center[2]
      );
    }
  });

  return <object3D ref={targetRef as React.RefObject<THREE.Object3D>} />;
}
