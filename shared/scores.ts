/** The rules for a high score, shared by the Worker and the hall (ADR-0006). */
import type { NewScore } from './types';

/** How many rows a cabinet's table shows. */
export const TABLE_SIZE = 10;

/** The highest score a cabinet can display: nine digits. */
export const MAX_SCORE = 999_999_999;

const GAME_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const GAME_ID_MAX = 32;
const INITIALS = /^[A-Z]{3}$/;

/** A game id is a short kebab-case slug, e.g. `moon-patrol-3d`. */
export function isGameId(value: string): boolean {
  return value.length <= GAME_ID_MAX && GAME_ID.test(value);
}

function isScore(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= MAX_SCORE;
}

/** Validates a POSTed score: three capital letters and a whole score in range. */
export function parseNewScore(body: unknown): NewScore | string {
  if (typeof body !== 'object' || body === null) return 'body must be an object';
  const { initials, score } = body as Record<string, unknown>;
  if (typeof initials !== 'string' || !INITIALS.test(initials)) {
    return 'initials must be three capital letters';
  }
  if (!isScore(score)) {
    return `score must be a whole number from 0 to ${MAX_SCORE}`;
  }
  return { initials, score };
}
