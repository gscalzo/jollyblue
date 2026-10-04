/** The hall's entry point: build the room, the cabinets and the avatar, then run the loop. */
import './styles.css';
import { spawnAvatar, stepAvatar } from './core/avatar';
import { HALL } from './core/hall';
import { follow, screenToFloor } from './core/iso';
import { listenToDevices } from './devices';
import { buildAvatar } from './render/avatar';
import { buildCabinet } from './render/cabinet';
import { buildRoom } from './render/room';
import { createStage } from './render/stage';

/** The longest frame the simulation accepts, so a background tab cannot teleport the avatar. */
const MAX_DT = 0.1;
const CAMERA_RATE = 4;

const root = document.getElementById('root');
if (root) {
  const stage = createStage(root);
  stage.scene.add(buildRoom(HALL));
  const cabinets = HALL.cabinets.map(buildCabinet);
  for (const view of cabinets) stage.scene.add(view.group);
  const body = buildAvatar();
  stage.scene.add(body.group);
  const devices = listenToDevices(window);

  let avatar = spawnAvatar(HALL);
  let focus = avatar.position;
  let last = performance.now();

  const loop = (ms: number) => {
    const dt = Math.min(MAX_DT, (ms - last) / 1000);
    last = ms;
    const intent = devices.read();
    avatar = stepAvatar(HALL, avatar, screenToFloor(intent.move), dt);
    body.update(avatar);
    focus = follow(focus, avatar.position, CAMERA_RATE, dt);
    for (const view of cabinets) view.tick(ms / 1000);
    stage.frame(focus, 1);
    stage.render();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
