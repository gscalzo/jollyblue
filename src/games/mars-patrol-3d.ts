/**
 * Mars Patrol 3D — the stub (ADR-0005). The real game is designed later;
 * this proves the contract end to end: it mounts on its own canvas, reads
 * the shared input, sends a test score on Action, and is unmounted by Back.
 */
import type { Game, GameEvents, InputSource } from '../core/game';
import { IDLE, presses } from '../core/input';
import { INK, TYPE } from '../palette';

const W = 240;
const H = 135;

function paint(ctx: CanvasRenderingContext2D, t: number, line: string): void {
  ctx.fillStyle = INK.screenBlack;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) {
    const x = (W - ((i * 37 + t * (8 + (i % 3) * 10)) % W) + W) % W;
    ctx.fillStyle = i % 5 === 0 ? INK.cyan : INK.white;
    ctx.fillRect(Math.floor(x), (i * 23) % 90, 1, 1);
  }
  ctx.fillStyle = INK.dim;
  ctx.fillRect(0, 110, W, 25);
  ctx.fillStyle = INK.amber;
  ctx.fillRect(40, 100 + Math.round(Math.sin(t * 6) * 2), 18, 6);
  ctx.textAlign = 'center';
  ctx.font = TYPE.marquee;
  ctx.fillStyle = INK.pink;
  ctx.fillText('MARS PATROL 3D', W / 2, 30);
  ctx.font = TYPE.screen;
  ctx.fillStyle = INK.white;
  ctx.fillText('COMING SOON', W / 2, 48);
  ctx.fillStyle = INK.phosphor;
  ctx.fillText(line, W / 2, 68);
  ctx.fillStyle = INK.dim;
  ctx.fillText('ESC / B  BACK TO THE HALL', W / 2, 80);
}

export default function createGame(): Game {
  let frame = 0;
  return {
    mount(canvas: HTMLCanvasElement, input: InputSource, events: GameEvents) {
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      let previous = IDLE;
      let line = 'ACTION  SEND A TEST SCORE';
      const loop = (ms: number) => {
        const intent = input.read();
        if (presses(previous, intent).action) {
          const points = 10 * Math.floor(100 + Math.random() * 9900);
          events.score(points);
          line = `SENT ${points}`;
        }
        previous = intent;
        paint(ctx, ms / 1000, line);
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
    },
    unmount() {
      cancelAnimationFrame(frame);
    },
  };
}
