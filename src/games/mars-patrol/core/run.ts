/**
 * One run (ADR-0017): drive, jump, shoot, dodge the bombs, crash, respawn at
 * the last checkpoint, clear the section or run out of lives. A pure step at a fixed
 * rate; what happened comes back as events for the sound and the screen.
 */
import { airborne, drive, startBuggy } from './buggy';
import type { Buggy } from './buggy';
import { checkpointX, cratersBehind, finish, inPit } from './course';
import type { Course, RockSize } from './course';
import { advance, fire, HOLSTERED } from './guns';
import type { Bolt, Guns } from './guns';
import { hitsBuggy, jumpedPoints, restore, standing, struck } from './rocks';
import { clearSkies, stepSkies } from './skies';
import type { Skies, SkyEvent } from './skies';
import { checkpointBonus, clearBonus, pay } from './scoring';
import type { Purse } from './scoring';
import { DRIVE, POINTS, ROCKS, RULES, STEP } from './tuning';

type Phase =
  { kind: 'driving' } | { kind: 'crashed'; left: number } | { kind: 'over' } | { kind: 'clear' };

export interface Run {
  buggy: Buggy;
  purse: Purse;
  /** Index of the last checkpoint passed. */
  checkpoint: number;
  /** Seconds since the last checkpoint, for its par. */
  stretch: number;
  phase: Phase;
  /** Shots each rock has taken, by its index in the course. */
  damage: readonly number[];
  guns: Guns;
  skies: Skies;
}

/** This step's controls: the lever, and the presses that went down. */
export interface Controls {
  lever: number;
  jump: boolean;
  fire: boolean;
}

export type RunEvent =
  | { kind: 'jump' }
  | { kind: 'land' }
  | { kind: 'fire' }
  | { kind: 'hit'; x: number }
  | { kind: 'break'; x: number; size: RockSize }
  | { kind: 'crash' }
  | { kind: 'respawn' }
  | { kind: 'points'; points: number }
  | { kind: 'extra-life' }
  | { kind: 'checkpoint'; letter: string; bonus: number }
  | { kind: 'clear'; bonus: number }
  | { kind: 'over' }
  | SkyEvent;

export interface Stepped {
  run: Run;
  events: RunEvent[];
}

export function newRun(course: Course): Run {
  return {
    buggy: startBuggy(checkpointX(course, 0)),
    purse: { score: 0, lives: RULES.lives, extras: 0 },
    checkpoint: 0,
    stretch: 0,
    phase: { kind: 'driving' },
    damage: course.rocks.map(() => 0),
    guns: HOLSTERED,
    skies: clearSkies(course.ufos, checkpointX(course, 0)),
  };
}

function award(s: Stepped, points: number, kind: 'points' | 'bonus' = 'points'): Stepped {
  if (points === 0) return s;
  const paid = pay(s.run.purse, points);
  const events: RunEvent[] = kind === 'points' ? [{ kind: 'points', points }] : [];
  for (let i = 0; i < paid.earned; i++) events.push({ kind: 'extra-life' });
  return { run: { ...s.run, purse: paid.purse }, events: [...s.events, ...events] };
}

function move(course: Course, run: Run, controls: Controls): Stepped {
  const before = run.buggy;
  const d = drive(before, controls.lever, controls.jump);
  const events: RunEvent[] = [];
  if (d.jumped) events.push({ kind: 'jump' });
  if (d.landed) events.push({ kind: 'land' });
  const s = { run: { ...run, buggy: d.buggy, stretch: run.stretch + STEP }, events };
  const rear = (b: Buggy) => b.x - DRIVE.half;
  const passed = cratersBehind(course, rear(d.buggy)) - cratersBehind(course, rear(before));
  const jumped = jumpedPoints(course, run.damage, rear(before), rear(d.buggy));
  return award(s, passed * POINTS.crater + jumped);
}

function strike(course: Course, s: Stepped, before: Bolt | null): Stepped {
  const bolt = s.run.guns.forward;
  if (!before || !bolt) return s;
  const hit = struck(course, s.run.damage, { from: before.x, to: bolt.x, y: bolt.y });
  if (!hit) return s;
  const damage = s.run.damage.map((d, k) => (k === hit.i ? d + 1 : d));
  const run = { ...s.run, damage, guns: { ...s.run.guns, forward: null } };
  const { rock } = hit;
  if (standing(rock, damage, hit.i))
    return { run, events: [...s.events, { kind: 'hit', x: rock.x }] };
  const broke: RunEvent = { kind: 'break', x: rock.x, size: rock.size };
  return award({ run, events: [...s.events, broke] }, ROCKS[rock.size].shot);
}

function shoot(course: Course, s: Stepped, trigger: boolean): Stepped {
  const shot = trigger ? fire(s.run.guns, s.run.buggy) : { guns: s.run.guns, fired: false };
  const events: RunEvent[] = shot.fired ? [...s.events, { kind: 'fire' }] : s.events;
  const run = { ...s.run, guns: advance(shot.guns) };
  return strike(course, { run, events }, shot.guns.forward);
}

function wrecked(course: Course, run: Run): boolean {
  const { buggy } = run;
  const pits = [...course.craters, ...run.skies.holes];
  return (!airborne(buggy) && inPit(pits, buggy.x)) || hitsBuggy(course, run.damage, buggy);
}

function crash(s: Stepped): Stepped {
  const purse = { ...s.run.purse, lives: s.run.purse.lives - 1 };
  const phase: Phase = { kind: 'crashed', left: RULES.crashSeconds };
  return { run: { ...s.run, purse, phase }, events: [...s.events, { kind: 'crash' }] };
}

function passCheckpoint(course: Course, s: Stepped): Stepped {
  const next = course.checkpoints[s.run.checkpoint + 1];
  if (!next || s.run.buggy.x < next.x) return s;
  const bonus = checkpointBonus(next.par, s.run.stretch);
  const run = { ...s.run, checkpoint: s.run.checkpoint + 1, stretch: 0 };
  const passed = award({ run, events: s.events }, bonus, 'bonus');
  const event: RunEvent = { kind: 'checkpoint', letter: next.letter, bonus };
  return { run: passed.run, events: [...passed.events, event] };
}

function clear(course: Course, s: Stepped): Stepped {
  if (s.run.buggy.x < finish(course)) return s;
  const bonus = clearBonus(s.run.purse.lives);
  const paid = award(
    { run: { ...s.run, phase: { kind: 'clear' } }, events: s.events },
    bonus,
    'bonus',
  );
  return { run: paid.run, events: [...paid.events, { kind: 'clear', bonus }] };
}

function driving(course: Course, run: Run, controls: Controls): Stepped {
  const shot = shoot(course, move(course, run, controls), controls.fire);
  const sky = stepSkies(course.ufos, shot.run.skies, shot.run.guns.up, shot.run.buggy);
  const guns = { ...shot.run.guns, up: sky.up };
  const flown = {
    run: { ...shot.run, skies: sky.skies, guns },
    events: [...shot.events, ...sky.events],
  };
  const s = award(flown, sky.points);
  if (sky.bombed || wrecked(course, s.run)) return crash(s);
  return clear(course, passCheckpoint(course, s));
}

function respawn(course: Course, run: Run): Stepped {
  const next: Run = {
    ...run,
    buggy: startBuggy(checkpointX(course, run.checkpoint)),
    stretch: 0,
    phase: { kind: 'driving' },
    damage: restore(course, run.damage, checkpointX(course, run.checkpoint)),
    guns: HOLSTERED,
    skies: clearSkies(course.ufos, checkpointX(course, run.checkpoint)),
  };
  return { run: next, events: [{ kind: 'respawn' }] };
}

function crashed(course: Course, run: Run, left: number): Stepped {
  const remaining = left - STEP;
  if (remaining > 0)
    return { run: { ...run, phase: { kind: 'crashed', left: remaining } }, events: [] };
  if (run.purse.lives > 0) return respawn(course, run);
  return { run: { ...run, phase: { kind: 'over' } }, events: [{ kind: 'over' }] };
}

/** One fixed step of a run. A finished run stays as it is. */
export function stepRun(course: Course, run: Run, controls: Controls): Stepped {
  switch (run.phase.kind) {
    case 'driving':
      return driving(course, run, controls);
    case 'crashed':
      return crashed(course, run, run.phase.left);
    default:
      return { run, events: [] };
  }
}

export function finished(run: Run): boolean {
  return run.phase.kind === 'over' || run.phase.kind === 'clear';
}
