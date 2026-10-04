# 0013 — The hall owns Back; runs are recorded under the owner's initials

**Status:** accepted
**Date:** 2026-10-04

## Context

Building the interaction slice raised three questions ADR-0005 and ADR-0006
left open: who reacts to Back while a game runs, whose initials a score
carries when there is no initials-entry screen, and what a cabinet without a
game does when you press Action.

## Decision

- **Back belongs to the hall.** While a game plays, the hall turns a Back
  press into the dive back out and unmounts the game; games read move and
  action only, and may also call `exit`. The game layer shows only while
  playing; the black veil covers the last 40 % of the dive both ways.
- **The owner's initials.** Until a game asks for initials, every score is
  posted as `GIO` (`OWNER_INITIALS` in `src/core/api.ts`), the single place
  to change when players get their own.
- **OUT OF ORDER** is a 1.6-second notice at the bottom of the screen; the
  avatar may keep walking.
- The hall's behaviour is a pure state machine (`src/core/session.ts`:
  hall, notice, entering, playing, leaving) and games load through
  `startGame` (`src/core/game.ts`), which never mounts a game the player
  left before it finished loading.

## Consequences

A game cannot trap the player. Accounts for other players (an idea for
later) would replace the initials constant and need records superseding
ADR-0006 and ADR-0007.

## Alternatives considered

- **Games handle Back themselves** — one bug and the player is stuck.
- **An initials-entry screen now** — work for a single owner that the
  public-accounts idea may replace anyway.
