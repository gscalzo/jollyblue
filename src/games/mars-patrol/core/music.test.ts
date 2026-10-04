import { describe, expect, it } from 'vitest';
import type { Course } from './course';
import { TITLE } from './flow';
import { MARS_TRACK, musicLevel } from './music';
import { newRun } from './run';

const COURSE: Course = {
  checkpoints: [{ letter: 'A', x: 0, par: 0 }],
  craters: [],
  rocks: [],
  ufos: [],
};

describe('the game’s music', () => {
  it('loops on a bar line before the outro', () => {
    expect(MARS_TRACK.url).toBe('/music/mars-patrol.mp3');
    expect(MARS_TRACK.loopEnd).toBeCloseTo(103.38, 2);
    expect(MARS_TRACK.crossfade).toBe(2);
  });

  it('plays softer on the title, ducks under a crash and the results', () => {
    const run = newRun(COURSE);
    expect(musicLevel(TITLE)).toBe(0.7);
    expect(musicLevel({ kind: 'playing', run })).toBe(1);
    expect(
      musicLevel({ kind: 'playing', run: { ...run, phase: { kind: 'crashed', left: 1 } } }),
    ).toBe(0.5);
    expect(musicLevel({ kind: 'results', run, t: 0 })).toBe(0.3);
  });
});
