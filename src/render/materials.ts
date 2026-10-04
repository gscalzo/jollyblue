/** Toon materials (ADR-0002): a few hard light bands, as in A Short Hike. */
import * as THREE from 'three';
import { LOOK } from '../palette';

function toonGradient(): THREE.DataTexture {
  const bands = LOOK.toonBands;
  const data = new Uint8Array(bands.length * 4);
  bands.forEach((v, i) => data.set([v, v, v, 255], i * 4));
  const texture = new THREE.DataTexture(data, bands.length, 1, THREE.RGBAFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

const gradient = toonGradient();
const cache = new Map<number, THREE.MeshToonMaterial>();

/** A shared toon material in one of the palette's colours. */
export function toon(color: number): THREE.MeshToonMaterial {
  let material = cache.get(color);
  if (!material) {
    material = new THREE.MeshToonMaterial({ color, gradientMap: gradient });
    cache.set(color, material);
  }
  return material;
}

/** A toon material painted with a texture (the carpet, side art). */
export function toonTextured(map: THREE.Texture): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({ map, gradientMap: gradient });
}

/** Something that glows on its own: neon tubes, screens, marquees. */
export function glow(color: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color });
}

/** A canvas painted in hard pixels, ready to be a texture. */
export function pixelCanvas(
  width: number,
  height: number,
): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
} {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  ctx.imageSmoothingEnabled = false;
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return { canvas, ctx, texture };
}
