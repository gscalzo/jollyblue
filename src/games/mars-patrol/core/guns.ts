/**
 * The buggy's guns (ADR-0017): Fire sends one bolt along the road, if none
 * is flying, and one straight up, up to three at once. Upward bolts keep
 * pace with the buggy so they climb above it.
 */
import type { Buggy } from './buggy';
import { GUNS, STEP } from './tuning';

export interface Bolt {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Where it left the gun. */
  from: number;
}

export interface Guns {
  forward: Bolt | null;
  up: readonly Bolt[];
}

export const HOLSTERED: Guns = { forward: null, up: [] };

export interface Fired {
  guns: Guns;
  fired: boolean;
}

/** Fires what the guns can: the forward bolt if it is free, an upward one if fewer than three fly. */
export function fire(guns: Guns, buggy: Buggy): Fired {
  const front = buggy.x + GUNS.frontX;
  const forward = guns.forward ?? {
    x: front,
    y: buggy.y + GUNS.frontY,
    vx: buggy.speed + GUNS.boltSpeed,
    vy: 0,
    from: front,
  };
  const room = guns.up.length < GUNS.maxUp;
  const top = buggy.x + GUNS.topX;
  const bolt = { x: top, y: buggy.y + GUNS.topY, vx: buggy.speed, vy: GUNS.upSpeed, from: top };
  const up = room ? [...guns.up, bolt] : guns.up;
  return { guns: { forward, up }, fired: room || guns.forward === null };
}

function fly(b: Bolt): Bolt {
  return { ...b, x: b.x + b.vx * STEP, y: b.y + b.vy * STEP };
}

/** One step of flight; bolts past their range or above the ceiling fade. */
export function advance(guns: Guns): Guns {
  const forward = guns.forward && fly(guns.forward);
  return {
    forward: forward && forward.x - forward.from <= GUNS.range ? forward : null,
    up: guns.up.map(fly).filter((b) => b.y <= GUNS.ceiling),
  };
}
