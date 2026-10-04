/**
 * The hall is data (ADR-0004): one room and its cabinets. A cabinet with a
 * `game` runs it (ADR-0005); one without plays its attract loop and is
 * OUT OF ORDER. Titles are invented, never real trademarks.
 */
import type { Livery } from '../palette';
import { isGameId } from '../../shared/scores';
import { add, facingVector, footprint, rectContains, rectsOverlap, scale } from './geometry';
import type { Facing, Rect, Vec2 } from './geometry';

/** How a cabinet's screen loops while nobody plays. */
export type AttractStyle = 'starfield' | 'bounce' | 'rain' | 'tunnel' | 'invaders' | 'snake';

export interface Cabinet {
  id: string;
  title: string;
  /** Centre of the footprint on the floor. */
  position: Vec2;
  facing: Facing;
  livery: Livery;
  attract: AttractStyle;
  game?: string;
}

export interface Hall {
  /** The room spans x 0..width and z 0..depth. */
  width: number;
  depth: number;
  /** Where the avatar starts. */
  spawn: Vec2;
  cabinets: Cabinet[];
}

/** A cabinet's size on the floor: across its screen, and front to back. */
export const CABINET_WIDTH = 1;
export const CABINET_DEPTH = 0.9;
/** How far in front of the screen a player stands. */
const USE_DISTANCE = 0.95;

export function cabinetFootprint(cabinet: Cabinet): Rect {
  return footprint(cabinet.position, cabinet.facing, CABINET_WIDTH, CABINET_DEPTH);
}

/** The spot in front of the screen where a player stands to play. */
export function usePoint(cabinet: Cabinet): Vec2 {
  return add(cabinet.position, scale(facingVector(cabinet.facing), USE_DISTANCE));
}

function roomRect(hall: Hall): Rect {
  return { minX: 0, minZ: 0, maxX: hall.width, maxZ: hall.depth };
}

function pointRect(p: Vec2): Rect {
  return { minX: p.x, minZ: p.z, maxX: p.x, maxZ: p.z };
}

function cabinetErrors(hall: Hall, cabinet: Cabinet, index: number): string[] {
  const errors: string[] = [];
  const room = roomRect(hall);
  const rect = cabinetFootprint(cabinet);
  if (!rectContains(room, rect)) errors.push(`${cabinet.id} stands outside the room`);
  if (!rectContains(room, pointRect(usePoint(cabinet)))) {
    errors.push(`${cabinet.id} faces a wall`);
  }
  if (cabinet.game !== undefined && !isGameId(cabinet.game)) {
    errors.push(`${cabinet.id} names a bad game id`);
  }
  hall.cabinets.forEach((other, j) => {
    if (other.id === cabinet.id && j < index) errors.push(`${cabinet.id} is not unique`);
    if (j > index && rectsOverlap(rect, cabinetFootprint(other))) {
      errors.push(`${cabinet.id} overlaps ${other.id}`);
    }
  });
  return errors;
}

/** Everything wrong with a hall; empty when it is sound. */
export function validateHall(hall: Hall): string[] {
  const errors = hall.cabinets.flatMap((c, i) => cabinetErrors(hall, c, i));
  if (!rectContains(roomRect(hall), pointRect(hall.spawn))) {
    errors.push('the spawn point is outside the room');
  }
  return errors;
}

/** JollyBlue's hall. You start in the top corner, under the sign; Mars Patrol 3D stands on the island. */
export const HALL: Hall = {
  width: 16,
  depth: 12,
  spawn: { x: 1.5, z: 1.6 },
  cabinets: [
    {
      id: 'mars-patrol',
      title: 'MARS PATROL 3D',
      position: { x: 9, z: 6.5 },
      facing: 'south',
      livery: 'midnight',
      attract: 'starfield',
      game: 'mars-patrol-3d',
    },
    {
      id: 'lava-llama',
      title: 'LAVA LLAMA',
      position: { x: 7, z: 6.5 },
      facing: 'south',
      livery: 'tangerine',
      attract: 'bounce',
    },
    {
      id: 'turbo-nonna',
      title: 'TURBO NONNA',
      position: { x: 3, z: 0.6 },
      facing: 'south',
      livery: 'cherry',
      attract: 'tunnel',
    },
    {
      id: 'star-gardener',
      title: 'STAR GARDENER',
      position: { x: 5, z: 0.6 },
      facing: 'south',
      livery: 'lime',
      attract: 'rain',
    },
    {
      id: 'pixel-piranha',
      title: 'PIXEL PIRANHA',
      position: { x: 7, z: 0.6 },
      facing: 'south',
      livery: 'teal',
      attract: 'snake',
    },
    {
      id: 'galaxy-gelato',
      title: 'GALAXY GELATO',
      position: { x: 9, z: 0.6 },
      facing: 'south',
      livery: 'bubblegum',
      attract: 'invaders',
    },
    {
      id: 'robo-rodeo',
      title: 'ROBO RODEO',
      position: { x: 11, z: 0.6 },
      facing: 'south',
      livery: 'cobalt',
      attract: 'bounce',
    },
    {
      id: 'comet-kebab',
      title: 'COMET KEBAB',
      position: { x: 0.6, z: 4 },
      facing: 'east',
      livery: 'grape',
      attract: 'starfield',
    },
    {
      id: 'disco-dungeon',
      title: 'DISCO DUNGEON',
      position: { x: 0.6, z: 6 },
      facing: 'east',
      livery: 'bubblegum',
      attract: 'tunnel',
    },
    {
      id: 'yeti-yacht',
      title: 'YETI YACHT',
      position: { x: 0.6, z: 8 },
      facing: 'east',
      livery: 'teal',
      attract: 'rain',
    },
  ],
};
