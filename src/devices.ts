/**
 * The browser end of the input layer (ADR-0003): which keys are held and
 * what the first connected gamepad says, turned into one Intent per frame by
 * the pure mapping in core/input.
 */
import { fromKeys, fromPad, merge } from './core/input';
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
  read(): Intent;
}

export function listenToDevices(target: Window): Devices {
  const held = new Set<string>();
  target.addEventListener('keydown', (e) => {
    if (SWALLOWED.has(e.code)) e.preventDefault();
    held.add(e.code);
  });
  target.addEventListener('keyup', (e) => held.delete(e.code));
  target.addEventListener('blur', () => held.clear());

  return {
    read() {
      const pads = target.navigator.getGamepads().filter((p) => p !== null);
      return merge([fromKeys(held), ...pads.map(fromPad)]);
    },
  };
}
