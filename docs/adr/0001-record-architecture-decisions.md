# 0001 — Record architecture decisions

**Status:** accepted
**Date:** 2026-10-04

## Context

JollyBlue was designed in one sitting, as a series of decisions the owner
made one at a time. Those decisions are the reason the code looks the way it
does, and none of them can be recovered from the code alone.

## Decision

Every architecturally significant decision — new dependency, schema change,
hosting or auth change, a content format, a game contract, a quality-gate
threshold — gets a short record in `docs/adr/`, numbered, using
`template.md`, indexed in `README.md` here, in the same commit as the code
that implements it. A decision that changes supersedes its predecessor
(marked `superseded-by-NNNN`); nothing is edited silently.

## Consequences

Records 0002–0011 are the design session written down; some describe slices
not yet built and say so. Code comments cite records by number.

## Alternatives considered

- **A design document** — one file drifts; numbered records each answer one
  question and never change meaning.
