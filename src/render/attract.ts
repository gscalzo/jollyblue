/**
 * Attract-mode loops (ADR-0004): what a cabinet's screen shows while nobody
 * plays, painted into a tiny canvas that the screen wears as a texture.
 */
import type { AttractStyle } from '../core/hall';
import { GLYPH_H, pixelsOf } from '../core/pixelfont';
import { INK } from '../palette';

export const SCREEN_W = 64;
export const SCREEN_H = 48;

type Painter = (ctx: CanvasRenderingContext2D, t: number) => void;

function dot(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, size = 1): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
}

const starfield: Painter = (ctx, t) => {
  for (let i = 0; i < 28; i++) {
    const speed = 6 + (i % 4) * 6;
    const x = (SCREEN_W - ((i * 17 + t * speed) % SCREEN_W) + SCREEN_W) % SCREEN_W;
    dot(ctx, i % 4 === 0 ? INK.cyan : INK.white, x, (i * 11) % SCREEN_H);
  }
  dot(ctx, INK.amber, 8, SCREEN_H - 8 + Math.round(Math.sin(t * 4)), 4);
  ctx.fillStyle = INK.dim;
  ctx.fillRect(0, SCREEN_H - 3, SCREEN_W, 3);
};

const bounce: Painter = (ctx, t) => {
  const x = Math.abs(((t * 31) % (2 * (SCREEN_W - 3))) - (SCREEN_W - 3));
  const y = Math.abs(((t * 23) % (2 * (SCREEN_H - 3))) - (SCREEN_H - 3));
  dot(ctx, INK.white, x, y, 3);
  ctx.fillStyle = INK.pink;
  ctx.fillRect(2, Math.min(SCREEN_H - 9, Math.max(0, y - 3)), 2, 9);
  ctx.fillStyle = INK.cyan;
  ctx.fillRect(SCREEN_W - 4, Math.min(SCREEN_H - 9, Math.max(0, y - 4)), 2, 9);
};

const rain: Painter = (ctx, t) => {
  for (let i = 0; i < 16; i++) {
    const x = (i * 3 + (i % 3)) % SCREEN_W;
    const y = (t * (10 + (i % 5) * 5) + i * 9) % (SCREEN_H + 6);
    ctx.fillStyle = INK.phosphor;
    ctx.fillRect(x, Math.floor(y) - 6, 1, 6);
    dot(ctx, INK.white, x, y);
  }
};

const tunnel: Painter = (ctx, t) => {
  for (let i = 0; i < 6; i++) {
    const k = ((i + t * 1.5) % 6) / 6;
    const w = Math.max(2, Math.floor(k * SCREEN_W));
    const h = Math.max(2, Math.floor(k * SCREEN_H));
    ctx.strokeStyle = i % 2 === 0 ? INK.pink : INK.amber;
    ctx.strokeRect((SCREEN_W - w) / 2 + 0.5, (SCREEN_H - h) / 2 + 0.5, w - 1, h - 1);
  }
};

const invaders: Painter = (ctx, t) => {
  const shift = Math.floor(t * 4) % 8;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 6; col++) {
      const color = row === 0 ? INK.pink : INK.phosphor;
      dot(ctx, color, 4 + col * 7 + shift, 3 + row * 6, 4);
    }
  }
  dot(ctx, INK.cyan, 6 + ((t * 12) % (SCREEN_W - 12)), SCREEN_H - 4, 4);
};

const snake: Painter = (ctx, t) => {
  const head = Math.floor(t * 14);
  for (let i = 0; i < 18; i++) {
    const step = head - i;
    const lap = Math.floor(step / SCREEN_W);
    const x = lap % 2 === 0 ? step % SCREEN_W : SCREEN_W - 1 - (step % SCREEN_W);
    const y = 4 + ((lap * 5) % (SCREEN_H - 8));
    dot(ctx, i === 0 ? INK.amber : INK.phosphor, x, y, 2);
  }
  dot(ctx, INK.pink, 30, 20, 2);
};

const PAINTERS: Record<AttractStyle, Painter> = {
  starfield,
  bounce,
  rain,
  tunnel,
  invaders,
  snake,
};

/** Paints one frame of a loop, `t` seconds in. */
export function paintAttract(ctx: CanvasRenderingContext2D, style: AttractStyle, t: number): void {
  ctx.fillStyle = INK.screenBlack;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  PAINTERS[style](ctx, t);
}

/** Paints the high-score table in the 3×5 font, the heading in pink. */
export function paintTable(ctx: CanvasRenderingContext2D, lines: readonly string[]): void {
  ctx.fillStyle = INK.screenBlack;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  lines.forEach((line, row) => {
    ctx.fillStyle = row === 0 ? INK.pink : INK.phosphor;
    for (const p of pixelsOf(line)) ctx.fillRect(2 + p.x, 3 + row * (GLYPH_H + 2) + p.y, 1, 1);
  });
}
