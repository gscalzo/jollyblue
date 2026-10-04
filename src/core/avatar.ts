/**
 * The avatar (ADR-0004): where it stands, which way it looks, how far into
 * its stride it is — and the procedural pose that makes it walk. It slides
 * along walls and cabinets instead of stopping dead.
 */
import { cabinetFootprint } from './hall';
import type { Hall } from './hall';
import { circleHitsRect, length } from './geometry';
import type { Vec2 } from './geometry';

export const AVATAR_RADIUS = 0.28;
/** Floor units per second at full stick. */
export const WALK_SPEED = 3.2;
/** Radians per second the avatar turns toward where it walks. */
const TURN_SPEED = 12;
/** Stride phase (radians) per floor unit walked. */
const STRIDE = 5.5;

export interface Avatar {
  position: Vec2;
  /** Yaw, 0 facing south (+z). */
  heading: number;
  /** Advances with distance walked; one step per π. */
  phase: number;
  /** 0 standing still, 1 at full walking speed. */
  pace: number;
}

export function spawnAvatar(hall: Hall): Avatar {
  // Facing the camera, so the first thing you see is the face.
  return { position: hall.spawn, heading: Math.PI / 4, phase: 0, pace: 0 };
}

function blocked(hall: Hall, p: Vec2): boolean {
  const r = AVATAR_RADIUS;
  if (p.x < r || p.z < r || p.x > hall.width - r || p.z > hall.depth - r) return true;
  return hall.cabinets.some((c) => circleHitsRect(p, r, cabinetFootprint(c)));
}

/** Moves by `delta`, one axis at a time, so a blocked axis does not stop the other. */
export function slide(hall: Hall, from: Vec2, delta: Vec2): Vec2 {
  const alongX = { x: from.x + delta.x, z: from.z };
  const x = blocked(hall, alongX) ? from : alongX;
  const alongZ = { x: x.x, z: x.z + delta.z };
  return blocked(hall, alongZ) ? x : alongZ;
}

/** The shortest signed turn from `from` to `to`, in (-π, π]. */
export function angleDelta(from: number, to: number): number {
  const d = (to - from) % (2 * Math.PI);
  if (d > Math.PI) return d - 2 * Math.PI;
  if (d <= -Math.PI) return d + 2 * Math.PI;
  return d;
}

function turn(heading: number, target: number, dt: number): number {
  const d = angleDelta(heading, target);
  const most = TURN_SPEED * dt;
  return heading + Math.max(-most, Math.min(most, d));
}

/** One frame: walk along `direction` (floor units, length ≤ 1) for `dt` seconds. */
export function stepAvatar(hall: Hall, avatar: Avatar, direction: Vec2, dt: number): Avatar {
  const pace = Math.min(1, length(direction));
  if (pace === 0) return { ...avatar, pace: 0 };
  const travel = WALK_SPEED * dt;
  const position = slide(hall, avatar.position, {
    x: direction.x * travel,
    z: direction.z * travel,
  });
  const walked = Math.hypot(position.x - avatar.position.x, position.z - avatar.position.z);
  return {
    position,
    heading: turn(avatar.heading, Math.atan2(direction.x, direction.z), dt),
    phase: avatar.phase + walked * STRIDE,
    pace,
  };
}

export interface Pose {
  /** Body lift, floor units. */
  bob: number;
  /** Leg swing, radians; the left leg takes +, the right −. */
  legs: number;
  /** Arm swing, radians, opposite to the legs. */
  arms: number;
  /** Forward lean, radians. */
  lean: number;
}

/** The walk cycle, scaled down to stillness as the pace drops. */
export function poseOf(avatar: Avatar): Pose {
  const s = Math.sin(avatar.phase);
  return {
    bob: Math.abs(Math.cos(avatar.phase)) * 0.06 * avatar.pace,
    legs: s * 0.7 * avatar.pace,
    arms: -s * 0.6 * avatar.pace,
    lean: 0.12 * avatar.pace,
  };
}

/** True when a step lands between the previous phase and this one. */
export function footfall(previousPhase: number, phase: number): boolean {
  return Math.floor(phase / Math.PI) > Math.floor(previousPhase / Math.PI);
}
