/**
 * The hall is data (ADR-0004): one room and its cabinets. A cabinet with a
 * `game` runs it (ADR-0005); one without plays its attract loop and is
 * OUT OF ORDER. Titles are invented, never real trademarks.
 */
import type { Livery } from '../palette';
import { isGameId } from '../../shared/scores';
import { parseJingle } from './audio';
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
  /** Attract-mode jingle in note names, `.` a rest (ADR-0010). */
  jingle: string;
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
  if (parseJingle(cabinet.jingle) === null) errors.push(`${cabinet.id} has a bad jingle`);
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

/** JollyBlue's hall. You start in the top corner, under the sign; Moon Patrol 3D stands on the island. */
export const HALL: Hall = {
  width: 16,
  depth: 12,
  spawn: { x: 1.5, z: 1.6 },
  cabinets: [
    {
      id: 'moon-patrol',
      title: 'MOON PATROL 3D',
      position: { x: 9, z: 6.5 },
      facing: 'south',
      livery: 'midnight',
      attract: 'starfield',
      jingle: 'C5 E5 G5 C6 . G5 E5 . D5 F5 A5 D6 . A5 F5 .',
      game: 'moon-patrol-3d',
    },
    {
      id: 'lava-llama',
      title: 'LAVA LLAMA',
      position: { x: 7, z: 6.5 },
      facing: 'south',
      livery: 'tangerine',
      attract: 'bounce',
      jingle: 'E4 G4 B4 . E5 . B4 G4 A4 C5 E5 . A5 . E5 C5',
    },
    {
      id: 'turbo-nonna',
      title: 'TURBO NONNA',
      position: { x: 3, z: 0.6 },
      facing: 'south',
      livery: 'cherry',
      attract: 'tunnel',
      jingle: 'G4 G4 D5 D5 E5 E5 D5 . C5 C5 B4 B4 A4 A4 G4 .',
    },
    {
      id: 'star-gardener',
      title: 'STAR GARDENER',
      position: { x: 5, z: 0.6 },
      facing: 'south',
      livery: 'lime',
      attract: 'rain',
      jingle: 'A4 C5 E5 A5 G5 E5 C5 . F4 A4 C5 F5 E5 C5 A4 .',
    },
    {
      id: 'pixel-piranha',
      title: 'PIXEL PIRANHA',
      position: { x: 7, z: 0.6 },
      facing: 'south',
      livery: 'teal',
      attract: 'snake',
      jingle: 'D5 . D5 F5 . A5 . F5 D5 . C5 . A4 . C5 .',
    },
    {
      id: 'galaxy-gelato',
      title: 'GALAXY GELATO',
      position: { x: 9, z: 0.6 },
      facing: 'south',
      livery: 'bubblegum',
      attract: 'invaders',
      jingle: 'C5 D5 E5 G5 E5 D5 C5 . E5 F5 G5 C6 G5 F5 E5 .',
    },
    {
      id: 'robo-rodeo',
      title: 'ROBO RODEO',
      position: { x: 11, z: 0.6 },
      facing: 'south',
      livery: 'cobalt',
      attract: 'bounce',
      jingle: 'E5 E5 . E5 . C5 E5 . G5 . . . G4 . . .',
    },
    {
      id: 'comet-kebab',
      title: 'COMET KEBAB',
      position: { x: 0.6, z: 4 },
      facing: 'east',
      livery: 'grape',
      attract: 'starfield',
      jingle: 'B4 D5 F5 B5 A5 F5 D5 . B4 E5 G5 B5 A5 G5 E5 .',
    },
    {
      id: 'disco-dungeon',
      title: 'DISCO DUNGEON',
      position: { x: 0.6, z: 6 },
      facing: 'east',
      livery: 'bubblegum',
      attract: 'tunnel',
      jingle: 'A4 . A5 . A4 . A5 . G4 . G5 . G4 . G5 .',
    },
    {
      id: 'yeti-yacht',
      title: 'YETI YACHT',
      position: { x: 0.6, z: 8 },
      facing: 'east',
      livery: 'teal',
      attract: 'rain',
      jingle: 'F4 A4 C5 F5 . C5 A4 . G4 B4 D5 G5 . D5 B4 .',
    },
  ],
};
