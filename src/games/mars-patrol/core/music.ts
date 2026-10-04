/**
 * Mars Patrol 3D's own Lyria track (ADR-0021) and how loud it plays on each
 * screen: full in a run, softer on the title, ducked under a crash and the
 * results.
 */
import type { Track } from '../../../core/music';
import type { Screen } from './flow';

/** 56 bars at 130 BPM, a phrase boundary; the generated track ends at about 116 s. */
export const MARS_TRACK: Track = {
  url: '/music/mars-patrol.mp3',
  loopEnd: (56 * 4 * 60) / 130,
  crossfade: 2,
};

export function musicLevel(screen: Screen): number {
  if (screen.kind === 'title') return 0.7;
  if (screen.kind === 'results') return 0.3;
  return screen.run.phase.kind === 'crashed' ? 0.5 : 1;
}
