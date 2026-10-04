/**
 * Every number that tunes Mars Patrol 3D (ADR-0017), in metres, seconds and
 * points. The simulation steps at a fixed rate whatever the display does.
 */

/** Seconds per simulation step. */
export const STEP = 1 / 60;

/** The buggy: the speed lever, the jump and its footprint. */
export const DRIVE = {
  cruise: 9,
  slowest: 5.5,
  fastest: 14,
  /** Metres per second gained or lost each second on the ground. */
  accel: 8,
  gravity: 22,
  jumpSpeed: 9.5,
  /** Half the buggy's length, wheel to wheel. */
  half: 1.2,
  /** How far up the stick must go to count as a jump. */
  jumpThreshold: 0.5,
} as const;

/** Lives, timings and the arcade's quiet kindness. */
export const RULES = {
  lives: 3,
  extraLives: [10_000, 30_000],
  /** Seconds of explosion before a respawn or the end. */
  crashSeconds: 2,
  /** Seconds the results show before Action can leave them. */
  resultsSeconds: 1,
  /** Metres trimmed from each end of a crater's deadly span. */
  craterMargin: 0.35,
} as const;

export const POINTS = {
  crater: 50,
  checkpoint: 1_000,
  perSecondUnderPar: 100,
  clear: 5_000,
  perLife: 2_000,
} as const;
