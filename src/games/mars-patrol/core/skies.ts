/**
 * The sky over the road, one step at a time (ADR-0017): waves launch as the
 * buggy reaches them, UFOs fly and drop bombs, upward bolts bring down what
 * they meet, and landed bombs either catch the buggy or leave a crater.
 */
import type { Buggy } from './buggy';
import type { Crater } from './course';
import type { Bolt } from './guns';
import { BOMB, UFO } from './tuning';
import { blasts, bursts, downs, fall, fly, hole, launch } from './ufo';
import type { Bomb, Ufo, Wave } from './ufo';

export interface Skies {
  ufos: readonly Ufo[];
  bombs: readonly Bomb[];
  /** Craters the bombs have blown in the road. */
  holes: readonly Crater[];
  /** Index of the next wave to launch. */
  nextWave: number;
}

export type SkyEvent =
  | { kind: 'ufo-in' }
  | { kind: 'drop' }
  | { kind: 'ufo-down'; x: number; y: number }
  | { kind: 'bomb-down'; x: number; y: number }
  | { kind: 'impact'; x: number };

export interface SkyStep {
  skies: Skies;
  /** The upward bolts still flying. */
  up: readonly Bolt[];
  events: SkyEvent[];
  points: number;
  /** True when a bomb landed on the buggy. */
  bombed: boolean;
}

/** The sky a run starts with, or a respawn at `x` finds: no UFOs, no bombs, no holes. */
export function clearSkies(waves: readonly Wave[], x: number): Skies {
  const pending = waves.findIndex((w) => w.at > x);
  return { ufos: [], bombs: [], holes: [], nextWave: pending < 0 ? waves.length : pending };
}

function launches(
  waves: readonly Wave[],
  skies: Skies,
  buggyX: number,
  up: readonly Bolt[],
): SkyStep {
  const due = waves.slice(skies.nextWave).filter((w) => w.at <= buggyX);
  const fresh = due.map((w, k) => launch(w, skies.nextWave + k, buggyX));
  return {
    skies: { ...skies, ufos: [...skies.ufos, ...fresh], nextWave: skies.nextWave + due.length },
    up,
    events: fresh.map(() => ({ kind: 'ufo-in' })),
    points: 0,
    bombed: false,
  };
}

function flights(waves: readonly Wave[], s: SkyStep, buggyX: number): SkyStep {
  const ufos: Ufo[] = [];
  const drops: Bomb[] = [];
  for (const ufo of s.skies.ufos) {
    const wave = waves[ufo.wave];
    if (!wave) continue;
    const flown = fly(ufo, wave, buggyX);
    if (flown.ufo) ufos.push(flown.ufo);
    if (flown.drop) drops.push(flown.drop);
  }
  const bombs = [...s.skies.bombs.map(fall), ...drops];
  const events: SkyEvent[] = [...s.events, ...drops.map((): SkyEvent => ({ kind: 'drop' }))];
  return { ...s, skies: { ...s.skies, ufos, bombs }, events };
}

/** Removes each target the first unspent bolt meets, spending that bolt. */
function shootDown<T extends { x: number; y: number }>(
  targets: readonly T[],
  bolts: readonly Bolt[],
  meets: (bolt: Bolt, target: T) => boolean,
): { left: T[]; down: T[]; bolts: Bolt[] } {
  let spare = [...bolts];
  const left: T[] = [];
  const down: T[] = [];
  for (const target of targets) {
    const bolt = spare.find((b) => meets(b, target));
    if (bolt) {
      spare = spare.filter((b) => b !== bolt);
      down.push(target);
    } else left.push(target);
  }
  return { left, down, bolts: spare };
}

function shots(s: SkyStep): SkyStep {
  const ufos = shootDown(s.skies.ufos, s.up, downs);
  const bombs = shootDown(s.skies.bombs, ufos.bolts, bursts);
  const events: SkyEvent[] = [
    ...s.events,
    ...ufos.down.map((u): SkyEvent => ({ kind: 'ufo-down', x: u.x, y: u.y })),
    ...bombs.down.map((b): SkyEvent => ({ kind: 'bomb-down', x: b.x, y: b.y })),
  ];
  const points = s.points + ufos.down.length * UFO.points + bombs.down.length * BOMB.points;
  return {
    ...s,
    skies: { ...s.skies, ufos: ufos.left, bombs: bombs.left },
    up: bombs.bolts,
    events,
    points,
  };
}

function impacts(s: SkyStep, buggy: Buggy): SkyStep {
  const landed = s.skies.bombs.filter((b) => b.y <= 0);
  const bombs = s.skies.bombs.filter((b) => b.y > 0);
  const holes = landed.map((b) => hole(b.x, buggy)).filter((h) => h !== null);
  return {
    ...s,
    skies: { ...s.skies, bombs, holes: [...s.skies.holes, ...holes] },
    events: [...s.events, ...landed.map((b): SkyEvent => ({ kind: 'impact', x: b.x }))],
    bombed: s.bombed || landed.some((b) => blasts(b.x, buggy)),
  };
}

/** One step of the sky over a buggy, with the upward bolts in flight. */
export function stepSkies(
  waves: readonly Wave[],
  skies: Skies,
  up: readonly Bolt[],
  buggy: Buggy,
): SkyStep {
  const launched = launches(waves, skies, buggy.x, up);
  return impacts(shots(flights(waves, launched, buggy.x)), buggy);
}
