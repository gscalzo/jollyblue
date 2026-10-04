/**
 * The game's sound effects as data (ADR-0017): each is a few tones — an
 * oscillator or filtered noise sweeping from one frequency to another —
 * played by the render's synth through the hall's bus (ADR-0020).
 */
import type { GameEvent } from './flow';

type Wave = 'sine' | 'square' | 'sawtooth' | 'triangle' | 'noise';

export interface Tone {
  wave: Wave;
  /** Hertz at the start and the end; for noise, the filter's centre. */
  from: number;
  to: number;
  seconds: number;
  gain: number;
  /** Seconds after the trigger. */
  delay: number;
}

export type SfxName =
  | 'start'
  | 'jump'
  | 'land'
  | 'fire'
  | 'hit'
  | 'break'
  | 'crash'
  | 'ufo'
  | 'drop'
  | 'ufo-down'
  | 'pop'
  | 'impact'
  | 'checkpoint'
  | 'extra'
  | 'clear'
  | 'over';

function tone(wave: Wave, from: number, to: number, seconds: number, gain: number): Tone {
  return { wave, from, to, seconds, gain, delay: 0 };
}

function arpeggio(wave: Wave, notes: readonly number[], each: number, gain: number): Tone[] {
  return notes.map((hz, i) => ({ ...tone(wave, hz, hz, each * 1.6, gain), delay: i * each }));
}

export const SFX: Record<SfxName, Tone[]> = {
  start: arpeggio('triangle', [392, 523, 659, 784], 0.07, 0.25),
  jump: [tone('sine', 260, 720, 0.2, 0.25), tone('noise', 900, 2400, 0.15, 0.08)],
  land: [tone('noise', 500, 150, 0.14, 0.3), tone('sine', 110, 60, 0.12, 0.3)],
  fire: [tone('square', 1500, 600, 0.09, 0.12), tone('sawtooth', 2400, 1300, 0.07, 0.08)],
  hit: [tone('noise', 2600, 900, 0.1, 0.3), tone('triangle', 900, 500, 0.08, 0.15)],
  break: [tone('noise', 1400, 120, 0.45, 0.45), tone('sine', 120, 45, 0.35, 0.3)],
  crash: [tone('noise', 1800, 90, 1.1, 0.5), tone('sawtooth', 140, 35, 0.9, 0.25)],
  ufo: [tone('sine', 300, 900, 0.6, 0.15), tone('triangle', 900, 300, 0.6, 0.1)],
  drop: [tone('sine', 1800, 500, 0.9, 0.08)],
  'ufo-down': [tone('noise', 2200, 200, 0.7, 0.45), tone('square', 600, 80, 0.6, 0.15)],
  pop: [tone('noise', 3000, 1200, 0.12, 0.3)],
  impact: [tone('noise', 900, 70, 0.6, 0.4), tone('sine', 90, 35, 0.5, 0.35)],
  checkpoint: arpeggio('triangle', [784, 1047], 0.09, 0.25),
  extra: arpeggio('square', [523, 659, 784, 1047, 1319], 0.06, 0.12),
  clear: arpeggio('triangle', [523, 659, 784, 1047, 784, 1047], 0.12, 0.28),
  over: arpeggio('triangle', [392, 330, 262, 196], 0.18, 0.28),
};

const FOR: Partial<Record<GameEvent['kind'], SfxName>> = {
  start: 'start',
  jump: 'jump',
  land: 'land',
  fire: 'fire',
  hit: 'hit',
  break: 'break',
  crash: 'crash',
  'ufo-in': 'ufo',
  drop: 'drop',
  'ufo-down': 'ufo-down',
  'bomb-down': 'pop',
  impact: 'impact',
  checkpoint: 'checkpoint',
  'extra-life': 'extra',
  clear: 'clear',
  over: 'over',
};

/** The effects a frame's events trigger, each at most once. */
export function soundsFor(events: readonly GameEvent[]): SfxName[] {
  const names = events.map((e) => FOR[e.kind]).filter((n) => n !== undefined);
  return [...new Set(names)];
}
