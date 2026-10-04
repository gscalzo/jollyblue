/**
 * The game's picture (ADR-0018): a full-resolution WebGL renderer with
 * filmic tone mapping, soft shadows, room reflections and bloom, the camera
 * the core frames, and the HUD on top. `buildStage` makes the scene alone,
 * so the smoke test can build it without WebGL (ADR-0012).
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MARS_LOOK } from '../../../palette';
import { framing } from '../core/camera';
import { effects } from '../core/effects';
import type { Course } from '../core/course';
import { finish } from '../core/course';
import type { GameEvent, Screen } from '../core/flow';
import type { Hud, Notice } from '../core/hud';
import { buildFx } from './fx';
import type { Fx } from './fx';
import { createHudLayer } from './hud';
import { buildBuggy, WHEEL_RADIUS } from './models';
import type { BuggyModel } from './models';
import { buildProps } from './props';
import { buildUfos } from './ufos';
import { buildWorld } from './world';
import type { World } from './world';

/** How fast the camera catches up with its framing, per second. */
const FOLLOW = { focus: 5, swing: 1.4 };
const LOOK_HEIGHT = 1.4;

export interface Stage {
  world: World;
  buggy: BuggyModel;
  fx: Fx;
  camera: THREE.PerspectiveCamera;
  /** Poses everything for this frame. */
  update(screen: Screen, events: readonly GameEvent[], dt: number, t: number): void;
}

interface Pose {
  x: number;
  y: number;
  vy: number;
  speed: number;
  wrecked: boolean;
}

function pose(screen: Screen): Pose {
  if (screen.kind === 'title') return { x: 0, y: 0, vy: 0, speed: 0, wrecked: false };
  const { buggy, phase } = screen.run;
  return { ...buggy, wrecked: phase.kind === 'crashed' || phase.kind === 'over' };
}

function poseBuggy(model: BuggyModel, p: Pose, t: number): void {
  model.root.visible = !p.wrecked;
  model.root.position.set(p.x, p.y, 0);
  const pitch = Math.max(-0.3, Math.min(0.3, p.vy * 0.035));
  model.body.rotation.z += (pitch - model.body.rotation.z) * 0.25;
  const rumble = p.y > 0 ? 0 : Math.min(1, p.speed / 9) * 0.035;
  model.wheels.forEach((wheel, i) => {
    wheel.rotation.z = -p.x / WHEEL_RADIUS;
    wheel.position.y = WHEEL_RADIUS + rumble * Math.sin(t * 15 + i * 1.7);
  });
  model.body.position.y = rumble * 0.5 * Math.sin(t * 11);
}

function react(fx: Fx, events: readonly GameEvent[], p: Pose): void {
  for (const e of effects(events, p.x)) fx.burst(e.burst, e.x, e.y);
}

export function buildStage(course: Course): Stage {
  const world = buildWorld(course, finish(course));
  const buggy = buildBuggy();
  const fx = buildFx();
  const props = buildProps(course);
  const ufos = buildUfos();
  world.scene.add(buggy.root, fx.group, props.group, ufos.group);
  const camera = new THREE.PerspectiveCamera(MARS_LOOK.fov, 16 / 9, 0.5, 3000);
  const shot = { focus: 0, yaw: 0.5, distance: 9 };
  return {
    world,
    buggy,
    fx,
    camera,
    update(screen, events, dt, t) {
      const p = pose(screen);
      poseBuggy(buggy, p, t);
      react(fx, events, p);
      fx.update(dt);
      props.update(screen, events, dt);
      ufos.update(screen, t);
      world.terrain.reshape(screen.kind === 'title' ? [] : screen.run.skies.holes);
      const want = framing(screen);
      const k = (rate: number) => 1 - Math.exp(-rate * dt);
      shot.focus += (want.focus - shot.focus) * k(FOLLOW.focus);
      shot.yaw += (want.yaw - shot.yaw) * k(FOLLOW.swing);
      shot.distance += (want.distance - shot.distance) * k(FOLLOW.swing);
      const look = new THREE.Vector3(shot.focus, LOOK_HEIGHT, 0);
      const d = shot.distance;
      camera.position.set(
        look.x + Math.sin(shot.yaw) * d,
        LOOK_HEIGHT + 0.6 + d * 0.11,
        Math.cos(shot.yaw) * d,
      );
      camera.lookAt(look);
      world.sky.follow(camera);
      world.lights.follow(shot.focus);
    },
  };
}

export interface View {
  draw(
    screen: Screen,
    events: readonly GameEvent[],
    hud: Hud,
    notice: Notice | null,
    dt: number,
  ): void;
  dispose(): void;
}

function makeRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(MARS_LOOK.maxPixelRatio, window.devicePixelRatio));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = MARS_LOOK.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

export function createView(canvas: HTMLCanvasElement, course: Course): View {
  const renderer = makeRenderer(canvas);
  const stage = buildStage(course);
  const { scene } = stage.world;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = MARS_LOOK.environment;
  const composer = new EffectComposer(renderer);
  const { strength, radius, threshold } = MARS_LOOK.bloom;
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), strength, radius, threshold);
  composer.addPass(new RenderPass(scene, stage.camera));
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const hudLayer = createHudLayer();
  const size = { w: 0, h: 0 };
  let t = 0;

  const fit = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === size.w && h === size.h) return;
    size.w = w;
    size.h = h;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    stage.camera.aspect = w / Math.max(1, h);
    stage.camera.updateProjectionMatrix();
    const ratio = renderer.getPixelRatio();
    hudLayer.resize(Math.round(w * ratio), Math.round(h * ratio));
  };

  return {
    draw(screen, events, hud, notice, dt) {
      t += dt;
      fit();
      stage.update(screen, events, dt, t);
      composer.render(dt);
      hudLayer.paint(hud, notice, Math.floor(t * 2) % 2 === 0);
      renderer.autoClear = false;
      renderer.render(hudLayer.scene, hudLayer.camera);
      renderer.autoClear = true;
    },
    dispose() {
      hudLayer.dispose();
      composer.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
