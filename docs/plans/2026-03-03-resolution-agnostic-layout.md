# Resolution-Agnostic 16:9 Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make all UI elements resolution-agnostic by rendering inside a fixed 1920x1080 container that scales to fit any browser window, with black letterbox bars.

**Architecture:** A scaling wrapper div (1920x1080) uses CSS `transform: scale()` to fit the viewport. A `useViewportScale` hook calculates the scale factor on resize. All child px values are bumped for 1080p TV readability.

**Tech Stack:** React, CSS transforms, ResizeObserver

---

### Task 1: Add letterbox styling to index.html and create useViewportScale hook

**Files:**
- Modify: `index.html:11-12` (body/html sizing)
- Create: `src/hooks/useViewportScale.ts`

**Step 1: Update index.html body/root styles for letterboxing**

Change line 12 from:
```css
html, body, #root { width: 100%; height: 100%; overflow: hidden; }
```
to:
```css
html, body { width: 100%; height: 100%; overflow: hidden; }
#root { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; }
```

Body background is already `#0a0a14` (line 15) — this serves as the letterbox color (near-black, matches the scene).

**Step 2: Create useViewportScale hook**

```ts
// src/hooks/useViewportScale.ts
import { useState, useEffect } from "react";

const DESIGN_W = 1920;
const DESIGN_H = 1080;

export function useViewportScale() {
  const [scale, setScale] = useState(() =>
    Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H)
  );

  useEffect(() => {
    const update = () =>
      setScale(Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H));
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return { scale, width: DESIGN_W, height: DESIGN_H };
}
```

**Step 3: Verify dev server runs**

Run: `pnpm run dev` (or check existing)
Expected: No errors

**Step 4: Commit**

```
feat: add viewport scaling hook and letterbox body styles
```

---

### Task 2: Wrap BingoPage in scaled 1920x1080 container

**Files:**
- Modify: `src/pages/BingoPage.tsx:1-21,40-74`

**Step 1: Add useViewportScale and wrap outer div**

Import the hook and replace the outer container. The outer div becomes the scaled viewport wrapper:

```tsx
import { useViewportScale } from "../hooks/useViewportScale";
// ... existing imports ...

export function BingoPage() {
  const game = useBingoGameState();
  const { scale, width, height } = useViewportScale();
  // ... existing state ...

  return (
    <div
      style={{
        width,
        height,
        background: "var(--bg-deep)",
        position: "relative",
        transform: `scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      {/* ... all children unchanged ... */}
    </div>
  );
}
```

**Step 2: Update bottom-right panel positioning**

Change `bottom: 12, right: 12` to `bottom: 30, right: 30`.

**Step 3: Update bottom control bar padding**

Change `padding: "0 20px 20px"` to `padding: "0 40px 40px"`.

**Step 4: Bump secondary button sizes (New Game, History)**

For both buttons in BingoPage (lines 91-133), update:
- `padding: "8px 20px"` → `"14px 32px"`
- `fontSize: 11` → `20`
- `letterSpacing: 1.5` → `2`
- `borderRadius: 8` → `12`
- `gap: 8` (between buttons, line 90) → `14`

**Step 5: Bump left stack gap**

Change gap on the left column container (line 81) from `8` to `16`.

**Step 6: Verify in browser**

Open browser, resize window — should see scaled content with letterboxing.

**Step 7: Commit**

```
feat: wrap BingoPage in scaled 1920x1080 viewport container
```

---

### Task 3: Bump GetABallButton sizes for 1080p

**Files:**
- Modify: `src/components/bingo/GetABallButton.tsx:24-28`

**Step 1: Update button styles**

- `padding: "14px 52px"` → `"24px 72px"`
- `fontSize: 20` → `36`
- `letterSpacing: 3` → `5`
- `borderRadius: 10` → `16`

**Step 2: Verify in browser**

Button should be large and readable from distance.

**Step 3: Commit**

```
feat: bump GetABallButton sizes for 1080p viewport
```

---

### Task 4: Bump DrawnBallsList sizes for 1080p

**Files:**
- Modify: `src/components/bingo/DrawnBallsList.tsx`

**Step 1: Update bingo board container**

- `borderRadius: 10` → `16`
- `padding: "8px 6px"` → `"16px 12px"`
- `gap: 2` → `4`

**Step 2: Update column header**

- `fontSize: 11` → `22`
- `marginBottom: 3` → `6`

**Step 3: Update number cells**

- `width: 22` → `44`
- `height: 16` → `32`
- `fontSize: 9` → `18`
- `borderRadius: 3` → `6`
- Column gap: `1` → `2`

**Step 4: Update count text**

- `fontSize: 10` → `18`

**Step 5: Update outer gap**

- `gap: 6` → `12`

**Step 6: Verify in browser**

Bingo card should be clearly readable.

**Step 7: Commit**

```
feat: bump DrawnBallsList sizes for 1080p viewport
```

---

### Task 5: Bump SpinControls sizes for 1080p

**Files:**
- Modify: `src/components/bingo/SpinControls.tsx`

**Step 1: Update debug toggle button**

- `padding: "5px 12px"` → `"8px 18px"`
- `fontSize: 10` → `16`
- `borderRadius: 6` → `8`

**Step 2: Update expanded panel**

- `padding: "14px 18px"` → `"20px 24px"`
- `borderRadius: 10` → `14`
- `gap: 14` → `20`
- `fontSize: 12` → `18`
- Slider width: `160` → `240`

**Step 3: Commit**

```
feat: bump SpinControls sizes for 1080p viewport
```

---

### Task 6: Bump GameHistoryModal sizes for 1080p

**Files:**
- Modify: `src/components/bingo/GameHistoryModal.tsx`

**Step 1: Update modal container**

- `width: "min(560px, 90vw)"` → `"min(900px, 80%)"` (% of the 1920 design space)
- `maxHeight: "80vh"` → `"80%"` (% of 1080 design space)
- `borderRadius: 16` → `20`

**Step 2: Update header**

- `padding: "20px 24px"` → `"28px 32px"`
- Title `fontSize: 22` → `32`
- Close button `fontSize: 20` → `28`, `padding: "4px 8px"` → `"8px 14px"`

**Step 3: Update games list container**

- `padding: "12px 16px"` → `"20px 24px"`
- `gap: 8` → `14`

**Step 4: Update empty state**

- `padding: 40` → `60`
- `fontSize: 13` → `20`

**Step 5: Update per-game item**

- `borderRadius: 10` → `14`
- `padding: "14px 16px"` → `"20px 24px"`

**Step 6: Update game item text/buttons**

- Date `fontSize: 12` → `18`
- "Active" badge: `fontSize: 9` → `14`, `padding: "2px 8px"` → `"4px 12px"`
- Balls count `fontSize: 12` → `18`
- LOAD/DEL/YES/NO buttons: `fontSize: 11` → `16`, `padding: "4px 14px"` → `"8px 20px"`, `borderRadius: 6` → `10`
- Ball circles: `width/height: 26` → `36`, `fontSize: 10` → `14`
- Ball gap: `3` → `5`
- Empty game text: `fontSize: 11` → `16`

**Step 7: Commit**

```
feat: bump GameHistoryModal sizes for 1080p viewport
```

---

### Task 7: Visual verification and test fixes

**Step 1: Run build to check for type errors**

Run: `pnpm run build`
Expected: No errors

**Step 2: Run existing tests**

Run: `pnpm test` (or equivalent)
Fix any snapshot/test failures from changed styles.

**Step 3: Browser test at different window sizes**

Verify:
- Full-screen 1920x1080: no letterboxing, everything fills screen
- Wider window (ultrawide): black bars on left/right
- Taller window (portrait): black bars on top/bottom
- Small window (800x600): everything scales down proportionally
- Logo visible in all cases

**Step 4: Final commit if any fixes needed**

```
fix: test and type fixes for viewport scaling
```
