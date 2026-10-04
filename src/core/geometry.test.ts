import { describe, expect, it } from 'vitest';
import {
  add,
  circleHitsRect,
  distance,
  facingVector,
  facingYaw,
  footprint,
  length,
  rectContains,
  rectsOverlap,
  scale,
} from './geometry';

const unit = { minX: 0, minZ: 0, maxX: 1, maxZ: 1 };

describe('facings', () => {
  it('point along the compass, z growing south', () => {
    expect(facingVector('north')).toEqual({ x: 0, z: -1 });
    expect(facingVector('east')).toEqual({ x: 1, z: 0 });
    expect(facingVector('south')).toEqual({ x: 0, z: 1 });
    expect(facingVector('west')).toEqual({ x: -1, z: 0 });
  });
  it('turn a south-facing model by yaw', () => {
    expect(facingYaw('south')).toBe(0);
    expect(facingYaw('east')).toBeCloseTo(Math.PI / 2);
    expect(facingYaw('north')).toBeCloseTo(Math.PI);
    expect(facingYaw('west')).toBeCloseTo(-Math.PI / 2);
  });
});

describe('vectors', () => {
  it('add, scale and measure', () => {
    expect(add({ x: 1, z: 2 }, { x: 3, z: -5 })).toEqual({ x: 4, z: -3 });
    expect(scale({ x: 1, z: -2 }, 3)).toEqual({ x: 3, z: -6 });
    expect(distance({ x: 1, z: 1 }, { x: 4, z: 5 })).toBe(5);
    expect(length({ x: -3, z: 4 })).toBe(5);
  });
});

describe('footprint', () => {
  it('lies across a north or south face and along an east or west one', () => {
    expect(footprint({ x: 5, z: 5 }, 'south', 2, 1)).toEqual({
      minX: 4,
      minZ: 4.5,
      maxX: 6,
      maxZ: 5.5,
    });
    expect(footprint({ x: 5, z: 5 }, 'north', 2, 1)).toEqual(
      footprint({ x: 5, z: 5 }, 'south', 2, 1),
    );
    expect(footprint({ x: 5, z: 5 }, 'east', 2, 1)).toEqual({
      minX: 4.5,
      minZ: 4,
      maxX: 5.5,
      maxZ: 6,
    });
    expect(footprint({ x: 5, z: 5 }, 'west', 2, 1)).toEqual(
      footprint({ x: 5, z: 5 }, 'east', 2, 1),
    );
  });
});

describe('rectsOverlap', () => {
  it('needs shared area on both axes', () => {
    expect(rectsOverlap(unit, { minX: 0.5, minZ: 0.5, maxX: 2, maxZ: 2 })).toBe(true);
    expect(rectsOverlap(unit, { minX: 1, minZ: 0, maxX: 2, maxZ: 1 })).toBe(false);
    expect(rectsOverlap(unit, { minX: -1, minZ: 0, maxX: 0, maxZ: 1 })).toBe(false);
    expect(rectsOverlap(unit, { minX: 0, minZ: 1, maxX: 1, maxZ: 2 })).toBe(false);
    expect(rectsOverlap(unit, { minX: 0, minZ: -1, maxX: 1, maxZ: 0 })).toBe(false);
  });
});

describe('rectContains', () => {
  it('accepts an inner rect touching the edges and rejects any spill', () => {
    expect(rectContains(unit, unit)).toBe(true);
    expect(rectContains(unit, { minX: -0.1, minZ: 0, maxX: 1, maxZ: 1 })).toBe(false);
    expect(rectContains(unit, { minX: 0, minZ: 0, maxX: 1.1, maxZ: 1 })).toBe(false);
    expect(rectContains(unit, { minX: 0, minZ: -0.1, maxX: 1, maxZ: 1 })).toBe(false);
    expect(rectContains(unit, { minX: 0, minZ: 0, maxX: 1, maxZ: 1.1 })).toBe(false);
  });
});

describe('circleHitsRect', () => {
  it('measures to the nearest point of the rect', () => {
    expect(circleHitsRect({ x: 0.5, z: 0.5 }, 0.1, unit)).toBe(true);
    expect(circleHitsRect({ x: 1.2, z: 0.5 }, 0.3, unit)).toBe(true);
    expect(circleHitsRect({ x: 1.3, z: 0.5 }, 0.3, unit)).toBe(false);
    expect(circleHitsRect({ x: -0.2, z: 0.5 }, 0.3, unit)).toBe(true);
    expect(circleHitsRect({ x: 0.5, z: -0.2 }, 0.3, unit)).toBe(true);
    expect(circleHitsRect({ x: 0.5, z: 1.2 }, 0.3, unit)).toBe(true);
    expect(circleHitsRect({ x: 1.2, z: 1.2 }, 0.3, unit)).toBe(true);
    expect(circleHitsRect({ x: 1.3, z: 1.3 }, 0.4, unit)).toBe(false);
    expect(circleHitsRect({ x: 1.5, z: 0.5 }, 0.5, unit)).toBe(false);
  });
});
