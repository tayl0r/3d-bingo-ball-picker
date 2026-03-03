# Frustum-Based 3D Layout Design

**Date:** 2026-03-03
**Status:** Approved

## Problem

Three 3D elements (HoloLogo, LastBall3D, Bingo Sphere) use hardcoded world-space coordinates tuned for 1920x1080. Positions are wrong even at the design resolution (eyeballed approximations) and get worse at other resolutions/aspect ratios.

## Solution

Compute positions from the camera frustum at each element's Z-depth. At any Z, the visible rectangle is:
```
visibleHeight = 2 * tan(fov/2) * distanceFromCamera
visibleWidth = visibleHeight * aspect
```

Position elements as percentage offsets from frustum edges, accounting for each element's own dimensions.

## Approach: `useFrustumLayout` Hook

A single hook in `src/hooks/useFrustumLayout.ts` that reads the R3F camera (FOV, aspect) via `useThree` and returns computed positions for all three elements. Recomputes only on viewport resize.

### Element Positioning

**HoloLogo (top-left, Z=-1)**
- Dock to top-left of visible frustum at Z=-1
- 5% padding from edges
- Inset by half the logo's width/height so its edge (not center) aligns with the padding boundary
- Scale derived from visible height (fraction of viewport)

**LastBall3D (top-right, Z=5)**
- Dock to top-right of visible frustum at Z=5
- 5% padding from edges
- Inset by ball radius

**Bingo Sphere (center, Z=0)**
- Center of frustum at Z=0
- Sized to ~95% of visible height (container radius scaled accordingly)

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useFrustumLayout.ts` | New — computes positions from camera frustum |
| `src/components/bingo/BingoScene.tsx` | Use hook, pass computed positions to children |
| `src/components/bingo/LastBall3D.tsx` | Accept position/scale as props instead of constants |
| `src/components/bingo/BingoBallAnimated.tsx` | Accept target position/scale as props instead of importing constants |
| `src/components/bingo/HoloLogo.tsx` | No change needed (already accepts position/scale props) |

### Unchanged

- Camera position `[0, 2, 8]` and FOV 50
- Physics, ball textures, animations, shaders
- `useViewportScale` CSS scaling wrapper
