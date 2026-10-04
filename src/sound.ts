/**
 * The Web Audio engine (ADR-0010): it plays what core/audio decides. Every
 * cabinet loops its jingle through its own panner and gain; footsteps,
 * the coin and the room hum are synthesised too. Nothing sounds until the
 * first key press (browser policy), and M toggles it, remembered per browser.
 */
import { hearing, loopOf, parseJingle, STEP_SECONDS } from './core/audio';
import type { Vec2 } from './core/geometry';
import type { Cabinet } from './core/hall';

const LOOKAHEAD = 0.25;
const JINGLE_VOLUME = 0.07;
const MUTE_KEY = 'jollyblue.muted';

interface Voice {
  cabinet: Cabinet;
  loop: (number | null)[];
  wave: OscillatorType;
  panner: StereoPannerNode;
  gain: GainNode;
  step: number;
  at: number;
}

export interface Sound {
  /** Starts the engine; call from a user gesture. */
  unlock(): void;
  /** Places the listener, schedules the jingles; `inGame` silences the hall. */
  update(listener: Vec2, inGame: boolean): void;
  footstep(): void;
  coin(): void;
  toggleMute(): boolean;
  readonly muted: boolean;
}

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // Storage blocked: the choice lasts this visit only.
  }
}

interface Blip {
  wave: OscillatorType;
  hz: number;
  at: number;
  length: number;
}

function blip(ctx: AudioContext, out: AudioNode, { wave, hz, at, length }: Blip): void {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = wave;
  osc.frequency.value = hz;
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(1, at + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(env).connect(out);
  osc.start(at);
  osc.stop(at + length + 0.02);
}

function noiseBuffer(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.08), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  return buffer;
}

function hum(ctx: AudioContext, out: AudioNode): void {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = 55;
  filter.type = 'lowpass';
  filter.frequency.value = 180;
  gain.gain.value = 0.025;
  osc.connect(filter).connect(gain).connect(out);
  osc.start();
}

function voiceFor(ctx: AudioContext, out: AudioNode, cabinet: Cabinet, index: number): Voice {
  const panner = ctx.createStereoPanner();
  const gain = ctx.createGain();
  gain.gain.value = 0;
  panner.connect(gain).connect(out);
  return {
    cabinet,
    loop: loopOf(parseJingle(cabinet.jingle) ?? []),
    wave: index % 2 === 0 ? 'square' : 'triangle',
    panner,
    gain,
    step: 0,
    // Staggered, so the hall is a murmur rather than a choir.
    at: ctx.currentTime + 0.3 + index * 0.41,
  };
}

function schedule(ctx: AudioContext, voice: Voice): void {
  while (voice.at < ctx.currentTime + LOOKAHEAD) {
    const hz = voice.loop[voice.step % voice.loop.length];
    if (hz !== null) {
      blip(ctx, voice.panner, { wave: voice.wave, hz, at: voice.at, length: STEP_SECONDS * 0.9 });
    }
    voice.step += 1;
    voice.at += STEP_SECONDS;
  }
}

export function createSound(cabinets: readonly Cabinet[]): Sound {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let hall: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let voices: Voice[] = [];
  let muted = readMuted();

  return {
    get muted() {
      return muted;
    },
    unlock() {
      if (ctx) return;
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 1;
      master.connect(ctx.destination);
      hall = ctx.createGain();
      hall.connect(master);
      noise = noiseBuffer(ctx);
      hum(ctx, hall);
      const live = ctx;
      const out = hall;
      voices = cabinets.map((c, i) => voiceFor(live, out, c, i));
    },
    update(listener, inGame) {
      if (!ctx || !hall) return;
      hall.gain.setTargetAtTime(inGame ? 0 : 1, ctx.currentTime, 0.2);
      for (const voice of voices) {
        const heard = hearing(listener, voice.cabinet.position);
        voice.gain.gain.setTargetAtTime(heard.gain * JINGLE_VOLUME, ctx.currentTime, 0.1);
        voice.panner.pan.setTargetAtTime(heard.pan, ctx.currentTime, 0.1);
        schedule(ctx, voice);
      }
    },
    footstep() {
      if (!ctx || !hall || !noise) return;
      const src = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      src.buffer = noise;
      filter.type = 'bandpass';
      filter.frequency.value = 900 + Math.random() * 300;
      gain.gain.value = 0.12;
      src.connect(filter).connect(gain).connect(hall);
      src.start();
    },
    coin() {
      if (!ctx || !master) return;
      const now = ctx.currentTime;
      blip(ctx, master, { wave: 'square', hz: 1318.5, at: now, length: 0.07 });
      blip(ctx, master, { wave: 'square', hz: 1760, at: now + 0.07, length: 0.25 });
    },
    toggleMute() {
      muted = !muted;
      writeMuted(muted);
      if (ctx && master) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.02);
      return muted;
    },
  };
}
