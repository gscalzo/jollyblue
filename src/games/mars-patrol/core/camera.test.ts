import { describe, expect, it } from 'vitest';
import { framing, LEAD, LEAD_PER_SPEED, lead } from './camera';
import type { Course } from './course';
import { newRun } from './run';
import { DRIVE } from './tuning';

const COURSE: Course = {
  checkpoints: [{ letter: 'A', x: 0, par: 0 }],
  craters: [],
  rocks: [],
  ufos: [],
};

describe('the camera', () => {
  it('looks less far ahead as the buggy speeds up', () => {
    expect(lead(DRIVE.cruise)).toBe(LEAD);
    expect(lead(DRIVE.cruise + 2)).toBeCloseTo(LEAD - 2 * LEAD_PER_SPEED);
  });

  it('turns slowly round the idling buggy on the title', () => {
    expect(framing({ kind: 'title', t: 0 })).toEqual({ focus: 0, yaw: 0.55, distance: 9 });
    expect(framing({ kind: 'title', t: 2 }).yaw).toBeCloseTo(0.55 + 0.25 * Math.sin(0.5));
  });

  it('frames a run side-on, ahead of the buggy', () => {
    const run = newRun(COURSE);
    const fast = { ...run, buggy: { ...run.buggy, x: 40, speed: DRIVE.cruise + 1 } };
    expect(framing({ kind: 'playing', run: fast })).toEqual({
      focus: 40 + lead(DRIVE.cruise + 1),
      yaw: 0,
      distance: 30,
    });
    expect(framing({ kind: 'results', run: fast, t: 0 }).focus).toBe(40 + lead(DRIVE.cruise + 1));
  });
});
