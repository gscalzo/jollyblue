import { describe, expect, it } from 'vitest';
import type { Course } from './course';
import { finished, newRun, stepRun } from './run';
import type { Controls, Run, RunEvent } from './run';
import { checkpointBonus, clearBonus } from './scoring';
import { DRIVE, GUNS, POINTS, ROCKS, RULES, STEP, UFO } from './tuning';

const COURSE: Course = {
  checkpoints: [
    { letter: 'A', x: 0, par: 0 },
    { letter: 'B', x: 100, par: 20 },
    { letter: 'C', x: 200, par: 20 },
  ],
  craters: [{ x: 40, width: 3 }],
  rocks: [],
  ufos: [],
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

describe('rocks and guns', () => {
  const ROCKY: Course = {
    checkpoints: [
      { letter: 'A', x: 0, par: 0 },
      { letter: 'B', x: 100, par: 20 },
      { letter: 'C', x: 200, par: 20 },
    ],
    craters: [],
    rocks: [
      { x: 40, size: 'small' },
      { x: 70, size: 'big' },
      { x: 150, size: 'small' },
    ],
    ufos: [],
  };
  const FIRE: Controls = { ...IDLE, fire: true };

  function drive(run: Run, done: (r: Run) => boolean, controls: (r: Run) => Controls) {
    let current = run;
    const events: RunEvent[] = [];
    for (let i = 0; i < 5_000 && !done(current); i++) {
      const s = stepRun(ROCKY, current, controls(current));
      current = s.run;
      events.push(...s.events);
    }
    expect(done(current)).toBe(true);
    return { run: current, events };
  }
  const placed = (x: number) => {
    const run = newRun(ROCKY);
    return { ...run, buggy: { ...run.buggy, x } };
  };

  it('starts with every rock whole and the guns holstered', () => {
    const run = newRun(ROCKY);
    expect(run.damage).toEqual([0, 0, 0]);
    expect(run.guns).toEqual({ forward: null, up: [] });
  });

  it('fires both guns on Fire', () => {
    const s = stepRun(ROCKY, placed(10), FIRE);
    expect(s.events).toEqual([{ kind: 'fire' }]);
    expect(s.run.guns.forward).not.toBeNull();
    expect(s.run.guns.up).toHaveLength(1);
  });

  it('says nothing when the guns have nothing left to fire', () => {
    const run = stepRun(ROCKY, placed(10), FIRE).run;
    const full = {
      ...run,
      guns: {
        ...run.guns,
        up: [run.guns.up[0], run.guns.up[0], run.guns.up[0]].filter((b) => b !== undefined),
      },
    };
    expect(stepRun(ROCKY, full, FIRE).events).toEqual([]);
  });

  it('breaks a small rock with one bolt, for points', () => {
    const first = stepRun(ROCKY, placed(20), FIRE);
    const { run, events } = drive(
      first.run,
      (r) => r.damage[0] === 1,
      () => IDLE,
    );
    expect(events).toEqual([
      { kind: 'break', x: 40, size: 'small' },
      { kind: 'points', points: ROCKS.small.shot },
    ]);
    expect(run.guns.forward).toBeNull();
    expect(run.damage).toEqual([1, 0, 0]);
    expect(run.purse.score).toBe(ROCKS.small.shot);
  });

  it('chips a big rock with the first bolt and breaks it with the second', () => {
    const start = { ...placed(50), damage: [1, 0, 0] };
    const one = drive(
      stepRun(ROCKY, start, FIRE).run,
      (r) => r.damage[1] === 1,
      () => IDLE,
    );
    expect(one.events).toEqual([{ kind: 'hit', x: 70 }]);
    expect(one.run.purse.score).toBe(0);
    const two = drive(
      stepRun(ROCKY, one.run, FIRE).run,
      (r) => r.damage[1] === 2,
      () => IDLE,
    );
    expect(two.events).toEqual([
      { kind: 'break', x: 70, size: 'big' },
      { kind: 'points', points: ROCKS.big.shot },
    ]);
  });

  it('lets a bolt fade before it reaches a rock out of range', () => {
    const run = placed(0);
    const guns = { forward: { x: 35, y: 0.7, vx: 600, vy: 0, from: 35 - GUNS.range + 1 }, up: [] };
    const s = stepRun(ROCKY, { ...run, guns }, IDLE);
    expect(s.run.guns.forward).toBeNull();
    expect(s.events).toEqual([]);
  });

  it('crashes into a rock it neither shoots nor jumps', () => {
    const { run, events } = drive(
      placed(20),
      (r) => r.phase.kind !== 'driving',
      () => IDLE,
    );
    expect(events).toEqual([{ kind: 'crash' }]);
    expect(run.buggy.x).toBeLessThan(40);
  });

  it('pays for jumping a rock', () => {
    const hopRock = (r: Run): Controls => (r.buggy.x > 36 && r.buggy.x < 37 ? JUMP : IDLE);
    const { run, events } = drive(placed(20), (r) => r.buggy.x > 50, hopRock);
    expect(events).toContainEqual({ kind: 'points', points: ROCKS.small.jumped });
    expect(run.phase.kind).toBe('driving');
  });

  it('respawns with the rocks ahead put back and the guns holstered', () => {
    const crashed = {
      ...placed(160),
      checkpoint: 1,
      damage: [1, 2, 1],
      guns: { forward: { x: 1, y: 1, vx: 1, vy: 0, from: 1 }, up: [] },
      phase: { kind: 'crashed' as const, left: STEP },
    };
    const s = stepRun(ROCKY, crashed, IDLE);
    expect(s.run.damage).toEqual([1, 2, 0]);
    expect(s.run.guns).toEqual({ forward: null, up: [] });
  });
});

describe('the sky over a run', () => {
  const SKY: Course = {
    checkpoints: [
      { letter: 'A', x: 0, par: 0 },
      { letter: 'B', x: 100, par: 20 },
      { letter: 'C', x: 300, par: 20 },
    ],
    craters: [],
    rocks: [],
    ufos: [{ at: 120, hover: 8, bombs: 3, every: 1 }],
  };
  const placed = (x: number) => {
    const run = newRun(SKY);
    return { ...run, buggy: { ...run.buggy, x }, checkpoint: 1 };
  };

  it('starts with a clear sky waiting for its waves', () => {
    expect(newRun(SKY).skies).toEqual({ ufos: [], bombs: [], holes: [], nextWave: 0 });
  });

  it('launches a UFO when the buggy reaches its wave', () => {
    const s = stepRun(SKY, placed(119.95), IDLE);
    expect(s.events).toEqual([{ kind: 'ufo-in' }]);
    expect(s.run.skies.ufos).toHaveLength(1);
  });

  it('is wrecked by a bomb landing on it', () => {
    const run = {
      ...placed(150),
      skies: { ...newRun(SKY).skies, bombs: [{ x: 150, y: 0.01, vy: -5 }], nextWave: 1 },
    };
    const s = stepRun(SKY, run, IDLE);
    expect(s.events).toEqual([{ kind: 'impact', x: 150 }, { kind: 'crash' }]);
  });

  it('drops into a crater a bomb has blown', () => {
    const run = {
      ...placed(150),
      skies: { ...newRun(SKY).skies, holes: [{ x: 149, width: 2.2 }], nextWave: 1 },
    };
    expect(stepRun(SKY, run, IDLE).events).toEqual([{ kind: 'crash' }]);
    const flying = { ...run, buggy: { ...run.buggy, y: 1, vy: 1 } };
    expect(stepRun(SKY, flying, IDLE).events).toEqual([]);
  });

  it('pays for a UFO brought down, with the bolt spent', () => {
    const ufo = {
      x: 158,
      y: UFO.hoverY,
      z: 0,
      wave: 0,
      phase: 'attack' as const,
      t: 0,
      from: { x: 158, y: UFO.hoverY, z: 0 },
      bombs: 3,
      reload: 5,
      anchor: 158,
    };
    const bolt = { x: 158, y: UFO.hoverY, vx: 0, vy: 0, from: 158 };
    const run = {
      ...placed(150),
      guns: { forward: null, up: [bolt] },
      skies: { ...newRun(SKY).skies, ufos: [ufo], nextWave: 1 },
    };
    const s = stepRun(SKY, run, IDLE);
    expect(s.events).toEqual([
      { kind: 'ufo-down', x: expect.any(Number) as number, y: expect.any(Number) as number },
      { kind: 'points', points: UFO.points },
    ]);
    expect(s.run.guns.up).toEqual([]);
    expect(s.run.skies.ufos).toEqual([]);
  });

  it('respawns under a clear sky, the waves since the checkpoint waiting again', () => {
    const run = {
      ...placed(150),
      checkpoint: 1,
      phase: { kind: 'crashed' as const, left: STEP },
      skies: {
        ufos: [],
        bombs: [{ x: 1, y: 1, vy: 0 }],
        holes: [{ x: 140, width: 2 }],
        nextWave: 1,
      },
    };
    expect(stepRun(SKY, run, IDLE).run.skies).toEqual({
      ufos: [],
      bombs: [],
      holes: [],
      nextWave: 0,
    });
  });
});
