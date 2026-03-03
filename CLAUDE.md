# Catalyst Agent

This project is managed by Catalyst Agent. Your dev server ports are defined in
PORTS.LOCAL.md (auto-generated per worktree). Start the server with start.local.sh.
If you need to change how the server is started, edit both start.sh (using __PORT_N__
template vars) and start.local.sh (using real port numbers).
If you need additional ports while making changes, add another entry to PORTS.md
and PORTS.LOCAL.md.

## Tech Stack

Vite + React + TypeScript + Three.js (via React Three Fiber)

## Commands

```bash
pnpm install        # Install dependencies
pnpm run dev        # Start dev server
pnpm run build      # Type-check and build for production
pnpm run lint       # ESLint
```

In Catalyst Agent, use `./start.local.sh` instead of `pnpm run dev`.

## Structure

- `src/main.tsx` — App entry point
- `src/App.tsx` — Root component, renders Canvas
- `src/components/Scene.tsx` — Three.js scene with primitives
- `src/components/RotatingMesh.tsx` — Reusable animated mesh component
