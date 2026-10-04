# 0021 — Mars Patrol 3D plays its own synthwave track

**Status:** accepted
**Date:** 2026-10-04

## Context

ADR-0015 left room for each game to bring its own music under its own
record. ADR-0017 promised Mars Patrol 3D a Lyria track, and ADR-0018 made the
game shiny and modern, so an 8-bit chiptune like the hall's would not fit.

## Decision

- The game plays **`public/music/mars-patrol.mp3`**, a modern synthwave
  piece made by Lyria 3.5 on fal from the second recipe in `art/music.json`
  (same script, same key, same lock file as ADR-0015).
- The track runs in eight-bar phrases at 130 BPM and ends at about 116 s; it
  loops at **56 bars** (103.4 s), a phrase boundary, with the two-second
  crossfade (`MARS_TRACK` in `src/games/mars-patrol/core/music.ts`).
  Regenerating it means measuring its tempo and outro again.
- How loud it plays is core logic (`musicLevel`): 70 % on the title, full in
  a run, half under a crash, 30 % on the results.
- It plays through the hall's game bus (ADR-0020), so M mutes it, and stops
  on unmount. The looping itself moves out of `src/sound.ts` into
  `src/loop-player.ts`, shared by the hall and the game.

## Consequences

The game downloads a 2.8 MB MP3 when it mounts with sound unlocked. The hall's
music still fades out while a game plays (ADR-0015), so the two never mix.

## Alternatives considered

- **No music, effects only** — the runs felt empty.
- **A chiptune like the hall's** — out of keeping with the shiny game.
- **Looping at 62 bars, just before the ending** — two bars more, but it
  cuts a phrase in half.
