# Three.js Rotating Primitives Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a React + Three.js app that renders an icosahedron (left) and torus (right) rotating together with shared random rotation speeds.

**Architecture:** Vite scaffolds a React+TS app. React Three Fiber provides declarative Three.js bindings. Random rotation speeds are generated once via `useRef` in the Scene component and passed as props to both RotatingMesh instances, which apply them via `useFrame`.

**Tech Stack:** Vite, React 18, TypeScript, @react-three/fiber, pnpm

---

### Task 1: Scaffold Vite + React + TypeScript project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/vite-env.d.ts`

**Step 1: Initialize the project with Vite**

Run:
```bash
cd /Users/taylor/dev/test4/.claude/worktrees/feature1
pnpm create vite@latest .vite-scaffold --template react-ts
cp -r .vite-scaffold/* .vite-scaffold/.* . 2>/dev/null || true
rm -rf .vite-scaffold
```

Scaffold into a temp subdirectory then move files out, since the working directory is non-empty and `create-vite` would prompt interactively.

**Step 2: Install dependencies**

Run:
```bash
pnpm install
```

Expected: `node_modules` created, lockfile written.

**Step 3: Install Three.js dependencies**

Run:
```bash
pnpm add three @react-three/fiber
pnpm add -D @types/three
```

**Step 4: Verify it builds**

Run:
```bash
pnpm build
```

Expected: Build succeeds, `dist/` created.

**Step 5: Commit**

```bash
rm -f eslint.config.js README.md
git add package.json pnpm-lock.yaml tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html src/
git commit -m "feat: scaffold Vite + React + TS project with Three.js deps"
```

---

### Task 2: Configure dev server port and start scripts

**Files:**
- Modify: `vite.config.ts`
- Modify: `start.sh`
- Modify: `start.local.sh`

**Step 1: Update vite.config.ts to accept port from CLI**

No changes needed — Vite already respects `--port` from CLI. Leave `vite.config.ts` as-is.

**Step 2: Update start.sh**

Replace contents of `start.sh` with (`--host` exposes on all interfaces for Catalyst Agent access):

```bash
#!/bin/bash
pnpm dev --port __PORT_1__ --host
```

**Step 3: Update start.local.sh**

Replace contents of `start.local.sh` with:

```bash
#!/bin/bash
pnpm dev --port 3609 --host
```

**Step 4: Verify dev server starts on correct port**

Run:
```bash
bash start.local.sh &
sleep 3
curl -s http://localhost:3609 | head -5
kill %1
```

Expected: HTML response from Vite dev server.

**Step 5: Commit**

```bash
git add start.sh
git commit -m "feat: configure dev server on port 3609"
```

---

### Task 3: Create the RotatingMesh component

**Files:**
- Create: `src/components/RotatingMesh.tsx`

**Step 1: Create the component**

```tsx
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
```

The component takes `rotationSpeeds` as a prop (shared between both meshes) and geometry as `children`.

**Step 2: Verify it compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No type errors. Using `tsc --noEmit` instead of `pnpm build` because Vite's build would tree-shake the unused component.

**Step 3: Commit**

```bash
git add src/components/RotatingMesh.tsx
git commit -m "feat: add RotatingMesh component"
```

---

### Task 4: Create the Scene component

**Files:**
- Create: `src/components/Scene.tsx`

**Step 1: Create the Scene component**

```tsx
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
```

Random speeds are generated once via `useRef` (immune to StrictMode double-invocation) and passed to both meshes. A minimum absolute speed of 0.3 ensures visible rotation.

**Step 2: Verify it compiles**

Run:
```bash
pnpm build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/Scene.tsx
git commit -m "feat: add Scene with icosahedron and torus"
```

---

### Task 5: Wire up App.tsx and main.tsx

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`
- Delete: `src/App.css` (not needed)
- Delete: `src/index.css` (will replace with minimal inline styles)

**Step 1: Replace App.tsx**

```tsx
import { Canvas } from "@react-three/fiber";
import { Scene } from "./components/Scene";

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#111" }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <Scene />
      </Canvas>
    </div>
  );
}
```

**Step 2: Replace main.tsx**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**Step 3: Delete unused CSS files**

```bash
rm -f src/App.css src/index.css
```

**Step 4: Remove the default Vite assets if present**

```bash
rm -f src/assets/react.svg public/vite.svg
```

**Step 5: Verify build**

Run:
```bash
pnpm build
```

Expected: Clean build, no errors.

**Step 6: Commit**

```bash
git add -u
git commit -m "feat: wire up Canvas with Scene in App"
```

---

### Task 6: Final verification

**Step 1: Start dev server and verify visually**

Run:
```bash
bash start.local.sh &
sleep 3
curl -s http://localhost:3609 | grep -c "root"
kill %1
```

Expected: At least 1 match (the `<div id="root">` element is present).

**Step 2: Run production build**

Run:
```bash
pnpm build
```

Expected: Clean build with no warnings.

**Step 3: Commit any remaining changes**

```bash
git status
# If clean, nothing to commit. If there are changes:
git add -A && git commit -m "chore: final cleanup"
```
