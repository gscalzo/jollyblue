import { describe, expect, it } from 'vitest';
import {
  changedCraters,
  checkpointX,
  CRATER_DEPTH,
  LANDING_ROOM,
  cratersBehind,
  finish,
  groundHeight,
  inPit,
  reaches,
  RESPAWN_ROOM,
  SECTION,
  validateCourse,
  WIDEST_CRATER,
} from './course';
import type { Course, Crater, Rock } from './course';
import { DRIVE, ROCKS, RULES } from './tuning';

const START = { letter: 'A', x: 0, par: 0 };
const END = { letter: 'B', x: 200, par: 30 };

function course(craters: Crater[], checkpoints = [START, END], rocks: Rock[] = []): Course {
  return { checkpoints, craters, rocks, ufos: [] };
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

describe('rocks in the course', () => {
  const small = (x: number): Rock => ({ x, size: 'small' });
  const room = LANDING_ROOM;

  it('accepts well-spaced rocks of known sizes', () => {
    expect(
      validateCourse(course([], [START, END], [small(50), small(60), { x: 80, size: 'big' }])),
    ).toEqual([]);
  });

  it('rejects a malformed rock', () => {
    expect(validateCourse(course([], [START, END], [small(Number.NaN)]))).toEqual([
      'rock 0 is malformed',
    ]);
    const odd = { x: 50, size: 'toString' } as unknown as Rock;
    expect(validateCourse(course([], [START, END], [odd]))).toEqual(['rock 0 is malformed']);
  });

  it('keeps room to land between rocks, and between rocks and craters', () => {
    const half = ROCKS.small.half;
    expect(
      validateCourse(course([], [START, END], [small(50), small(50 + 2 * half + room)])),
    ).toEqual([]);
    expect(
      validateCourse(course([], [START, END], [small(50), small(50 + 2 * half + room - 0.01)])),
    ).toEqual(['rock 1 leaves no room to land']);
    const pit = [{ x: 50, width: 3 }];
    expect(validateCourse(course(pit, [START, END], [small(53 + room + half)]))).toEqual([]);
    expect(validateCourse(course(pit, [START, END], [small(53 + room + half - 0.01)]))).toEqual([
      'rock 0 leaves no room to land',
    ]);
    expect(validateCourse(course(pit, [START, END], [small(50 - room - half)]))).toEqual([]);
    expect(validateCourse(course(pit, [START, END], [small(50 - room - half + 0.01)]))).toEqual([
      'rock 0 leaves no room to land',
    ]);
  });

  it('keeps rocks before the finish and clear of every checkpoint', () => {
    const half = ROCKS.small.half;
    expect(validateCourse(course([], [START, END], [small(200 - half - 0.01)]))).toEqual([]);
    expect(validateCourse(course([], [START, END], [small(200 - half)]))).toEqual([
      'rock 0 is past the finish',
    ]);
    expect(validateCourse(course([], [START, END], [small(RESPAWN_ROOM + half)]))).toEqual([]);
    expect(validateCourse(course([], [START, END], [small(RESPAWN_ROOM + half - 0.01)]))).toEqual([
      'rock 0 crowds a checkpoint',
    ]);
  });

  it('puts small rocks in B, big ones in C, and both later', () => {
    const between = (from: number, to: number) =>
      SECTION.rocks.filter((r) => r.x > from && r.x < to);
    expect(between(0, 300)).toEqual([]);
    expect(between(300, 600).every((r) => r.size === 'small')).toBe(true);
    expect(between(600, 900).some((r) => r.size === 'big')).toBe(true);
    expect(between(900, 1200).length).toBeGreaterThan(0);
  });
});

describe('UFO waves in the course', () => {
  const wave = { at: 50, hover: 8, bombs: 3, every: 1.5 };
  const withWaves = (ufos: (typeof wave)[]): Course => ({
    checkpoints: [START, END],
    craters: [],
    rocks: [],
    ufos,
  });

  it('accepts waves in order before the finish', () => {
    expect(validateCourse(withWaves([wave, { ...wave, at: 50 }]))).toEqual([]);
    expect(validateCourse(withWaves([{ ...wave, at: 199.9 }]))).toEqual([]);
  });

  it('rejects a malformed, unordered or late wave', () => {
    for (const bad of [
      { at: Number.NaN },
      { hover: Number.NaN },
      { bombs: Number.NaN },
      { every: Number.NaN },
      { hover: 0 },
      { bombs: 0 },
      { every: 0 },
    ]) {
      expect(validateCourse(withWaves([{ ...wave, ...bad }]))).toEqual(['wave 0 is malformed']);
    }
    expect(validateCourse(withWaves([{ ...wave, at: 0 }]))).toEqual([]);
    expect(validateCourse(withWaves([wave, { ...wave, at: 49 }]))).toEqual([
      'wave 1 comes before wave 0',
    ]);
    expect(validateCourse(withWaves([{ ...wave, at: 200 }]))).toEqual([
      'wave 0 is past the finish',
    ]);
  });

  it('sends the UFOs in the last stretch only', () => {
    expect(SECTION.ufos.length).toBeGreaterThan(1);
    expect(SECTION.ufos.every((w) => w.at > 900)).toBe(true);
  });
});

describe('craters that change', () => {
  const a = { x: 10, width: 2 };
  const b = { x: 20, width: 2 };
  const c = { x: 30, width: 2 };

  it('lists the craters in one list and not the other', () => {
    expect(changedCraters([a, b], [a, b])).toEqual([]);
    expect(changedCraters([a], [a, b])).toEqual([b]);
    expect(changedCraters([a, c], [a])).toEqual([c]);
  });

  it('knows which stretch of road a crater reaches into', () => {
    expect(reaches(a, 12, 20)).toBe(true);
    expect(reaches(a, 12.01, 20)).toBe(false);
    expect(reaches(a, 0, 10)).toBe(true);
    expect(reaches(a, 0, 9.99)).toBe(false);
  });
});

describe('the ground', () => {
  const one = course([{ x: 50, width: 3 }]);
  const m = RULES.craterMargin;

  it('drops the buggy only inside the trimmed span', () => {
    expect(inPit(one.craters, 50 + m)).toBe(false);
    expect(inPit(one.craters, 50 + m + 0.01)).toBe(true);
    expect(inPit(one.craters, 53 - m - 0.01)).toBe(true);
    expect(inPit(one.craters, 53 - m)).toBe(false);
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
