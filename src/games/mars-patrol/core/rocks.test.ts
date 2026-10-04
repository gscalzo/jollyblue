import { describe, expect, it } from 'vitest';
import { startBuggy } from './buggy';
import type { Course } from './course';
import { hitsBuggy, jumpedPoints, restore, standing, struck } from './rocks';
import { DRIVE, ROCKS, RULES } from './tuning';

const COURSE: Course = {
  checkpoints: [
    { letter: 'A', x: 0, par: 0 },
    { letter: 'B', x: 200, par: 20 },
  ],
  craters: [],
  rocks: [
    { x: 50, size: 'small' },
    { x: 100, size: 'big' },
  ],
};
const FRESH = [0, 0];
const buggyAt = (x: number, y = 0) => ({ ...startBuggy(x), y });

describe('standing', () => {
  it('lasts until a rock has taken its shots', () => {
    const [small, big] = COURSE.rocks;
    if (!small || !big) throw new Error('two rocks');
    expect(standing(small, [0], 0)).toBe(true);
    expect(standing(small, [1], 0)).toBe(false);
    expect(standing(big, [0, 1], 1)).toBe(true);
    expect(standing(big, [0, 2], 1)).toBe(false);
    expect(standing(big, [], 1)).toBe(true);
  });
});

describe('hitsBuggy', () => {
  const m = RULES.rockMargin;
  const touch = 50 - ROCKS.small.half + m - DRIVE.half;

  it('wrecks a buggy that meets a standing rock below its top', () => {
    expect(hitsBuggy(COURSE, FRESH, buggyAt(touch))).toBe(false);
    expect(hitsBuggy(COURSE, FRESH, buggyAt(touch + 0.01))).toBe(true);
    expect(hitsBuggy(COURSE, FRESH, buggyAt(50 + ROCKS.small.half - m + DRIVE.half - 0.01))).toBe(
      true,
    );
    expect(hitsBuggy(COURSE, FRESH, buggyAt(50 + ROCKS.small.half - m + DRIVE.half))).toBe(false);
  });

  it('lets a buggy over the top, or through a broken rock', () => {
    const top = ROCKS.small.height - m;
    expect(hitsBuggy(COURSE, FRESH, buggyAt(50, top - 0.01))).toBe(true);
    expect(hitsBuggy(COURSE, FRESH, buggyAt(50, top))).toBe(false);
    expect(hitsBuggy(COURSE, [1, 0], buggyAt(50))).toBe(false);
  });
});

describe('jumpedPoints', () => {
  const end = 50 + ROCKS.small.half;

  it('pays for each standing rock the rear passes', () => {
    expect(jumpedPoints(COURSE, FRESH, end - 1, end + 0.01)).toBe(ROCKS.small.jumped);
    expect(jumpedPoints(COURSE, FRESH, end, end + 0.01)).toBe(ROCKS.small.jumped);
    expect(jumpedPoints(COURSE, FRESH, end - 1, end)).toBe(0);
    expect(jumpedPoints(COURSE, FRESH, end + 0.01, end + 1)).toBe(0);
    expect(jumpedPoints(COURSE, FRESH, 0, 150)).toBe(ROCKS.small.jumped + ROCKS.big.jumped);
  });

  it('pays nothing for a rock already broken', () => {
    expect(jumpedPoints(COURSE, [1, 0], end - 1, end + 1)).toBe(0);
  });
});

describe('struck', () => {
  const from = 50 - ROCKS.small.half;

  it('finds the first standing rock a bolt crosses below its top', () => {
    expect(struck(COURSE, FRESH, { from: from - 1, to: from, y: 0.5 })).toEqual({
      rock: COURSE.rocks[0],
      i: 0,
    });
    expect(struck(COURSE, FRESH, { from: from - 1, to: from - 0.01, y: 0.5 })).toBeNull();
    expect(struck(COURSE, FRESH, { from: 50.5, to: 51, y: 0.5 })).toEqual({
      rock: COURSE.rocks[0],
      i: 0,
    });
    expect(struck(COURSE, FRESH, { from: 50.51, to: 99, y: 0.5 })).toBeNull();
    expect(struck(COURSE, FRESH, { from: 40, to: 60, y: ROCKS.small.height })).toBeNull();
    expect(struck(COURSE, FRESH, { from: 40, to: 60, y: ROCKS.small.height - 0.01 })?.i).toBe(0);
  });

  it('flies through broken rocks to the next', () => {
    expect(struck(COURSE, [1, 0], { from: 40, to: 110, y: 0.5 })).toEqual({
      rock: COURSE.rocks[1],
      i: 1,
    });
  });
});

describe('restore', () => {
  it('puts back the rocks ahead of a point and leaves those behind', () => {
    expect(restore(COURSE, [1, 2], 60)).toEqual([1, 0]);
    expect(restore(COURSE, [1, 2], 50)).toEqual([1, 0]);
    expect(restore(COURSE, [1, 2], 49.99)).toEqual([0, 0]);
    expect(restore(COURSE, [], 200)).toEqual([0, 0]);
  });
});
