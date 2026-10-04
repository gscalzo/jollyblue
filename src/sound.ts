/**
 * The Web Audio engine (ADR-0015): one Lyria chiptune for the hall, looped
 * with a crossfade and faded out while a game plays, plus soft synthesised
 * footsteps and a coin. A game plays through its own bus under the same
 * master (ADR-0020), so M mutes it too. Nothing sounds until the first key
 * press (browser policy), and M toggles it, remembered per browser.
 */
import type { GameAudio } from './core/game';
import { HALL_TRACK } from './core/music';
import { createLoopPlayer } from './loop-player';
import type { LoopPlayer } from './loop-player';

const MUSIC_VOLUME = 0.35;
const STEP_VOLUME = 0.05;
const COIN_VOLUME = 0.25;
const MUTE_KEY = 'jollyblue.muted';

export interface Sound {
  /** Starts the engine; call from a user gesture. */
  unlock(): void;
  /** Keeps the music looping; `inGame` fades it out. */
  update(inGame: boolean): void;
  footstep(): void;
  coin(): void;
  toggleMute(): boolean;
  /** The bus a game plays through, under the master; null before unlock. */
  gameAudio(): GameAudio | null;
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
  hz: number;
  at: number;
  length: number;
}

function blip(ctx: AudioContext, out: AudioNode, { hz, at, length }: Blip): void {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = hz;
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(COIN_VOLUME, at + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(env).connect(out);
  osc.start(at);
  osc.stop(at + length + 0.02);
}

function noiseBuffer(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  return buffer;
}

export function createSound(): Sound {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let music: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let player: LoopPlayer | null = null;
  let muted = readMuted();
  let gameBus: GameAudio | null = null;

  return {
    get muted() {
      return muted;
    },
    unlock() {
      if (ctx) return;
      const live = new AudioContext();
      ctx = live;
      master = live.createGain();
      master.gain.value = muted ? 0 : 1;
      master.connect(live.destination);
      music = live.createGain();
      music.gain.value = MUSIC_VOLUME;
      music.connect(master);
      noise = noiseBuffer(live);
      player = createLoopPlayer(live, music, HALL_TRACK);
    },
    update(inGame) {
      if (!ctx || !music) return;
      music.gain.setTargetAtTime(inGame ? 0 : MUSIC_VOLUME, ctx.currentTime, 0.3);
      player?.update();
    },
    footstep() {
      if (!ctx || !master || !noise) return;
      const src = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      src.buffer = noise;
      filter.type = 'bandpass';
      filter.frequency.value = 700 + Math.random() * 200;
      gain.gain.value = STEP_VOLUME;
      src.connect(filter).connect(gain).connect(master);
      src.start();
    },
    coin() {
      if (!ctx || !master) return;
      const now = ctx.currentTime;
      blip(ctx, master, { hz: 1318.5, at: now, length: 0.07 });
      blip(ctx, master, { hz: 1760, at: now + 0.07, length: 0.25 });
    },
    gameAudio() {
      if (!ctx || !master) return null;
      if (!gameBus) {
        const out = ctx.createGain();
        out.connect(master);
        gameBus = { context: ctx, out };
      }
      return gameBus;
    },
    toggleMute() {
      muted = !muted;
      writeMuted(muted);
      if (ctx && master) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.02);
      return muted;
    },
  };
}
