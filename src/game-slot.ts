/** Where a cabinet's game runs (ADR-0005): started as the dive ends, stopped as the player leaves. */
import { startGame } from './core/game';
import type { InputSource, Running } from './core/game';
import type { Cabinet } from './core/hall';
import { GAMES } from './games';
import type { ScoreBook } from './scorebook';

export interface GameSlot {
  start(cabinet: Cabinet): void;
  stop(): void;
  /** True once the game asked to leave; read and cleared by the hall. */
  takeExit(): boolean;
}

export function createGameSlot(
  canvas: HTMLCanvasElement,
  input: InputSource,
  book: ScoreBook,
): GameSlot {
  let running: Running | null = null;
  let exitRequested = false;
  return {
    start(cabinet) {
      const game = cabinet.game ?? '';
      exitRequested = false;
      const events = {
        score: (points: number) => book.record(game, points),
        exit: () => {
          exitRequested = true;
        },
      };
      running = startGame(GAMES, game, { canvas, input, events }, console.error);
    },
    stop() {
      running?.stop();
      running = null;
      book.refresh();
    },
    takeExit() {
      const asked = exitRequested;
      exitRequested = false;
      return asked;
    },
  };
}
