/**
 * The UFOs and their bombs (ADR-0017). Each wave in the course launches one
 * UFO when the buggy reaches it: it flies in from far behind the road, then
 * cruises along keeping station ahead of the buggy — but only so fast, so
 * the speed lever can slip under it or hang back — dropping its bombs on a
 * beat, then flies away. Upward
 * bolts bring down a UFO in the road's plane, or burst a bomb. A bomb that
 * lands on the buggy wrecks it; one that misses ahead leaves a crater.
 */
import type { Buggy } from './buggy';
import type { Crater } from './course';
import type { Bolt } from './guns';
import { approach as toward } from './buggy';
import { BOMB, DRIVE, STEP, UFO } from './tuning';

export interface Wave {
  /** Where the buggy launches it. */
  at: number;
  /** Metres ahead of the buggy it hovers. */
  hover: number;
  bombs: number;
  /** Seconds between bombs. */
  every: number;
}

export interface Point {
  x: number;
  y: number;
  z: number;
}

export interface Ufo extends Point {
  wave: number;
  phase: 'approach' | 'attack' | 'leave';
  /** Seconds in this phase. */
  t: number;
  /** Where the phase began. */
  from: Point;
  bombs: number;
  /** Seconds to the next bomb. */
  reload: number;
  /** The road position it sways about while it attacks. */
  anchor: number;
}

export interface Bomb {
  x: number;
  y: number;
  vy: number;
}

/** A smooth 0..1 ease. */
export function ease(k: number): number {
  const c = Math.min(1, Math.max(0, k));
  return c * c * (3 - 2 * c);
}

function lerp(a: Point, b: Point, k: number): Point {
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k };
}

/** A new UFO for wave `i`, far behind the road and ahead of the buggy. */
export function launch(wave: Wave, i: number, buggyX: number): Ufo {
  const from = { x: buggyX + UFO.startAhead, y: UFO.startY, z: UFO.startZ };
  return {
    ...from,
    wave: i,
    phase: 'approach',
    t: 0,
    from,
    bombs: wave.bombs,
    reload: wave.every / 2,
    anchor: from.x,
  };
}

/** Where a hovering UFO sits, swaying about `anchor`, after `t` seconds of attack. */
export function hoverAt(anchor: number, t: number): Point {
  return {
    x: anchor + UFO.swayX * Math.sin(t * 1.3),
    y: UFO.hoverY + UFO.swayY * Math.sin(t * 2.1),
    z: 0,
  };
}

function next(ufo: Ufo, phase: Ufo['phase']): Ufo {
  return { ...ufo, phase, t: 0, from: { x: ufo.x, y: ufo.y, z: ufo.z } };
}

function approach(ufo: Ufo, wave: Wave, buggyX: number): Ufo {
  const t = ufo.t + STEP;
  const at = lerp(ufo.from, hoverAt(buggyX + wave.hover, 0), ease(t / UFO.approach));
  const moved = { ...ufo, ...at, t, anchor: at.x };
  // Stryker disable next-line EqualityOperator: fixed steps never land exactly on the end
  return t >= UFO.approach ? next(moved, 'attack') : moved;
}

function attack(ufo: Ufo, wave: Wave, buggyX: number): { ufo: Ufo; drop: Bomb | null } {
  const t = ufo.t + STEP;
  const station = buggyX + wave.hover;
  const speed = toward(DRIVE.cruise, DRIVE.cruise + (station - ufo.anchor), UFO.chase);
  const anchor = ufo.anchor + speed * STEP;
  const moved = { ...ufo, ...hoverAt(anchor, t), t, anchor, reload: ufo.reload - STEP };
  if (moved.reload > 0) return { ufo: moved, drop: null };
  const drop = { x: moved.x, y: moved.y - 0.6, vy: 0 };
  const left = { ...moved, bombs: moved.bombs - 1, reload: wave.every };
  return { ufo: left.bombs > 0 ? left : next(left, 'leave'), drop };
}

function leave(ufo: Ufo): Ufo | null {
  const t = ufo.t + STEP;
  // Stryker disable next-line EqualityOperator: fixed steps never land exactly on the end
  if (t >= UFO.leave) return null;
  const away = { x: ufo.from.x + 30, y: UFO.startY + 8, z: UFO.startZ };
  return { ...ufo, ...lerp(ufo.from, away, ease(t / UFO.leave)), t };
}

/** One step of a UFO's flight; null once it has gone. */
export function fly(ufo: Ufo, wave: Wave, buggyX: number): { ufo: Ufo | null; drop: Bomb | null } {
  if (ufo.phase === 'approach') return { ufo: approach(ufo, wave, buggyX), drop: null };
  if (ufo.phase === 'attack') return attack(ufo, wave, buggyX);
  return { ufo: leave(ufo), drop: null };
}

export function fall(bomb: Bomb): Bomb {
  const vy = bomb.vy - BOMB.gravity * STEP;
  return { x: bomb.x, y: bomb.y + vy * STEP, vy };
}

/** True when a bomb landing at `x` catches the buggy. */
export function blasts(x: number, buggy: Buggy): boolean {
  return Math.abs(x - buggy.x) < DRIVE.half + BOMB.blast && buggy.y < BOMB.reach;
}

/** The crater a bomb landing at `x` leaves, if it lands ahead of the buggy. */
export function hole(x: number, buggy: Buggy): Crater | null {
  return x > buggy.x + DRIVE.half + BOMB.blast ? { x: x - BOMB.hole / 2, width: BOMB.hole } : null;
}

/** True when an upward bolt passes close enough to a UFO in the road's plane. */
export function downs(bolt: Bolt, ufo: Ufo): boolean {
  const inPlane = ufo.phase === 'attack';
  return inPlane && Math.abs(bolt.x - ufo.x) < UFO.hitX && Math.abs(bolt.y - ufo.y) < UFO.hitY;
}

/** True when an upward bolt passes close enough to burst a bomb. */
export function bursts(bolt: Bolt, bomb: Bomb): boolean {
  return Math.abs(bolt.x - bomb.x) < BOMB.hit && Math.abs(bolt.y - bomb.y) < BOMB.hit;
}
