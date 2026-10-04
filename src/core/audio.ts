/**
 * The sound's arithmetic (ADR-0010): jingles written as note names, how loud
 * and where a cabinet sounds from the avatar's spot, and the loop each
 * cabinet plays. The Web Audio engine only executes what this decides.
 */
import type { Vec2 } from './geometry';

/** Seconds per jingle step. */
export const STEP_SECONDS = 0.15;
/** Rest steps between two plays of a jingle. */
const LOOP_REST = 16;
/** Beyond this distance a cabinet is silent. */
const HEARING = 7;
/** Floor units of sideways offset that pan fully left or right. */
const PAN_SPAN = 5;

const NOTE = /^([A-G])(#?)(\d)$/;
const SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Hz of a note name such as `A4` or `C#5`; null when it is not one. */
export function noteFrequency(name: string): number | null {
  const m = NOTE.exec(name);
  if (!m) return null;
  const midi = 12 * (Number(m[3]) + 1) + SEMITONES[m[1]] + (m[2] === '#' ? 1 : 0);
  return 440 * 2 ** ((midi - 69) / 12);
}

/** A jingle's steps: a frequency, or null for a rest (`.`). */
export function parseJingle(text: string): (number | null)[] | null {
  const steps: (number | null)[] = [];
  for (const token of text.trim().split(/\s+/)) {
    if (token === '.') {
      steps.push(null);
      continue;
    }
    const f = noteFrequency(token);
    if (f === null) return null;
    steps.push(f);
  }
  return steps;
}

/** The jingle followed by its rest, as one looping pattern. */
export function loopOf(steps: readonly (number | null)[]): (number | null)[] {
  return [...steps, ...Array<null>(LOOP_REST).fill(null)];
}

/**
 * How a source sounds to a listener: gain falls off with distance (squared,
 * silent beyond hearing range), and pan follows the source's place on screen.
 */
export function hearing(listener: Vec2, source: Vec2): { gain: number; pan: number } {
  const dx = source.x - listener.x;
  const dz = source.z - listener.z;
  const near = Math.max(0, 1 - Math.hypot(dx, dz) / HEARING);
  // Screen right is the floor direction (1, -1)/√2 (core/iso).
  const sideways = (dx - dz) * Math.SQRT1_2;
  return { gain: near * near, pan: Math.max(-1, Math.min(1, sideways / PAN_SPAN)) };
}
