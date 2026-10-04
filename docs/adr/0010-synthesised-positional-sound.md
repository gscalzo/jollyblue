# 0010 — Sound is synthesised in code and positional

**Status:** accepted
**Date:** 2026-10-04

## Context

An arcade is half sound. Audio files bring licensing, weight and loading.

## Decision

All sound is made with the Web Audio API, no audio files: each cabinet's
attract-mode jingle is a few lines of note data in the hall file played by a
tiny square/triangle sequencer, panned and attenuated by distance from the
avatar; footsteps, a coin clink on Action and a low room hum. Sound starts
after the first key press (browser policy). M or a gamepad button mutes;
the choice is kept in `localStorage`. The sequencer and the falloff are pure
and live in the tested core.

## Consequences

The 8-bit feel comes for free and weighs nothing. Richer sound later needs a
new record.

## Alternatives considered

- **Silence for v1** — the hall would feel dead.
- **Samples** — asset files, licensing, loading weight.
