import { describe, expect, it } from 'vitest';
import type { Course } from './course';
import { finished, newRun, stepRun } from './run';
import type { Controls, Run, RunEvent } from './run';
import { checkpointBonus, clearBonus } from './scoring';
import { DRIVE, POINTS, RULES, STEP } from './tuning';

const COURSE: Course = {
  checkpoints: [
    { letter: 'A', x: 0, par: 0 },
    { letter: 'B', x: 100, par: 20 },
    { letter: 'C', x: 200, par: 20 },
  ],
  craters: [{ x: 40, width: 3 }],
};

const IDLE: Controls = { lever: 0, jump: false, fire: false };
const JUMP: Controls = { ...IDLE, jump: true };

/** Steps until `done`, collecting every event; fails after too many steps. */
function until(run: Run, done: (r: Run) => boolean, controls: (r: Run) => Controls = () => IDLE) {
  let current = run;
  const events: RunEvent[] = [];
  for (let i = 0; i < 20_000 && !done(current); i++) {
    const s = stepRun(COURSE, current, controls(current));
    current = s.run;
    events.push(...s.events);
  }
  expect(done(current)).toBe(true);
  return { run: current, events };
}

/** Jumps just before the crater, otherwise drives. */
const hop = (r: Run): Controls => (r.buggy.x > 37 && r.buggy.x < 38 ? JUMP : IDLE);
const at = (x: number, run = newRun(COURSE)): Run => ({ ...run, buggy: { ...run.buggy, x } });

describe('a new run', () => {
  it('starts at the first checkpoint with three lives and nothing scored', () => {
    const run = newRun(COURSE);
    expect(run.buggy).toEqual({ x: 0, y: 0, vy: 0, speed: DRIVE.cruise });
    expect(run.purse).toEqual({ score: 0, lives: RULES.lives, extras: 0 });
    expect(run.checkpoint).toBe(0);
    expect(run.stretch).toBe(0);
    expect(run.phase).toEqual({ kind: 'driving' });
    expect(finished(run)).toBe(false);
  });
});

describe('driving', () => {
  it('moves the buggy and counts the stretch’s time', () => {
    const s = stepRun(COURSE, newRun(COURSE), IDLE);
    expect(s.run.buggy.x).toBeCloseTo(DRIVE.cruise * STEP);
    expect(s.run.stretch).toBeCloseTo(STEP);
    expect(s.events).toEqual([]);
  });

  it('jumps a crater for points, with the jump and the landing heard', () => {
    const { run, events } = until(newRun(COURSE), (r) => r.buggy.x > 50, hop);
    expect(events).toEqual([
      { kind: 'jump' },
      { kind: 'points', points: POINTS.crater },
      { kind: 'land' },
    ]);
    expect(run.purse.score).toBe(POINTS.crater);
    expect(run.phase.kind).toBe('driving');
  });

  it('crashes into a crater it does not jump, losing a life', () => {
    const { run, events } = until(newRun(COURSE), (r) => r.phase.kind !== 'driving');
    expect(events).toEqual([{ kind: 'crash' }]);
    expect(run.purse.lives).toBe(RULES.lives - 1);
    expect(run.phase).toEqual({ kind: 'crashed', left: RULES.crashSeconds });
    expect(run.buggy.x).toBeGreaterThan(40 + RULES.craterMargin);
  });

  it('flies over a crater without crashing while in the air', () => {
    const airborne = { ...at(41), buggy: { x: 41, y: 1, vy: 2, speed: DRIVE.cruise } };
    expect(stepRun(COURSE, airborne, IDLE).run.phase.kind).toBe('driving');
  });
});

describe('after a crash', () => {
  const wreck = () => until(newRun(COURSE), (r) => r.phase.kind !== 'driving').run;

  it('waits out the explosion, then respawns at the last checkpoint', () => {
    const crashed = wreck();
    const one = stepRun(COURSE, crashed, JUMP);
    expect(one.run.phase).toEqual({ kind: 'crashed', left: RULES.crashSeconds - STEP });
    expect(one.run.buggy).toBe(crashed.buggy);
    expect(one.events).toEqual([]);
    const { run, events } = until(crashed, (r) => r.phase.kind === 'driving');
    expect(events).toEqual([{ kind: 'respawn' }]);
    expect(run.buggy).toEqual({ x: 0, y: 0, vy: 0, speed: DRIVE.cruise });
    expect(run.stretch).toBe(0);
    expect(run.purse.lives).toBe(RULES.lives - 1);
  });

  it('respawns at the checkpoint reached, not the start', () => {
    const crashed = wreck();
    const later = { ...crashed, checkpoint: 1, phase: { kind: 'crashed' as const, left: STEP } };
    expect(stepRun(COURSE, later, IDLE).run.buggy.x).toBe(100);
  });

  it('ends the run when the last life is gone', () => {
    const crashed = wreck();
    const last = { ...crashed, purse: { ...crashed.purse, lives: 0 } };
    const { run, events } = until(last, finished);
    expect(events).toEqual([{ kind: 'over' }]);
    expect(run.phase).toEqual({ kind: 'over' });
    expect(stepRun(COURSE, run, JUMP)).toEqual({ run, events: [] });
  });
});

describe('checkpoints and the finish', () => {
  it('pays a checkpoint by its par and restarts the stretch', () => {
    const past = { ...at(99.95), stretch: 10 };
    const s = stepRun(COURSE, past, IDLE);
    const bonus = checkpointBonus(20, 10 + STEP);
    expect(s.events).toEqual([{ kind: 'checkpoint', letter: 'B', bonus }]);
    expect(s.run.checkpoint).toBe(1);
    expect(s.run.stretch).toBe(0);
    expect(s.run.purse.score).toBe(bonus);
    expect(stepRun(COURSE, at(99), IDLE).events).toEqual([]);
  });

  it('reaches a checkpoint standing exactly on it', () => {
    const on = { ...at(100 - DRIVE.cruise * STEP), stretch: 30 };
    expect(stepRun(COURSE, on, IDLE).run.checkpoint).toBe(1);
  });

  it('clears the section at the last checkpoint, with a bonus for lives left', () => {
    const near = { ...at(199.95), checkpoint: 1, stretch: 30 };
    const s = stepRun(COURSE, near, IDLE);
    const cp = checkpointBonus(20, 30 + STEP);
    const bonus = clearBonus(RULES.lives);
    expect(s.events).toEqual([
      { kind: 'checkpoint', letter: 'C', bonus: cp },
      { kind: 'extra-life' },
      { kind: 'clear', bonus },
    ]);
    expect(s.run.phase).toEqual({ kind: 'clear' });
    expect(s.run.purse.score).toBe(cp + bonus);
    expect(finished(s.run)).toBe(true);
    expect(stepRun(COURSE, s.run, IDLE)).toEqual({ run: s.run, events: [] });
  });

  it('clears standing exactly on the finish', () => {
    const on = { ...at(200 - DRIVE.cruise * STEP), checkpoint: 1 };
    expect(stepRun(COURSE, on, IDLE).run.phase.kind).toBe('clear');
  });

  it('does not clear before the finish', () => {
    const before = { ...at(150), checkpoint: 1 };
    expect(stepRun(COURSE, before, IDLE).run.phase.kind).toBe('driving');
  });

  it('gives an extra life when a bonus crosses a threshold', () => {
    const rich = { ...at(99.95), purse: { score: RULES.extraLives[0] - 10, lives: 2, extras: 0 } };
    const s = stepRun(COURSE, rich, IDLE);
    expect(s.events.map((e) => e.kind)).toEqual(['extra-life', 'checkpoint']);
    expect(s.run.purse.lives).toBe(3);
  });

  it('gives an extra life when points cross a threshold', () => {
    const rich = { ...at(43), purse: { score: RULES.extraLives[0] - 10, lives: 2, extras: 0 } };
    const s = until(rich, (r) => r.purse.score >= RULES.extraLives[0]);
    expect(s.events).toEqual([{ kind: 'points', points: POINTS.crater }, { kind: 'extra-life' }]);
  });
});
