import { describe, expect, it } from 'vitest';
import {
  checkpointX,
  CRATER_DEPTH,
  cratersBehind,
  finish,
  groundHeight,
  inCrater,
  RESPAWN_ROOM,
  SECTION,
  validateCourse,
  WIDEST_CRATER,
} from './course';
import type { Course, Crater } from './course';
import { DRIVE, RULES } from './tuning';

const START = { letter: 'A', x: 0, par: 0 };
const END = { letter: 'B', x: 200, par: 30 };

function course(craters: Crater[], checkpoints = [START, END]): Course {
  return { checkpoints, craters };
}

describe('the section', () => {
  it('is sound, runs A to E and has craters in every stretch', () => {
    expect(validateCourse(SECTION)).toEqual([]);
    expect(SECTION.checkpoints.map((c) => c.letter).join('')).toBe('ABCDE');
    for (let i = 1; i < SECTION.checkpoints.length; i++) {
      const from = checkpointX(SECTION, i - 1);
      const to = checkpointX(SECTION, i);
      expect(SECTION.craters.some((c) => c.x > from && c.x < to)).toBe(true);
    }
  });
});

describe('validateCourse', () => {
  it('needs a start and a finish, well formed and in order', () => {
    expect(validateCourse(course([], [START]))).toEqual(['a course needs a start and a finish']);
    expect(validateCourse(course([], [START, { ...END, x: Number.NaN }]))).toEqual([
      'checkpoint 1 is malformed',
    ]);
    expect(validateCourse(course([], [START, { ...END, par: Number.NaN }]))).toEqual([
      'checkpoint 1 is malformed',
    ]);
    expect(validateCourse(course([], [START, { ...END, letter: 'BB' }]))).toEqual([
      'checkpoint 1 is malformed',
    ]);
    expect(validateCourse(course([], [START, { ...END, x: 0 }]))).toEqual([
      'checkpoint B is not after A',
    ]);
    expect(validateCourse(course([], [START, END]))).toEqual([]);
  });

  it('rejects a malformed crater or one too wide to jump', () => {
    expect(validateCourse(course([{ x: Number.NaN, width: 2 }]))).toEqual([
      'crater 0 is malformed',
    ]);
    expect(validateCourse(course([{ x: 50, width: Number.NaN }]))).toEqual([
      'crater 0 is malformed',
    ]);
    expect(validateCourse(course([{ x: 50, width: 0 }]))).toEqual(['crater 0 cannot be jumped']);
    expect(validateCourse(course([{ x: 50, width: WIDEST_CRATER + 0.01 }]))).toEqual([
      'crater 0 cannot be jumped',
    ]);
    expect(validateCourse(course([{ x: 50, width: WIDEST_CRATER }]))).toEqual([]);
  });

  it('keeps room to land between craters', () => {
    const room = DRIVE.half * 4;
    expect(
      validateCourse(
        course([
          { x: 50, width: 2 },
          { x: 52 + room, width: 2 },
        ]),
      ),
    ).toEqual([]);
    expect(
      validateCourse(
        course([
          { x: 50, width: 2 },
          { x: 52 + room - 0.01, width: 2 },
        ]),
      ),
    ).toEqual(['crater 1 leaves no room to land']);
  });

  it('keeps craters before the finish and clear of every checkpoint', () => {
    expect(validateCourse(course([{ x: 197, width: 2.99 }]))).toEqual([]);
    expect(validateCourse(course([{ x: 197, width: 3 }]))).toEqual(['crater 0 is past the finish']);
    expect(validateCourse(course([{ x: RESPAWN_ROOM, width: 2 }]))).toEqual([]);
    expect(validateCourse(course([{ x: RESPAWN_ROOM - 0.01, width: 2 }]))).toEqual([
      'crater 0 crowds a checkpoint',
    ]);
    const mid = { letter: 'M', x: 100, par: 10 };
    const three = [START, mid, END];
    expect(validateCourse(course([{ x: 97, width: 3 }], three))).toEqual([]);
    expect(validateCourse(course([{ x: 97, width: 3.01 }], three))).toEqual([
      'crater 0 crowds a checkpoint',
    ]);
  });
});

describe('the ground', () => {
  const one = course([{ x: 50, width: 3 }]);
  const m = RULES.craterMargin;

  it('drops the buggy only inside the trimmed span', () => {
    expect(inCrater(one, 50 + m)).toBe(false);
    expect(inCrater(one, 50 + m + 0.01)).toBe(true);
    expect(inCrater(one, 53 - m - 0.01)).toBe(true);
    expect(inCrater(one, 53 - m)).toBe(false);
  });

  it('counts the craters wholly behind a point', () => {
    expect(cratersBehind(one, 53)).toBe(0);
    expect(cratersBehind(one, 53.01)).toBe(1);
  });

  it('dips smoothly inside a crater and is flat elsewhere', () => {
    expect(groundHeight(one, 50)).toBe(0);
    expect(groundHeight(one, 53)).toBe(0);
    expect(groundHeight(one, 51.5)).toBeCloseTo(-CRATER_DEPTH);
    expect(groundHeight(one, 51)).toBeCloseTo(-CRATER_DEPTH * Math.sin(Math.PI / 3));
  });

  it('finds checkpoints and the finish, zero when missing', () => {
    expect(checkpointX(one, 1)).toBe(200);
    expect(checkpointX(one, 5)).toBe(0);
    expect(finish(one)).toBe(200);
    expect(finish(course([], []))).toBe(0);
  });
});
