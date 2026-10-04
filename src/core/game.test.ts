import { describe, expect, it, vi } from 'vitest';
import { startGame } from './game';
import type { Game, GameEvents, GameLoaders, GameModule } from './game';
import { IDLE } from './input';

function fakeGame() {
  const mount = vi.fn();
  const unmount = vi.fn();
  const game: Game = { mount, unmount };
  return { game, mount, unmount };
}

function setup(loaders: GameLoaders) {
  const exit = vi.fn();
  const events: GameEvents = { score: vi.fn(), exit };
  const mount = { canvas: {} as HTMLCanvasElement, input: { read: () => IDLE }, events };
  const onError = vi.fn();
  return {
    events,
    exit,
    mount,
    onError,
    start: (id: string) => startGame(loaders, id, mount, onError),
  };
}

describe('startGame', () => {
  it('loads, makes and mounts the game, then unmounts it on stop', async () => {
    const { game, mount, unmount } = fakeGame();
    const s = setup({ g: () => Promise.resolve({ default: () => game }) });
    const running = s.start('g');
    await running.ready;
    expect(mount).toHaveBeenCalledWith(s.mount.canvas, s.mount.input, s.events);
    running.stop();
    expect(unmount).toHaveBeenCalledTimes(1);
    running.stop();
    expect(unmount).toHaveBeenCalledTimes(1);
  });

  it('never mounts a game stopped while it was loading', async () => {
    const { game, mount, unmount } = fakeGame();
    let arrive: (m: GameModule) => void = () => undefined;
    const s = setup({ g: () => new Promise<GameModule>((resolve) => (arrive = resolve)) });
    const running = s.start('g');
    running.stop();
    arrive({ default: () => game });
    await running.ready;
    expect(mount).not.toHaveBeenCalled();
    expect(unmount).not.toHaveBeenCalled();
  });

  it('reports an unknown game or a failed load, and exits', async () => {
    const s = setup({ broken: () => Promise.reject(new Error('404')) });
    await s.start('nope').ready;
    expect(s.onError).toHaveBeenCalledWith(new Error('unknown game nope'));
    await s.start('broken').ready;
    expect(s.onError).toHaveBeenLastCalledWith(new Error('404'));
    expect(s.exit).toHaveBeenCalledTimes(2);
  });
});
