import { describe, expect, it } from 'vitest';
import { HALL, usePoint } from './hall';
import type { Cabinet } from './hall';
import { IDLE, presses } from './input';
import {
  advance,
  cameraShot,
  veil,
  cabinetInReach,
  canWalk,
  dive,
  DIVE_SECONDS,
  ease,
  handover,
  IN_HALL,
  leave,
  NOTICE_SECONDS,
  press,
  prompt,
  REACH,
} from './session';
import type { Session } from './session';

const moon = HALL.cabinets.find((c) => c.game !== undefined) as Cabinet;
const dud = HALL.cabinets.find((c) => c.game === undefined) as Cabinet;
const none = presses(IDLE, IDLE);
const action = { ...none, action: true };
const back = { ...none, back: true };

describe('cabinetInReach', () => {
  it('finds the cabinet whose play spot you stand on, within reach only', () => {
    const spot = usePoint(moon);
    expect(cabinetInReach(HALL, spot)).toBe(moon);
    expect(cabinetInReach(HALL, { x: spot.x + REACH - 0.01, z: spot.z })).toBe(moon);
    expect(cabinetInReach(HALL, { x: spot.x + REACH, z: spot.z })).toBeNull();
    expect(cabinetInReach(HALL, HALL.spawn)).toBeNull();
  });
  it('picks the nearest of two in reach', () => {
    const a = usePoint(HALL.cabinets[2]);
    const b = usePoint(HALL.cabinets[3]);
    const between = { x: (a.x + b.x) / 2 + 0.3, z: a.z };
    expect(
      cabinetInReach({ ...HALL, cabinets: [HALL.cabinets[2], HALL.cabinets[3]] }, between),
    ).toBe(HALL.cabinets[3]);
    expect(
      cabinetInReach({ ...HALL, cabinets: [HALL.cabinets[3], HALL.cabinets[2]] }, between),
    ).toBe(HALL.cabinets[3]);
  });
});

describe('press', () => {
  it('dives into a cabinet with a game', () => {
    expect(press(IN_HALL, moon, action)).toEqual({ kind: 'entering', cabinet: moon, t: 0 });
  });
  it('shows OUT OF ORDER at a cabinet without one, even over another notice', () => {
    const notice = { kind: 'notice', cabinet: dud, left: NOTICE_SECONDS } as const;
    expect(press(IN_HALL, dud, action)).toEqual(notice);
    expect(press({ ...notice, left: 0.1 }, dud, action)).toEqual(notice);
  });
  it('ignores action away from cabinets, and without a press', () => {
    expect(press(IN_HALL, null, action)).toBe(IN_HALL);
    expect(press(IN_HALL, moon, none)).toBe(IN_HALL);
    expect(press(IN_HALL, moon, back)).toBe(IN_HALL);
  });
  it('ignores action while diving or playing', () => {
    const entering: Session = { kind: 'entering', cabinet: moon, t: 0.5 };
    expect(press(entering, moon, action)).toBe(entering);
    const playing: Session = { kind: 'playing', cabinet: moon };
    expect(press(playing, moon, action)).toBe(playing);
  });
  it('leaves a game on back', () => {
    expect(press({ kind: 'playing', cabinet: moon }, null, back)).toEqual({
      kind: 'leaving',
      cabinet: moon,
      t: 0,
    });
  });
});

describe('leave', () => {
  it('only leaves a game being played', () => {
    expect(leave({ kind: 'playing', cabinet: moon })).toEqual({
      kind: 'leaving',
      cabinet: moon,
      t: 0,
    });
    const entering: Session = { kind: 'entering', cabinet: moon, t: 0.2 };
    expect(leave(entering)).toBe(entering);
  });
});

describe('advance', () => {
  it('counts the notice down, then returns to the hall', () => {
    const notice: Session = { kind: 'notice', cabinet: dud, left: 1 };
    expect(advance(notice, 0.4)).toEqual({ ...notice, left: 0.6 });
    expect(advance(notice, 1)).toBe(IN_HALL);
  });
  it('dives in over DIVE_SECONDS, then plays', () => {
    const entering: Session = { kind: 'entering', cabinet: moon, t: 0 };
    expect(advance(entering, DIVE_SECONDS / 2)).toEqual({ ...entering, t: 0.5 });
    expect(advance(entering, DIVE_SECONDS)).toEqual({ kind: 'playing', cabinet: moon });
  });
  it('comes back out over DIVE_SECONDS, then walks', () => {
    const leaving: Session = { kind: 'leaving', cabinet: moon, t: 0 };
    expect(advance(leaving, DIVE_SECONDS / 4)).toEqual({ ...leaving, t: 0.25 });
    expect(advance(leaving, DIVE_SECONDS)).toBe(IN_HALL);
  });
  it('leaves the hall and a game in play as they are', () => {
    expect(advance(IN_HALL, 1)).toBe(IN_HALL);
    const playing: Session = { kind: 'playing', cabinet: moon };
    expect(advance(playing, 1)).toBe(playing);
  });
});

describe('canWalk', () => {
  it('walks in the hall and past a notice, not while diving or playing', () => {
    expect(canWalk(IN_HALL)).toBe(true);
    expect(canWalk({ kind: 'notice', cabinet: dud, left: 1 })).toBe(true);
    expect(canWalk({ kind: 'entering', cabinet: moon, t: 0 })).toBe(false);
    expect(canWalk({ kind: 'playing', cabinet: moon })).toBe(false);
    expect(canWalk({ kind: 'leaving', cabinet: moon, t: 0 })).toBe(false);
  });
});

describe('ease and dive', () => {
  it('eases in and out, clamped to 0..1', () => {
    expect(ease(-1)).toBe(0);
    expect(ease(0)).toBe(0);
    expect(ease(0.25)).toBeCloseTo(0.15625);
    expect(ease(0.5)).toBe(0.5);
    expect(ease(1)).toBe(1);
    expect(ease(2)).toBe(1);
  });
  it('follows the session into the screen and back', () => {
    expect(dive(IN_HALL)).toBe(0);
    expect(dive({ kind: 'notice', cabinet: dud, left: 1 })).toBe(0);
    expect(dive({ kind: 'entering', cabinet: moon, t: 0.25 })).toBeCloseTo(0.15625);
    expect(dive({ kind: 'playing', cabinet: moon })).toBe(1);
    expect(dive({ kind: 'leaving', cabinet: moon, t: 0.25 })).toBeCloseTo(0.84375);
  });
});

describe('handover', () => {
  const playing: Session = { kind: 'playing', cabinet: moon };
  it('starts the game as the dive ends and stops it as the player leaves', () => {
    expect(handover({ kind: 'entering', cabinet: moon, t: 0.9 }, playing)).toEqual({ start: moon });
    expect(handover(playing, { kind: 'leaving', cabinet: moon, t: 0 })).toEqual({ stop: moon });
  });
  it('does nothing otherwise', () => {
    expect(handover(playing, playing)).toBeNull();
    expect(handover(IN_HALL, IN_HALL)).toBeNull();
  });
});

describe('prompt', () => {
  it('invites play at a game, names a dud, and says OUT OF ORDER', () => {
    expect(prompt(IN_HALL, moon)).toBe('PLAY MOON PATROL 3D — E / A');
    expect(prompt(IN_HALL, moon, 'HI 900 GIO')).toBe('PLAY MOON PATROL 3D — HI 900 GIO — E / A');
    expect(prompt(IN_HALL, dud, 'HI 900 GIO')).toBe(`${dud.title} — E / A`);
    expect(prompt(IN_HALL, dud)).toBe(`${dud.title} — E / A`);
    expect(prompt({ kind: 'notice', cabinet: dud, left: 1 }, null)).toBe(
      `${dud.title} — OUT OF ORDER`,
    );
  });
  it('is silent away from cabinets and outside the hall', () => {
    expect(prompt(IN_HALL, null)).toBeNull();
    expect(prompt({ kind: 'playing', cabinet: moon }, moon)).toBeNull();
  });
});

describe('cameraShot', () => {
  const focus = { x: 2, z: 4 };
  const screen = { x: 6, y: 1.5, z: 8 };
  it('follows the avatar in the hall', () => {
    expect(cameraShot(focus, null, 0.5)).toEqual({ target: focus, zoom: 1, lift: 0 });
    expect(cameraShot(focus, screen, 0)).toEqual({ target: focus, zoom: 1, lift: 0 });
  });
  it('blends into the screen, zooming and lifting', () => {
    expect(cameraShot(focus, screen, 0.5)).toEqual({ target: { x: 4, z: 6 }, zoom: 4, lift: 0.75 });
    expect(cameraShot(focus, screen, 1)).toEqual({ target: { x: 6, z: 8 }, zoom: 7, lift: 1.5 });
  });
});

describe('veil', () => {
  it('darkens over the last 40% of the dive', () => {
    expect(veil(0)).toBe(0);
    expect(veil(0.6)).toBe(0);
    expect(veil(0.8)).toBeCloseTo(0.5);
    expect(veil(1)).toBe(1);
  });
});
