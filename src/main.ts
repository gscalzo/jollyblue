/** The hall's entry point: build the room and its cabinets, then run the loop. */
import './styles.css';
import { HALL } from './core/hall';
import { buildCabinet } from './render/cabinet';
import { buildRoom } from './render/room';
import { createStage } from './render/stage';

const root = document.getElementById('root');
if (root) {
  const stage = createStage(root);
  stage.scene.add(buildRoom(HALL));
  const cabinets = HALL.cabinets.map(buildCabinet);
  for (const view of cabinets) stage.scene.add(view.group);

  const center = { x: HALL.width / 2, z: HALL.depth / 2 };
  const loop = (ms: number) => {
    const t = ms / 1000;
    for (const view of cabinets) view.tick(t);
    stage.frame(center, 1);
    stage.render();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
