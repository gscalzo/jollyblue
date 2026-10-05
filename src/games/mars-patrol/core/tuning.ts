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
  /** Metres trimmed from a rock's sides and top before it counts as a hit. */
  rockMargin: 0.2,
} as const;

/** The two rocks: half their width, their height, the shots they take and what they pay. */
export const ROCKS = {
  small: { half: 0.5, height: 0.8, hits: 1, jumped: 80, shot: 100 },
  big: { half: 0.8, height: 1.4, hits: 2, jumped: 100, shot: 200 },
} as const;

/** The buggy's two guns (ADR-0017): one bolt along the road, up to three straight up. */
export const GUNS = {
  /** Metres per second a forward bolt flies faster than the buggy. */
  boltSpeed: 34,
  /** How far a forward bolt flies before it fades. */
  range: 30,
  upSpeed: 26,
  /** Height where an upward bolt fades. */
  ceiling: 24,
  maxUp: 3,
  /** Where the bolts leave the buggy, from its middle. */
  frontX: 1.9,
  frontY: 0.72,
  topX: -0.35,
  topY: 2.25,
} as const;

export const POINTS = {
  crater: 50,
  checkpoint: 1_000,
  perSecondUnderPar: 100,
  clear: 5_000,
  perLife: 2_000,
} as const;

/** The UFOs (ADR-0017): they fly in from far behind the road, hover ahead and bomb. */
export const UFO = {
  /** Seconds to fly in from the distance, and to fly away. */
  approach: 3,
  leave: 3,
  /** Where one appears, relative to the buggy: far back, high and ahead. */
  startZ: -70,
  startY: 18,
  startAhead: 45,
  hoverY: 7,
  /** Metres per second faster or slower than cruise it moves to keep its station. */
  chase: 3,
  /** How far it sways while it hovers. */
  swayX: 3,
  swayY: 0.8,
  /** How close an upward bolt must pass to bring one down. */
  hitX: 1.4,
  hitY: 0.8,
  points: 300,
} as const;

export const BOMB = {
  gravity: 9,
  /** How close a bolt must pass to burst a bomb. */
  hit: 0.6,
  /** Metres beyond the buggy's ends a blast still reaches. */
  blast: 0.4,
  /** A blast only reaches a buggy lower than this. */
  reach: 1,
  /** The crater a missed bomb leaves in the road ahead. */
  hole: 2.2,
  /** A bomb only leaves a crater this far ahead of the buggy or more: closer, there is no time to jump. */
  clearance: 7,
  points: 50,
} as const;
