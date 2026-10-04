/**
 * A Lyria track looped without a seam (ADR-0015): loaded once, each play
 * scheduled just before it is due and crossfaded into the next. The hall's
 * music uses it, and so does a game's (ADR-0021).
 */
import { dueToStart, loopPeriod } from './core/music';
import type { Track } from './core/music';

const LOOKAHEAD = 0.5;

export interface LoopPlayer {
  /** Schedules the next play when it is due; call every frame. */
  update(): void;
  stop(): void;
}

/** One play of the track from its start to the loop point, faded in and out by the crossfade. */
function playOnce(
  ctx: AudioContext,
  out: AudioNode,
  buffer: AudioBuffer,
  track: Track,
  at: number,
): AudioBufferSourceNode {
  const { loopEnd, crossfade } = track;
  const src = ctx.createBufferSource();
  const env = ctx.createGain();
  src.buffer = buffer;
  env.gain.setValueAtTime(0, at);
  env.gain.linearRampToValueAtTime(1, at + crossfade);
  env.gain.setValueAtTime(1, at + loopEnd - crossfade);
  env.gain.linearRampToValueAtTime(0, at + loopEnd);
  src.connect(env).connect(out);
  src.start(at, 0, loopEnd);
  return src;
}

async function loadTrack(ctx: AudioContext, url: string): Promise<AudioBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`music answered ${res.status}`);
  return ctx.decodeAudioData(await res.arrayBuffer());
}

export function createLoopPlayer(ctx: AudioContext, out: AudioNode, track: Track): LoopPlayer {
  let buffer: AudioBuffer | null = null;
  let nextStart = 0;
  let stopped = false;
  let playing: AudioBufferSourceNode[] = [];
  loadTrack(ctx, track.url)
    .then((decoded) => {
      buffer = decoded;
      nextStart = ctx.currentTime + 0.1;
    })
    .catch(console.error);
  return {
    update() {
      if (stopped || !buffer || !dueToStart(nextStart, ctx.currentTime, LOOKAHEAD)) return;
      playing = [...playing.slice(-1), playOnce(ctx, out, buffer, track, nextStart)];
      nextStart += loopPeriod(track);
    },
    stop() {
      stopped = true;
      for (const src of playing) src.stop();
      playing = [];
    },
  };
}
