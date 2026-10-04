/**
 * One input layer (ADR-0003): keyboard and gamepad become the same three
 * intents — move, action, back — plus mute (ADR-0010). Nothing else in the
 * hall or a game reads a key or a button.
 */

export interface Intent {
  /** Screen direction: x right, y up, length at most 1. */
  move: { x: number; y: number };
  action: boolean;
  back: boolean;
  mute: boolean;
}

/** The parts of the browser's Gamepad that the layer reads. */
export interface PadState {
  axes: readonly number[];
  buttons: readonly { pressed: boolean }[];
}

export const IDLE: Intent = { move: { x: 0, y: 0 }, action: false, back: false, mute: false };

const STICK_DEADZONE = 0.2;

const KEYS = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  action: ['KeyE', 'Enter', 'Space'],
  back: ['Escape', 'Backspace'],
  mute: ['KeyM'],
} as const;

/** Standard-mapping gamepad buttons. */
const PAD = { action: 0, back: 1, mute: 8, up: 12, down: 13, left: 14, right: 15 } as const;

function anyHeld(keys: ReadonlySet<string>, codes: readonly string[]): boolean {
  return codes.some((code) => keys.has(code));
}

function axis(negative: boolean, positive: boolean): number {
  return Number(positive) - Number(negative);
}

/** Never longer than 1, so diagonals are no faster. */
export function clampLength(v: { x: number; y: number }): { x: number; y: number } {
  const len = Math.hypot(v.x, v.y);
  // Stryker disable next-line EqualityOperator: a length of exactly 1 divides by 1
  return len > 1 ? { x: v.x / len, y: v.y / len } : v;
}

export function fromKeys(keys: ReadonlySet<string>): Intent {
  const held = (codes: readonly string[]) => anyHeld(keys, codes);
  return {
    move: clampLength({
      x: axis(held(KEYS.left), held(KEYS.right)),
      y: axis(held(KEYS.down), held(KEYS.up)),
    }),
    action: held(KEYS.action),
    back: held(KEYS.back),
    mute: held(KEYS.mute),
  };
}

function button(pad: PadState, index: number): boolean {
  return pad.buttons[index]?.pressed ?? false;
}

function stick(pad: PadState): { x: number; y: number } {
  const x = pad.axes[0] ?? 0;
  const y = -(pad.axes[1] ?? 0);
  return Math.hypot(x, y) < STICK_DEADZONE ? { x: 0, y: 0 } : { x, y };
}

export function fromPad(pad: PadState): Intent {
  const s = stick(pad);
  const pressed = (index: number) => button(pad, index);
  return {
    move: clampLength({
      x: s.x + axis(pressed(PAD.left), pressed(PAD.right)),
      y: s.y + axis(pressed(PAD.down), pressed(PAD.up)),
    }),
    action: pressed(PAD.action),
    back: pressed(PAD.back),
    mute: pressed(PAD.mute),
  };
}

/** Every device at once: moves add up, buttons are held if any holds them. */
export function merge(intents: readonly Intent[]): Intent {
  return intents.reduce(
    (a, b) => ({
      move: clampLength({ x: a.move.x + b.move.x, y: a.move.y + b.move.y }),
      action: a.action || b.action,
      back: a.back || b.back,
      mute: a.mute || b.mute,
    }),
    IDLE,
  );
}

/** The buttons that went down this frame. */
export interface Presses {
  action: boolean;
  back: boolean;
  mute: boolean;
}

export function presses(previous: Intent, current: Intent): Presses {
  return {
    action: current.action && !previous.action,
    back: current.back && !previous.back,
    mute: current.mute && !previous.mute,
  };
}
