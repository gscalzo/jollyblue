/**
 * What stands on the road and flies over it (ADR-0018): the course's rocks,
 * shown while they stand and shrunk once chipped; the bolts; the muzzle
 * flash. Everything is posed from the core's run.
 */
import * as THREE from 'three';
import { MARS } from '../../../palette';
import type { Course } from '../core/course';
import type { GameEvent, Screen } from '../core/flow';
import type { Bolt } from '../core/guns';
import { standing } from '../core/rocks';
import { GUNS, ROCKS } from '../core/tuning';
import { buildRock } from './models';

export interface Props {
  group: THREE.Group;
  update(screen: Screen, events: readonly GameEvent[], dt: number): void;
}

const FLASH = 40;

function boltMesh(material: THREE.Material, upright: boolean): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, upright ? 0.9 : 1.1, 4, 8), material);
  if (!upright) mesh.rotation.z = Math.PI / 2;
  mesh.visible = false;
  return mesh;
}

function showBolt(mesh: THREE.Mesh, bolt: Bolt | undefined | null): void {
  mesh.visible = Boolean(bolt);
  if (bolt) mesh.position.set(bolt.x, bolt.y, 0);
}

export function buildProps(course: Course): Props {
  const group = new THREE.Group();
  const rocks = course.rocks.map((rock, i) => {
    const mesh = buildRock(ROCKS[rock.size].height, 100 + i);
    mesh.position.x = rock.x;
    group.add(mesh);
    return mesh;
  });
  const glow = new THREE.MeshStandardMaterial({
    color: MARS.shot,
    emissive: MARS.shot,
    emissiveIntensity: 5,
  });
  const forward = boltMesh(glow, false);
  const up = Array.from({ length: GUNS.maxUp }, () => boltMesh(glow, true));
  const flash = new THREE.PointLight(MARS.flash, 0, 10, 2);
  group.add(forward, ...up, flash);

  return {
    group,
    update(screen, events, dt) {
      const run = screen.kind === 'title' ? null : screen.run;
      const damage = run?.damage ?? [];
      course.rocks.forEach((rock, i) => {
        const mesh = rocks[i];
        if (!mesh) return;
        mesh.visible = standing(rock, damage, i);
        mesh.scale.setScalar((damage[i] ?? 0) > 0 ? 0.8 : 1);
      });
      showBolt(forward, run?.guns.forward);
      up.forEach((mesh, i) => showBolt(mesh, run?.guns.up[i]));
      const fired = events.some((e) => e.kind === 'fire');
      flash.intensity = fired ? FLASH : flash.intensity * Math.exp(-dt * 18);
      if (run) flash.position.set(run.buggy.x + GUNS.frontX, run.buggy.y + GUNS.frontY + 0.4, 0.6);
    },
  };
}
