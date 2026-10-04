import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { SECTION } from '../core/course';
import { stepScreen, TITLE } from '../core/flow';
import type { Screen } from '../core/flow';
import { newRun } from '../core/run';
import { buildStage } from './view';
import { terrainHeight } from './world';

// Building the whole section is slow under Stryker's instrumentation on CI.
describe('the Mars Patrol stage builds (ADR-0012)', { timeout: 30_000 }, () => {
  it('builds the world, the buggy and its six wheels, lit by the sun', () => {
    const stage = buildStage(SECTION);
    expect(stage.buggy.wheels).toHaveLength(6);
    const lights: THREE.Light[] = [];
    stage.world.scene.traverse((o) => {
      if (o instanceof THREE.Light) lights.push(o);
    });
    expect(lights.some((l) => l instanceof THREE.DirectionalLight && l.castShadow)).toBe(true);
  });

  it('poses a title, a run and a crash without throwing', () => {
    const stage = buildStage(SECTION);
    stage.update(TITLE, [], 1 / 60, 0);
    let screen: Screen = { kind: 'playing', run: newRun(SECTION) };
    for (
      let i = 0;
      i < 2000 && screen.kind === 'playing' && screen.run.phase.kind !== 'crashed';
      i++
    ) {
      const next = stepScreen(SECTION, screen, { lever: 1, jump: false, fire: i % 20 === 0 });
      screen = next.screen;
      stage.update(screen, next.events, 1 / 60, i / 60);
    }
    expect(stage.camera.position.z).toBeGreaterThan(5);
    expect(stage.buggy.root.visible).toBe(false);
  });

  it('dips the road where the course has a crater, and nowhere else on the line', () => {
    const crater = SECTION.craters[0];
    if (!crater) throw new Error('the section has craters');
    expect(terrainHeight(SECTION, crater.x + crater.width / 2, 0)).toBeLessThan(-1);
    expect(terrainHeight(SECTION, crater.x - 5, 0)).toBe(0);
  });
});
