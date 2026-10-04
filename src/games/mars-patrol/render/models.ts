/**
 * The model seam (ADR-0018): every entity the game shows is built here and
 * handed out as an Object3D with named parts. Today they are primitives with
 * shiny materials; glTF models can replace them without touching anything
 * else. The buggy faces +x, its wheels on y = 0.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { MARS } from '../../../palette';

export const WHEEL_RADIUS = 0.38;
/** Wheel positions along the buggy, front to back. */
const AXLES = [1.05, 0, -1.05];
const TRACK = 0.86;

export interface BuggyModel {
  root: THREE.Group;
  /** Pitches with the jump; the wheels stay outside it. */
  body: THREE.Group;
  wheels: THREE.Object3D[];
  muzzleFront: THREE.Object3D;
  muzzleTop: THREE.Object3D;
}

function physical(color: number, params: THREE.MeshPhysicalMaterialParameters = {}) {
  return new THREE.MeshPhysicalMaterial({ color, ...params });
}

function glow(color: number, intensity = 2.5): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity });
}

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function place<T extends THREE.Object3D>(o: T, x: number, y: number, z: number): T {
  o.position.set(x, y, z);
  return o;
}

const MATERIALS = {
  hull: () => physical(MARS.hull, { metalness: 0.2, roughness: 0.25, clearcoat: 1 }),
  accent: () => physical(MARS.hullAccent, { metalness: 0.4, roughness: 0.2, clearcoat: 1 }),
  chassis: () => physical(MARS.chassis, { metalness: 0.7, roughness: 0.35 }),
  glass: () =>
    physical(MARS.glass, { metalness: 0.1, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0 }),
  tyre: () => physical(MARS.tyre, { roughness: 0.85 }),
  rim: () => physical(MARS.rim, { metalness: 1, roughness: 0.2 }),
  muzzle: () => physical(MARS.muzzle, { metalness: 0.9, roughness: 0.3 }),
};

function wheel(materials: { tyre: THREE.Material; rim: THREE.Material }): THREE.Object3D {
  const group = new THREE.Group();
  const tyre = mesh(
    new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, 0.3, 20),
    materials.tyre,
  );
  tyre.rotation.x = Math.PI / 2;
  const rim = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.32, 12), materials.rim);
  rim.rotation.x = Math.PI / 2;
  const spoke = mesh(new THREE.BoxGeometry(0.36, 0.06, 0.34), materials.rim);
  group.add(tyre, rim, spoke);
  return group;
}

function hull(): THREE.Group {
  const m = { hull: MATERIALS.hull(), accent: MATERIALS.accent(), glass: MATERIALS.glass() };
  const body = new THREE.Group();
  const tub = mesh(new RoundedBoxGeometry(2.7, 0.5, 1.5, 3, 0.12), m.hull);
  const stripe = mesh(new RoundedBoxGeometry(2.72, 0.12, 1.52, 2, 0.05), m.accent);
  const cab = mesh(new RoundedBoxGeometry(1.25, 0.6, 1.3, 3, 0.18), m.hull);
  const windscreen = mesh(new RoundedBoxGeometry(0.5, 0.42, 1.18, 2, 0.1), m.glass);
  const nose = mesh(new RoundedBoxGeometry(0.6, 0.32, 1.3, 2, 0.1), m.accent);
  body.add(
    place(tub, 0, 0.78, 0),
    place(stripe, 0, 0.7, 0),
    place(cab, -0.25, 1.28, 0),
    place(windscreen, 0.28, 1.3, 0),
    place(nose, 1.25, 0.95, 0),
  );
  return body;
}

function lights(body: THREE.Group): void {
  const head = glow(MARS.headlight, 3);
  for (const z of [-0.5, 0.5])
    body.add(place(mesh(new THREE.BoxGeometry(0.06, 0.1, 0.22), head), 1.56, 0.92, z));
  const mast = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 6), MATERIALS.chassis());
  const beacon = mesh(new THREE.SphereGeometry(0.06, 10, 8), glow(MARS.beacon, 4));
  body.add(place(mast, -0.75, 1.95, -0.45), place(beacon, -0.75, 2.42, -0.45));
}

function guns(body: THREE.Group): { front: THREE.Object3D; top: THREE.Object3D } {
  const metal = MATERIALS.muzzle();
  const barrel = mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.6, 10), metal);
  barrel.rotation.z = -Math.PI / 2;
  const turret = mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.18, 14), metal);
  const tube = mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.5, 10), metal);
  body.add(
    place(barrel, 1.55, 0.72, 0),
    place(turret, -0.35, 1.67, 0),
    place(tube, -0.35, 1.95, 0),
  );
  const front = place(new THREE.Object3D(), 1.9, 0.72, 0);
  const top = place(new THREE.Object3D(), -0.35, 2.25, 0);
  body.add(front, top);
  return { front, top };
}

export function buildBuggy(): BuggyModel {
  const root = new THREE.Group();
  const body = hull();
  lights(body);
  const muzzles = guns(body);
  const chassis = mesh(new THREE.BoxGeometry(2.6, 0.12, 1.2), MATERIALS.chassis());
  body.add(place(chassis, 0, 0.45, 0));
  const materials = { tyre: MATERIALS.tyre(), rim: MATERIALS.rim() };
  const wheels = AXLES.flatMap((x) =>
    [-TRACK, TRACK].map((z) => place(wheel(materials), x, WHEEL_RADIUS, z)),
  );
  root.add(body, ...wheels);
  return { root, body, wheels, muzzleFront: muzzles.front, muzzleTop: muzzles.top };
}

/** A boulder: a faceted, rough rock, `size` metres tall. */
export function buildRock(size: number, seed: number): THREE.Mesh {
  const geometry = new THREE.DodecahedronGeometry(size * 0.6, 0);
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i++) {
    const wobble = 0.85 + 0.3 * Math.abs(Math.sin(seed * 12.9898 + i * 78.233));
    position.setXYZ(
      i,
      position.getX(i) * wobble,
      position.getY(i) * wobble,
      position.getZ(i) * wobble,
    );
  }
  geometry.computeVertexNormals();
  const rock = mesh(geometry, physical(MARS.pebble, { roughness: 0.9, flatShading: true }));
  rock.position.y = size * 0.45;
  return rock;
}

export interface UfoModel {
  root: THREE.Group;
  /** Spins under the dome. */
  rim: THREE.Group;
}

/** A saucer: polished hull, glowing dome and a ring of lights. */
export function buildUfo(): UfoModel {
  const root = new THREE.Group();
  const hull = physical(MARS.ufoHull, { metalness: 0.9, roughness: 0.18, clearcoat: 1 });
  const saucer = mesh(new THREE.SphereGeometry(1.6, 32, 12), hull);
  saucer.scale.set(1, 0.28, 1);
  const dome = mesh(
    new THREE.SphereGeometry(0.7, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    physical(MARS.ufoDome, {
      emissive: MARS.ufoDome,
      emissiveIntensity: 1.2,
      roughness: 0.05,
      clearcoat: 1,
    }),
  );
  dome.position.y = 0.25;
  const belly = mesh(new THREE.CylinderGeometry(0.5, 0.7, 0.2, 20), glow(MARS.ufoGlow, 3));
  belly.position.y = -0.38;
  const rim = new THREE.Group();
  const lamp = glow(MARS.ufoGlow, 5);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    rim.add(
      place(
        mesh(new THREE.SphereGeometry(0.09, 8, 6), lamp),
        Math.cos(a) * 1.5,
        0,
        Math.sin(a) * 1.5,
      ),
    );
  }
  root.add(saucer, dome, belly, rim);
  return { root, rim };
}

/** A bomb: a dark shell with a red-hot core. */
export function buildBomb(): THREE.Group {
  const root = new THREE.Group();
  const shell = mesh(
    new THREE.SphereGeometry(0.28, 16, 12),
    physical(MARS.bomb, { metalness: 0.6, roughness: 0.4 }),
  );
  const core = mesh(new THREE.SphereGeometry(0.12, 10, 8), glow(MARS.bombGlow, 6));
  core.position.y = -0.2;
  root.add(shell, core);
  return root;
}
