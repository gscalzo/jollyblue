/**
 * The isometric view (ADR-0002): an orthographic camera looking down the
 * diagonal (-1, -1, -1), so east and south walls face the viewer and the
 * north and west walls are the back of the room.
 */
import type { Vec2 } from './geometry';

/** Where the camera sits relative to what it looks at, in world units. */
export const CAMERA_OFFSET = { x: 20, y: 20, z: 20 } as const;

export interface Frustum {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** An orthographic frustum showing `viewHeight` world units top to bottom. */
export function frustumFor(aspect: number, viewHeight: number): Frustum {
  const top = viewHeight / 2;
  const right = top * aspect;
  return { left: -right, right, top, bottom: -top };
}

const HALF_ROOT_2 = Math.SQRT1_2;

/**
 * Turns a stick or key direction on screen (x right, y up) into a direction
 * on the floor, so pushing up walks the avatar up the screen.
 */
export function screenToFloor(stick: { x: number; y: number }): Vec2 {
  // Screen right is floor (1, -1)/√2 and screen up is floor (-1, -1)/√2.
  return {
    x: (stick.x - stick.y) * HALF_ROOT_2,
    z: (-stick.x - stick.y) * HALF_ROOT_2,
  };
}

/** Eases `current` toward `target`, at `rate` per second, frame-rate independent. */
export function follow(current: Vec2, target: Vec2, rate: number, dt: number): Vec2 {
  const k = 1 - Math.exp(-rate * dt);
  return { x: current.x + (target.x - current.x) * k, z: current.z + (target.z - current.z) * k };
}
