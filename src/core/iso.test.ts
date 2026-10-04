import { describe, expect, it } from 'vitest';
import { CAMERA_OFFSET, follow, frustumFor, screenToFloor } from './iso';

describe('frustumFor', () => {
  it('shows the view height and widens with the aspect', () => {
    expect(frustumFor(2, 10)).toEqual({ left: -10, right: 10, top: 5, bottom: -5 });
  });
});

describe('screenToFloor', () => {
  const h = Math.SQRT1_2;
  it('walks screen directions along the iso diagonals', () => {
    expect(screenToFloor({ x: 1, y: 0 })).toEqual({ x: h, z: -h });
    expect(screenToFloor({ x: 0, y: 1 })).toEqual({ x: -h, z: -h });
    expect(screenToFloor({ x: -1, y: 0 })).toEqual({ x: -h, z: h });
    expect(screenToFloor({ x: 0, y: -1 })).toEqual({ x: h, z: h });
  });
  it('agrees with the camera: screen up walks away from it', () => {
    const away = screenToFloor({ x: 0, y: 1 });
    expect(Math.sign(away.x)).toBe(-Math.sign(CAMERA_OFFSET.x));
    expect(Math.sign(away.z)).toBe(-Math.sign(CAMERA_OFFSET.z));
  });
});

describe('follow', () => {
  it('closes the gap by 1 - e^(-rate·dt)', () => {
    const p = follow({ x: 2, z: 10 }, { x: 10, z: 0 }, Math.LN2, 1);
    expect(p.x).toBeCloseTo(6);
    expect(p.z).toBeCloseTo(5);
  });
  it('stays put with no time', () => {
    expect(follow({ x: 1, z: 2 }, { x: 9, z: 9 }, 5, 0)).toEqual({ x: 1, z: 2 });
  });
});
