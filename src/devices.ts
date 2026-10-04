/**
 * The browser end of the input layer (ADR-0003): which keys are held and
 * what the first connected gamepad says, turned into one Intent per frame by
 * the pure mapping in core/input.
 */
import { fromKeys, fromPad, IDLE, merge } from './core/input';
import type { Intent } from './core/input';

/** Keys whose browser default (scrolling, page back) must not fire. */
const SWALLOWED = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Space',
  'Backspace',
]);

export interface Devices {
  /** Samples every device; the hall calls it once per frame. */
  poll(): Intent;
  /** This frame's sample, for anyone else (a game) reading the same frame. */
  read(): Intent;
}

export function listenToDevices(target: Window): Devices {
  const held = new Set<string>();
  // Keys that went down since the last read: a tap shorter than a frame still counts once.
  const tapped = new Set<string>();
  target.addEventListener('keydown', (e) => {
    if (SWALLOWED.has(e.code)) e.preventDefault();
    held.add(e.code);
    tapped.add(e.code);
  });
  target.addEventListener('keyup', (e) => held.delete(e.code));
  target.addEventListener('blur', () => held.clear());

  let current = IDLE;
  return {
    read: () => current,
    poll() {
      const pads = target.navigator.getGamepads().filter((p) => p !== null);
      const keys = new Set([...held, ...tapped]);
      tapped.clear();
      current = merge([fromKeys(keys), ...pads.map(fromPad)]);
      return current;
    },
  };
}
