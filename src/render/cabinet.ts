/**
 * An arcade cabinet built from boxes (ADR-0004): body, sloped control panel,
 * a glowing screen wearing its attract loop, and a lit marquee. Modelled
 * facing south (+z) and turned to its facing.
 */
import * as THREE from 'three';
import { facingYaw } from '../core/geometry';
import { CABINET_DEPTH, CABINET_WIDTH } from '../core/hall';
import type { Cabinet } from '../core/hall';
import { INK, LIVERIES, SCENE, TYPE } from '../palette';
import { tableLines, showsTable } from '../core/scoreboard';
import type { ScoreEntry } from '../../shared/types';
import { paintAttract, paintTable, SCREEN_H, SCREEN_W } from './attract';
import { dressWith } from './art';
import { glow, pixelCanvas, toon, toonPanel } from './materials';

export interface CabinetView {
  cabinet: Cabinet;
  group: THREE.Group;
  /** Repaints the screen's attract loop. */
  tick(t: number): void;
  /** The game's high scores, cycled through in attract mode. */
  setScores(scores: readonly ScoreEntry[]): void;
  /** Lights the cabinet up when the avatar can play it. */
  setHighlighted(on: boolean): void;
  /** Where the camera dives to when the cabinet's game starts. */
  screenCenter: THREE.Vector3;
}

function part(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  [x, y, z]: [number, number, number],
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  return mesh;
}

function marquee(cabinet: Cabinet): THREE.Mesh {
  const title = cabinet.title;
  const { ctx, texture } = pixelCanvas(96, 24);
  ctx.fillStyle = INK.screenBlack;
  ctx.fillRect(0, 0, 96, 24);
  ctx.font = TYPE.marquee;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = INK.marqueeGlow;
  ctx.fillText(title, 48, 13, 92);
  const material = new THREE.MeshBasicMaterial({ map: texture });
  dressWith(material, `marquee-${cabinet.id}`);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(CABINET_WIDTH * 0.96, 0.26), material);
  mesh.position.set(0, 2.08, 0.26);
  return mesh;
}

/** The painted side panels, one each side, over the livery. */
function sideArt(cabinet: Cabinet): THREE.Group {
  const group = new THREE.Group();
  // Livery-coloured until the art arrives, then the art untinted.
  const material = toonPanel(LIVERIES[cabinet.livery].body);
  dressWith(material, `side-${cabinet.id}`);
  for (const side of [1, -1]) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(CABINET_DEPTH * 0.8, 1.6), material);
    panel.position.set((side * CABINET_WIDTH) / 2 + side * 0.025, 1.05, -0.02);
    panel.rotation.y = (side * Math.PI) / 2;
    group.add(panel);
  }
  return group;
}

function body(cabinet: Cabinet): THREE.Group {
  const livery = LIVERIES[cabinet.livery];
  const w = CABINET_WIDTH;
  const d = CABINET_DEPTH;
  const group = new THREE.Group();
  group.add(
    part(new THREE.BoxGeometry(w, 1.1, d), toon(livery.body), [0, 0.55, 0]),
    part(new THREE.BoxGeometry(w, 0.85, 0.55), toon(livery.body), [0, 1.52, -0.17]),
    part(new THREE.BoxGeometry(w + 0.04, 0.32, 0.62), toon(livery.trim), [0, 2.08, -0.06]),
    part(new THREE.BoxGeometry(w + 0.02, 0.06, d + 0.02), toon(livery.trim), [0, 1.1, 0]),
    part(new THREE.BoxGeometry(0.04, 1.8, d * 0.9), toon(livery.trim), [w / 2, 1.0, -0.02]),
    part(new THREE.BoxGeometry(0.04, 1.8, d * 0.9), toon(livery.trim), [-w / 2, 1.0, -0.02]),
  );
  const panel = part(new THREE.BoxGeometry(w, 0.1, 0.36), toon(SCENE.wallTrim), [0, 1.16, 0.26]);
  panel.rotation.x = 0.35;
  const stick = part(
    new THREE.CylinderGeometry(0.02, 0.02, 0.14),
    toon(SCENE.shoes),
    [-0.2, 1.27, 0.28],
  );
  const knob = part(
    new THREE.SphereGeometry(0.045, 8, 6),
    glow(SCENE.neonPink),
    [-0.2, 1.35, 0.28],
  );
  const buttonA = part(
    new THREE.CylinderGeometry(0.04, 0.04, 0.04),
    glow(SCENE.neonCyan),
    [0.1, 1.23, 0.27],
  );
  const buttonB = part(
    new THREE.CylinderGeometry(0.04, 0.04, 0.04),
    glow(SCENE.neonAmber),
    [0.24, 1.23, 0.27],
  );
  group.add(panel, stick, knob, buttonA, buttonB);
  return group;
}

/** A cabinet, placed and turned, with its live screen. */
export function buildCabinet(cabinet: Cabinet): CabinetView {
  const group = new THREE.Group();
  group.add(body(cabinet), marquee(cabinet), sideArt(cabinet));

  const screen = pixelCanvas(SCREEN_W, SCREEN_H);
  let table = tableLines([]);
  const screenMesh = part(
    new THREE.PlaneGeometry(0.78, 0.58),
    new THREE.MeshBasicMaterial({ map: screen.texture }),
    [0, 1.55, 0.115],
  );
  screenMesh.rotation.x = -0.12;
  group.add(screenMesh);

  const halo = part(
    new THREE.BoxGeometry(CABINET_WIDTH + 0.12, 0.03, CABINET_DEPTH + 0.12),
    glow(SCENE.highlight),
    [0, 0.015, 0],
  );
  halo.visible = false;
  group.add(halo);

  group.position.set(cabinet.position.x, 0, cabinet.position.z);
  group.rotation.y = facingYaw(cabinet.facing);
  group.updateMatrixWorld(true);
  const screenCenter = screenMesh.getWorldPosition(new THREE.Vector3());

  return {
    cabinet,
    group,
    screenCenter,
    tick(t) {
      if (showsTable(t, cabinet.game !== undefined)) paintTable(screen.ctx, table);
      else paintAttract(screen.ctx, cabinet.attract, t);
      screen.texture.needsUpdate = true;
    },
    setScores(scores) {
      table = tableLines(scores);
    },
    setHighlighted(on) {
      halo.visible = on;
    },
  };
}
