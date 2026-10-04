# 0014 — sharp snaps the generated art to pixels; the first art set

**Status:** accepted
**Date:** 2026-10-04

## Context

ADR-0011 set the art pipeline but not the tool that downsamples and
quantises fal's images, nor what the first set contains.

## Decision

- **sharp** (dev dependency, used only by `scripts/generate-art.mjs`)
  downsamples each image to its grid with Lanczos and quantises it to the
  item's palette size with no dithering.
- The model is `fal-ai/flux/dev`. `art/lock.json` (committed) holds a hash
  of each item's recipe, so only new or changed items are paid for; naming
  ids on the command line forces just those. Full-size originals land in
  `art/raw/` (gitignored) for inspection.
- The first set, 24 images: a marquee (128×32) and side art (48×96) per
  cabinet, a carpet tile (48×48) and three posters (48×64). The hall shows
  code-drawn stand-ins until a texture loads, so missing art never breaks it.
- Marquees carry their titles as generated lettering; a garbled title is
  fixed by changing that item's seed or prompt, never by hand-editing pixels.

## Consequences

Regenerating needs `FAL_KEY` and the owner's machine; CI only ships the
committed PNGs. The whole first set cost about $0.60.

## Alternatives considered

- **pngjs and hand-written quantisation** — more code to own for a worse
  palette.
- **Nearest-neighbour downsampling** — keeps the model's noise; Lanczos then
  a small palette reads as drawn pixel art.
