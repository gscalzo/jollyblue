/**
 * The hall's entry point: build the scene, then each frame read the input,
 * step the session (ADR-0005), walk the avatar, and draw and play it all.
 */
import './styles.css';
import { footfall, spawnAvatar, stepAvatar } from './core/avatar';
import { HALL } from './core/hall';
import type { Cabinet } from './core/hall';
import { IDLE, presses } from './core/input';
import type { Intent } from './core/input';
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
import { createGameSlot } from './game-slot';
import { buildAvatar } from './render/avatar';
import { buildCabinet } from './render/cabinet';
import { createOverlay } from './render/overlay';
import { buildRoom } from './render/room';
import { createStage } from './render/stage';
import { createScoreBook } from './scorebook';
import { createSound } from './sound';

/** The longest frame the simulation accepts, so a background tab cannot teleport the avatar. */
const MAX_DT = 0.1;
const CAMERA_RATE = 4;
/** The avatar stands between the camera and the screen; it steps aside this far into the dive. */
const AVATAR_HIDES_AT = 0.3;

function buildScene(root: HTMLElement) {
  const stage = createStage(root);
  const overlay = createOverlay(root);
  stage.scene.add(buildRoom(HALL));
  const cabinets = HALL.cabinets.map(buildCabinet);
  for (const view of cabinets) stage.scene.add(view.group);
  const body = buildAvatar();
  stage.scene.add(body.group);
  const screenOf = (cabinet: Cabinet) =>
    cabinets.find((v) => v.cabinet === cabinet)?.screenCenter ?? null;
  return { stage, overlay, cabinets, body, screenOf };
}

function run(root: HTMLElement): void {
  const { stage, overlay, cabinets, body, screenOf } = buildScene(root);
  const devices = listenToDevices(window);
  const sound = createSound(HALL.cabinets);
  const book = createScoreBook(cabinets);
  const slot = createGameSlot(overlay.gameCanvas, devices, book);
  overlay.setMuted(sound.muted);
  book.refresh();
  // Browsers only let sound start from a gesture.
  for (const gesture of ['keydown', 'pointerdown']) {
    window.addEventListener(gesture, () => sound.unlock(), { once: true });
  }

  let avatar = spawnAvatar(HALL);
  let focus = avatar.position;
  let session: Session = IN_HALL;
  let previous = IDLE;
  let last = performance.now();

  /** Input, the session and the handover to a game. */
  const think = (intent: Intent, near: Cabinet | null, dt: number) => {
    const before = session;
    const pressed = presses(previous, intent);
    previous = intent;
    if (pressed.action || pressed.mute) sound.unlock();
    if (pressed.mute) overlay.setMuted(sound.toggleMute());
    session = advance(press(session, near, pressed), dt);
    if (slot.takeExit()) session = leave(session);
    if (before.kind === 'hall' && session.kind !== 'hall') sound.coin();
    const change = handover(before, session);
    if (change) {
      if ('start' in change) slot.start(change.start);
      else slot.stop();
    }
  };

  /** The avatar's walk, and its footsteps. */
  const walk = (intent: Intent, dt: number) => {
    if (!canWalk(session)) return;
    const stepped = stepAvatar(HALL, avatar, screenToFloor(intent.move), dt);
    if (footfall(avatar.phase, stepped.phase)) sound.footstep();
    avatar = stepped;
  };

  /** Everything the player sees and hears this frame. */
  const show = (near: Cabinet | null, ms: number, dt: number) => {
    const playing = session.kind === 'playing';
    sound.update(avatar.position, playing);
    body.update(avatar);
    focus = follow(focus, avatar.position, CAMERA_RATE, dt);
    for (const view of cabinets) {
      view.tick(ms / 1000);
      view.setHighlighted(view.cabinet === near && session.kind === 'hall');
    }
    const k = dive(session);
    body.group.visible = k < AVATAR_HIDES_AT;
    overlay.setPrompt(prompt(session, near, book.best(near?.game)));
    overlay.setVeil(veil(k));
    overlay.showGame(playing);
    if (playing) return;
    const shot = cameraShot(focus, 'cabinet' in session ? screenOf(session.cabinet) : null, k);
    stage.frame(shot.target, shot.zoom, shot.lift);
    stage.render();
  };

  const loop = (ms: number) => {
    const dt = Math.min(MAX_DT, (ms - last) / 1000);
    last = ms;
    const intent = devices.poll();
    const near = canWalk(session) ? cabinetInReach(HALL, avatar.position) : null;
    think(intent, near, dt);
    walk(intent, dt);
    show(near, ms, dt);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

const root = document.getElementById('root');
if (root) run(root);
