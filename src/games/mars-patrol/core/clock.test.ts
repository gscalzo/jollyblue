import { describe, expect, it } from 'vitest';
import { IDLE } from '../../../core/input';
import type { Intent } from '../../../core/input';
import { controlsFrom, MAX_STEPS, posts, runFrame, stepsDue } from './clock';
import type { Course } from './course';
import { TITLE } from './flow';
import type { Screen } from './flow';
import { newRun } from './run';
import { DRIVE, STEP } from './tuning';

const COURSE: Course = {
  checkpoints: [
    { letter: 'A', x: 0, par: 0 },
    { letter: 'B', x: 100, par: 20 },
  ],
  craters: [],
  rocks: [],
};

const intent = (x: number, y: number, action = false): Intent => ({
  ...IDLE,
  move: { x, y },
  action,
});

describe('stepsDue', () => {
  it('owes whole steps and carries the rest', () => {
    const a = stepsDue(0, STEP * 2.5);
    expect(a.steps).toBe(2);
    expect(a.carry).toBeCloseTo(STEP / 2);
    const b = stepsDue(STEP / 2, STEP / 2);
    expect(b.steps).toBe(1);
    expect(b.carry).toBeCloseTo(0);
    expect(stepsDue(0, STEP / 3)).toEqual({ steps: 0, carry: STEP / 3 });
  });

  it('never runs backwards or too far after a stall', () => {
    expect(stepsDue(0, -1)).toEqual({ steps: 0, carry: 0 });
    expect(stepsDue(0, 1)).toEqual({ steps: MAX_STEPS, carry: 0 });
    const c = stepsDue(0, STEP * (MAX_STEPS - 0.5));
    expect(c.steps).toBe(MAX_STEPS - 1);
    expect(c.carry).toBeCloseTo(STEP / 2);
  });
});

describe('controlsFrom', () => {
  it('passes the lever through and turns up and Action into presses', () => {
    expect(controlsFrom(intent(0.4, 0), IDLE)).toEqual({ lever: 0.4, jump: false, fire: false });
    expect(controlsFrom(intent(0, 1, true), IDLE)).toEqual({ lever: 0, jump: true, fire: true });
    expect(controlsFrom(intent(0, 1, true), intent(0, 1, true))).toEqual({
      lever: 0,
      jump: false,
      fire: false,
    });
  });

  it('counts up as a jump only past the threshold', () => {
    const t = DRIVE.jumpThreshold;
    expect(controlsFrom(intent(0, t), IDLE).jump).toBe(false);
    expect(controlsFrom(intent(0, t + 0.01), IDLE).jump).toBe(true);
    expect(controlsFrom(intent(0, 1), intent(0, t)).jump).toBe(true);
  });
});

describe('runFrame', () => {
  const playing: Screen = { kind: 'playing', run: newRun(COURSE) };

  it('runs every step, the presses on the first only', () => {
    const fire = { lever: 0, jump: false, fire: true };
    const out = runFrame(COURSE, TITLE, fire, 2);
    expect(out.events).toEqual([{ kind: 'start' }]);
    expect(out.screen.kind).toBe('playing');
    const jumped = runFrame(COURSE, playing, { lever: 0, jump: true, fire: false }, 3);
    expect(jumped.events).toEqual([{ kind: 'jump' }]);
    if (jumped.screen.kind !== 'playing') throw new Error('still playing');
    expect(jumped.screen.run.buggy.x).toBeCloseTo(3 * STEP * DRIVE.cruise);
  });

  it('never lets one press both leave the results and start a run', () => {
    const run = { ...newRun(COURSE), phase: { kind: 'over' as const } };
    const ready: Screen = { kind: 'results', run, t: 5 };
    const out = runFrame(COURSE, ready, { lever: 0, jump: false, fire: true }, 2);
    expect(out.screen).toEqual({ kind: 'title', t: STEP });
  });

  it('changes nothing on a frame that owes no steps', () => {
    expect(runFrame(COURSE, TITLE, { lever: 0, jump: false, fire: true }, 0)).toEqual({
      screen: TITLE,
      events: [],
    });
  });
});

describe('posts', () => {
  it('picks the posted scores out of a frame’s events', () => {
    expect(posts([{ kind: 'jump' }, { kind: 'post', points: 90 }])).toEqual([90]);
    expect(posts([])).toEqual([]);
  });
});
