/**
 * The hall's music (ADR-0015): one Lyria track, played up to just before
 * its outro and crossfaded into the next play, so it loops without a seam.
 */

export interface Track {
  url: string;
  /** Seconds into the file where the loop turns round: before the outro, on a bar line. */
  loopEnd: number;
  /** Seconds each play overlaps the next. */
  crossfade: number;
}

/** 52 bars at 110 BPM: the generated track's outro starts at about 116 s. */
export const HALL_TRACK: Track = {
  url: '/music/hall.mp3',
  loopEnd: (52 * 4 * 60) / 110,
  crossfade: 2,
};

/** Seconds from the start of one play to the start of the next. */
export function loopPeriod(track: Track): number {
  return track.loopEnd - track.crossfade;
}

/** True when the next play must be scheduled: it starts within `lookahead` of `now`. */
export function dueToStart(nextStart: number, now: number, lookahead: number): boolean {
  return nextStart <= now + lookahead;
}
