/** What a game cabinet shows of its high scores (ADR-0006). */
import type { ScoreEntry } from '../../shared/types';

/** Seconds per attract cycle, and how many of them show the table. */
const CYCLE = 8;
const TABLE_SHARE = 3;
const ROWS = 5;

/** The table's lines: a heading, then rank, initials and score. */
export function tableLines(scores: readonly ScoreEntry[]): string[] {
  const rows = scores.slice(0, ROWS).map((s, i) => `${i + 1} ${s.initials} ${s.score}`);
  return ['HI-SCORES', ...(rows.length > 0 ? rows : ['NO RUNS YET'])];
}

/** True during the part of each attract cycle that shows the table. */
export function showsTable(t: number, hasGame: boolean): boolean {
  return hasGame && t % CYCLE >= CYCLE - TABLE_SHARE;
}

/** The prompt's mention of the best run, if there is one. */
export function bestRun(scores: readonly ScoreEntry[]): string | null {
  const best = scores[0];
  return best ? `HI ${best.score} ${best.initials}` : null;
}
