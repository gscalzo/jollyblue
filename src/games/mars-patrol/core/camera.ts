/**
 * Where the camera looks (ADR-0017): side-on during a run, the buggy a third
 * of the way in and sliding right as it speeds up; a slow three-quarter turn
 * around the idling buggy on the title.
 */
import type { Screen } from './flow';
import { DRIVE } from './tuning';

export interface Framing {
  /** The point on the road the camera centres on. */
  focus: number;
  /** Radians the camera swings from side-on towards the front. */
  yaw: number;
  /** Metres from the focus. */
  distance: number;
}

/** Metres the camera looks ahead of the buggy at cruise. */
export const LEAD = 3.5;
/** Metres less lead for each m/s above cruise. */
export const LEAD_PER_SPEED = 0.5;

export function lead(speed: number): number {
  return LEAD - (speed - DRIVE.cruise) * LEAD_PER_SPEED;
}

export function framing(screen: Screen): Framing {
  if (screen.kind === 'title') {
    return { focus: 0, yaw: 0.55 + 0.25 * Math.sin(screen.t * 0.25), distance: 9 };
  }
  const { buggy } = screen.run;
  return { focus: buggy.x + lead(buggy.speed), yaw: 0, distance: 22 };
}
