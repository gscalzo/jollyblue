/**
 * The buggy's motion (ADR-0017): the speed lever on the ground, a fixed
 * ballistic arc in the air. Height is measured from the road.
 */
import { DRIVE, STEP } from './tuning';

export interface Buggy {
  x: number;
  y: number;
  vy: number;
  speed: number;
}

export interface Drive {
  buggy: Buggy;
  jumped: boolean;
  landed: boolean;
}

export function startBuggy(x: number): Buggy {
  return { x, y: 0, vy: 0, speed: DRIVE.cruise };
}

export function airborne(b: Buggy): boolean {
  return b.y > 0 || b.vy > 0;
}

/** The speed the lever asks for: right towards the fastest, left towards the slowest. */
export function targetSpeed(lever: number): number {
  // Stryker disable next-line EqualityOperator: at a lever of 0 either span gives cruise
  const span = lever > 0 ? DRIVE.fastest - DRIVE.cruise : DRIVE.cruise - DRIVE.slowest;
  return DRIVE.cruise + lever * span;
}

/** Moves `value` towards `target` by at most `limit`. */
export function approach(value: number, target: number, limit: number): number {
  return value + Math.max(-limit, Math.min(limit, target - value));
}

function fly(b: Buggy): Drive {
  const vy = b.vy - DRIVE.gravity * STEP;
  const y = b.y + vy * STEP;
  const x = b.x + b.speed * STEP;
  // Stryker disable next-line EqualityOperator: a height of exactly 0 lands on the next step anyway
  if (y > 0) return { buggy: { ...b, x, y, vy }, jumped: false, landed: false };
  return { buggy: { ...b, x, y: 0, vy: 0 }, jumped: false, landed: true };
}

function roll(b: Buggy, lever: number, jump: boolean): Drive {
  const speed = approach(b.speed, targetSpeed(lever), DRIVE.accel * STEP);
  const x = b.x + speed * STEP;
  if (!jump) return { buggy: { x, y: 0, vy: 0, speed }, jumped: false, landed: false };
  const vy = DRIVE.jumpSpeed;
  return { buggy: { x, y: vy * STEP, vy, speed }, jumped: true, landed: false };
}

/** One step: the lever and a jump only work with the wheels on the road. */
export function drive(b: Buggy, lever: number, jump: boolean): Drive {
  return airborne(b) ? fly(b) : roll(b, lever, jump);
}
