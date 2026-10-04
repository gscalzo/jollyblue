/**
 * The rocks on the road (ADR-0017): a rock stands until it has taken its
 * shots; a standing rock wrecks a buggy that meets it below its top, and
 * pays when the buggy clears it. `damage` counts the shots each has taken.
 */
import { rockSpan } from './course';
import type { Course, Rock } from './course';
import type { Buggy } from './buggy';
import { DRIVE, ROCKS, RULES } from './tuning';

export function standing(rock: Rock, damage: readonly number[], i: number): boolean {
  return (damage[i] ?? 0) < ROCKS[rock.size].hits;
}

/** True when a standing rock meets the buggy below the rock's top. */
export function hitsBuggy(course: Course, damage: readonly number[], buggy: Buggy): boolean {
  const m = RULES.rockMargin;
  return course.rocks.some((rock, i) => {
    const { from, to } = rockSpan(rock);
    const meets = buggy.x + DRIVE.half > from + m && buggy.x - DRIVE.half < to - m;
    return standing(rock, damage, i) && meets && buggy.y < ROCKS[rock.size].height - m;
  });
}

/** Points for the standing rocks the buggy's rear passed between two places. */
export function jumpedPoints(
  course: Course,
  damage: readonly number[],
  before: number,
  after: number,
): number {
  return course.rocks.reduce((sum, rock, i) => {
    const end = rockSpan(rock).to;
    const passed = end < after && end >= before && standing(rock, damage, i);
    return passed ? sum + ROCKS[rock.size].jumped : sum;
  }, 0);
}

export interface Struck {
  rock: Rock;
  i: number;
}

/** The first standing rock a bolt at height `y` meets flying from `from` to `to`. */
export function struck(
  course: Course,
  damage: readonly number[],
  path: { from: number; to: number; y: number },
): Struck | null {
  const i = course.rocks.findIndex((rock, k) => {
    const span = rockSpan(rock);
    const crosses = span.from <= path.to && span.to >= path.from;
    return standing(rock, damage, k) && crosses && path.y < ROCKS[rock.size].height;
  });
  const rock = course.rocks[i];
  return rock ? { rock, i } : null;
}

/** Puts back every rock ahead of `x`, as a respawn finds them. */
export function restore(course: Course, damage: readonly number[], x: number): number[] {
  return course.rocks.map((rock, i) => (rock.x > x ? 0 : (damage[i] ?? 0)));
}
