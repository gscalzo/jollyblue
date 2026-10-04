import { describe, expect, it } from 'vitest';
import { GLYPH_H, GLYPH_W, pixelsOf, textWidth } from './pixelfont';

describe('textWidth', () => {
  it('is four pixels a glyph, less the trailing gap', () => {
    expect(textWidth('')).toBe(0);
    expect(textWidth('A')).toBe(GLYPH_W);
    expect(textWidth('GIO')).toBe(11);
  });
});

describe('pixelsOf', () => {
  it('lights a glyph row by row, top first', () => {
    expect(pixelsOf('-')).toEqual([
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ]);
    expect(pixelsOf('.')).toEqual([{ x: 1, y: 4 }]);
  });
  it('advances four pixels per glyph and upper-cases', () => {
    expect(pixelsOf('a.')).toEqual([...pixelsOf('A'), { x: 5, y: 4 }]);
  });
  it('leaves unknown characters and spaces blank', () => {
    expect(pixelsOf(' ?')).toEqual([]);
  });
  it('fits every glyph in its 3×5 box', () => {
    const all = pixelsOf('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.:');
    expect(all.length).toBeGreaterThan(300);
    for (const p of all) {
      expect(p.x % 4).toBeLessThan(GLYPH_W);
      expect(p.y).toBeLessThan(GLYPH_H);
    }
    expect(pixelsOf('8')).toHaveLength(13);
  });
});
