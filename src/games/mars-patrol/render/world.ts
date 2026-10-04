/**
 * Mars (ADR-0018): the road with its craters, the dunes either side, mesas,
 * mountains and domes at real depths for parallax, a dusky sky with the sun
 * and two moons, and the light. The road's height comes from the core's
 * course, so what you see is what you jump.
 */
import * as THREE from 'three';
import { MARS, MARS_LOOK } from '../../../palette';
import { groundHeight } from '../core/course';
import type { Course } from '../core/course';
import { buildRock } from './models';

/** Metres of terrain per chunk, and how far the world runs past the course. */
const CHUNK = 60;
const BEFORE = 120;
const AFTER = 200;
/** Metres between terrain columns along the road. */
const COLUMN = 0.25;
/** Rows across the road, back to front: fine near the road, coarse far away. */
const ROWS = [
  -70, -50, -36, -26, -19, -14, -10, -7, -5.5, -4.5, -3.75, -3, -2.25, -1.5, -0.75, 0, 0.75, 1.5,
  2.25, 3, 3.75, 4.5, 5.5, 7, 9, 12, 16, 21, 27, 34,
];
/** Half the width of a crater across the road, and of the road itself. */
const CRATER_HALF = 3.2;
const ROAD_HALF = 4;

/** Cheap, repeatable noise in 0..1. */
function hash(a: number, b: number): number {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function dunes(x: number, z: number): number {
  const away = Math.min(1, Math.max(0, (Math.abs(z) - ROAD_HALF) / 8));
  const swell = 0.9 * Math.sin(x * 0.045 + z * 0.21) + 0.45 * Math.sin(x * 0.13 - z * 0.37);
  return away * (swell + 0.6);
}

/** How much of a crater's dip reaches `z` across the road. */
function across(z: number): number {
  return Math.max(0, 1 - (z / CRATER_HALF) ** 2);
}

/** The terrain's height: the course's craters across the road, dunes beyond. */
export function terrainHeight(course: Course, x: number, z: number): number {
  return groundHeight(course, x) * across(z) + dunes(x, z);
}

function dustColour(dip: number, x: number, z: number, out: THREE.Color): void {
  const base = out.set(MARS.dust);
  const speck = Math.sin(x * 1.7 + z * 2.3) * Math.sin(x * 0.6 - z * 1.1);
  base.lerp(new THREE.Color(speck > 0 ? MARS.dustLight : MARS.dustDark), Math.abs(speck) * 0.25);
  const depth = Math.min(1, -dip * Math.max(0, 1 - Math.abs(z) / CRATER_HALF));
  base.lerp(new THREE.Color(MARS.craterFloor), depth * 0.8);
}

function chunkGeometry(course: Course, from: number): THREE.BufferGeometry {
  const columns = Math.round(CHUNK / COLUMN) + 1;
  const xs = Array.from({ length: columns }, (_, c) => from + c * COLUMN);
  const dips = xs.map((x) => groundHeight(course, x));
  const positions: number[] = [];
  const colours: number[] = [];
  const colour = new THREE.Color();
  for (const z of ROWS) {
    xs.forEach((x, c) => {
      const dip = dips[c] ?? 0;
      positions.push(x, dip * across(z) + dunes(x, z), z);
      dustColour(dip, x, z, colour);
      colours.push(colour.r, colour.g, colour.b);
    });
  }
  const index: number[] = [];
  for (let r = 0; r < ROWS.length - 1; r++) {
    for (let c = 0; c < columns - 1; c++) {
      const a = r * columns + c;
      const b = a + columns;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

function buildTerrain(course: Course, end: number): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
  for (let from = -BEFORE; from < end + AFTER; from += CHUNK) {
    const chunk = new THREE.Mesh(chunkGeometry(course, from), material);
    chunk.receiveShadow = true;
    group.add(chunk);
  }
  return group;
}

function scatter(end: number): THREE.Group {
  const group = new THREE.Group();
  for (let i = 0; i < 260; i++) {
    const x = -BEFORE + hash(i, 1) * (end + BEFORE + AFTER);
    const z = -(ROAD_HALF + 5 + hash(i, 3) * 30);
    const rock = buildRock(0.25 + hash(i, 4) * 0.9, i);
    rock.position.set(x, rock.position.y + dunes(x, z) - 0.15, z);
    rock.rotation.set(hash(i, 5) * 3, hash(i, 6) * 3, 0);
    group.add(rock);
  }
  return group;
}

function mesa(width: number, height: number, colour: number): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(width * 0.42, width * 0.5, height, 7, 1);
  const material = new THREE.MeshStandardMaterial({
    color: colour,
    roughness: 1,
    flatShading: true,
  });
  const m = new THREE.Mesh(geometry, material);
  m.position.y = height / 2 - 1;
  return m;
}

function backdrop(end: number): THREE.Group {
  const group = new THREE.Group();
  const span = end + BEFORE + AFTER + 600;
  for (let i = 0; i < 70; i++) {
    const m = mesa(10 + hash(i, 7) * 18, 5 + hash(i, 8) * 11, MARS.mesa);
    m.position.x = -BEFORE - 300 + hash(i, 9) * span;
    m.position.z = -110 - hash(i, 10) * 70;
    group.add(m);
  }
  for (let i = 0; i < 40; i++) {
    const height = 22 + hash(i, 11) * 38;
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(height * 1.4, height, 6),
      new THREE.MeshStandardMaterial({ color: MARS.mountain, roughness: 1, flatShading: true }),
    );
    cone.position.set(
      -BEFORE - 600 + hash(i, 12) * (span + 600),
      height / 2 - 4,
      -480 - hash(i, 13) * 150,
    );
    group.add(cone);
  }
  return group;
}

function domes(end: number): THREE.Group {
  const group = new THREE.Group();
  const shell = new THREE.MeshPhysicalMaterial({
    color: MARS.dome,
    metalness: 0.3,
    roughness: 0.15,
    clearcoat: 1,
  });
  const ring = new THREE.MeshStandardMaterial({
    color: MARS.domeGlow,
    emissive: MARS.domeGlow,
    emissiveIntensity: 3,
  });
  for (let i = 0; i < 9; i++) {
    const base = new THREE.Group();
    const r = 2.5 + hash(i, 14) * 3;
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      shell,
    );
    const band = new THREE.Mesh(new THREE.TorusGeometry(r * 1.01, 0.12, 6, 32), ring);
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.3;
    base.add(dome, band);
    base.position.set(i * ((end + AFTER) / 9) + hash(i, 15) * 40, 0, -55 - hash(i, 16) * 25);
    base.position.y = dunes(base.position.x, base.position.z) - 0.5;
    group.add(base);
  }
  return group;
}

interface Sky {
  group: THREE.Group;
  /** Keeps the sky centred on the camera, so it stays infinitely far. */
  follow(camera: THREE.Camera): void;
}

function skyDome(): THREE.Mesh {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      top: { value: new THREE.Color(MARS.skyTop) },
      mid: { value: new THREE.Color(MARS.skyMid) },
      horizon: { value: new THREE.Color(MARS.skyHorizon) },
    },
    vertexShader: `varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y, 0.0, 1.0);
        vec3 c = mix(horizon, mid, smoothstep(0.0, 0.18, h));
        c = mix(c, top, smoothstep(0.15, 0.6, h));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(1400, 32, 16), material);
}

function stars(): THREE.Points {
  const positions: number[] = [];
  for (let i = 0; i < 500; i++) {
    const a = hash(i, 17) * Math.PI * 2;
    const h = 0.25 + hash(i, 18) * 0.75;
    const r = 1300;
    positions.push(
      Math.cos(a) * r * Math.sqrt(1 - h * h),
      h * r,
      Math.sin(a) * r * Math.sqrt(1 - h * h),
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: MARS.star,
    size: 2,
    sizeAttenuation: false,
    fog: false,
  });
  return new THREE.Points(geometry, material);
}

function heavenly(radius: number, colour: number, emissive: number): THREE.Mesh {
  const material = new THREE.MeshStandardMaterial({
    color: colour,
    emissive: colour,
    emissiveIntensity: emissive,
    roughness: 1,
    fog: false,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 16), material);
}

function buildSky(): Sky {
  const group = new THREE.Group();
  const sun = heavenly(40, MARS.sunDisc, 4);
  sun.position.set(-500, 140, -1100);
  const phobos = heavenly(22, MARS.phobos, 0.25);
  phobos.position.set(300, 380, -1100);
  const deimos = heavenly(11, MARS.deimos, 0.25);
  deimos.position.set(-150, 520, -1100);
  group.add(skyDome(), stars(), sun, phobos, deimos);
  return {
    group,
    follow(camera) {
      group.position.copy(camera.position);
    },
  };
}

interface Lights {
  group: THREE.Group;
  /** Keeps the sun's shadow box on the buggy. */
  follow(x: number): void;
}

function buildLights(): Lights {
  const group = new THREE.Group();
  const hemi = new THREE.HemisphereLight(MARS.hemiSky, MARS.hemiGround, 1.1);
  const sun = new THREE.DirectionalLight(MARS.sunLight, 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(MARS_LOOK.shadowMapSize, MARS_LOOK.shadowMapSize);
  const box = sun.shadow.camera;
  box.left = -30;
  box.right = 30;
  box.top = 18;
  box.bottom = -18;
  box.near = 1;
  box.far = 160;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  group.add(hemi, sun, sun.target);
  return {
    group,
    follow(x) {
      sun.position.set(x - 45, 40, 50);
      sun.target.position.set(x, 0, 0);
    },
  };
}

export interface World {
  scene: THREE.Scene;
  sky: Sky;
  lights: Lights;
}

export function buildWorld(course: Course, end: number): World {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(MARS.fog, MARS_LOOK.fogNear, MARS_LOOK.fogFar);
  const terrain = buildTerrain(course, end);
  const sky = buildSky();
  const lights = buildLights();
  scene.add(sky.group, terrain, scatter(end), backdrop(end), domes(end), lights.group);
  return { scene, sky, lights };
}
