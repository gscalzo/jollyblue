/**
 * The avatar's body (ADR-0004): a small figure in a hoodie made of
 * primitives, posed every frame from the pure walk cycle in core/avatar.
 */
import * as THREE from 'three';
import { poseOf } from '../core/avatar';
import type { Avatar } from '../core/avatar';
import { SCENE } from '../palette';
import { toon } from './materials';

export interface AvatarView {
  group: THREE.Group;
  update(avatar: Avatar): void;
}

function mesh(geometry: THREE.BufferGeometry, color: number, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(geometry, toon(color));
  m.position.set(0, y, z);
  return m;
}

/** A limb hanging from a pivot, so rotating the pivot swings it. */
function limb(
  x: number,
  y: number,
  geometry: THREE.BufferGeometry,
  color: number,
  reach: number,
): THREE.Group {
  const pivot = new THREE.Group();
  pivot.position.set(x, y, 0);
  pivot.add(mesh(geometry, color, -reach));
  return pivot;
}

export function buildAvatar(): AvatarView {
  const group = new THREE.Group();
  const body = new THREE.Group();
  const torso = new THREE.Group();

  const legL = limb(0.09, 0.42, new THREE.CapsuleGeometry(0.065, 0.24, 2, 6), SCENE.trousers, 0.2);
  const legR = limb(-0.09, 0.42, new THREE.CapsuleGeometry(0.065, 0.24, 2, 6), SCENE.trousers, 0.2);
  legL.add(mesh(new THREE.BoxGeometry(0.13, 0.08, 0.2), SCENE.shoes, -0.4, 0.03));
  legR.add(mesh(new THREE.BoxGeometry(0.13, 0.08, 0.2), SCENE.shoes, -0.4, 0.03));

  torso.position.y = 0.42;
  torso.add(mesh(new THREE.CapsuleGeometry(0.19, 0.22, 3, 8), SCENE.hoodie, 0.24));
  torso.add(mesh(new THREE.SphereGeometry(0.2, 10, 8), SCENE.hoodieDark, 0.56, -0.05));
  torso.add(mesh(new THREE.SphereGeometry(0.16, 10, 8), SCENE.skin, 0.6, 0.03));
  const eyes = new THREE.BoxGeometry(0.03, 0.05, 0.02);
  const eyeL = mesh(eyes, SCENE.trousers, 0.62, 0.18);
  eyeL.position.x = 0.06;
  const eyeR = mesh(eyes, SCENE.trousers, 0.62, 0.18);
  eyeR.position.x = -0.06;
  torso.add(eyeL, eyeR);
  const armL = limb(0.24, 0.4, new THREE.CapsuleGeometry(0.055, 0.2, 2, 6), SCENE.hoodie, 0.14);
  const armR = limb(-0.24, 0.4, new THREE.CapsuleGeometry(0.055, 0.2, 2, 6), SCENE.hoodie, 0.14);
  torso.add(armL, armR);

  body.add(legL, legR, torso);
  group.add(body);

  return {
    group,
    update(avatar) {
      const pose = poseOf(avatar);
      group.position.set(avatar.position.x, 0, avatar.position.z);
      group.rotation.y = avatar.heading;
      body.position.y = pose.bob;
      torso.rotation.x = pose.lean;
      legL.rotation.x = pose.legs;
      legR.rotation.x = -pose.legs;
      armL.rotation.x = pose.arms;
      armR.rotation.x = -pose.arms;
    },
  };
}
