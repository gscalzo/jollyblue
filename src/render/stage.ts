/**
 * The stage (ADR-0002): a WebGL renderer drawing at a fraction of the
 * window's resolution, stretched back up in hard pixels, and the isometric
 * orthographic camera that frames it.
 */
import * as THREE from 'three';
import type { Vec2 } from '../core/geometry';
import { CAMERA_OFFSET, frustumFor } from '../core/iso';
import { LOOK, SCENE } from '../palette';

export interface Stage {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  /** Points the camera at a spot on the floor, `zoom` 1 being the normal view. */
  frame(target: Vec2, zoom: number, lift?: number): void;
  render(): void;
}

export function createStage(host: HTMLElement): Stage {
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(1);
  renderer.domElement.className = 'stage';
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SCENE.night);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);

  const resize = () => {
    const w = Math.max(1, Math.ceil(host.clientWidth / LOOK.pixelScale));
    const h = Math.max(1, Math.ceil(host.clientHeight / LOOK.pixelScale));
    renderer.setSize(w, h, false);
    const f = frustumFor(w / h, LOOK.viewHeight);
    camera.left = f.left;
    camera.right = f.right;
    camera.top = f.top;
    camera.bottom = f.bottom;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  return {
    renderer,
    scene,
    camera,
    frame(target, zoom, lift = 0) {
      camera.position.set(
        target.x + CAMERA_OFFSET.x,
        lift + CAMERA_OFFSET.y,
        target.z + CAMERA_OFFSET.z,
      );
      camera.lookAt(target.x, lift, target.z);
      if (camera.zoom !== zoom) {
        camera.zoom = zoom;
        camera.updateProjectionMatrix();
      }
    },
    render() {
      renderer.render(scene, camera);
    },
  };
}
