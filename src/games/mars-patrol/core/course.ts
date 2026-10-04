/**
 * The course (ADR-0017): checkpoints A to E and the craters and rocks between
 * them, hand-authored and validated. Positions are metres along the road.
 */
import { DRIVE, ROCKS, RULES } from './tuning';

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

export type RockSize = keyof typeof ROCKS;

export interface Rock {
  /** The rock's middle. */
  x: number;
  size: RockSize;
}

export interface Course {
  /** The first is the start; passing the last clears the section. */
  checkpoints: readonly Checkpoint[];
  craters: readonly Crater[];
  rocks: readonly Rock[];
}

/** Clear road kept after every checkpoint, so a respawn never lands in trouble. */
export const RESPAWN_ROOM = 20;
/** The widest crater: a jump at the slowest speed still clears it. */
export const WIDEST_CRATER = 4;
/** How deep a crater looks; the logic only knows its span. */
export const CRATER_DEPTH = 1.1;

/** Clear road an obstacle keeps from the next, so a jump can land. */
export const LANDING_ROOM = DRIVE.half * 4;

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
    { x: 430, width: 2.5 },
    { x: 555, width: 3 },
    { x: 630, width: 3 },
    { x: 645, width: 3 },
    { x: 750, width: 3.5 },
    { x: 764, width: 3 },
    { x: 860, width: 4 },
    { x: 930, width: 3.5 },
    { x: 1000, width: 3 },
    { x: 1080, width: 4 },
    { x: 1094, width: 3 },
    { x: 1160, width: 3.5 },
  ],
  rocks: [
    { x: 380, size: 'small' },
    { x: 470, size: 'small' },
    { x: 510, size: 'small' },
    { x: 700, size: 'big' },
    { x: 810, size: 'big' },
    { x: 830, size: 'small' },
    { x: 970, size: 'small' },
    { x: 1040, size: 'big' },
    { x: 1130, size: 'small' },
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
  if (before && crater.x < before.x + before.width + LANDING_ROOM) {
    return `crater ${i} leaves no room to land`;
  }
  if (crater.x + crater.width >= finish(course)) return `crater ${i} is past the finish`;
  return crowds(course, crater.x, crater.x + crater.width)
    ? `crater ${i} crowds a checkpoint`
    : null;
}

/** Where a rock stands on the road. */
export function rockSpan(rock: Rock): { from: number; to: number } {
  const { half } = ROCKS[rock.size];
  return { from: rock.x - half, to: rock.x + half };
}

function crowds(course: Course, from: number, to: number): boolean {
  return course.checkpoints.some((cp) => to > cp.x && from < cp.x + RESPAWN_ROOM);
}

function rockError(course: Course, rock: Rock, i: number): string | null {
  if (!Number.isFinite(rock.x) || !Object.hasOwn(ROCKS, rock.size)) return `rock ${i} is malformed`;
  const { from, to } = rockSpan(rock);
  const before = course.rocks[i - 1];
  if (before && from < rockSpan(before).to + LANDING_ROOM)
    return `rock ${i} leaves no room to land`;
  const near = course.craters.some(
    (c) => from < c.x + c.width + LANDING_ROOM && to > c.x - LANDING_ROOM,
  );
  if (near) return `rock ${i} leaves no room to land`;
  if (to >= finish(course)) return `rock ${i} is past the finish`;
  return crowds(course, from, to) ? `rock ${i} crowds a checkpoint` : null;
}

/** Every reason the course cannot be played; empty when it is sound. */
export function validateCourse(course: Course): string[] {
  const errors = checkpointErrors(course);
  if (errors.length > 0) return errors;
  return [
    ...course.craters.flatMap((c, i) => craterError(course, c, i) ?? []),
    ...course.rocks.flatMap((r, i) => rockError(course, r, i) ?? []),
  ];
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
