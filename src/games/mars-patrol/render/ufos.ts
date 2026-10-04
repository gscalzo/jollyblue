/**
 * The sky's things (ADR-0018): saucers from the model seam, their bombs, and
 * each bomb's shadow on the road, growing darker and wider as it falls —
 * the warning ADR-0017 promises. Posed from the core's skies.
 */
import * as THREE from 'three';
import { MARS } from '../../../palette';
import type { Screen } from '../core/flow';
import type { Bomb } from '../core/ufo';
import { UFO } from '../core/tuning';
import { buildBomb, buildUfo } from './models';
import type { UfoModel } from './models';

const UFOS = 6;
const BOMBS = 16;

export interface Ufos {
  group: THREE.Group;
  update(screen: Screen, t: number): void;
}

function shadow(): THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial> {
  const material = new THREE.MeshBasicMaterial({
    color: MARS.shadow,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 24), material);
  disc.rotation.x = -Math.PI / 2;
  disc.renderOrder = 1;
  return disc;
}

function poseBomb(
  model: THREE.Group,
  disc: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>,
  bomb: Bomb | undefined,
): void {
  model.visible = Boolean(bomb);
  disc.visible = Boolean(bomb);
  if (!bomb) return;
  model.position.set(bomb.x, bomb.y, 0);
  const near = 1 - Math.min(1, bomb.y / UFO.hoverY);
  disc.position.set(bomb.x, 0.04, 0);
  disc.scale.setScalar(0.6 + near * 0.9);
  disc.material.opacity = 0.35 + near * 0.55;
}

export function buildUfos(): Ufos {
  const group = new THREE.Group();
  const saucers: UfoModel[] = Array.from({ length: UFOS }, buildUfo);
  const bombs = Array.from({ length: BOMBS }, buildBomb);
  const shadows = Array.from({ length: BOMBS }, shadow);
  for (const s of saucers) s.root.visible = false;
  group.add(...saucers.map((s) => s.root), ...bombs, ...shadows);
  return {
    group,
    update(screen, t) {
      const skies = screen.kind === 'title' ? null : screen.run.skies;
      saucers.forEach((model, i) => {
        const ufo = skies?.ufos[i];
        model.root.visible = Boolean(ufo);
        if (!ufo) return;
        model.root.position.set(ufo.x, ufo.y, ufo.z);
        model.root.rotation.z = Math.sin(t * 1.7 + i) * 0.12;
        model.rim.rotation.y = t * 3;
      });
      bombs.forEach((model, i) => poseBomb(model, shadows[i], skies?.bombs[i]));
    },
  };
}
