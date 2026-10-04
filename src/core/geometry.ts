/**
 * Floor-plane geometry for the hall (ADR-0004). The floor is the world's
 * x/z plane seen from above: x grows east, z grows south. Everything solid
 * stands on an axis-aligned footprint, because cabinets only ever face one
 * of the four walls.
 */

export interface Vec2 {
  x: number;
  z: number;
}

/** An axis-aligned rectangle on the floor. */
export interface Rect {
  minX: number;
  minZ: number;
  maxX: number;
  maxZ: number;
}

/** The way a cabinet's screen looks. */
export type Facing = 'north' | 'east' | 'south' | 'west';

const FACING_VECTORS: Record<Facing, Vec2> = {
  north: { x: 0, z: -1 },
  east: { x: 1, z: 0 },
  south: { x: 0, z: 1 },
  west: { x: -1, z: 0 },
};

/** The unit vector a facing points along. */
export function facingVector(facing: Facing): Vec2 {
  return FACING_VECTORS[facing];
}

/** Yaw in radians that turns a model built facing south (+z) to `facing`. */
export function facingYaw(facing: Facing): number {
  const v = facingVector(facing);
  return Math.atan2(v.x, v.z);
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, z: a.z + b.z };
}

export function scale(v: Vec2, k: number): Vec2 {
  return { x: v.x * k, z: v.z * k };
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function length(v: Vec2): number {
  return Math.hypot(v.x, v.z);
}

/**
 * The footprint of something `width` wide (along its face) and `depth` deep,
 * centred on `center` and facing `facing`.
 */
export function footprint(center: Vec2, facing: Facing, width: number, depth: number): Rect {
  const sideways = facing === 'east' || facing === 'west';
  const halfX = (sideways ? depth : width) / 2;
  const halfZ = (sideways ? width : depth) / 2;
  return {
    minX: center.x - halfX,
    minZ: center.z - halfZ,
    maxX: center.x + halfX,
    maxZ: center.z + halfZ,
  };
}

/** True when the rectangles share some area (touching edges do not count). */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.minX < b.maxX && b.minX < a.maxX && a.minZ < b.maxZ && b.minZ < a.maxZ;
}

/** True when `inner` lies wholly inside `outer`. */
export function rectContains(outer: Rect, inner: Rect): boolean {
  return (
    inner.minX >= outer.minX &&
    inner.maxX <= outer.maxX &&
    inner.minZ >= outer.minZ &&
    inner.maxZ <= outer.maxZ
  );
}

/** True when a circle of `radius` at `center` overlaps the rectangle. */
export function circleHitsRect(center: Vec2, radius: number, rect: Rect): boolean {
  const nearestX = Math.min(Math.max(center.x, rect.minX), rect.maxX);
  const nearestZ = Math.min(Math.max(center.z, rect.minZ), rect.maxZ);
  return Math.hypot(center.x - nearestX, center.z - nearestZ) < radius;
}
