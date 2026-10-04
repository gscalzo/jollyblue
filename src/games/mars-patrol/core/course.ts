/**
 * The course (ADR-0017): checkpoints A to E and the craters between them,
 * hand-authored and validated. Positions are metres along the road.
 */
import { DRIVE, RULES } from './tuning';

interface Checkpoint {
  letter: string;
  x: number;
  /** Seconds the stretch up to this checkpoint should take; the bonus counts under it. */
  par: number;
}

export interface Crater {
  /** Where the crater starts. */
  x: number;
  width: number;
}

export interface Course {
  /** The first is the start; passing the last clears the section. */
  checkpoints: readonly Checkpoint[];
  craters: readonly Crater[];
}

/** Clear road kept after every checkpoint, so a respawn never lands in trouble. */
export const RESPAWN_ROOM = 20;
/** The widest crater: a jump at the slowest speed still clears it. */
export const WIDEST_CRATER = 4;
/** How deep a crater looks; the logic only knows its span. */
export const CRATER_DEPTH = 1.1;

/** Section A–E. Each stretch teaches one thing and tightens the rhythm. */
export const SECTION: Course = {
  checkpoints: [
    { letter: 'A', x: 0, par: 0 },
    { letter: 'B', x: 300, par: 35 },
    { letter: 'C', x: 600, par: 34 },
    { letter: 'D', x: 900, par: 33 },
    { letter: 'E', x: 1200, par: 32 },
  ],
  craters: [
    { x: 60, width: 2 },
    { x: 115, width: 2.5 },
    { x: 170, width: 2.5 },
    { x: 225, width: 3 },
    { x: 330, width: 3 },
    { x: 378, width: 2.5 },
    { x: 426, width: 3 },
    { x: 474, width: 3.5 },
    { x: 522, width: 3 },
    { x: 630, width: 3 },
    { x: 672, width: 3.5 },
    { x: 714, width: 2.5 },
    { x: 756, width: 3 },
    { x: 798, width: 3.5 },
    { x: 840, width: 4 },
    { x: 930, width: 3.5 },
    { x: 966, width: 3 },
    { x: 1002, width: 4 },
    { x: 1038, width: 3 },
    { x: 1074, width: 3.5 },
    { x: 1110, width: 4 },
    { x: 1146, width: 3 },
  ],
};

function finite(...values: number[]): boolean {
  return values.every(Number.isFinite);
}

function checkpointErrors(course: Course): string[] {
  const { checkpoints } = course;
  if (checkpoints.length < 2) return ['a course needs a start and a finish'];
  return checkpoints.flatMap((cp, i) => {
    if (!finite(cp.x, cp.par) || cp.letter.length !== 1) return [`checkpoint ${i} is malformed`];
    const before = checkpoints[i - 1];
    return before && cp.x <= before.x
      ? [`checkpoint ${cp.letter} is not after ${before.letter}`]
      : [];
  });
}

function craterError(course: Course, crater: Crater, i: number): string | null {
  if (!finite(crater.x, crater.width)) return `crater ${i} is malformed`;
  if (crater.width <= 0 || crater.width > WIDEST_CRATER) return `crater ${i} cannot be jumped`;
  const before = course.craters[i - 1];
  if (before && crater.x < before.x + before.width + DRIVE.half * 4) {
    return `crater ${i} leaves no room to land`;
  }
  if (crater.x + crater.width >= finish(course)) return `crater ${i} is past the finish`;
  const crowded = course.checkpoints.some(
    (cp) => crater.x + crater.width > cp.x && crater.x < cp.x + RESPAWN_ROOM,
  );
  return crowded ? `crater ${i} crowds a checkpoint` : null;
}

/** Every reason the course cannot be played; empty when it is sound. */
export function validateCourse(course: Course): string[] {
  const errors = checkpointErrors(course);
  if (errors.length > 0) return errors;
  return course.craters.flatMap((c, i) => craterError(course, c, i) ?? []);
}

/** True when a buggy whose middle is at `x` would drop into a crater. */
export function inCrater(course: Course, x: number): boolean {
  const m = RULES.craterMargin;
  return course.craters.some((c) => x > c.x + m && x < c.x + c.width - m);
}

/** How many craters lie wholly behind `x`. */
export function cratersBehind(course: Course, x: number): number {
  return course.craters.filter((c) => c.x + c.width < x).length;
}

/** The ground's height at `x`: zero on the road, a smooth dip in a crater. */
export function groundHeight(course: Course, x: number): number {
  const crater = course.craters.find((c) => x > c.x && x < c.x + c.width);
  if (!crater) return 0;
  return -CRATER_DEPTH * Math.sin((Math.PI * (x - crater.x)) / crater.width);
}

/** Where checkpoint `i` stands; zero for one the course does not have. */
export function checkpointX(course: Course, i: number): number {
  return course.checkpoints[i]?.x ?? 0;
}

/** Where the section ends. */
export function finish(course: Course): number {
  return checkpointX(course, course.checkpoints.length - 1);
}
