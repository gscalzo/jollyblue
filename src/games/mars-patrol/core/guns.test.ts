import { describe, expect, it } from 'vitest';
import { startBuggy } from './buggy';
import { advance, fire, HOLSTERED } from './guns';
import type { Guns } from './guns';
import { GUNS, STEP } from './tuning';

const buggy = { ...startBuggy(10), y: 0.5 };

describe('fire', () => {
  it('sends a bolt along the road and one straight up', () => {
    const { guns, fired } = fire(HOLSTERED, buggy);
    expect(fired).toBe(true);
    const front = 10 + GUNS.frontX;
    expect(guns.forward).toEqual({
      x: front,
      y: 0.5 + GUNS.frontY,
      vx: buggy.speed + GUNS.boltSpeed,
      vy: 0,
      from: front,
    });
    const top = 10 + GUNS.topX;
    expect(guns.up).toEqual([
      { x: top, y: 0.5 + GUNS.topY, vx: buggy.speed, vy: GUNS.upSpeed, from: top },
    ]);
  });

  it('keeps the forward bolt already flying, and at most three upward', () => {
    let guns: Guns = HOLSTERED;
    for (let i = 0; i < GUNS.maxUp; i++) guns = fire(guns, buggy).guns;
    expect(guns.up).toHaveLength(GUNS.maxUp);
    const flying = guns.forward;
    const full = fire(guns, buggy);
    expect(full.fired).toBe(false);
    expect(full.guns.forward).toBe(flying);
    expect(full.guns.up).toBe(guns.up);
    const freed = fire({ ...guns, forward: null }, buggy);
    expect(freed.fired).toBe(true);
    expect(freed.guns.up).toBe(guns.up);
    const roomUp = fire({ ...guns, up: guns.up.slice(1) }, buggy);
    expect(roomUp.fired).toBe(true);
    expect(roomUp.guns.forward).toBe(flying);
    expect(roomUp.guns.up).toHaveLength(GUNS.maxUp);
  });
});

describe('advance', () => {
  it('flies the bolts', () => {
    const guns = advance(fire(HOLSTERED, buggy).guns);
    const front = 10 + GUNS.frontX;
    expect(guns.forward?.x).toBeCloseTo(front + (buggy.speed + GUNS.boltSpeed) * STEP);
    expect(guns.forward?.y).toBeCloseTo(0.5 + GUNS.frontY);
    expect(guns.up[0]?.y).toBeCloseTo(0.5 + GUNS.topY + GUNS.upSpeed * STEP);
    expect(guns.up[0]?.x).toBeCloseTo(10 + GUNS.topX + buggy.speed * STEP);
  });

  it('fades a forward bolt past its range and an upward one past the ceiling', () => {
    const bolt = { x: 0, y: 1, vx: 60, vy: 0, from: 0 };
    expect(advance({ forward: { ...bolt, x: GUNS.range - 1 }, up: [] }).forward).not.toBeNull();
    expect(advance({ forward: { ...bolt, x: GUNS.range }, up: [] }).forward).toBeNull();
    expect(
      advance({ forward: { ...bolt, x: GUNS.range - 1, vx: 60 }, up: [] }).forward,
    ).not.toBeNull();
    const up = { x: 0, y: 0, vx: 0, vy: 60, from: 0 };
    expect(advance({ forward: null, up: [{ ...up, y: GUNS.ceiling - 1 }] }).up).toHaveLength(1);
    expect(advance({ forward: null, up: [{ ...up, y: GUNS.ceiling }] }).up).toHaveLength(0);
    expect(advance(HOLSTERED)).toEqual(HOLSTERED);
  });

  it('keeps a bolt landing exactly on its limit', () => {
    expect(
      advance({ forward: { x: 0, y: 1, vx: GUNS.range / STEP, vy: 0, from: 0 }, up: [] }).forward,
    ).not.toBeNull();
    expect(
      advance({ forward: null, up: [{ x: 0, y: 0, vx: 0, vy: GUNS.ceiling / STEP, from: 0 }] }).up,
    ).toHaveLength(1);
  });
});
