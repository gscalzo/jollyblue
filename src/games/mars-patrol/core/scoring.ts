/** Points, bonuses and extra lives (ADR-0017). */
import { POINTS, RULES } from './tuning';

export interface Purse {
  score: number;
  lives: number;
  /** How many of the extra lives have been given. */
  extras: number;
}

export interface Paid {
  purse: Purse;
  /** Extra lives this payment earned. */
  earned: number;
}

/** Adds points, and the extra lives their thresholds give. */
export function pay(purse: Purse, points: number): Paid {
  const score = purse.score + points;
  const extras = RULES.extraLives.filter((at) => score >= at).length;
  const earned = Math.max(0, extras - purse.extras);
  return { purse: { score, lives: purse.lives + earned, extras: purse.extras + earned }, earned };
}

/** A checkpoint's bonus: the base, plus a hundred for each whole second under par. */
export function checkpointBonus(par: number, seconds: number): number {
  return POINTS.checkpoint + POINTS.perSecondUnderPar * Math.max(0, Math.floor(par - seconds));
}

/** The bonus for clearing the section with `lives` to spare. */
export function clearBonus(lives: number): number {
  return POINTS.clear + POINTS.perLife * lives;
}
