import { describe, expect, it } from 'vitest';
import { cabinetFootprint, HALL, usePoint, validateHall } from './hall';
import type { Cabinet, Hall } from './hall';

const cabinet = (over: Partial<Cabinet> = {}): Cabinet => ({
  id: 'a',
  title: 'A',
  position: { x: 2, z: 2 },
  facing: 'south',
  livery: 'cobalt',
  attract: 'bounce',
  ...over,
});

const hall = (cabinets: Cabinet[], over: Partial<Hall> = {}): Hall => ({
  width: 10,
  depth: 10,
  spawn: { x: 5, z: 9 },
  cabinets,
  ...over,
});

describe('a cabinet', () => {
  it('stands on its footprint and is played from in front of its screen', () => {
    const c = cabinet({ facing: 'east' });
    expect(cabinetFootprint(c)).toEqual({ minX: 1.55, minZ: 1.5, maxX: 2.45, maxZ: 2.5 });
    expect(usePoint(c)).toEqual({ x: 2.95, z: 2 });
    expect(usePoint(cabinet({ facing: 'north' }))).toEqual({ x: 2, z: 1.05 });
  });
});

describe('validateHall', () => {
  it("passes JollyBlue's hall", () => {
    expect(validateHall(HALL)).toEqual([]);
    expect(HALL.cabinets.filter((c) => c.game !== undefined).map((c) => c.game)).toEqual([
      'moon-patrol-3d',
    ]);
  });

  it('passes a sound hall', () => {
    const b = cabinet({ id: 'b', position: { x: 4, z: 2 }, game: 'g' });
    expect(validateHall(hall([cabinet(), b]))).toEqual([]);
    expect(validateHall(hall([cabinet({ position: { x: 0.5, z: 0.45 } })]))).toEqual([]);
  });

  it('finds a cabinet outside the room or facing a wall', () => {
    expect(validateHall(hall([cabinet({ position: { x: 0.4, z: 2 } })]))).toEqual([
      'a stands outside the room',
    ]);
    expect(validateHall(hall([cabinet({ position: { x: 2, z: 9.5 } })]))).toEqual([
      'a faces a wall',
    ]);
    expect(validateHall(hall([cabinet({ position: { x: 2, z: 9.5 }, facing: 'north' })]))).toEqual(
      [],
    );
  });

  it('finds a bad game id', () => {
    expect(validateHall(hall([cabinet({ game: 'Moon Patrol' })]))).toEqual([
      'a names a bad game id',
    ]);
  });

  it('finds a duplicate id and an overlap once each', () => {
    const twin = cabinet({ position: { x: 2.5, z: 2 } });
    expect(validateHall(hall([cabinet(), twin]))).toEqual(['a overlaps a', 'a is not unique']);
    const far = cabinet({ position: { x: 6, z: 2 } });
    expect(validateHall(hall([cabinet(), cabinet({ id: 'b' }), far]))).toEqual([
      'a overlaps b',
      'a is not unique',
    ]);
  });

  it('finds a spawn point outside the room', () => {
    expect(validateHall(hall([], { spawn: { x: 11, z: 5 } }))).toEqual([
      'the spawn point is outside the room',
    ]);
    expect(validateHall(hall([], { spawn: { x: 10, z: 10 } }))).toEqual([]);
  });
});
