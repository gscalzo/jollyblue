/** Contracts shared by the Worker and the hall (ADR-0006). */

/** One row of a cabinet's high-score table. */
export interface ScoreEntry {
  initials: string;
  score: number;
  /** Epoch milliseconds. */
  playedAt: number;
}

/** GET /api/scores/:game */
export interface ScoreTable {
  game: string;
  scores: ScoreEntry[];
}

/** POST /api/scores/:game */
export interface NewScore {
  initials: string;
  score: number;
}
