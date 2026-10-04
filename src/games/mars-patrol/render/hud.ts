/**
 * Paints the core's HUD (ADR-0018) on a 2D canvas at full resolution, drawn
 * over the scene as a texture. It repaints only when what it says changes.
 */
import * as THREE from 'three';
import { MARS_FONT, MARS_INK } from '../../../palette';
import type { Hud, Notice } from '../core/hud';

export interface HudLayer {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  paint(hud: Hud, notice: Notice | null, blink: boolean): void;
  resize(width: number, height: number): void;
  dispose(): void;
}

function font(px: number, weight = 700): string {
  return `${weight} ${Math.round(px)}px ${MARS_FONT}`;
}

function text(ctx: CanvasRenderingContext2D, line: string, x: number, y: number, glow = 0): void {
  ctx.shadowBlur = glow;
  ctx.fillText(line, x, y);
  ctx.shadowBlur = 0;
}

function corners(ctx: CanvasRenderingContext2D, hud: Hud, u: number, w: number): void {
  ctx.textAlign = 'left';
  ctx.fillStyle = MARS_INK.dim;
  ctx.font = font(2.2 * u, 600);
  text(ctx, 'SCORE', 3 * u, 5 * u);
  ctx.fillStyle = MARS_INK.text;
  ctx.font = font(4.6 * u, 800);
  text(ctx, hud.score, 3 * u, 10 * u, u);
  if (hud.hi !== null) {
    ctx.fillStyle = MARS_INK.dim;
    ctx.font = font(2.2 * u, 600);
    text(ctx, `HI ${hud.hi}`, 3 * u, 13.5 * u);
  }
  ctx.fillStyle = MARS_INK.accent;
  for (let i = 0; i < hud.lives; i++) {
    const x = w - 3 * u - (i + 1) * 4.2 * u;
    ctx.beginPath();
    ctx.roundRect(x, 5.2 * u, 3.4 * u, 1.4 * u, 0.5 * u);
    ctx.roundRect(x + 0.6 * u, 4.2 * u, 1.6 * u, 1.2 * u, 0.4 * u);
    for (const dx of [0.6, 1.7, 2.8]) ctx.arc(x + dx * u, 7 * u, 0.55 * u, 0, Math.PI * 2);
    ctx.fill();
  }
}

function progress(ctx: CanvasRenderingContext2D, hud: Hud, u: number, w: number): void {
  const left = w / 2 - 22 * u;
  const width = 44 * u;
  const y = 6 * u;
  ctx.fillStyle = MARS_INK.dim;
  ctx.fillRect(left, y - 0.15 * u, width, 0.3 * u);
  ctx.fillStyle = MARS_INK.warm;
  ctx.fillRect(left, y - 0.15 * u, width * hud.progress, 0.3 * u);
  ctx.textAlign = 'center';
  ctx.font = font(2.2 * u, 800);
  hud.letters.forEach((letter, i) => {
    const x = left + (width * i) / (hud.letters.length - 1);
    ctx.fillStyle = i <= hud.reached ? MARS_INK.warm : MARS_INK.dim;
    text(ctx, letter, x, y - 1.2 * u, i <= hud.reached ? u : 0);
  });
  ctx.fillStyle = MARS_INK.accent;
  ctx.beginPath();
  ctx.arc(left + width * hud.progress, y, 0.8 * u, 0, Math.PI * 2);
  ctx.fill();
}

interface Frame {
  u: number;
  w: number;
  h: number;
}

function words(
  ctx: CanvasRenderingContext2D,
  hud: Hud,
  notice: Notice | null,
  blink: boolean,
  f: Frame,
): void {
  const { u, w, h } = f;
  ctx.textAlign = 'center';
  if (hud.banner !== null) {
    ctx.fillStyle = MARS_INK.text;
    ctx.font = font(9 * u, 900);
    text(ctx, hud.banner, w / 2, h * 0.36, 3 * u);
  }
  if (hud.detail !== null) {
    ctx.fillStyle = MARS_INK.warm;
    ctx.font = font(3.4 * u, 700);
    text(ctx, hud.detail, w / 2, h * 0.36 + 6 * u, u);
  }
  if (hud.prompt !== null && blink) {
    ctx.fillStyle = MARS_INK.accent;
    ctx.font = font(2.8 * u, 700);
    text(ctx, hud.prompt, w / 2, h * 0.78, u);
  }
  if (notice !== null) {
    ctx.fillStyle = MARS_INK.warm;
    ctx.font = font(3.2 * u, 800);
    text(ctx, notice.text, w / 2, h * 0.24, 1.5 * u);
  }
}

export function createHudLayer(): HudLayer {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
  const sprite = new THREE.Sprite(material);
  const scene = new THREE.Scene();
  scene.add(sprite);
  const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 2);
  camera.position.z = 1;
  let painted = '';
  return {
    scene,
    camera,
    paint(hud, notice, blink) {
      const key = JSON.stringify([hud, notice?.text ?? null, blink, canvas.width, canvas.height]);
      if (!ctx || key === painted) return;
      painted = key;
      const { width: w, height: h } = canvas;
      const u = h / 100;
      ctx.clearRect(0, 0, w, h);
      ctx.shadowColor = MARS_INK.glow;
      corners(ctx, hud, u, w);
      progress(ctx, hud, u, w);
      words(ctx, hud, notice, blink, { u, w, h });
      texture.needsUpdate = true;
    },
    resize(width, height) {
      canvas.width = width;
      canvas.height = height;
      painted = '';
    },
    dispose() {
      texture.dispose();
      material.dispose();
    },
  };
}
