import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { facingVector } from '../core/geometry';
import { HALL } from '../core/hall';
import { installFakeCanvas } from '../test/fake-canvas';
import { buildCabinet } from './cabinet';
import { buildRoom } from './room';

beforeAll(installFakeCanvas);

describe('the scene builds', () => {
  it('builds the room with its lights', () => {
    const room = buildRoom(HALL);
    const lights: THREE.Light[] = [];
    room.traverse((o) => {
      if (o instanceof THREE.Light) lights.push(o);
    });
    expect(lights.length).toBeGreaterThan(2);
  });

  it('builds every cabinet, unlit, with its screen in front of it', () => {
    for (const cabinet of HALL.cabinets) {
      const view = buildCabinet(cabinet);
      expect(() => view.tick(1.5)).not.toThrow();
      const ahead = facingVector(cabinet.facing);
      const offset =
        (view.screenCenter.x - cabinet.position.x) * ahead.x +
        (view.screenCenter.z - cabinet.position.z) * ahead.z;
      expect(offset).toBeGreaterThan(0);
      expect(view.screenCenter.y).toBeGreaterThan(1);
    }
  });
});
