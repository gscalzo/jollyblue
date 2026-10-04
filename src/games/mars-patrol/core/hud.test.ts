import { describe, expect, it } from 'vitest';
import type { Course } from './course';
import type { Screen } from './flow';
import { TITLE } from './flow';
import { bestAfter, digits, hud, NOTICE_SECONDS, updateNotice } from './hud';
import { newRun } from './run';
import { RULES } from './tuning';

const COURSE: Course = {
  checkpoints: [
    { letter: 'A', x: 0, par: 0 },
    { letter: 'B', x: 100, par: 20 },
  ],
  craters: [],
  rocks: [],
  ufos: [],
};
const run = newRun(COURSE);
const at = (x: number) => ({ ...run, buggy: { ...run.buggy, x } });

describe('hud', () => {
  it('shows the title with the best score and no run yet', () => {
    expect(hud(COURSE, TITLE, 4560)).toEqual({
      score: '000000',
      hi: '004560',
      lives: RULES.lives,
      letters: ['A', 'B'],
      reached: 0,
      progress: 0,
      banner: 'MARS PATROL 3D',
      detail: null,
      prompt: 'ACTION TO START',
    });
    expect(hud(COURSE, TITLE, null).hi).toBeNull();
  });

  it('shows a run’s score, lives, checkpoint and progress, and no words', () => {
    const playing: Screen = {
      kind: 'playing',
      run: { ...at(25), purse: { score: 120, lives: 2, extras: 0 }, checkpoint: 1 },
    };
    expect(hud(COURSE, playing, null)).toMatchObject({
      score: '000120',
      lives: 2,
      reached: 1,
      progress: 0.25,
      banner: null,
      detail: null,
      prompt: null,
    });
  });

  it('keeps progress between nought and one', () => {
    expect(hud(COURSE, { kind: 'playing', run: at(-5) }, null).progress).toBe(0);
    expect(hud(COURSE, { kind: 'playing', run: at(150) }, null).progress).toBe(1);
  });

  it('shows the results, and the way back once they have shown a moment', () => {
    const over = { ...run, purse: { ...run.purse, score: 990 }, phase: { kind: 'over' as const } };
    expect(hud(COURSE, { kind: 'results', run: over, t: 0 }, null)).toMatchObject({
      banner: 'GAME OVER',
      detail: 'SCORE 000990',
      prompt: null,
    });
    const clear = { ...over, phase: { kind: 'clear' as const } };
    expect(
      hud(COURSE, { kind: 'results', run: clear, t: RULES.resultsSeconds }, null),
    ).toMatchObject({ banner: 'SECTION CLEAR', prompt: 'ACTION TO PLAY AGAIN' });
  });

  it('pads scores to six digits', () => {
    expect(digits(7)).toBe('000007');
    expect(digits(1234567)).toBe('1234567');
  });
});

describe('notices', () => {
  it('raises a notice for a checkpoint or an extra life, the latest winning', () => {
    expect(updateNotice(null, [{ kind: 'checkpoint', letter: 'B', bonus: 1300 }], 0.1)).toEqual({
      text: 'CHECKPOINT B  +1300',
      left: NOTICE_SECONDS,
    });
    expect(
      updateNotice(
        null,
        [{ kind: 'checkpoint', letter: 'B', bonus: 1300 }, { kind: 'extra-life' }],
        0.1,
      ),
    ).toEqual({ text: 'EXTRA LIFE', left: NOTICE_SECONDS });
  });

  it('lets a notice run down, then drops it', () => {
    const n = { text: 'X', left: 1 };
    expect(updateNotice(n, [{ kind: 'jump' }], 0.25)).toEqual({ text: 'X', left: 0.75 });
    expect(updateNotice(n, [], 1)).toBeNull();
    expect(updateNotice(null, [], 0.1)).toBeNull();
  });
});

describe('bestAfter', () => {
  it('keeps the best of the old best and the new posts', () => {
    expect(bestAfter(null, [])).toBeNull();
    expect(bestAfter(null, [30])).toBe(30);
    expect(bestAfter(null, [0])).toBe(0);
    expect(bestAfter(50, [30])).toBe(50);
    expect(bestAfter(50, [80, 60])).toBe(80);
  });
});
