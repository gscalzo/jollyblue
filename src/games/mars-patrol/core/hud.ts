/**
 * What the HUD says (ADR-0017): score, best, lives, the A–E bar, the big
 * banner of the title and the results, and short notices from the run.
 * The render only paints it.
 */
import { finish } from './course';
import type { Course } from './course';
import type { GameEvent, Screen } from './flow';
import { RULES } from './tuning';

export interface Hud {
  score: string;
  hi: string | null;
  lives: number;
  letters: string[];
  /** Index of the last checkpoint passed. */
  reached: number;
  /** How far along the section the buggy is, 0 to 1. */
  progress: number;
  banner: string | null;
  detail: string | null;
  prompt: string | null;
}

export interface Notice {
  text: string;
  left: number;
}

/** Seconds a notice stays up. */
export const NOTICE_SECONDS = 2;

export function digits(score: number): string {
  return String(score).padStart(6, '0');
}

function words(screen: Screen): Pick<Hud, 'banner' | 'detail' | 'prompt'> {
  if (screen.kind === 'title') {
    return { banner: 'MARS PATROL 3D', detail: null, prompt: 'ACTION TO START' };
  }
  if (screen.kind === 'playing') return { banner: null, detail: null, prompt: null };
  const clear = screen.run.phase.kind === 'clear';
  return {
    banner: clear ? 'SECTION CLEAR' : 'GAME OVER',
    detail: `SCORE ${digits(screen.run.purse.score)}`,
    prompt: screen.t >= RULES.resultsSeconds ? 'ACTION TO PLAY AGAIN' : null,
  };
}

function standing(
  course: Course,
  screen: Screen,
): Pick<Hud, 'score' | 'lives' | 'reached' | 'progress'> {
  if (screen.kind === 'title')
    return { score: digits(0), lives: RULES.lives, reached: 0, progress: 0 };
  const { run } = screen;
  return {
    score: digits(run.purse.score),
    lives: run.purse.lives,
    reached: run.checkpoint,
    progress: Math.min(1, Math.max(0, run.buggy.x / finish(course))),
  };
}

export function hud(course: Course, screen: Screen, best: number | null): Hud {
  return {
    ...standing(course, screen),
    hi: best === null ? null : digits(best),
    letters: course.checkpoints.map((cp) => cp.letter),
    ...words(screen),
  };
}

function noticeText(event: GameEvent): string | null {
  if (event.kind === 'checkpoint') return `CHECKPOINT ${event.letter}  +${event.bonus}`;
  if (event.kind === 'extra-life') return 'EXTRA LIFE';
  return null;
}

/** The notice showing after this frame: a new one replaces the old, which fades in time. */
export function updateNotice(
  notice: Notice | null,
  events: readonly GameEvent[],
  dt: number,
): Notice | null {
  const fresh = events.map(noticeText).filter((t) => t !== null);
  const text = fresh[fresh.length - 1];
  if (text !== undefined) return { text, left: NOTICE_SECONDS };
  if (!notice || notice.left <= dt) return null;
  return { text: notice.text, left: notice.left - dt };
}

/** The best score after a frame's posts. */
export function bestAfter(best: number | null, posted: readonly number[]): number | null {
  // Stryker disable next-line EqualityOperator: an equal post leaves the same best
  return posted.reduce<number | null>((b, p) => (b === null || p > b ? p : b), best);
}
