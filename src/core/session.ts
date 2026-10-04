/**
 * What the hall is doing (ADR-0005): walking about, showing OUT OF ORDER,
 * diving into a cabinet's screen, playing its game, or coming back out.
 * Pure: the loop feeds it presses and time, and reads the camera blend and
 * the prompt from it.
 */
import { distance } from './geometry';
import { usePoint } from './hall';
import type { Cabinet, Hall } from './hall';
import type { Presses } from './input';
import type { Vec2 } from './geometry';

/** How close to a cabinet's play spot the avatar must stand. */
export const REACH = 0.75;
/** Seconds to dive into a screen, and to come back out. */
export const DIVE_SECONDS = 1.1;
/** Seconds OUT OF ORDER stays up. */
export const NOTICE_SECONDS = 1.6;

export type Session =
  | { kind: 'hall' }
  | { kind: 'notice'; cabinet: Cabinet; left: number }
  | { kind: 'entering'; cabinet: Cabinet; t: number }
  | { kind: 'playing'; cabinet: Cabinet }
  | { kind: 'leaving'; cabinet: Cabinet; t: number };

export const IN_HALL: Session = { kind: 'hall' };

/** The cabinet whose play spot is nearest, if one is within reach. */
export function cabinetInReach(hall: Hall, position: Vec2): Cabinet | null {
  let best: Cabinet | null = null;
  let bestDistance = REACH;
  for (const cabinet of hall.cabinets) {
    const d = distance(position, usePoint(cabinet));
    if (d < bestDistance) {
      best = cabinet;
      bestDistance = d;
    }
  }
  return best;
}

/** True while the avatar may walk. */
export function canWalk(session: Session): boolean {
  return session.kind === 'hall' || session.kind === 'notice';
}

function pressAction(cabinet: Cabinet): Session {
  return cabinet.game === undefined
    ? { kind: 'notice', cabinet, left: NOTICE_SECONDS }
    : { kind: 'entering', cabinet, t: 0 };
}

/** Reacts to this frame's presses; `near` is the cabinet in reach, if any. */
export function press(session: Session, near: Cabinet | null, presses: Presses): Session {
  if (canWalk(session) && presses.action && near !== null) return pressAction(near);
  if (presses.back) return leave(session);
  return session;
}

/** The game said it is over, or the hall sent the player back. */
export function leave(session: Session): Session {
  return session.kind === 'playing' ? { kind: 'leaving', cabinet: session.cabinet, t: 0 } : session;
}

/** Lets `dt` seconds pass. */
export function advance(session: Session, dt: number): Session {
  switch (session.kind) {
    case 'notice': {
      const left = session.left - dt;
      return left > 0 ? { ...session, left } : IN_HALL;
    }
    case 'entering': {
      const t = session.t + dt / DIVE_SECONDS;
      return t < 1 ? { ...session, t } : { kind: 'playing', cabinet: session.cabinet };
    }
    case 'leaving': {
      const t = session.t + dt / DIVE_SECONDS;
      return t < 1 ? { ...session, t } : IN_HALL;
    }
    default:
      return session;
  }
}

/** Smoothstep: eases in and out of the dive. */
export function ease(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/** How far into the screen the camera is: 0 in the hall, 1 inside the game. */
export function dive(session: Session): number {
  switch (session.kind) {
    case 'entering':
      return ease(session.t);
    case 'playing':
      return 1;
    case 'leaving':
      return 1 - ease(session.t);
    default:
      return 0;
  }
}

/** The game to start or stop between two frames, if any. */
export function handover(
  before: Session,
  after: Session,
): { start: Cabinet } | { stop: Cabinet } | null {
  if (after.kind === 'playing' && before.kind !== 'playing') return { start: after.cabinet };
  if (before.kind === 'playing' && after.kind !== 'playing') return { stop: before.cabinet };
  return null;
}

/** The line the hall shows at the bottom of the screen, if any. */
export function prompt(session: Session, near: Cabinet | null): string | null {
  if (session.kind === 'notice') return `${session.cabinet.title} — OUT OF ORDER`;
  if (session.kind !== 'hall' || near === null) return null;
  return near.game === undefined ? `${near.title} — E / A` : `PLAY ${near.title} — E / A`;
}

/** How much closer the camera is once inside a screen. */
const DIVE_ZOOM = 7;

export interface CameraShot {
  target: Vec2;
  zoom: number;
  /** Height the camera looks at: the floor in the hall, the screen inside it. */
  lift: number;
}

/** Blends the hall shot (following the avatar) into the cabinet's screen by `k`. */
export function cameraShot(
  hallFocus: Vec2,
  screen: { x: number; y: number; z: number } | null,
  k: number,
): CameraShot {
  if (screen === null) return { target: hallFocus, zoom: 1, lift: 0 };
  return {
    target: {
      x: hallFocus.x + (screen.x - hallFocus.x) * k,
      z: hallFocus.z + (screen.z - hallFocus.z) * k,
    },
    zoom: 1 + (DIVE_ZOOM - 1) * k,
    lift: screen.y * k,
  };
}

/** The black veil over the last stretch of the dive, 0..1. */
export function veil(k: number): number {
  return Math.max(0, (k - 0.6) / 0.4);
}
