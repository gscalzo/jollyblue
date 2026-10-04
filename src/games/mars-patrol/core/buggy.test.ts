import { describe, expect, it } from 'vitest';
import { airborne, approach, drive, startBuggy, targetSpeed } from './buggy';
import type { Buggy } from './buggy';
import { DRIVE, STEP } from './tuning';

describe('the speed lever', () => {
  it('asks for cruise at rest, the fastest right and the slowest left', () => {
    expect(targetSpeed(0)).toBe(DRIVE.cruise);
    expect(targetSpeed(1)).toBe(DRIVE.fastest);
    expect(targetSpeed(-1)).toBe(DRIVE.slowest);
    expect(targetSpeed(0.5)).toBe((DRIVE.cruise + DRIVE.fastest) / 2);
    expect(targetSpeed(-0.5)).toBe((DRIVE.cruise + DRIVE.slowest) / 2);
  });

  it('approaches a target by a limited amount', () => {
    expect(approach(5, 10, 1)).toBe(6);
    expect(approach(5, 0, 1)).toBe(4);
    expect(approach(5, 5.5, 1)).toBe(5.5);
    expect(approach(5, 4.5, 1)).toBe(4.5);
  });
});

describe('drive', () => {
  it('starts on the road at cruise', () => {
    expect(startBuggy(12)).toEqual({ x: 12, y: 0, vy: 0, speed: DRIVE.cruise });
  });

  it('knows when the wheels are off the road', () => {
    expect(airborne({ x: 0, y: 0, vy: 0, speed: 9 })).toBe(false);
    expect(airborne({ x: 0, y: 0.1, vy: -1, speed: 9 })).toBe(true);
    expect(airborne({ x: 0, y: 0, vy: 1, speed: 9 })).toBe(true);
  });

  it('rolls forward, easing towards the lever’s speed', () => {
    const d = drive(startBuggy(0), 1, false);
    const speed = DRIVE.cruise + DRIVE.accel * STEP;
    expect(d).toEqual({
      buggy: { x: speed * STEP, y: 0, vy: 0, speed },
      jumped: false,
      landed: false,
    });
  });

  it('jumps from the road, keeps its speed in the air and lands', () => {
    const start = startBuggy(0);
    const up = drive(start, 0, true);
    expect(up.jumped).toBe(true);
    expect(up.landed).toBe(false);
    expect(up.buggy.vy).toBe(DRIVE.jumpSpeed);
    expect(up.buggy.y).toBeCloseTo(DRIVE.jumpSpeed * STEP);
    expect(up.buggy.x).toBeCloseTo(DRIVE.cruise * STEP);

    let b: Buggy = up.buggy;
    let steps = 1;
    let top = 0;
    for (;;) {
      const d = drive(b, 1, true);
      expect(d.jumped).toBe(false);
      b = d.buggy;
      steps += 1;
      top = Math.max(top, b.y);
      if (d.landed) break;
      expect(b.speed).toBe(DRIVE.cruise);
      expect(b.y).toBeGreaterThan(0);
    }
    expect(b.y).toBe(0);
    expect(b.vy).toBe(0);
    expect(b.speed).toBe(DRIVE.cruise);
    const airtime = (2 * DRIVE.jumpSpeed) / DRIVE.gravity;
    expect(steps * STEP).toBeCloseTo(airtime, 1);
    expect(top).toBeCloseTo(DRIVE.jumpSpeed ** 2 / (2 * DRIVE.gravity), 0);
    expect(b.x).toBeCloseTo(steps * STEP * DRIVE.cruise);
  });
});
