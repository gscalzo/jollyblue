import { describe, expect, it } from 'vitest';
import {
  angleDelta,
  AVATAR_RADIUS,
  footfall,
  poseOf,
  slide,
  spawnAvatar,
  stepAvatar,
  WALK_SPEED,
} from './avatar';
import type { Avatar } from './avatar';
import type { Hall } from './hall';

const hall: Hall = {
  width: 10,
  depth: 10,
  spawn: { x: 5, z: 8 },
  cabinets: [
    {
      id: 'c',
      title: 'C',
      position: { x: 5, z: 5 },
      facing: 'south',
      livery: 'cobalt',
      attract: 'bounce',
    },
    {
      id: 'far',
      title: 'FAR',
      position: { x: 1, z: 1 },
      facing: 'south',
      livery: 'cobalt',
      attract: 'bounce',
    },
  ],
};

const at = (x: number, z: number, over: Partial<Avatar> = {}): Avatar => ({
  position: { x, z },
  heading: 0,
  phase: 0,
  pace: 0,
  ...over,
});

describe('spawnAvatar', () => {
  it('stands still at the spawn, facing the camera', () => {
    expect(spawnAvatar(hall)).toEqual({
      position: { x: 5, z: 8 },
      heading: Math.PI / 4,
      phase: 0,
      pace: 0,
    });
  });
});

describe('slide', () => {
  it('moves freely on open floor', () => {
    expect(slide(hall, { x: 2, z: 2 }, { x: 0.5, z: -0.5 })).toEqual({ x: 2.5, z: 1.5 });
  });
  it('stops at each wall, keeping the radius', () => {
    const r = AVATAR_RADIUS;
    expect(slide(hall, { x: r, z: 2 }, { x: -0.1, z: 0 })).toEqual({ x: r, z: 2 });
    expect(slide(hall, { x: 2, z: r }, { x: 0, z: -0.1 })).toEqual({ x: 2, z: r });
    expect(slide(hall, { x: 10 - r, z: 2 }, { x: 0.1, z: 0 })).toEqual({ x: 10 - r, z: 2 });
    expect(slide(hall, { x: 2, z: 10 - r }, { x: 0, z: 0.1 })).toEqual({ x: 2, z: 10 - r });
    expect(slide(hall, { x: r, z: 2 }, { x: 0, z: 0.1 })).toEqual({ x: r, z: 2.1 });
    expect(slide(hall, { x: 3, z: r }, { x: 0.1, z: 0 })).toEqual({ x: 3.1, z: r });
    expect(slide(hall, { x: 10 - r, z: 2 }, { x: 0, z: 0.1 })).toEqual({ x: 10 - r, z: 2.1 });
    expect(slide(hall, { x: 2, z: 10 - r }, { x: 0.1, z: 0 })).toEqual({ x: 2.1, z: 10 - r });
  });
  it('slides along a cabinet instead of stopping dead', () => {
    // The cabinet's front edge is z = 5.45; walking north-east into it keeps the x.
    const from = { x: 5, z: 5.45 + AVATAR_RADIUS + 0.01 };
    const to = slide(hall, from, { x: 0.2, z: -0.2 });
    expect(to.x).toBeCloseTo(5.2);
    expect(to.z).toBe(from.z);
    const side = { x: 4.5 - AVATAR_RADIUS - 0.01, z: 5 };
    const along = slide(hall, side, { x: 0.2, z: 0.2 });
    expect(along.x).toBe(side.x);
    expect(along.z).toBeCloseTo(5.2);
  });
});

describe('angleDelta', () => {
  it('takes the short way round', () => {
    expect(angleDelta(0, 1)).toBe(1);
    expect(angleDelta(1, 0)).toBe(-1);
    expect(angleDelta(-3, 3)).toBeCloseTo(6 - 2 * Math.PI);
    expect(angleDelta(3, -3)).toBeCloseTo(2 * Math.PI - 6);
    expect(angleDelta(0, Math.PI)).toBeCloseTo(Math.PI);
    expect(angleDelta(0, -Math.PI)).toBeCloseTo(Math.PI);
    expect(angleDelta(0, 2 * Math.PI + 0.5)).toBeCloseTo(0.5);
  });
});

describe('stepAvatar', () => {
  it('stands still, pace 0, without a direction', () => {
    const a = at(2, 2, { pace: 1, phase: 3, heading: 1 });
    expect(stepAvatar(hall, a, { x: 0, z: 0 }, 0.1)).toEqual({ ...a, pace: 0 });
  });
  it('walks at walking speed and strides with the distance', () => {
    const next = stepAvatar(hall, at(2, 2), { x: 1, z: 0 }, 0.1);
    expect(next.position.x).toBeCloseTo(2 + WALK_SPEED * 0.1);
    expect(next.position.z).toBe(2);
    expect(next.phase).toBeCloseTo(WALK_SPEED * 0.1 * 5.5);
    expect(next.pace).toBe(1);
  });
  it('walks slower with a half-pushed stick and caps the pace at 1', () => {
    const half = stepAvatar(hall, at(2, 2), { x: 0, z: 0.5 }, 0.1);
    expect(half.position.z).toBeCloseTo(2 + WALK_SPEED * 0.05);
    expect(half.pace).toBe(0.5);
    expect(stepAvatar(hall, at(2, 2), { x: 1, z: 1 }, 0.01).pace).toBe(1);
  });
  it('does not stride while pushing into a wall', () => {
    const next = stepAvatar(hall, at(AVATAR_RADIUS, 2), { x: -1, z: 0 }, 0.1);
    expect(next.phase).toBe(0);
    expect(next.pace).toBe(1);
  });
  it('turns toward the walk, no faster than its turn speed', () => {
    const quick = stepAvatar(hall, at(2, 2), { x: 1, z: 0 }, 1);
    expect(quick.heading).toBeCloseTo(Math.PI / 2);
    const slow = stepAvatar(hall, at(2, 2), { x: 1, z: 0 }, 0.01);
    expect(slow.heading).toBeCloseTo(0.12);
    const back = stepAvatar(hall, at(2, 2, { heading: 1 }), { x: 0, z: 1 }, 0.01);
    expect(back.heading).toBeCloseTo(0.88);
  });
});

describe('poseOf', () => {
  it('is still at pace 0', () => {
    const pose = poseOf(at(0, 0, { phase: 1 }));
    expect(pose.bob).toBe(0);
    expect(pose.legs).toBeCloseTo(0);
    expect(pose.arms).toBeCloseTo(0);
    expect(pose.lean).toBe(0);
  });
  it('swings legs and arms in opposition and bobs on each step', () => {
    const pose = poseOf(at(0, 0, { phase: Math.PI / 2, pace: 1 }));
    expect(pose.legs).toBeCloseTo(0.7);
    expect(pose.arms).toBeCloseTo(-0.6);
    expect(pose.bob).toBeCloseTo(0);
    expect(pose.lean).toBeCloseTo(0.12);
    expect(poseOf(at(0, 0, { phase: Math.PI, pace: 0.5 })).bob).toBeCloseTo(0.03);
  });
});

describe('footfall', () => {
  it('lands once per π of phase', () => {
    expect(footfall(0.1, 3)).toBe(false);
    expect(footfall(3, 3.2)).toBe(true);
    expect(footfall(3.2, 6.2)).toBe(false);
    expect(footfall(6.2, 6.3)).toBe(true);
  });
});
