import { describe, expect, it } from 'vitest';
import { bestRun, showsTable, tableLines } from './scoreboard';

const run = (initials: string, score: number) => ({ initials, score, playedAt: 0 });

describe('tableLines', () => {
  it('says so when nobody has played', () => {
    expect(tableLines([])).toEqual(['HI-SCORES', 'NO RUNS YET']);
  });
  it('ranks the top five', () => {
    const scores = [6, 5, 4, 3, 2, 1].map((n) => run('GIO', n * 100));
    expect(tableLines(scores)).toEqual([
      'HI-SCORES',
      '1 GIO 600',
      '2 GIO 500',
      '3 GIO 400',
      '4 GIO 300',
      '5 GIO 200',
    ]);
  });
});

describe('showsTable', () => {
  it('shows the table for the last three seconds of every eight, on game cabinets', () => {
    expect(showsTable(4.9, true)).toBe(false);
    expect(showsTable(5, true)).toBe(true);
    expect(showsTable(7.9, true)).toBe(true);
    expect(showsTable(8, true)).toBe(false);
    expect(showsTable(13.5, true)).toBe(true);
    expect(showsTable(6, false)).toBe(false);
  });
});

describe('bestRun', () => {
  it('names the top run', () => {
    expect(bestRun([run('GIO', 900), run('AAA', 10)])).toBe('HI 900 GIO');
    expect(bestRun([])).toBeNull();
  });
});
