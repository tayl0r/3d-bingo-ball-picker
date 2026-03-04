// Each entry is a zzfx parameter array.
// Design sounds at https://killedbyapixel.github.io/ZzFX/

export type SoundParams = (number | undefined)[];

export const GAME_SOUNDS = {
  /** Short punchy "boop" when GET A BALL is clicked (~200ms) */
  ballDraw: [, , 537, .02, .02, .22, 1, 1.59, -6.98, 4.97] as SoundParams,

  /** Rising whir for machine mixing — play as one-shot at mix start */
  mixing: [, , 150, .05, .5, .8, 2, 2, , , 50, .05, .15, , , , , .5, .3] as SoundParams,

  /** Rising whoosh when ball launches from machine (~300ms) */
  ballLaunch: [, , 200, .01, .05, .15, , 1.5, 20, , , , , , , , , , .3] as SoundParams,

  /** Satisfying thud when ball lands at rest position (~150ms) */
  ballLand: [, , 925, .04, .3, .6, 1, .3, , 6.27, -184, .09, .17] as SoundParams,
} as const;

export const UI_SOUNDS = {
  /** Soft click for buttons (~50ms) */
  buttonClick: [, , 1e3, , .02, .01, , 1.5, , , , , , , , , , , .5] as SoundParams,

  /** Ascending chime when modal opens (~200ms) */
  modalOpen: [, , 700, .02, .08, .12, 1, .8, , , 88, .04, .05] as SoundParams,

  /** Descending tone when modal closes (~200ms) */
  modalClose: [, , 500, .02, .06, .1, 1, .8, , , -88, .04, .05] as SoundParams,

  /** Subtle tick for toggle switches (~50ms) */
  toggleSwitch: [, , 1200, , .01, .005, , 2, , , , , , , , , , , .3] as SoundParams,

  /** Bright confirmation ping when pattern is selected (~150ms) */
  patternSelect: [, , 880, .01, .06, .15, 1, 1, , , 150, .03, .04] as SoundParams,
} as const;
