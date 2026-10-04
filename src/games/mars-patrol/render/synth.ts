/**
 * Plays the core's sound recipes (ADR-0017) and the game's track (ADR-0021)
 * through the hall's game bus (ADR-0020): oscillators and filtered noise,
 * each with a short envelope, over the looping music.
 */
import type { GameAudio } from '../../../core/game';
import { createLoopPlayer } from '../../../loop-player';
import { MARS_TRACK } from '../core/music';
import { SFX } from '../core/sfx';
import type { SfxName, Tone } from '../core/sfx';

const VOLUME = 0.8;
const MUSIC_VOLUME = 0.32;

export interface Synth {
  play(names: readonly SfxName[]): void;
  /** Keeps the music looping at `level` (0 to 1) of its volume. */
  music(level: number): void;
  dispose(): void;
}

function noise(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function source(
  ctx: AudioContext,
  tone: Tone,
  at: number,
  buffer: AudioBuffer,
): AudioScheduledSourceNode & { connect: AudioNode['connect'] } {
  if (tone.wave === 'noise') {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  }
  const osc = ctx.createOscillator();
  osc.type = tone.wave;
  osc.frequency.setValueAtTime(tone.from, at);
  osc.frequency.exponentialRampToValueAtTime(tone.to, at + tone.seconds);
  return osc;
}

function playTone(ctx: AudioContext, out: AudioNode, tone: Tone, buffer: AudioBuffer): void {
  const at = ctx.currentTime + tone.delay;
  const end = at + tone.seconds;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(tone.gain, at + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, end);
  const src = source(ctx, tone, at, buffer);
  let chain: AudioNode = src;
  if (tone.wave === 'noise') {
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(tone.from, at);
    filter.frequency.exponentialRampToValueAtTime(tone.to, end);
    chain = src.connect(filter);
  }
  chain.connect(env).connect(out);
  src.start(at);
  src.stop(end + 0.05);
}

export function createSynth(audio: GameAudio): Synth {
  const ctx = audio.context;
  const out = ctx.createGain();
  out.gain.value = VOLUME;
  out.connect(audio.out);
  const buffer = noise(ctx);
  const music = ctx.createGain();
  music.gain.value = 0;
  music.connect(audio.out);
  const player = createLoopPlayer(ctx, music, MARS_TRACK);
  return {
    play(names) {
      for (const name of names) for (const tone of SFX[name]) playTone(ctx, out, tone, buffer);
    },
    music(level) {
      music.gain.setTargetAtTime(MUSIC_VOLUME * level, ctx.currentTime, 0.4);
      player.update();
    },
    dispose() {
      player.stop();
      out.disconnect();
      music.disconnect();
    },
  };
}
