import { describe, expect, it } from 'vitest';
import { SFX, soundsFor } from './sfx';
import type { SfxName } from './sfx';

const NAMES: SfxName[] = [
  'start',
  'jump',
  'land',
  'fire',
  'hit',
  'break',
  'crash',
  'ufo',
  'drop',
  'ufo-down',
  'pop',
  'impact',
  'checkpoint',
  'extra',
  'clear',
  'over',
];

describe('the effects', () => {
  it('are each a few audible tones', () => {
    expect(Object.keys(SFX).sort()).toEqual([...NAMES].sort());
    for (const name of NAMES) {
      expect(SFX[name].length).toBeGreaterThan(0);
      for (const t of SFX[name]) {
        expect(['sine', 'square', 'sawtooth', 'triangle', 'noise']).toContain(t.wave);
        expect(t.from).toBeGreaterThan(20);
        expect(t.to).toBeGreaterThan(20);
        expect(t.seconds).toBeGreaterThan(0);
        expect(t.gain).toBeGreaterThan(0);
        expect(t.gain).toBeLessThanOrEqual(0.5);
        expect(t.delay).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('play arpeggios note after note', () => {
    expect(SFX.checkpoint.map((t) => t.delay)).toEqual([0, 0.09]);
    expect(SFX.checkpoint[0]).toMatchObject({ wave: 'triangle', from: 784, to: 784, gain: 0.25 });
    expect(SFX.checkpoint[0]?.seconds).toBeCloseTo(0.144);
    expect(SFX.jump[0]).toEqual({
      wave: 'sine',
      from: 260,
      to: 720,
      seconds: 0.2,
      gain: 0.25,
      delay: 0,
    });
    expect(SFX.crash[0]?.gain).toBe(0.5);
  });
});

describe('soundsFor', () => {
  it('maps each event to its effect, once a frame', () => {
    expect(
      soundsFor([
        { kind: 'start' },
        { kind: 'jump' },
        { kind: 'land' },
        { kind: 'fire' },
        { kind: 'hit', x: 1 },
        { kind: 'break', x: 1, size: 'big' },
        { kind: 'crash' },
        { kind: 'ufo-in' },
        { kind: 'drop' },
        { kind: 'ufo-down', x: 1, y: 1 },
        { kind: 'bomb-down', x: 1, y: 1 },
        { kind: 'impact', x: 1 },
        { kind: 'checkpoint', letter: 'B', bonus: 1 },
        { kind: 'extra-life' },
        { kind: 'extra-life' },
        { kind: 'clear', bonus: 1 },
        { kind: 'over' },
        { kind: 'points', points: 50 },
        { kind: 'respawn' },
      ]),
    ).toEqual([
      'start',
      'jump',
      'land',
      'fire',
      'hit',
      'break',
      'crash',
      'ufo',
      'drop',
      'ufo-down',
      'pop',
      'impact',
      'checkpoint',
      'extra',
      'clear',
      'over',
    ]);
  });
});
