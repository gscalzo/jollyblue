import { describe, expect, it } from 'vitest';
import { clampLength, fromKeys, fromPad, IDLE, merge, presses } from './input';
import type { Intent, PadState } from './input';

const keys = (...codes: string[]) => fromKeys(new Set(codes));
const h = Math.SQRT1_2;

function expectMove(actual: { x: number; y: number }, x: number, y: number): void {
  expect(actual.x).toBeCloseTo(x);
  expect(actual.y).toBeCloseTo(y);
}

function pad(axes: number[] = [], pressed: number[] = []): PadState {
  return {
    axes,
    buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: pressed.includes(i) })),
  };
}

describe('fromKeys', () => {
  it('is idle with nothing held', () => {
    expect(keys()).toEqual(IDLE);
  });
  it('moves with WASD and the arrows, diagonals no faster', () => {
    expect(keys('KeyW').move).toEqual({ x: 0, y: 1 });
    expect(keys('ArrowUp').move).toEqual({ x: 0, y: 1 });
    expect(keys('KeyS').move).toEqual({ x: 0, y: -1 });
    expect(keys('ArrowDown').move).toEqual({ x: 0, y: -1 });
    expect(keys('KeyA').move).toEqual({ x: -1, y: 0 });
    expect(keys('ArrowLeft').move).toEqual({ x: -1, y: 0 });
    expect(keys('KeyD').move).toEqual({ x: 1, y: 0 });
    expect(keys('ArrowRight').move).toEqual({ x: 1, y: 0 });
    expectMove(keys('KeyW', 'KeyD').move, h, h);
    expect(keys('KeyW', 'KeyS').move).toEqual({ x: 0, y: 0 });
  });
  it('reads action, back and mute', () => {
    for (const code of ['KeyE', 'Enter', 'Space']) expect(keys(code).action).toBe(true);
    for (const code of ['Escape', 'Backspace']) expect(keys(code).back).toBe(true);
    expect(keys('KeyM').mute).toBe(true);
    expect(keys('KeyM').action).toBe(false);
  });
});

describe('fromPad', () => {
  it('is idle at rest, and ignores a stick inside the deadzone', () => {
    expect(fromPad(pad())).toEqual(IDLE);
    expect(fromPad(pad([0.19, 0])).move).toEqual({ x: 0, y: 0 });
    expect(fromPad({ axes: [], buttons: [] })).toEqual(IDLE);
  });
  it('moves with the left stick, up being negative on the pad', () => {
    expectMove(fromPad(pad([0.5, 0])).move, 0.5, 0);
    expectMove(fromPad(pad([0, -0.2])).move, 0, 0.2);
    expectMove(fromPad(pad([0.2, 0])).move, 0.2, 0);
    expectMove(fromPad(pad([0.5, 0.5])).move, 0.5, -0.5);
  });
  it('moves with the d-pad', () => {
    expect(fromPad(pad([], [12])).move).toEqual({ x: 0, y: 1 });
    expect(fromPad(pad([], [13])).move).toEqual({ x: 0, y: -1 });
    expect(fromPad(pad([], [14])).move).toEqual({ x: -1, y: 0 });
    expect(fromPad(pad([], [15])).move).toEqual({ x: 1, y: 0 });
  });
  it('reads A as action, B as back and View as mute', () => {
    expect(fromPad(pad([], [0]))).toEqual({ ...IDLE, action: true });
    expect(fromPad(pad([], [1]))).toEqual({ ...IDLE, back: true });
    expect(fromPad(pad([], [8]))).toEqual({ ...IDLE, mute: true });
  });
});

describe('clampLength', () => {
  it('shortens only what is longer than 1', () => {
    expect(clampLength({ x: 3, y: 4 })).toEqual({ x: 0.6, y: 0.8 });
    expect(clampLength({ x: 1, y: 0 })).toEqual({ x: 1, y: 0 });
    expect(clampLength({ x: 0.3, y: 0.4 })).toEqual({ x: 0.3, y: 0.4 });
  });
});

describe('merge', () => {
  it('adds moves and ORs buttons', () => {
    const a: Intent = { move: { x: 1, y: 0 }, action: true, back: false, mute: false };
    const b: Intent = { move: { x: 0, y: 1 }, action: false, back: true, mute: true };
    const both = merge([a, b]);
    expectMove(both.move, h, h);
    expect(both).toMatchObject({ action: true, back: true, mute: true });
    expect(merge([b, IDLE])).toEqual({ ...b });
    expect(merge([])).toEqual(IDLE);
    expect(merge([IDLE, IDLE])).toEqual(IDLE);
  });
});

describe('presses', () => {
  it('reports buttons that went down this frame only', () => {
    const held: Intent = { ...IDLE, action: true, back: true, mute: true };
    expect(presses(IDLE, held)).toEqual({ action: true, back: true, mute: true });
    expect(presses(held, held)).toEqual({ action: false, back: false, mute: false });
    expect(presses(held, IDLE)).toEqual({ action: false, back: false, mute: false });
  });
});
