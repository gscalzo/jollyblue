/**
 * The game's screens (ADR-0017): a title, the run, and the results. A
 * finished run posts its score once; Action on the results goes back to
 * the title. Back is the hall's (ADR-0013).
 */
import type { Course } from './course';
import { finished, newRun, stepRun } from './run';
import type { Controls, Run, RunEvent } from './run';
import { RULES, STEP } from './tuning';

export type Screen =
  | { kind: 'title'; t: number }
  | { kind: 'playing'; run: Run }
  | { kind: 'results'; run: Run; t: number };

export type GameEvent = RunEvent | { kind: 'start' } | { kind: 'post'; points: number };

export const TITLE: Screen = { kind: 'title', t: 0 };

export interface Flowed {
  screen: Screen;
  events: GameEvent[];
}

function playing(course: Course, run: Run, controls: Controls): Flowed {
  const s = stepRun(course, run, controls);
  if (!finished(s.run)) return { screen: { kind: 'playing', run: s.run }, events: s.events };
  const post: GameEvent = { kind: 'post', points: s.run.purse.score };
  return { screen: { kind: 'results', run: s.run, t: 0 }, events: [...s.events, post] };
}

/** One fixed step. On the title and the results, Fire is Action. */
export function stepScreen(course: Course, screen: Screen, controls: Controls): Flowed {
  switch (screen.kind) {
    case 'title':
      if (controls.fire) {
        return { screen: { kind: 'playing', run: newRun(course) }, events: [{ kind: 'start' }] };
      }
      return { screen: { kind: 'title', t: screen.t + STEP }, events: [] };
    case 'playing':
      return playing(course, screen.run, controls);
    case 'results':
      if (controls.fire && screen.t >= RULES.resultsSeconds) return { screen: TITLE, events: [] };
      return { screen: { ...screen, t: screen.t + STEP }, events: [] };
  }
}
