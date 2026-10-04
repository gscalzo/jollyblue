/**
 * The generated pixel art (ADR-0011): PNGs in public/art, loaded as textures
 * with hard pixels. A texture that fails to load leaves the code-drawn
 * stand-in in place.
 */
import * as THREE from 'three';
import { SCENE } from '../palette';

const loader = new THREE.TextureLoader();

/** Loads `/art/<id>.png` and hands the texture over once it has arrived. */
export function loadArt(id: string, use: (texture: THREE.Texture) => void): void {
  loader.load(`/art/${id}.png`, (texture) => {
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    use(texture);
  });
}

/** Swaps a material's map for the art once it loads, dropping any tint. */
export function dressWith(
  material: THREE.MeshBasicMaterial | THREE.MeshToonMaterial,
  id: string,
): void {
  loadArt(id, (texture) => {
    material.map = texture;
    material.color.set(SCENE.untinted);
    material.needsUpdate = true;
  });
}
