import { describe, expect, it } from 'vitest';
import { checkpointBonus, clearBonus, pay } from './scoring';
import { POINTS, RULES } from './tuning';

describe('pay', () => {
  const purse = { score: 0, lives: 3, extras: 0 };
  const [first, second] = RULES.extraLives;

  it('adds points and gives each extra life once, at its threshold', () => {
    expect(pay(purse, 50)).toEqual({ purse: { score: 50, lives: 3, extras: 0 }, earned: 0 });
    expect(pay(purse, first - 1).earned).toBe(0);
    expect(pay(purse, first)).toEqual({
      purse: { score: first, lives: 4, extras: 1 },
      earned: 1,
    });
    const after = pay(purse, first).purse;
    expect(pay(after, 10)).toEqual({
      purse: { score: first + 10, lives: 4, extras: 1 },
      earned: 0,
    });
  });

  it('gives two at once when one payment crosses both', () => {
    expect(pay(purse, second)).toEqual({
      purse: { score: second, lives: 5, extras: 2 },
      earned: 2,
    });
  });

  it('never takes a life back for a purse that already had more extras', () => {
    expect(pay({ score: 0, lives: 3, extras: 2 }, 10).purse.lives).toBe(3);
  });
});

describe('bonuses', () => {
  it('pays a checkpoint its base plus whole seconds under par', () => {
    expect(checkpointBonus(35, 30.5)).toBe(POINTS.checkpoint + 4 * POINTS.perSecondUnderPar);
    expect(checkpointBonus(35, 35)).toBe(POINTS.checkpoint);
    expect(checkpointBonus(35, 40)).toBe(POINTS.checkpoint);
  });

  it('pays the clear its base plus each life left', () => {
    expect(clearBonus(2)).toBe(POINTS.clear + 2 * POINTS.perLife);
  });
});
