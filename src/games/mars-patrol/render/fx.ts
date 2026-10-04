/**
 * Particles (ADR-0018): sparks and a fireball when the buggy crashes, dust
 * when it lands. One instanced mesh; each particle flies, falls and fades.
 */
import * as THREE from 'three';
import { MARS } from '../../../palette';

const MAX = 600;
const GRAVITY = 9;

interface Particle {
  at: THREE.Vector3;
  v: THREE.Vector3;
  life: number;
  max: number;
  size: number;
  colour: THREE.Color;
}

type Burst = 'crash' | 'dust';

export interface Fx {
  group: THREE.Group;
  burst(kind: Burst, x: number, y: number): void;
  update(dt: number): void;
}

const RECIPES: Record<
  Burst,
  { count: number; speed: number; up: number; life: number; size: number; colours: number[] }
> = {
  crash: {
    count: 140,
    speed: 9,
    up: 7,
    life: 1.4,
    size: 0.16,
    colours: [MARS.fire, MARS.spark, MARS.smoke],
  },
  dust: {
    count: 26,
    speed: 2.2,
    up: 1.6,
    life: 0.7,
    size: 0.12,
    colours: [MARS.dustLight, MARS.dust],
  },
};

export function buildFx(): Fx {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: MARS.untinted,
    emissive: MARS.fire,
    emissiveIntensity: 0.6,
  });
  const shards = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, MAX);
  shards.count = 0;
  shards.frustumCulled = false;
  const fireball = new THREE.Mesh(
    new THREE.SphereGeometry(1, 20, 14),
    new THREE.MeshBasicMaterial({ color: MARS.fire, transparent: true, opacity: 0 }),
  );
  group.add(shards, fireball);
  let particles: Particle[] = [];
  let ball = 1;
  const matrix = new THREE.Matrix4();
  const spin = new THREE.Quaternion();

  return {
    group,
    burst(kind, x, y) {
      const r = RECIPES[kind];
      for (let i = 0; i < r.count && particles.length < MAX; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = new THREE.Vector3(
          Math.cos(a) * r.speed * Math.random(),
          r.up * (0.4 + Math.random()),
          Math.sin(a) * r.speed * Math.random(),
        );
        const colour = new THREE.Color(r.colours[i % r.colours.length]);
        particles.push({
          at: new THREE.Vector3(x, y, 0),
          v,
          life: 0,
          max: r.life * (0.5 + Math.random()),
          size: r.size,
          colour,
        });
      }
      if (kind === 'crash') {
        fireball.position.set(x, y + 0.6, 0);
        ball = 0;
      }
    },
    update(dt) {
      particles = particles.filter((p) => p.life < p.max);
      particles.forEach((p, i) => {
        p.life += dt;
        p.v.y -= GRAVITY * dt;
        p.at.addScaledVector(p.v, dt);
        p.at.y = Math.max(0.05, p.at.y);
        const s = p.size * (1 - p.life / p.max);
        spin.setFromAxisAngle(p.v.clone().normalize(), p.life * 8);
        matrix.compose(p.at, spin, new THREE.Vector3(s, s, s));
        shards.setMatrixAt(i, matrix);
        shards.setColorAt(i, p.colour);
      });
      shards.count = particles.length;
      shards.instanceMatrix.needsUpdate = true;
      if (shards.instanceColor) shards.instanceColor.needsUpdate = true;
      ball = Math.min(1, ball + dt * 1.6);
      fireball.scale.setScalar(0.5 + ball * 3.5);
      fireball.material.opacity = (1 - ball) * 0.9;
    },
  };
}
