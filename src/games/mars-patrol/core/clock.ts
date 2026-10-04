/**
 * The fixed-step clock and the frame (ADR-0017): each display frame runs as
 * many 1/60 s steps as the time it covers; the presses of that frame go to
 * its first step only.
 */
import type { Intent } from '../../../core/input';
import type { Course } from './course';
import { stepScreen } from './flow';
import type { GameEvent, Screen } from './flow';
import type { Controls } from './run';
import { DRIVE, STEP } from './tuning';

/** The most steps one frame may run, so a stalled tab does not fast-forward. */
export const MAX_STEPS = 6;

export interface Due {
  steps: number;
  /** Time left over for the next frame. */
  carry: number;
}

/** How many steps `dt` seconds owe, given what the last frame left over. */
export function stepsDue(carry: number, dt: number): Due {
  const total = carry + Math.max(0, dt);
  const steps = Math.min(MAX_STEPS, Math.floor(total / STEP));
  return { steps, carry: steps === MAX_STEPS ? 0 : total - steps * STEP };
}

/** The controls a frame's intent gives, against the frame before. */
export function controlsFrom(intent: Intent, previous: Intent): Controls {
  const up = (i: Intent) => i.move.y > DRIVE.jumpThreshold;
  return {
    lever: intent.move.x,
    jump: up(intent) && !up(previous),
    fire: intent.action && !previous.action,
  };
}

/** Runs a frame's steps; the presses count once. */
export function runFrame(
  course: Course,
  screen: Screen,
  controls: Controls,
  steps: number,
): { screen: Screen; events: GameEvent[] } {
  let current = screen;
  const events: GameEvent[] = [];
  for (let i = 0; i < steps; i++) {
    const held = i === 0 ? controls : { ...controls, jump: false, fire: false };
    const next = stepScreen(course, current, held);
    current = next.screen;
    events.push(...next.events);
  }
  return { screen: current, events };
}

/** The scores a frame posts. */
export function posts(events: readonly GameEvent[]): number[] {
  return events.flatMap((e) => (e.kind === 'post' ? [e.points] : []));
}
