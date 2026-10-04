/**
 * The room (ADR-0002, ADR-0004): carpet, the two back walls at full height,
 * the two front walls cut down to skirting so the camera sees in, neon tubes
 * and the lights they throw.
 */
import * as THREE from 'three';
import type { Hall } from '../core/hall';
import { INK, SCENE, TYPE } from '../palette';
import { dressWith, loadArt } from './art';
import { glow, pixelCanvas, toon, toonPanel, toonTextured } from './materials';

const WALL_HEIGHT = 3.2;
const WALL_THICKNESS = 0.2;
const SKIRTING_HEIGHT = 0.35;
const NEON_SIZE = 0.06;

function box(w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

function carpetTexture(hall: Hall): THREE.CanvasTexture {
  const { ctx, texture } = pixelCanvas(32, 32);
  ctx.fillStyle = INK.carpet;
  ctx.fillRect(0, 0, 32, 32);
  const specks = [INK.pink, INK.cyan, INK.amber, INK.white];
  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = specks[i % specks.length];
    ctx.fillRect((i * 13 + (i % 5) * 7) % 32, (i * 7 + (i % 3) * 11) % 32, 1, 1);
  }
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(hall.width / 3, hall.depth / 3);
  return texture;
}

function floor(hall: Hall): THREE.Mesh {
  const material = toonTextured(carpetTexture(hall));
  loadArt('carpet', (art) => {
    art.wrapS = THREE.RepeatWrapping;
    art.wrapT = THREE.RepeatWrapping;
    art.repeat.set(hall.width / 4, hall.depth / 4);
    material.map = art;
    material.color.set(SCENE.carpetTint);
    material.needsUpdate = true;
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(hall.width, hall.depth), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(hall.width / 2, 0, hall.depth / 2);
  return mesh;
}

function walls(hall: Hall): THREE.Group {
  const group = new THREE.Group();
  const { width: w, depth: d } = hall;
  const t = WALL_THICKNESS;
  const north = box(w + t, WALL_HEIGHT, t, toon(SCENE.wall));
  north.position.set(w / 2 - t / 2, WALL_HEIGHT / 2, -t / 2);
  const west = box(t, WALL_HEIGHT, d, toon(SCENE.wall));
  west.position.set(-t / 2, WALL_HEIGHT / 2, d / 2);
  const south = box(w + t, SKIRTING_HEIGHT, t, toon(SCENE.skirting));
  south.position.set(w / 2 - t / 2, SKIRTING_HEIGHT / 2, d + t / 2);
  const east = box(t, SKIRTING_HEIGHT, d + 2 * t, toon(SCENE.skirting));
  east.position.set(w + t / 2, SKIRTING_HEIGHT / 2, d / 2);
  const trimN = box(w + t, 0.12, t + 0.02, toon(SCENE.wallTrim));
  trimN.position.set(w / 2 - t / 2, 0.06, -t / 2);
  const trimW = box(t + 0.02, 0.12, d, toon(SCENE.wallTrim));
  trimW.position.set(-t / 2, 0.06, d / 2);
  group.add(north, west, south, east, trimN, trimW);
  return group;
}

function neonTubes(hall: Hall): THREE.Group {
  const group = new THREE.Group();
  const { width: w, depth: d } = hall;
  const high = WALL_HEIGHT - 0.35;
  const tubes: [THREE.Mesh, number, number, number][] = [
    [box(w, NEON_SIZE, NEON_SIZE, glow(SCENE.neonPink)), w / 2, high, 0.05],
    [box(NEON_SIZE, NEON_SIZE, d, glow(SCENE.neonCyan)), 0.05, high, d / 2],
    [box(w, NEON_SIZE, NEON_SIZE, glow(SCENE.neonCyan)), w / 2, high - 0.2, 0.05],
    [box(NEON_SIZE, NEON_SIZE, d, glow(SCENE.neonPink)), 0.05, high - 0.2, d / 2],
  ];
  for (const [mesh, x, y, z] of tubes) {
    mesh.position.set(x, y, z);
    group.add(mesh);
  }
  return group;
}

/** A JOLLYBLUE sign flat on a back wall; `onWest` turns it to face east. */
function sign(x: number, z: number, onWest: boolean): THREE.Mesh {
  const { ctx, texture } = pixelCanvas(96, 20);
  ctx.fillStyle = INK.screenBlack;
  ctx.fillRect(0, 0, 96, 20);
  ctx.font = TYPE.marquee;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = INK.pink;
  ctx.fillText('JOLLYBLUE', 48, 11);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 0.75),
    new THREE.MeshBasicMaterial({ map: texture }),
  );
  mesh.position.set(x, 2.2, z);
  if (onWest) mesh.rotation.y = Math.PI / 2;
  return mesh;
}

function lights(hall: Hall): THREE.Group {
  const group = new THREE.Group();
  group.add(new THREE.AmbientLight(SCENE.ambient, 0.55));
  const moon = new THREE.DirectionalLight(SCENE.moon, 0.9);
  moon.position.set(hall.width * 0.8, 12, hall.depth * 1.2);
  moon.target.position.set(hall.width / 2, 0, hall.depth / 2);
  group.add(moon, moon.target);
  const glowAt = (color: number, x: number, z: number) => {
    const light = new THREE.PointLight(color, 9, 9, 1.5);
    light.position.set(x, 2.6, z);
    group.add(light);
  };
  glowAt(SCENE.neonPink, hall.width * 0.3, 0.8);
  glowAt(SCENE.neonCyan, 0.8, hall.depth * 0.6);
  glowAt(SCENE.neonAmber, hall.width * 0.65, hall.depth * 0.55);
  return group;
}

/** Posters on the back walls: [art id, x, z, facing east (on the west wall)]. */
const POSTERS: [string, number, number, boolean][] = [
  ['poster-high-score', 1.4, 0.02, false],
  ['poster-insert-coin', 15.4, 0.02, false],
  ['poster-game-over', 0.02, 10, true],
];

function posters(): THREE.Group {
  const group = new THREE.Group();
  for (const [id, x, z, onWest] of POSTERS) {
    const material = toonPanel(SCENE.wallTrim);
    dressWith(material, id);
    const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.2), material);
    poster.position.set(x, 1.7, z);
    if (onWest) poster.rotation.y = Math.PI / 2;
    group.add(poster);
  }
  return group;
}

/** Everything that does not move: the room and its lights. */
export function buildRoom(hall: Hall): THREE.Group {
  const room = new THREE.Group();
  room.add(floor(hall), walls(hall), neonTubes(hall), posters(), lights(hall));
  // One sign over the far end of the north wall, one in the top corner where you start.
  room.add(sign(hall.width - 3, 0.02, false), sign(0.02, 1.85, true));
  return room;
}
