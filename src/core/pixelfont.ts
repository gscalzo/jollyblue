/**
 * A 3×5 bitmap font for the cabinet screens: at a few dozen pixels across,
 * canvas text turns to mush, so the high-score table is drawn pixel by pixel.
 * Each glyph is five rows of three bits, top row first.
 */

export const GLYPH_W = 3;
export const GLYPH_H = 5;
/** One blank column between glyphs. */
const ADVANCE = GLYPH_W + 1;

const GLYPHS: Record<string, string> = {
  A: '010 101 111 101 101',
  B: '110 101 110 101 110',
  C: '011 100 100 100 011',
  D: '110 101 101 101 110',
  E: '111 100 110 100 111',
  F: '111 100 110 100 100',
  G: '011 100 101 101 011',
  H: '101 101 111 101 101',
  I: '111 010 010 010 111',
  J: '001 001 001 101 010',
  K: '101 101 110 101 101',
  L: '100 100 100 100 111',
  M: '101 111 111 101 101',
  N: '110 101 101 101 101',
  O: '010 101 101 101 010',
  P: '110 101 110 100 100',
  Q: '010 101 101 110 011',
  R: '110 101 110 101 101',
  S: '011 100 010 001 110',
  T: '111 010 010 010 010',
  U: '101 101 101 101 111',
  V: '101 101 101 101 010',
  W: '101 101 111 111 101',
  X: '101 101 010 101 101',
  Y: '101 101 010 010 010',
  Z: '111 001 010 100 111',
  '0': '111 101 101 101 111',
  '1': '010 110 010 010 111',
  '2': '110 001 010 100 111',
  '3': '110 001 010 001 110',
  '4': '101 101 111 001 001',
  '5': '111 100 110 001 110',
  '6': '011 100 111 101 111',
  '7': '111 001 010 010 010',
  '8': '111 101 111 101 111',
  '9': '111 101 111 001 110',
  '-': '000 000 111 000 000',
  '.': '000 000 000 000 010',
  ':': '000 010 000 010 000',
};

/** Width in pixels of `text` set in the font. */
export function textWidth(text: string): number {
  return text.length === 0 ? 0 : text.length * ADVANCE - 1;
}

/** The lit pixels of `text`, relative to its top-left corner. Unknown characters are blank. */
export function pixelsOf(text: string): { x: number; y: number }[] {
  const lit: { x: number; y: number }[] = [];
  [...text.toUpperCase()].forEach((ch, i) => {
    const rows = (GLYPHS[ch] ?? '').split(' ');
    rows.forEach((row, y) => {
      [...row].forEach((bit, x) => {
        if (bit === '1') lit.push({ x: i * ADVANCE + x, y });
      });
    });
  });
  return lit;
}
