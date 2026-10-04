# 0011 — Art is generated on fal by a script and committed as pixel art

**Status:** accepted
**Date:** 2026-10-04

## Context

Painted surfaces (marquees, side art, carpet, posters) are what code draws
badly. Image models draw them well but not on a true pixel grid.

## Decision

`art/manifest.json` lists every texture (id, prompt, size, palette hint,
seed). `scripts/generate-art.mjs` calls fal (a FLUX model) only for entries
whose PNG is missing or whose prompt changed, then downsamples with
nearest-neighbour to the target grid and snaps to the palette, writing
`public/art/<id>.png`. The PNGs are committed. The fal key is `FAL_KEY` in
the owner's shell only: CI and the Worker never see it, and builds never
call fal.

## Consequences

Art is reproducible and reviewable: a prompt change is a diff, the pixels
are in git. Regenerating needs the owner's machine.

## Alternatives considered

- **Hand-made in fal's playground** — no record of the prompts.
- **Generated at runtime by the Worker** — a secret in the Worker and a cost
  per request, for a hall that does not change.
