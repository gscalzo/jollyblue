import { describe, expect, it } from 'vitest';
import type { Course } from './course';
import { stepScreen, TITLE } from './flow';
import type { Screen } from './flow';
import { newRun } from './run';
import type { Controls } from './run';
import { RULES, STEP } from './tuning';

const COURSE: Course = {
  checkpoints: [
    { letter: 'A', x: 0, par: 0 },
    { letter: 'B', x: 100, par: 20 },
  ],
  craters: [],
  rocks: [],
};
const IDLE: Controls = { lever: 0, jump: false, fire: false };
const FIRE: Controls = { ...IDLE, fire: true };

describe('the screens', () => {
  it('waits on the title, then starts a run on Action', () => {
    expect(stepScreen(COURSE, TITLE, { ...IDLE, jump: true })).toEqual({
      screen: { kind: 'title', t: STEP },
      events: [],
    });
    expect(stepScreen(COURSE, TITLE, FIRE)).toEqual({
      screen: { kind: 'playing', run: newRun(COURSE) },
      events: [{ kind: 'start' }],
    });
  });

  it('steps the run while it lasts', () => {
    const s = stepScreen(COURSE, { kind: 'playing', run: newRun(COURSE) }, IDLE);
    expect(s.screen.kind).toBe('playing');
    expect(s.events).toEqual([]);
  });

  it('posts a finished run’s score once and shows the results', () => {
    const run = newRun(COURSE);
    const last = {
      ...run,
      purse: { ...run.purse, score: 1230, lives: 0 },
      phase: { kind: 'crashed' as const, left: STEP },
    };
    const s = stepScreen(COURSE, { kind: 'playing', run: last }, IDLE);
    expect(s.events).toEqual([{ kind: 'over' }, { kind: 'post', points: 1230 }]);
    expect(s.screen).toEqual({ kind: 'results', run: { ...last, phase: { kind: 'over' } }, t: 0 });
  });

  it('leaves the results for the title on Action, once they have shown a moment', () => {
    const run = { ...newRun(COURSE), phase: { kind: 'over' as const } };
    const fresh: Screen = { kind: 'results', run, t: 0 };
    expect(stepScreen(COURSE, fresh, FIRE)).toEqual({
      screen: { kind: 'results', run, t: STEP },
      events: [],
    });
    const ready: Screen = { kind: 'results', run, t: RULES.resultsSeconds };
    expect(stepScreen(COURSE, ready, IDLE).screen).toEqual({
      kind: 'results',
      run,
      t: RULES.resultsSeconds + STEP,
    });
    expect(stepScreen(COURSE, ready, FIRE)).toEqual({ screen: TITLE, events: [] });
  });
});
