import { describe, expect, it } from 'vitest';
import { hearing, loopOf, noteFrequency, parseJingle } from './audio';

describe('noteFrequency', () => {
  it('tunes A4 to 440 Hz in equal temperament', () => {
    expect(noteFrequency('A4')).toBe(440);
    expect(noteFrequency('A5')).toBe(880);
    expect(noteFrequency('C4')).toBeCloseTo(261.63, 2);
    expect(noteFrequency('C#4')).toBeCloseTo(277.18, 2);
    expect(noteFrequency('B3')).toBeCloseTo(246.94, 2);
    expect(noteFrequency('E5')).toBeCloseTo(659.26, 2);
  });
  it('refuses what is not a note', () => {
    expect(noteFrequency('H4')).toBeNull();
    expect(noteFrequency('A')).toBeNull();
    expect(noteFrequency('xA4')).toBeNull();
    expect(noteFrequency('A4x')).toBeNull();
  });
});

describe('parseJingle', () => {
  it('reads notes and rests', () => {
    expect(parseJingle(' A4  .  A5 ')).toEqual([440, null, 880]);
  });
  it('refuses a jingle with a bad note', () => {
    expect(parseJingle('A4 Q9')).toBeNull();
  });
});

describe('loopOf', () => {
  it('rests sixteen steps after the jingle', () => {
    const loop = loopOf([440, null]);
    expect(loop).toHaveLength(18);
    expect(loop.slice(0, 2)).toEqual([440, null]);
    expect(loop.slice(2).every((s) => s === null)).toBe(true);
  });
});

describe('hearing', () => {
  const here = { x: 5, z: 5 };
  it('is full volume, centred, on the spot', () => {
    expect(hearing(here, here)).toEqual({ gain: 1, pan: 0 });
  });
  it('falls off with the square of the distance and is silent beyond range', () => {
    expect(hearing(here, { x: 5, z: 8.5 }).gain).toBeCloseTo(0.25);
    expect(hearing(here, { x: 5, z: 12 }).gain).toBe(0);
    expect(hearing(here, { x: 5, z: 20 }).gain).toBe(0);
  });
  it('pans by where the source sits on screen', () => {
    const h = Math.SQRT1_2;
    expect(hearing(here, { x: 5 + h, z: 5 - h }).pan).toBeCloseTo(0.2);
    expect(hearing(here, { x: 5 - h, z: 5 + h }).pan).toBeCloseTo(-0.2);
    expect(hearing(here, { x: 6, z: 6 }).pan).toBeCloseTo(0);
    expect(hearing(here, { x: 15, z: 0 }).pan).toBe(1);
    expect(hearing(here, { x: 0, z: 15 }).pan).toBe(-1);
  });
});
