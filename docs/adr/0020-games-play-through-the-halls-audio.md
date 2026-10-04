# 0020 — Games play through the hall's audio

**Status:** accepted
**Date:** 2026-10-04

## Context

ADR-0005's contract gave a game a canvas, the input and two events. Mars
Patrol 3D makes sound (ADR-0017), but the hall owns the AudioContext (unlocked
by the first key press) and the mute that M toggles (ADR-0015). A game making
its own context would ignore M and need its own unlock.

## Decision

- `mount(canvas, input, events, audio)`: the fourth argument is a
  `GameAudio` — `{ context, out }`, the hall's AudioContext and a gain node
  under the hall's master — or `null` when sound has not been unlocked yet.
- The hall creates the bus once (`Sound.gameAudio()` in `src/sound.ts`) and
  passes it at every mount through `startGame` and the game slot. M mutes it
  with everything else; the hall's music still fades out while a game plays.
- A game connects its own nodes to `out` and disconnects them on unmount; it
  never touches `context.destination` or the mute setting.

## Consequences

Every game gets mute and the browser unlock for free. In practice the bus is
always there at mount, because pressing Action at a cabinet unlocks sound.
This amends ADR-0005's signature; games written against the old one still
type-check, since the extra argument may be ignored.

## Alternatives considered

- **Each game its own AudioContext** — M would not mute it, and it would need
  its own unlock gesture.
- **A mute event in the contract** — every game would reimplement muting.
