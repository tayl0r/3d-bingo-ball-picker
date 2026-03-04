# Bingo Win Patterns Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add win pattern selection to bingo games — picker modal on new game, in-game display, and history integration.

**Architecture:** Pattern data lives in a JSON file with a TS type file. Game state stores the selected patternId. A shared `PatternGrid` component renders the 5x5 CSS grid everywhere. Favorites stored separately in localStorage.

**Tech Stack:** React, TypeScript, CSS grid, localStorage, vitest

---

### Task 1: Pattern Data Files

**Files:**
- Create: `src/data/bingoPatterns.types.ts`
- Create: `src/data/bingoPatterns.json`

**Step 1: Create the TypeScript type file**

Create `src/data/bingoPatterns.types.ts`:

```ts
export interface BingoPattern {
  id: string;
  name: string;
  description: string;
  grid: number[][];
  tags: string[];
}
```

**Step 2: Create the JSON data file**

Create `src/data/bingoPatterns.json` with all 14 patterns. Each has an id, name, description, 5x5 grid (1=marked, 0=empty), and tags array.

Patterns to include (with grids — row 0 is top, col 0 is left):

- **any-line** ("Any Line", tags: ["basic"]): Top row filled: `[[1,1,1,1,1],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]]`
- **four-corners** ("Four Corners", tags: ["basic"]): `[[1,0,0,0,1],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[1,0,0,0,1]]`
- **blackout** ("Blackout", tags: ["basic"]): All 1s
- **postage-stamp** ("Postage Stamp", tags: ["basic"]): Top-right 2x2: `[[0,0,0,1,1],[0,0,0,1,1],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]]`
- **letter-t** ("Letter T", tags: ["letter"]): Top row + middle column: `[[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]]`
- **letter-l** ("Letter L", tags: ["letter"]): Left column + bottom row: `[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1]]`
- **letter-h** ("Letter H", tags: ["letter"]): Left col + right col + middle row: `[[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1]]`
- **letter-x** ("X", tags: ["letter","shape"]): Both diagonals: `[[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1]]`
- **diamond** ("Diamond", tags: ["shape"]): `[[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0]]`
- **plus-sign** ("Plus Sign", tags: ["shape"]): Middle row + middle col: `[[0,0,1,0,0],[0,0,1,0,0],[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0]]`
- **arrow** ("Arrow", tags: ["shape"]): Right-pointing arrow: `[[0,0,1,0,0],[0,0,0,1,0],[1,1,1,1,1],[0,0,0,1,0],[0,0,1,0,0]]`
- **heart** ("Heart", tags: ["shape"]): `[[0,1,0,1,0],[1,1,1,1,1],[1,1,1,1,1],[0,1,1,1,0],[0,0,1,0,0]]`
- **outer-edge** ("Outer Edge", tags: ["advanced"]): All border cells 1, interior 0
- **checkerboard** ("Checkerboard", tags: ["advanced"]): Alternating 1/0 pattern

**Step 3: Commit**

```bash
git add src/data/bingoPatterns.types.ts src/data/bingoPatterns.json
git commit -m "feat: add bingo pattern data and types"
```

---

### Task 2: PatternGrid Component

**Files:**
- Create: `src/components/bingo/PatternGrid.tsx`

**Step 1: Write a test for PatternGrid**

Create `src/components/bingo/__tests__/PatternGrid.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PatternGrid } from "../PatternGrid";

describe("PatternGrid", () => {
  const xGrid = [
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0],
    [1, 0, 0, 0, 1],
  ];

  it("renders a 5x5 grid with correct number of cells", () => {
    const { container } = render(<PatternGrid grid={xGrid} size={80} />);
    const cells = container.querySelectorAll("[data-cell]");
    expect(cells).toHaveLength(25);
  });

  it("marks active cells", () => {
    const { container } = render(<PatternGrid grid={xGrid} size={80} />);
    const activeCells = container.querySelectorAll("[data-active='true']");
    // X pattern has 9 active cells (5 on each diagonal, minus center overlap)
    expect(activeCells).toHaveLength(9);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/components/bingo/__tests__/PatternGrid.test.tsx`
Expected: FAIL — module not found

**Step 3: Implement PatternGrid**

Create `src/components/bingo/PatternGrid.tsx`:

```tsx
import type { CSSProperties } from "react";

interface PatternGridProps {
  grid: number[][];
  size: number; // total size in px
}

export function PatternGrid({ grid, size }: PatternGridProps) {
  const cellSize = size / 5;

  const containerStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(5, ${cellSize}px)`,
    gridTemplateRows: `repeat(5, ${cellSize}px)`,
    gap: 1,
    borderRadius: 4,
    overflow: "hidden",
  };

  return (
    <div style={containerStyle}>
      {grid.flatMap((row, r) =>
        row.map((cell, c) => (
          <div
            key={`${r}-${c}`}
            data-cell
            data-active={cell === 1 ? "true" : "false"}
            style={{
              width: cellSize,
              height: cellSize,
              backgroundColor: cell === 1
                ? "rgba(245, 158, 11, 0.85)"
                : "rgba(255, 255, 255, 0.08)",
            }}
          />
        ))
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run src/components/bingo/__tests__/PatternGrid.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/bingo/PatternGrid.tsx src/components/bingo/__tests__/PatternGrid.test.tsx
git commit -m "feat: add PatternGrid component with tests"
```

---

### Task 3: Favorites Storage Utility

**Files:**
- Create: `src/utils/patternFavorites.ts`

**Step 1: Write tests**

Create `src/utils/__tests__/patternFavorites.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  getFavorites,
  toggleFavorite,
  isFavorite,
} from "../patternFavorites";

describe("patternFavorites", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty set initially", () => {
    expect(getFavorites()).toEqual(new Set());
  });

  it("toggleFavorite adds and removes", () => {
    toggleFavorite("letter-x");
    expect(isFavorite("letter-x")).toBe(true);

    toggleFavorite("letter-x");
    expect(isFavorite("letter-x")).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/utils/__tests__/patternFavorites.test.ts`
Expected: FAIL

**Step 3: Implement**

Create `src/utils/patternFavorites.ts`:

```ts
const STORAGE_KEY = "bingo_pattern_favorites";

export function getFavorites(): Set<string> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return new Set();
  return new Set(JSON.parse(raw));
}

function saveFavorites(favs: Set<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...favs]));
}

export function toggleFavorite(patternId: string): void {
  const favs = getFavorites();
  if (favs.has(patternId)) {
    favs.delete(patternId);
  } else {
    favs.add(patternId);
  }
  saveFavorites(favs);
}

export function isFavorite(patternId: string): boolean {
  return getFavorites().has(patternId);
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run src/utils/__tests__/patternFavorites.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/patternFavorites.ts src/utils/__tests__/patternFavorites.test.ts
git commit -m "feat: add pattern favorites localStorage utility"
```

---

### Task 4: Update Game Storage with patternId

**Files:**
- Modify: `src/utils/gameStorage.ts`

**Step 1: Add patternId to SavedGame interface**

In `src/utils/gameStorage.ts`, add `patternId` to the `SavedGame` interface (line 4-9):

Change:
```ts
export interface SavedGame {
  id: string;
  drawnBalls: number[];
  createdAt: number;
  updatedAt: number;
}
```

To:
```ts
export interface SavedGame {
  id: string;
  drawnBalls: number[];
  patternId: string;
  createdAt: number;
  updatedAt: number;
}
```

**Step 2: Update createGame to accept patternId**

Change `createGame()` (line 30-42) to accept a `patternId` parameter:

```ts
export function createGame(patternId: string): SavedGame {
  const game: SavedGame = {
    id: generateId(),
    drawnBalls: [],
    patternId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const games = getAllGames();
  games.unshift(game);
  saveAllGames(games);
  setActiveGameId(game.id);
  return game;
}
```

**Step 3: Update getOrCreateActiveGame to use default patternId**

Change `getOrCreateActiveGame()` (line 84-91) — the fallback `createGame()` call needs a default:

```ts
export function getOrCreateActiveGame(): SavedGame {
  const activeId = getActiveGameId();
  if (activeId) {
    const game = getGameById(activeId);
    if (game) return game;
  }
  return createGame("any-line");
}
```

**Step 4: Commit**

```bash
git add src/utils/gameStorage.ts
git commit -m "feat: add patternId to SavedGame storage"
```

---

### Task 5: Update useBingoGameState Hook

**Files:**
- Modify: `src/hooks/useBingoGameState.ts`

**Step 1: Add patternId state**

After the existing state declarations (around line 27-37), add:

```ts
const [patternId, setPatternId] = useState(initialGame.patternId ?? "any-line");
```

**Step 2: Update newGame to accept patternId**

Change the `newGame` callback (lines 87-93):

```ts
const newGame = useCallback((selectedPatternId: string) => {
  const game = createGame(selectedPatternId);
  setCurrentGameId(game.id);
  setDrawnBalls([]);
  setActiveBallNumbers(Array.from({ length: 75 }, (_, i) => i + 1));
  setPatternId(selectedPatternId);
}, []);
```

**Step 3: Update loadGame to restore patternId**

Change the `loadGame` callback (lines 95-101):

```ts
const loadGame = useCallback((game: SavedGame) => {
  setActiveGameId(game.id);
  setCurrentGameId(game.id);
  setDrawnBalls(game.drawnBalls);
  setActiveBallNumbers(ballsFromDrawn(game.drawnBalls));
  setPatternId(game.patternId ?? "any-line");
}, []);
```

**Step 4: Add patternId to returned object**

Add `patternId` to the return object (around line 104-119):

```ts
patternId,
```

**Step 5: Commit**

```bash
git add src/hooks/useBingoGameState.ts
git commit -m "feat: integrate patternId into game state hook"
```

---

### Task 6: Pattern Picker Modal

**Files:**
- Create: `src/components/bingo/PatternPickerModal.tsx`

**Step 1: Create the modal component**

This is the largest new component. It needs:

- Import `bingoPatterns.json`, the `BingoPattern` type, `PatternGrid`, and favorites utilities
- State: `searchQuery` (string), `activeTag` (string | null), `favorites` (Set<string>)
- Derive unique tags from all patterns
- Filter patterns by search query (name match) and active tag (including "favorites" virtual tag)
- Render:
  - Fixed overlay (same style as GameHistoryModal: position fixed, inset 0, z-index 100, backdrop blur)
  - Modal content container
  - Header: "Choose a Pattern" + close button (×)
  - Search input
  - Tag filter chips row: "All" + each unique tag + "Favorites" (with heart icon)
  - CSS grid of pattern cards (responsive: `grid-template-columns: repeat(auto-fill, minmax(140px, 1fr))`)
  - Each card: `PatternGrid` (size ~80), pattern name, heart toggle button
  - Clicking the card (not the heart) calls `onSelect(pattern.id)` and closes
- Props: `onSelect: (patternId: string) => void`, `onClose: () => void`

```tsx
interface PatternPickerModalProps {
  onSelect: (patternId: string) => void;
  onClose: () => void;
}
```

Style the modal to match the existing GameHistoryModal aesthetic (dark background, amber accents, same font family).

**Step 2: Commit**

```bash
git add src/components/bingo/PatternPickerModal.tsx
git commit -m "feat: add pattern picker modal component"
```

---

### Task 7: In-Game Pattern Display Component

**Files:**
- Create: `src/components/bingo/CurrentPatternDisplay.tsx`

**Step 1: Create the component**

A compact display showing the current pattern's mini-grid + name. Used above the GET A BALL button.

```tsx
import patterns from "../../data/bingoPatterns.json";
import type { BingoPattern } from "../../data/bingoPatterns.types";
import { PatternGrid } from "./PatternGrid";

interface CurrentPatternDisplayProps {
  patternId: string;
}

export function CurrentPatternDisplay({ patternId }: CurrentPatternDisplayProps) {
  const pattern = (patterns as BingoPattern[]).find((p) => p.id === patternId);
  if (!pattern) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <PatternGrid grid={pattern.grid} size={64} />
      <span style={{
        color: "rgba(245, 158, 11, 0.9)",
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: 1,
        textTransform: "uppercase",
      }}>
        {pattern.name}
      </span>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/bingo/CurrentPatternDisplay.tsx
git commit -m "feat: add current pattern display component"
```

---

### Task 8: Wire Everything into BingoPage

**Files:**
- Modify: `src/pages/BingoPage.tsx`

**Step 1: Add imports**

Add at the top of BingoPage.tsx:

```ts
import { PatternPickerModal } from "../components/bingo/PatternPickerModal";
import { CurrentPatternDisplay } from "../components/bingo/CurrentPatternDisplay";
```

**Step 2: Add showPatternPicker state**

Add state for pattern picker modal:

```ts
const [showPatternPicker, setShowPatternPicker] = useState(false);
```

**Step 3: Change "New Game" button to open picker**

The "New Game" button (lines 111-132) currently calls `game.newGame()` directly. Change its `onClick` to:

```ts
onClick={() => setShowPatternPicker(true)}
```

**Step 4: Add PatternPickerModal**

After the GameHistoryModal conditional render (around line 158), add:

```tsx
{showPatternPicker && (
  <PatternPickerModal
    onSelect={(patternId) => {
      game.newGame(patternId);
      setShowPatternPicker(false);
    }}
    onClose={() => setShowPatternPicker(false)}
  />
)}
```

**Step 5: Add CurrentPatternDisplay above GetABallButton**

In the left-side area where GetABallButton lives (around lines 84-98), add the pattern display above the button. The container div already has `position: "fixed"` and positioning. Add `CurrentPatternDisplay` inside it, above `GetABallButton`:

```tsx
<CurrentPatternDisplay patternId={game.patternId} />
```

Place it just before the `<GetABallButton>` with some margin-bottom (e.g. 16px).

**Step 6: Commit**

```bash
git add src/pages/BingoPage.tsx
git commit -m "feat: wire pattern picker and display into main page"
```

---

### Task 9: Update GameHistoryModal with Pattern Info

**Files:**
- Modify: `src/components/bingo/GameHistoryModal.tsx`

**Step 1: Add imports**

Add to GameHistoryModal.tsx:

```ts
import patterns from "../../data/bingoPatterns.json";
import type { BingoPattern } from "../../data/bingoPatterns.types";
import { PatternGrid } from "./PatternGrid";
```

**Step 2: Add pattern display to each game entry**

In the game item rendering (around lines 137-161, the top row with date and draw count), add the pattern info. After the date display, add:

```tsx
{(() => {
  const pattern = (patterns as BingoPattern[]).find(
    (p) => p.id === (g.patternId ?? "any-line")
  );
  if (!pattern) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <PatternGrid grid={pattern.grid} size={28} />
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
        {pattern.name}
      </span>
    </div>
  );
})()}
```

**Step 3: Commit**

```bash
git add src/components/bingo/GameHistoryModal.tsx
git commit -m "feat: show pattern info in game history modal"
```

---

### Task 10: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update the Structure section**

Add new entries to the file listing in CLAUDE.md:

- `src/data/bingoPatterns.json` — Bingo win pattern definitions (14 patterns)
- `src/data/bingoPatterns.types.ts` — TypeScript type for BingoPattern
- `src/components/bingo/PatternGrid.tsx` — Reusable 5x5 pattern grid display
- `src/components/bingo/PatternPickerModal.tsx` — Full-screen pattern selection modal
- `src/components/bingo/CurrentPatternDisplay.tsx` — In-game current pattern indicator
- `src/utils/patternFavorites.ts` — localStorage favorites for patterns

**Step 2: Update Key Patterns section**

Add: `**Win patterns**: Players choose a bingo pattern (winning formation) when starting a game. Pattern data in JSON, favorites in localStorage.`

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with pattern feature files"
```

---

### Task 11: Final Integration Test

**Step 1: Run all tests**

Run: `pnpm test -- --run`
Expected: All tests pass

**Step 2: Run build**

Run: `pnpm run build`
Expected: No type errors, build succeeds

**Step 3: Manual smoke test**

Run: `pnpm run dev`

Verify:
1. Click "New Game" → Pattern picker modal appears
2. Search works, tag filters work, favorites toggle works
3. Click a pattern → New game starts with that pattern
4. Current pattern displays above GET A BALL button (mini-grid + name)
5. Click "History" → Each game shows its pattern name + mini-grid
6. Load an old game → Pattern display updates correctly
