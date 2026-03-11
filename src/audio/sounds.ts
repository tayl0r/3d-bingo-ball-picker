// Each entry is a zzfx parameter array.
// Design sounds at https://killedbyapixel.github.io/ZzFX/

export type SoundParams = (number | undefined)[];

/* eslint-disable no-sparse-arrays */

export const GAME_SOUNDS = {
  /** Slot machine cha-ching when GET A BALL is clicked */
  ballDraw: [.5, , 300, .01, .05, .15, 1, 1.2, , , 400, .02, .03, , , , , , .3] as SoundParams,

  /** Rising whoosh when ball launches from machine (~300ms) */
  ballLaunch: [, , 200, .01, .05, .15, , 1.5, 20, , , , , , , , , , .3] as SoundParams,

  /** Bright triumphant chime when ball lands at rest position (~300ms) */
  ballLand: [.5, , 660, .02, .15, .3, 1, .8, , , 200, .04, .06, , , , , , .4] as SoundParams,

  /** Short percussive "clack" for spinning tick (~15ms) */
  spinTick: [.25, , 80, , .005, .001, 4, 3, , , , , , , 4, , .5, , .02] as SoundParams,
} as const;

export const UI_SOUNDS = {
  /** Soft click for buttons (~50ms) */
  buttonClick: [, , 1e3, , .02, .01, , 1.5, , , , , , , , , , , .5] as SoundParams,

  /** Mario coin pickup for toggle switches */
  toggleSwitch: [.15, , 988, .01, .03, .08, 1, 1, , , 400, .02, .02, , , , , , .15] as SoundParams,

  /** Bright confirmation ping when pattern is selected (~150ms) */
  patternSelect: [, , 880, .01, .06, .15, 1, 1, , , 150, .03, .04] as SoundParams,

  /** Soft descending dismiss for closing dialogs (~80ms) */
  dialogClose: [, , 600, , .03, .06, 1, 1.8, -8, , , , , , , , , , .3] as SoundParams,
} as const;

/* eslint-enable no-sparse-arrays */
