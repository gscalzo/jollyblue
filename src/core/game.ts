/**
 * The game contract (ADR-0005, ADR-0020). A game is a lazily loaded module
 * whose default export makes a Game; the hall mounts it on its own canvas
 * with the shared input layer and its audio output, and listens for its
 * score and its exit.
 */
import type { Intent } from './input';

export interface InputSource {
  read(): Intent;
}

export interface GameEvents {
  /** A run ended with this many points. */
  score(points: number): void;
  /** The game wants to go back to the hall. */
  exit(): void;
}

/**
 * Where a game makes sound: the hall's audio context and a node the hall
 * mutes with M. Null when sound has not been unlocked yet.
 */
export interface GameAudio {
  context: AudioContext;
  out: AudioNode;
}

export interface Game {
  mount(
    canvas: HTMLCanvasElement,
    input: InputSource,
    events: GameEvents,
    audio: GameAudio | null,
  ): void;
  unmount(): void;
}

export interface GameModule {
  default: () => Game;
}

export type GameLoaders = Record<string, () => Promise<GameModule>>;

export interface Running {
  /** Unmounts the game, or makes sure it never mounts if it is still loading. */
  stop(): void;
  /** Settles once the game is mounted, or failed, or was stopped first. */
  ready: Promise<void>;
}

/**
 * Loads and mounts a game. Safe against the player leaving mid-load: a game
 * stopped before it arrives is never mounted. A game that is unknown or
 * fails to load reports through `onError` and exits.
 */
export function startGame(
  loaders: GameLoaders,
  id: string,
  mount: {
    canvas: HTMLCanvasElement;
    input: InputSource;
    events: GameEvents;
    audio: GameAudio | null;
  },
  onError: (error: unknown) => void,
): Running {
  let stopped = false;
  let game: Game | null = null;
  const load = loaders[id];
  const ready = (load ? load() : Promise.reject(new Error(`unknown game ${id}`))).then(
    (module) => {
      if (stopped) return;
      game = module.default();
      game.mount(mount.canvas, mount.input, mount.events, mount.audio);
    },
    (error: unknown) => {
      onError(error);
      mount.events.exit();
    },
  );
  return {
    ready,
    stop() {
      stopped = true;
      game?.unmount();
      game = null;
    },
  };
}
