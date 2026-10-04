import { describe, expect, it } from 'vitest';
import { startBuggy } from './buggy';
import { clearSkies, stepSkies } from './skies';
import type { Skies } from './skies';
import { BOMB, DRIVE, STEP, UFO } from './tuning';
import { launch } from './ufo';
import type { Ufo, Wave } from './ufo';

const WAVES: Wave[] = [
  { at: 100, hover: 8, bombs: 2, every: 1 },
  { at: 100, hover: 4, bombs: 2, every: 1 },
  { at: 200, hover: 8, bombs: 2, every: 1 },
];
const bolt = (x: number, y: number) => ({ x, y, vx: 0, vy: 0, from: x });
const attacking = (x: number, wave = 0): Ufo => ({
  ...launch(WAVES[0], wave, 0),
  phase: 'attack',
  x,
  y: UFO.hoverY,
  z: 0,
  reload: 5,
  anchor: x,
});

describe('clearSkies', () => {
  it('waits for the waves ahead of a point', () => {
    expect(clearSkies(WAVES, 0)).toEqual({ ufos: [], bombs: [], holes: [], nextWave: 0 });
    expect(clearSkies(WAVES, 100)).toMatchObject({ nextWave: 2 });
    expect(clearSkies(WAVES, 99.9)).toMatchObject({ nextWave: 0 });
    expect(clearSkies(WAVES, 500)).toMatchObject({ nextWave: 3 });
  });
});

describe('stepSkies', () => {
  const empty = clearSkies(WAVES, 0);

  it('launches every wave the buggy has reached, once', () => {
    expect(stepSkies(WAVES, empty, [], startBuggy(99)).events).toEqual([]);
    const s = stepSkies(WAVES, empty, [], startBuggy(100));
    expect(s.events).toEqual([{ kind: 'ufo-in' }, { kind: 'ufo-in' }]);
    expect(s.skies.ufos.map((u) => u.wave)).toEqual([0, 1]);
    expect(s.skies.nextWave).toBe(2);
    expect(stepSkies(WAVES, s.skies, [], startBuggy(101)).events).toEqual([]);
  });

  it('flies the UFOs and lets the gone ones go', () => {
    const going: Ufo = { ...attacking(10), phase: 'leave', t: UFO.leave };
    const skies: Skies = { ...empty, ufos: [attacking(10), going], nextWave: 3 };
    const s = stepSkies(WAVES, skies, [], startBuggy(0));
    expect(s.skies.ufos).toHaveLength(1);
    expect(s.skies.ufos[0]?.t).toBeGreaterThan(0);
  });

  it('drops a bomb from a UFO on its beat; the bomb falls from the next step', () => {
    const skies: Skies = { ...empty, ufos: [{ ...attacking(10), reload: 0 }], nextWave: 3 };
    const s = stepSkies(WAVES, skies, [], startBuggy(0));
    expect(s.events).toEqual([{ kind: 'drop' }]);
    expect(s.skies.bombs).toHaveLength(1);
    expect(s.skies.bombs[0]?.vy).toBe(0);
    const later = stepSkies(WAVES, s.skies, [], startBuggy(0));
    expect(later.skies.bombs[0]?.vy).toBeLessThan(0);
  });

  it('forgets a UFO whose wave the course no longer has', () => {
    const stray = { ...attacking(10), wave: 9 };
    expect(
      stepSkies(WAVES, { ...empty, ufos: [stray], nextWave: 3 }, [], startBuggy(0)).skies.ufos,
    ).toEqual([]);
  });

  it('brings down a UFO and bursts a bomb with upward bolts, one bolt each', () => {
    // A UFO of wave 0 hovers 8 m ahead of the buggy at 22.
    const skies: Skies = {
      ...empty,
      ufos: [attacking(30)],
      bombs: [{ x: 20, y: 5, vy: 0 }],
      nextWave: 3,
    };
    const up = [bolt(30, UFO.hoverY), bolt(20, 5), bolt(0, 1)];
    const s = stepSkies(WAVES, skies, up, startBuggy(22));
    expect(s.skies.ufos).toEqual([]);
    expect(s.skies.bombs).toEqual([]);
    expect(s.up).toEqual([bolt(0, 1)]);
    expect(s.points).toBe(UFO.points + BOMB.points);
    expect(s.events.map((e) => e.kind)).toEqual(['ufo-down', 'bomb-down']);
    expect(s.events[0]).toMatchObject({ kind: 'ufo-down' });
  });

  it('spends a bolt on one target only', () => {
    const skies: Skies = { ...empty, ufos: [attacking(30), attacking(30)], nextWave: 3 };
    const s = stepSkies(WAVES, skies, [bolt(30, UFO.hoverY)], startBuggy(22));
    expect(s.skies.ufos).toHaveLength(1);
    expect(s.up).toEqual([]);
    expect(s.points).toBe(UFO.points);
  });

  it('lands bombs: one on the buggy wrecks it, one ahead leaves a crater, one behind leaves nothing', () => {
    const bombs = [
      { x: 50, y: 0.01, vy: -5 },
      { x: 60, y: 0.01, vy: -5 },
      { x: 40, y: 0.01, vy: -5 },
      { x: 70, y: 5, vy: 0 },
    ];
    const s = stepSkies(WAVES, { ...empty, bombs, nextWave: 3 }, [], startBuggy(50));
    expect(s.bombed).toBe(true);
    expect(s.events).toEqual([
      { kind: 'impact', x: 50 },
      { kind: 'impact', x: 60 },
      { kind: 'impact', x: 40 },
    ]);
    expect(s.skies.holes).toEqual([{ x: 60 - BOMB.hole / 2, width: BOMB.hole }]);
    expect(s.skies.bombs).toHaveLength(1);
  });

  it('lands a bomb that reaches the ground exactly', () => {
    const bombs = [{ x: 80, y: 0, vy: BOMB.gravity * STEP }];
    const s = stepSkies(WAVES, { ...empty, bombs, nextWave: 3 }, [], startBuggy(50));
    expect(s.events).toEqual([{ kind: 'impact', x: 80 }]);
    expect(s.skies.bombs).toEqual([]);
  });

  it('lets a bomb landing clear of the buggy spare it', () => {
    const bombs = [{ x: 50 + DRIVE.half + BOMB.blast + 1, y: 0, vy: 0 }];
    const s = stepSkies(WAVES, { ...empty, bombs, nextWave: 3 }, [], startBuggy(50));
    expect(s.bombed).toBe(false);
    expect(s.skies.holes).toHaveLength(1);
  });
});
