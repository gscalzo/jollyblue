/** The hall's copy of each game's high scores (ADR-0006), kept fresh after every run. */
import type { ScoreEntry } from '../shared/types';
import { fetchScores, postScore } from './core/api';
import { bestRun } from './core/scoreboard';
import type { CabinetView } from './render/cabinet';

export interface ScoreBook {
  refresh(): void;
  record(game: string, points: number): void;
  best(game: string | undefined): string | null;
}

export function createScoreBook(cabinets: readonly CabinetView[]): ScoreBook {
  const scores = new Map<string, ScoreEntry[]>();
  return {
    refresh() {
      for (const view of cabinets) {
        const game = view.cabinet.game;
        if (game === undefined) continue;
        fetchScores((u) => fetch(u), game)
          .then((table) => {
            scores.set(game, table.scores);
            view.setScores(table.scores);
          })
          .catch(console.error);
      }
    },
    record(game, points) {
      postScore((u, i) => fetch(u, i), game, points).catch(console.error);
    },
    best(game) {
      return game === undefined ? null : bestRun(scores.get(game) ?? []);
    },
  };
}
