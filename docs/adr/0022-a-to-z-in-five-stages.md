# 0022 — Mars Patrol runs A to Z in five stages; stage 1 is dense

**Status:** accepted
**Date:** 2026-10-05

## Context

The owner found the first version too easy. ADR-0017 made A–E the whole
game: four 300 m stretches, an obstacle every 5–8 s and UFOs only after D.
In the 1982 original, A–E is only the first of five stages (A–E, E–J, J–O,
O–T, T–Z, each with a new hazard: J brings mines, and there are tanks,
boulders and three kinds of UFO), and saucers are overhead from the very
start.

## Decision

- The course grows to **A–Z in five stages**, built a stage per slice; the
  run keeps ending at the last checkpoint built. Each later stage adds one
  hazard — mines, tanks that shoot, rolling boulders, a bomber that only
  craters the road — each designed when its slice comes.
- **A stretch is 100 m** (about 11 s at cruise), not 300 m. Stage 1 places an
  obstacle every 16–25 m with pairs from the start (back-to-back craters that
  punish speed, a crater then a rock to shoot), and a UFO overhead almost all
  the way, two at once in C. Later stages tighten towards an obstacle every
  15 m.
- **A bomb only leaves a crater at least 7 m ahead of the buggy**
  (`BOMB.clearance`); closer, it just bursts. A crater appearing under the
  front wheels cannot be jumped, so it was an unfair death.
- Stage 1 is play-tested by an autopilot driving the core: a careful pilot
  clears it with no deaths in about 45 s; one that speeds through the double
  craters, or ignores the bomb shadows, loses every life.
- This supersedes ADR-0017's scope clause (one section A–E) and its
  stretch-by-stretch teaching plan; the rest of ADR-0017 stands.

## Consequences

The course data grows about five-fold by Z; past stage 2 it may move to a
data file. The checkpoint bonus is still paid at every letter, so shorter
stretches pay more often; whether bonuses move to the stage ends, as in the
original, is decided with stage 2.

## Alternatives considered

- **Re-tune A–E only** — harder, but the A–Z bar would still promise a
  course that is not there.
- **A Champion course replaying A–E faster** — variety by speed alone, no
  new hazards.
