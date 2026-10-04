# 0005 — The game contract: mount, unmount, score, exit

**Status:** accepted
**Date:** 2026-10-04

## Context

Games will be written one at a time, starting with Moon Patrol 3D. The hall
must host them without being shaped by any one of them.

## Decision

A game is a module loaded lazily with dynamic `import()` and implements:

- `mount(canvas, input)` — it gets its own canvas, its own renderer and
  render settings, and the intent stream of ADR-0003;
- `unmount()` — it releases everything it took;
- events `score` (a final score, recorded through ADR-0006) and `exit`.

Pressing Action at a cabinet with a game dollies the camera into its screen
and fades to the game. Back (Esc or the gamepad button) or `exit` fades
back to the hall with the avatar standing at the cabinet. Until Moon Patrol
3D is written, a stub game proves the contract: a "COMING SOON" screen whose
Action posts a fake score.

## Consequences

A game cannot break the hall's renderer, and the hall does not download a
game until it is played. The contract is small enough to move a game into
an iframe later without changing the hall.

## Alternatives considered

- **Games render onto the cabinet's screen inside the hall** — every game
  inherits the hall's renderer and post-processing, and its bugs.
- **Each game a separate page or iframe from the start** — loading and
  messaging overhead, and a harder seamless transition.
