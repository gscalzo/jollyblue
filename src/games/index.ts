/** Every game a cabinet can run, loaded only when played (ADR-0005). */
import type { GameLoaders } from '../core/game';

export const GAMES: GameLoaders = {
  'moon-patrol-3d': () => import('./moon-patrol-3d'),
};
