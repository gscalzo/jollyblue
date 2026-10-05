import { describe, expect, it } from 'vitest';
import { startBuggy } from './buggy';
import { BOMB, DRIVE, STEP, UFO } from './tuning';
import { blasts, bursts, downs, ease, fall, fly, hole, hoverAt, launch } from './ufo';
import type { Ufo, Wave } from './ufo';

const WAVE: Wave = { at: 100, hover: 8, bombs: 2, every: 1 };
const bolt = (x: number, y: number) => ({ x, y, vx: 0, vy: 0, from: x });

describe('ease', () => {
  it('runs smoothly from nought to one and holds there', () => {
    expect(ease(-1)).toBe(0);
    expect(ease(0)).toBe(0);
    expect(ease(0.25)).toBeCloseTo(0.15625);
    expect(ease(0.5)).toBe(0.5);
    expect(ease(1)).toBe(1);
    expect(ease(2)).toBe(1);
  });
});

describe('a UFO’s flight', () => {
  it('appears far behind the road, high and ahead of the buggy', () => {
    const ufo = launch(WAVE, 3, 100);
    const from = { x: 100 + UFO.startAhead, y: UFO.startY, z: UFO.startZ };
    expect(ufo).toEqual({
      ...from,
      wave: 3,
      phase: 'approach',
      t: 0,
      from,
      bombs: 2,
      reload: 0.5,
      anchor: from.x,
    });
  });

  it('hovers about its anchor, swaying', () => {
    expect(hoverAt(58, 0)).toEqual({ x: 58, y: UFO.hoverY, z: 0 });
    const t = 1;
    expect(hoverAt(58, t)).toEqual({
      x: 58 + UFO.swayX * Math.sin(1.3),
      y: UFO.hoverY + UFO.swayY * Math.sin(2.1),
      z: 0,
    });
  });

  it('flies in from the distance, then attacks from where it arrived', () => {
    const ufo = launch(WAVE, 0, 100);
    const one = fly(ufo, WAVE, 100);
    expect(one.drop).toBeNull();
    const k = ease(STEP / UFO.approach);
    const target = hoverAt(100 + WAVE.hover, 0);
    expect(one.ufo).toMatchObject({ phase: 'approach', t: STEP, anchor: one.ufo?.x });
    expect(one.ufo?.x).toBeCloseTo(ufo.x + (target.x - ufo.x) * k);
    expect(one.ufo?.y).toBeCloseTo(ufo.y + (target.y - ufo.y) * k);
    expect(one.ufo?.z).toBeCloseTo(ufo.z + (target.z - ufo.z) * k);
    const late = fly({ ...ufo, t: UFO.approach - STEP / 2 }, WAVE, 100).ufo;
    expect(late).toMatchObject({
      phase: 'attack',
      t: 0,
      x: target.x,
      y: target.y,
      z: 0,
      anchor: target.x,
    });
    expect(late?.from).toEqual(target);
    expect(fly({ ...ufo, t: UFO.approach - 1.5 * STEP }, WAVE, 100).ufo?.phase).toBe('approach');
  });

  it('drops a bomb on its beat, then flies away after the last', () => {
    const onStation = WAVE.hover;
    const hovering: Ufo = {
      ...launch(WAVE, 0, 0),
      phase: 'attack',
      t: 0,
      reload: 2 * STEP,
      anchor: onStation,
    };
    const wait = fly(hovering, WAVE, 0);
    expect(wait.drop).toBeNull();
    expect(wait.ufo?.reload).toBeCloseTo(STEP);
    const at = hoverAt(onStation + DRIVE.cruise * STEP, STEP);
    expect(wait.ufo).toMatchObject({ x: at.x, y: at.y, z: 0, t: STEP });
    const drop = fly({ ...hovering, reload: STEP }, WAVE, 0);
    expect(drop.drop).toEqual({ x: at.x, y: at.y - 0.6, vy: 0 });
    expect(drop.ufo).toMatchObject({ phase: 'attack', bombs: 1, reload: WAVE.every });
    const last = fly({ ...hovering, reload: STEP, bombs: 1 }, WAVE, 0);
    expect(last.drop).not.toBeNull();
    expect(last.ufo).toMatchObject({ phase: 'leave', t: 0, bombs: 0 });
  });

  it('keeps station at cruise, chasing it no faster than its limit', () => {
    const at = (anchor: number) => ({
      ...launch(WAVE, 0, 0),
      phase: 'attack' as const,
      anchor,
      reload: 9,
    });
    const moved = (anchor: number) => (fly(at(anchor), WAVE, 0).ufo?.anchor ?? 0) - anchor;
    expect(moved(WAVE.hover) / STEP).toBeCloseTo(DRIVE.cruise);
    expect(moved(WAVE.hover - 1) / STEP).toBeCloseTo(DRIVE.cruise + 1);
    expect(moved(WAVE.hover - 50) / STEP).toBeCloseTo(DRIVE.cruise + UFO.chase);
    expect(moved(WAVE.hover + 50) / STEP).toBeCloseTo(DRIVE.cruise - UFO.chase);
  });

  it('flies away and is gone', () => {
    const leaving: Ufo = {
      ...launch(WAVE, 0, 0),
      phase: 'leave',
      t: 0,
      from: { x: 10, y: 7, z: 0 },
    };
    const one = fly(leaving, WAVE, 0);
    const k = ease(STEP / UFO.leave);
    expect(one.drop).toBeNull();
    expect(one.ufo?.x).toBeCloseTo(10 + 30 * k);
    expect(one.ufo?.y).toBeCloseTo(7 + (UFO.startY + 8 - 7) * k);
    expect(one.ufo?.z).toBeCloseTo(UFO.startZ * k);
    expect(one.ufo?.t).toBe(STEP);
    const half = fly({ ...leaving, t: UFO.leave / 2 - STEP }, WAVE, 0).ufo;
    expect(half?.y).toBeCloseTo(7 + (UFO.startY + 8 - 7) / 2);
    expect(fly({ ...leaving, t: UFO.leave - STEP / 2 }, WAVE, 0).ufo).toBeNull();
    expect(fly({ ...leaving, t: UFO.leave - 1.5 * STEP }, WAVE, 0).ufo).not.toBeNull();
  });
});

describe('bombs', () => {
  it('fall faster and faster', () => {
    const one = fall({ x: 3, y: 7, vy: 0 });
    expect(one.x).toBe(3);
    expect(one.vy).toBeCloseTo(-BOMB.gravity * STEP);
    expect(one.y).toBeCloseTo(7 - BOMB.gravity * STEP * STEP);
  });

  it('catch a low buggy within the blast', () => {
    const buggy = startBuggy(0);
    const reach = DRIVE.half + BOMB.blast;
    expect(blasts(reach - 0.01, buggy)).toBe(true);
    expect(blasts(0.01 - reach, buggy)).toBe(true);
    expect(blasts(reach, buggy)).toBe(false);
    expect(blasts(-reach, buggy)).toBe(false);
    expect(blasts(0, { ...buggy, y: BOMB.reach - 0.01 })).toBe(true);
    expect(blasts(0, { ...buggy, y: BOMB.reach })).toBe(false);
  });

  it('leave a crater only far enough ahead to be jumped', () => {
    const buggy = startBuggy(0);
    const edge = BOMB.clearance + BOMB.hole / 2;
    expect(hole(edge, buggy)).toEqual({ x: BOMB.clearance, width: BOMB.hole });
    expect(hole(edge - 0.01, buggy)).toBeNull();
    expect(hole(-10, buggy)).toBeNull();
  });
});

describe('upward bolts', () => {
  // At the origin, so the edges are exact in floating point.
  const attacking: Ufo = { ...launch(WAVE, 0, 0), phase: 'attack', x: 0, y: 0, z: 0 };
  const { hitX: hx, hitY: hy } = UFO;

  it('bring down a UFO in the road’s plane when they pass close', () => {
    expect(downs(bolt(hx - 0.01, hy - 0.01), attacking)).toBe(true);
    expect(downs(bolt(0.01 - hx, 0.01 - hy), attacking)).toBe(true);
    expect(downs(bolt(hx, 0), attacking)).toBe(false);
    expect(downs(bolt(-hx, 0), attacking)).toBe(false);
    expect(downs(bolt(0, hy), attacking)).toBe(false);
    expect(downs(bolt(0, -hy), attacking)).toBe(false);
    expect(downs(bolt(0, 0), { ...attacking, phase: 'approach' })).toBe(false);
    expect(downs(bolt(0, 0), { ...attacking, phase: 'leave' })).toBe(false);
  });

  it('burst a bomb they pass close to', () => {
    const bomb = { x: 0, y: 0, vy: -1 };
    const h = BOMB.hit;
    expect(bursts(bolt(h - 0.01, h - 0.01), bomb)).toBe(true);
    expect(bursts(bolt(0.01 - h, 0.01 - h), bomb)).toBe(true);
    expect(bursts(bolt(h, 0), bomb)).toBe(false);
    expect(bursts(bolt(-h, 0), bomb)).toBe(false);
    expect(bursts(bolt(0, h), bomb)).toBe(false);
    expect(bursts(bolt(0, -h), bomb)).toBe(false);
  });
});
