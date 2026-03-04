# Bingo Win Patterns Feature Design

## Summary

Add the concept of bingo "patterns" (standard bingo terminology for winning formations) to the game. Players choose a pattern when starting a new game, see it displayed during play, and it's recorded in game history.

## Pattern Data

Patterns stored in `src/data/bingoPatterns.json` — a flat JSON array.

```ts
interface BingoPattern {
  id: string;           // e.g. "x", "any-line", "four-corners"
  name: string;         // Display name
  description: string;  // Short description
  grid: number[][];     // 5x5 grid, 1 = marked, 0 = empty
  tags: string[];       // e.g. ["basic"], ["letter", "shape"]
}
```

~14 patterns across tags: basic, letter, shape, advanced.

**Favorites** are stored in localStorage as a set of pattern IDs — not in the JSON file. The picker shows a heart toggle on each pattern card.

## Pattern Picker Modal

Full-screen modal shown when "New Game" is clicked (replaces instant new-game behavior).

Layout:
- Title "Choose a Pattern" with close button (closes without starting a game)
- Search bar filtering by pattern name
- Tag filter chips: one per unique tag + "Favorites" virtual filter
- Responsive CSS grid of pattern cards, each showing:
  - 5x5 mini-grid with filled/empty cells
  - Pattern name
  - Heart icon to toggle favorite (persisted in localStorage)
- Clicking a card selects the pattern and starts the new game
- Scrollable if patterns exceed viewport

## In-Game Pattern Display

Above the GET A BALL button (same fixed-left positioning area):
- Small 5x5 CSS grid (~60-80px) showing the current pattern
- Pattern name beside the grid

## Game State Changes

- `SavedGame` gains `patternId: string` field
- `useBingoGameState` stores current `patternId`
- `newGame()` opens pattern picker → user selects → game created with `patternId`
- `loadGame()` restores `patternId` from saved game
- Old games without `patternId` default to `"any-line"`

## History Modal Changes

Each game entry in `GameHistoryModal` shows the pattern name (and optionally tiny mini-grid) alongside existing date/ball count info.

## Rendering Approach

5x5 CSS grid for all pattern graphics — simple HTML/CSS, no canvas/SVG needed.

## Pattern List

| ID | Name | Tags |
|----|------|------|
| any-line | Any Line | basic |
| four-corners | Four Corners | basic |
| blackout | Blackout | basic |
| postage-stamp | Postage Stamp | basic |
| letter-t | Letter T | letter |
| letter-l | Letter L | letter |
| letter-h | Letter H | letter |
| letter-x | X | letter, shape |
| diamond | Diamond | shape |
| plus-sign | Plus Sign | shape |
| arrow | Arrow | shape |
| heart | Heart | shape |
| outer-edge | Outer Edge | advanced |
| checkerboard | Checkerboard | advanced |

## Non-Goals

- No auto-win detection — pattern is visual reference only
- No custom pattern creation
