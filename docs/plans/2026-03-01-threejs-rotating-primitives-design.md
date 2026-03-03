# Three.js Rotating Primitives — Design

## Overview

A single-page React + Three.js app that renders two 3D primitives side by side — an icosahedron on the left and a torus on the right — both sharing the same random rotation.

## Stack

- **Runtime:** Vite + React + TypeScript
- **Package manager:** pnpm
- **3D:** `@react-three/fiber` (R3F)
- **Dev server port:** 3609

## Scene

- Full-viewport `<Canvas>` with dark background
- Icosahedron positioned at x=-2, Torus at x=+2
- Ambient light + directional light for visibility
- No orbit controls — auto-rotation only

## Rotation Behavior

- On mount, generate three random rotation speeds (one per axis: x, y, z)
- Both meshes apply the same speeds each frame via `useFrame`
- Speeds chosen from a range that produces visible but smooth rotation

## File Structure

```
src/
  main.tsx              — React entry, renders App into #root
  App.tsx               — <Canvas> wrapper + Scene
  components/
    Scene.tsx           — Lights + two RotatingMesh instances
    RotatingMesh.tsx    — Reusable: accepts geometry JSX + position, applies shared rotation
index.html
vite.config.ts
tsconfig.json
package.json
```

## Dev Server

- Vite dev server bound to port 3609
- `start.sh` updated: `pnpm dev --port __PORT_1__`
- `start.local.sh` updated: `pnpm dev --port 3609`
