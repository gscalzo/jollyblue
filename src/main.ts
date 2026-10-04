/**
 * The hall's entry point: build the scene, then each frame read the input,
 * walk the avatar, step the session (ADR-0005) and hand over to a game when
 * the dive ends.
 */
import './styles.css';
import { postScore } from './core/api';
import { spawnAvatar, stepAvatar } from './core/avatar';
import { startGame } from './core/game';
import type { Running } from './core/game';
import { HALL } from './core/hall';
import type { Cabinet } from './core/hall';
import { IDLE, presses } from './core/input';
import { follow, screenToFloor } from './core/iso';
import {
  advance,
  cabinetInReach,
  cameraShot,
  canWalk,
  dive,
  handover,
  IN_HALL,
  leave,
  press,
  prompt,
  veil,
} from './core/session';
import type { Session } from './core/session';
import { listenToDevices } from './devices';
import { GAMES } from './games';
import { buildAvatar } from './render/avatar';
import { buildCabinet } from './render/cabinet';
import { createOverlay } from './render/overlay';
import { buildRoom } from './render/room';
import { createStage } from './render/stage';

/** The longest frame the simulation accepts, so a background tab cannot teleport the avatar. */
const MAX_DT = 0.1;
const CAMERA_RATE = 4;
const AVATAR_HIDES_AT = 0.3;

function run(root: HTMLElement): void {
  const stage = createStage(root);
  const overlay = createOverlay(root);
  stage.scene.add(buildRoom(HALL));
  const cabinets = HALL.cabinets.map(buildCabinet);
  for (const view of cabinets) stage.scene.add(view.group);
  const screenOf = (cabinet: Cabinet) =>
    cabinets.find((v) => v.cabinet === cabinet)?.screenCenter ?? null;
  const body = buildAvatar();
  stage.scene.add(body.group);
  const devices = listenToDevices(window);

  let avatar = spawnAvatar(HALL);
  let focus = avatar.position;
  let session: Session = IN_HALL;
  let previous = IDLE;
  let running: Running | null = null;
  let exitRequested = false;
  let last = performance.now();

  const hand = (before: Session) => {
    const change = handover(before, session);
    if (change && 'start' in change) {
      const game = change.start.game ?? '';
      exitRequested = false;
      running = startGame(
        GAMES,
        game,
        {
          canvas: overlay.gameCanvas,
          input: devices,
          events: {
            score: (points) =>
              void postScore((u, i) => fetch(u, i), game, points).catch(console.error),
            exit: () => (exitRequested = true),
          },
        },
        console.error,
      );
    } else if (change) {
      running?.stop();
      running = null;
    }
  };

  const loop = (ms: number) => {
    const dt = Math.min(MAX_DT, (ms - last) / 1000);
    last = ms;
    const intent = devices.read();
    const near = canWalk(session) ? cabinetInReach(HALL, avatar.position) : null;
    const before = session;
    session = advance(press(session, near, presses(previous, intent)), dt);
    if (exitRequested) session = leave(session);
    previous = intent;
    hand(before);

    if (canWalk(session)) avatar = stepAvatar(HALL, avatar, screenToFloor(intent.move), dt);
    body.update(avatar);
    focus = follow(focus, avatar.position, CAMERA_RATE, dt);
    for (const view of cabinets) {
      view.tick(ms / 1000);
      view.setHighlighted(view.cabinet === near && session.kind === 'hall');
    }

    const k = dive(session);
    // The avatar stands between the camera and the screen; it steps aside as the camera dives.
    body.group.visible = k < AVATAR_HIDES_AT;
    const shot = cameraShot(focus, 'cabinet' in session ? screenOf(session.cabinet) : null, k);
    overlay.setPrompt(prompt(session, near));
    overlay.setVeil(veil(k));
    overlay.showGame(session.kind === 'playing');
    if (session.kind !== 'playing') {
      stage.frame(shot.target, shot.zoom, shot.lift);
      stage.render();
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

const root = document.getElementById('root');
if (root) run(root);
