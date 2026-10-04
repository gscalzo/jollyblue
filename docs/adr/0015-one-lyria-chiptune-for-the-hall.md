# 0015 — One Lyria chiptune for the hall instead of synthesised jingles

**Status:** accepted
**Date:** 2026-10-04

## Context

ADR-0010 made every cabinet loop a square-wave jingle, panned and faded by
distance, over a low room hum. In the hall the ten overlapping jingles and
the hum read as noise. The owner asked for one real 8-bit chiptune made with
Google's Lyria instead.

## Decision

- The hall plays **one track**: `public/music/hall.mp3`, made by Lyria 3.5
  on fal (`google/lyria-3.5`, $0.10 a generation — the same fal key and
  account as the art; the Gemini API's $0.08 was not worth a second
  provider). `scripts/generate-music.mjs` builds it from the recipe in
  `art/music.json`; its hash sits in `art/lock.json` beside the art's.
- The track is played up to `loopEnd` — 52 bars at 110 BPM, before the
  outro Lyria wrote despite the prompt — and each play crossfades into the
  next over two seconds (`src/core/music.ts`). Changing the track means
  checking its outro and setting `loopEnd` again.
- The music fades out while a game plays. The cabinet jingles, their
  positional mix and the hum are gone; cabinets no longer carry a `jingle`
  in the hall data. Footsteps and the coin stay synthesised, quieter. M still
  mutes, remembered per browser.
- This supersedes ADR-0010, and ADR-0004's jingle clause.

## Consequences

The hall ships a 3 MB MP3, downloaded after the first key press. Each game
can bring its own music later under its own record.

## Alternatives considered

- **A Lyria track per cabinet, positional** — ten tracks overlap into the
  same noise, at ten times the cost.
- **A hall track plus each game cabinet's theme when you stand at it** — a
  later addition once Moon Patrol 3D has its theme.
- **The Gemini API directly** — two cents cheaper per track, a second
  provider to look after.
