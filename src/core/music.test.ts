import { describe, expect, it } from 'vitest';
import { dueToStart, HALL_TRACK, loopPeriod } from './music';

describe('the hall track', () => {
  it('turns round on a bar line, before the outro', () => {
    expect(HALL_TRACK.loopEnd).toBeCloseTo(113.45, 2);
    expect(HALL_TRACK.loopEnd).toBeLessThan(116);
  });
  it('starts each play one crossfade before the last one ends', () => {
    expect(loopPeriod({ url: '', loopEnd: 100, crossfade: 2 })).toBe(98);
  });
});

describe('dueToStart', () => {
  it('schedules a play once it falls inside the lookahead', () => {
    expect(dueToStart(10, 9.7, 0.3)).toBe(true);
    expect(dueToStart(10, 9.69, 0.3)).toBe(false);
    expect(dueToStart(10, 11, 0.3)).toBe(true);
  });
});
