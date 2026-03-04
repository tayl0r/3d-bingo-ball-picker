# Catalyst Agent

This project is managed by Catalyst Agent. Your dev server ports are defined in
PORTS.LOCAL.md (auto-generated per worktree). Start the server with start.local.sh.
If you need to change how the server is started, edit both start.sh (using __PORT_N__
template vars) and start.local.sh (using real port numbers).
If you need additional ports while making changes, add another entry to PORTS.md
and PORTS.LOCAL.md.

## Tech Stack

Vite + React 19 + TypeScript + Three.js (React Three Fiber + Rapier physics) + react-router + vitest

## Commands

```bash
pnpm install        # Install dependencies
pnpm run dev        # Start dev server
pnpm run build      # Type-check and build for production
pnpm run lint       # ESLint
pnpm run test       # Run tests (vitest, jsdom)
pnpm run test:watch # Run tests in watch mode
```

In Catalyst Agent, use `./start.local.sh` instead of `pnpm run dev`.

## Structure

- `src/main.tsx` — App entry point (BrowserRouter setup)
- `src/App.tsx` — Routes: `/` → BingoPage (lazy-loaded), `/test` → Scene
- `src/pages/BingoPage.tsx` — Main bingo game page with Canvas, UI overlay, and game state
- `src/components/bingo/` — Bingo game components:
  - `BingoScene.tsx` — 3D scene with bingo machine, last ball display, frustum layout
  - `BingoMachine.tsx` — Rotating sphere container with physics balls (Rapier)
  - `BingoBall.tsx` — Single 3D bingo ball with numbered texture
  - `BingoBallAnimated.tsx` — Ball with animated position/scale/quaternion transitions
  - `LastBall3D.tsx` — Displays the most recently drawn ball
  - `HoloLogo.tsx` — Holographic logo display
  - `DrawnBallsList.tsx` — HTML overlay listing drawn balls
  - `GetABallButton.tsx` — Button to draw next ball
  - `SpinStyleSelector.tsx` — Machine spin style selector (strength + duration toggles)
  - `GameHistoryModal.tsx` — Past game history modal
  - `PatternPickerModal.tsx` — Full-screen pattern selection modal
  - `PatternGrid.tsx` — Reusable 5x5 pattern grid display
  - `CurrentPatternDisplay.tsx` — In-game current pattern indicator
  - `VolumeControl.tsx` — Mute toggle + volume slider + ball paddle on/off toggle
  - `NicknameSheen.tsx` — Animated nickname display for last drawn ball
  - `LogoEditButton.tsx` — Custom logo upload/clear button
  - `PaddleCursor.tsx` — Mouse-controlled physics paddle inside bingo machine
- `src/audio/` — Sound system:
  - `sounds.ts` — zzfx parameter arrays for all sound effects
  - `soundManager.ts` — Central audio module (play functions, volume/mute, localStorage)
- `src/data/` — Static data:
  - `bingoPatterns.json` — Bingo win pattern definitions (14 patterns)
  - `bingoPatterns.types.ts` — TypeScript type for BingoPattern
  - `bingoNicknames.json` — Traditional bingo number nicknames (1-75)
- `src/components/Scene.tsx` — Original test scene with rotating primitives
- `src/hooks/` — Custom hooks:
  - `useBingoGameState.ts` — Game state management (draw, reset, history)
  - `useFrustumLayout.ts` — Camera frustum-based responsive positioning
  - `useViewportScale.ts` — Viewport-aware scaling
  - `useSphereRotation.ts` — Sphere rotation animation
  - `useSoundSettings.ts` — Volume/mute React state for VolumeControl UI
- `src/utils/` — Utilities:
  - `ballTexture.ts` — Canvas-based ball number texture generation
  - `sphereContainerGeometry.ts` — Sphere container mesh geometry
  - `gameStorage.ts` — localStorage persistence for game state
  - `patternFavorites.ts` — localStorage favorites for patterns
  - `logoStorage.ts` — localStorage persistence for custom logo
  - `trimTransparentPixels.ts` — Canvas pixel trimming utility

## Key Patterns

- **Base path**: Vite `base` is `/3d-bingo-ball-picker/` — all assets deploy under this prefix
- **Lazy loading**: BingoPage is lazy-loaded via `React.lazy` + `Suspense`
- **Frustum layout**: `useFrustumLayout` computes 3D positions from camera frustum for responsive element placement
- **Physics**: `@react-three/rapier` handles ball physics inside the bingo machine
- **Test setup**: vitest + jsdom + `vitest-canvas-mock`; setup file at `src/test/setup.ts`
- **Tests**: Co-located in `__tests__/` directories next to source files
- **Win patterns**: Players choose a bingo pattern (winning formation) when starting a game. Pattern data in JSON, favorites in localStorage.
- **Game phases**: `idle` → `mixing` → `settling` → `selecting` → `animating` → `idle`. Phase drives sphere rotation, ball selection, and paddle visibility.
