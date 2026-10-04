import { describe, expect, it } from 'vitest';
import { isGameId, MAX_SCORE, parseNewScore } from './scores';

describe('isGameId', () => {
  it('accepts short kebab-case slugs', () => {
    expect(isGameId('moon-patrol-3d')).toBe(true);
    expect(isGameId('a')).toBe(true);
    expect(isGameId('a'.repeat(32))).toBe(true);
  });
  it('rejects anything else', () => {
    expect(isGameId('')).toBe(false);
    expect(isGameId('a'.repeat(33))).toBe(false);
    expect(isGameId('Moon')).toBe(false);
    expect(isGameId('-moon')).toBe(false);
    expect(isGameId('moon-')).toBe(false);
    expect(isGameId('moon--patrol')).toBe(false);
    expect(isGameId('moon patrol')).toBe(false);
    expect(isGameId('x/moon')).toBe(false);
    expect(isGameId('moon/x')).toBe(false);
  });
});

describe('parseNewScore', () => {
  it('accepts three capitals and a whole score in range', () => {
    expect(parseNewScore({ initials: 'GIO', score: 0 })).toEqual({ initials: 'GIO', score: 0 });
    expect(parseNewScore({ initials: 'AAA', score: MAX_SCORE, extra: 1 })).toEqual({
      initials: 'AAA',
      score: MAX_SCORE,
    });
  });
  it('rejects a body that is not an object', () => {
    expect(parseNewScore(null)).toBe('body must be an object');
    expect(parseNewScore('GIO')).toBe('body must be an object');
  });
  it('rejects bad initials', () => {
    const bad = 'initials must be three capital letters';
    expect(parseNewScore({ score: 1 })).toBe(bad);
    expect(parseNewScore({ initials: 'gio', score: 1 })).toBe(bad);
    expect(parseNewScore({ initials: 'GI', score: 1 })).toBe(bad);
    expect(parseNewScore({ initials: 'GIOS', score: 1 })).toBe(bad);
    expect(parseNewScore({ initials: 'XGIO', score: 1 })).toBe(bad);
    expect(parseNewScore({ initials: ['GIO'], score: 1 })).toBe(bad);
  });
  it('rejects bad scores', () => {
    const bad = `score must be a whole number from 0 to ${MAX_SCORE}`;
    expect(parseNewScore({ initials: 'GIO' })).toBe(bad);
    expect(parseNewScore({ initials: 'GIO', score: '10' })).toBe(bad);
    expect(parseNewScore({ initials: 'GIO', score: 1.5 })).toBe(bad);
    expect(parseNewScore({ initials: 'GIO', score: -1 })).toBe(bad);
    expect(parseNewScore({ initials: 'GIO', score: MAX_SCORE + 1 })).toBe(bad);
  });
});
