# Resolution-Agnostic 16:9 Letterboxed Layout

## Problem
UI elements (buttons, bingo card, logo) are tiny and poorly positioned on 1080p displays. No responsive scaling exists.

## Solution
CSS `transform: scale()` on a fixed 1920x1080 container. Body provides black letterbox bars. All UI sized for 1920x1080 "design space" and scaled uniformly to fit any browser window.

## Architecture

1. `<body>`: black background, flexbox centered, overflow hidden (letterbox bars)
2. `<div id="viewport">`: fixed 1920x1080px, `transform: scale(factor)` where `factor = Math.min(window.innerWidth / 1920, window.innerHeight / 1080)`, `transform-origin: center center`, resize listener
3. All child content renders inside this fixed design space

## UI Size Changes (1920x1080 design space)

| Element | Current | New |
|---------|---------|-----|
| GET A BALL button font | 20px | 36px |
| GET A BALL padding | 14px/52px | 24px/72px |
| Bingo grid cells | 22x16px, 9px font | 44x32px, 18px font |
| Bingo column headers | 11px | 22px |
| Ball count text | 10px | 18px |
| Secondary buttons | ~14px | 24px |
| Debug toggle | 10px | 16px |
| Gaps/margins | 6-12px | 12-20px |
| Border radii | 3-10px | 6-16px |
| History modal | 560px max | 800px max |
| Edge margins | 12-20px | 30-40px |

## 3D Scene
Canvas fills 1920x1080 container. Camera/world positions unchanged (world-space units). Logo position should remain visible in 16:9.
