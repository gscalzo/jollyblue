/**
 * Mars Patrol 3D (ADR-0016–0018): the Game the hall mounts (ADR-0005). Each
 * frame it reads the intent, runs the core's fixed steps, posts a finished
 * run's score, plays the sounds and draws. The rules are all in core/.
 */
import { fetchScores } from '../../core/api';
import type { Game } from '../../core/game';
import { IDLE } from '../../core/input';
import { controlsFrom, posts, runFrame, stepsDue } from './core/clock';
import { SECTION } from './core/course';
import { TITLE } from './core/flow';
import { bestAfter, hud, updateNotice } from './core/hud';
import type { Notice } from './core/hud';
import { musicLevel } from './core/music';
import { soundsFor } from './core/sfx';
import { createSynth } from './render/synth';
import { createView } from './render/view';

const GAME_ID = 'mars-patrol-3d';

export default function createGame(): Game {
  let frame = 0;
  let release: () => void = () => undefined;
  return {
    mount(canvas, input, events, audio) {
      const view = createView(canvas, SECTION);
      const synth = audio ? createSynth(audio) : null;
      let screen = TITLE;
      let previous = IDLE;
      let carry = 0;
      let last = performance.now();
      let best: number | null = null;
      let notice: Notice | null = null;
      fetchScores(fetch, GAME_ID)
        .then(
          (table) =>
            (best = bestAfter(
              best,
              table.scores.map((s) => s.score),
            )),
        )
        .catch(console.error);

      const loop = (ms: number) => {
        const dt = Math.min(0.1, Math.max(0, (ms - last) / 1000));
        last = ms;
        const intent = input.read();
        const due = stepsDue(carry, dt);
        carry = due.carry;
        const out = runFrame(SECTION, screen, controlsFrom(intent, previous), due.steps);
        previous = intent;
        screen = out.screen;
        const posted = posts(out.events);
        for (const points of posted) events.score(points);
        best = bestAfter(best, posted);
        notice = updateNotice(notice, out.events, dt);
        synth?.play(soundsFor(out.events));
        synth?.music(musicLevel(screen));
        view.draw(screen, out.events, hud(SECTION, screen, best), notice, dt);
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
      release = () => {
        view.dispose();
        synth?.dispose();
      };
    },
    unmount() {
      cancelAnimationFrame(frame);
      release();
    },
  };
}
