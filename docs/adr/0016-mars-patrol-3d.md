# 0016 — The first game is Mars Patrol 3D, a homage under its own name

**Status:** accepted
**Date:** 2026-10-04

## Context

The first game was planned as "Moon Patrol 3D", a 3D take on Irem's 1982
arcade game. Moon Patrol is Irem's trademark, the repository is public, and
ADR-0004 already keeps real trademarks off the placeholder cabinets.

## Decision

- The game is **MARS PATROL 3D**, id `mars-patrol-3d`, on the cabinet
  `mars-patrol`. It plays as a homage to the original — a buggy driving
  right, jumping craters, shooting forward and up — set on Mars: red dust,
  mesas, a dusky sky and two small moons.
- No name, logo, art or music of the original is used; the gameplay ideas
  are the homage.
- The cabinet's marquee and side art are regenerated (`marquee-mars-patrol`,
  `side-mars-patrol` in `art/manifest.json`); the Moon images are deleted.
- The stub's test scores under `moon-patrol-3d` stay in D1, orphaned: no
  cabinet asks for them and nothing migrates them.
- Earlier records keep the old name in their text; this record says what it
  became.

## Consequences

The public repository carries no third-party mark. A warm Mars palette
suits the games' look (ADR-0018) better than a grey Moon.

## Alternatives considered

- **Keep "Moon Patrol 3D"** — a real trademark in a public repository,
  against the spirit of ADR-0004.
- **Delete the orphaned stub scores** — a remote write for rows no one can
  see.
