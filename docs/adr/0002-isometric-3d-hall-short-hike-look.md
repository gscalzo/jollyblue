# 0002 — An isometric 3D hall in Three.js, with A Short Hike's look

**Status:** accepted
**Date:** 2026-10-04

## Context

JollyBlue is a private arcade hall ("sala giochi"): you walk an isometric
world and play the games on its cabinets. The owner wants an 8-bit feel and
named _A Short Hike_ as the vibe. The first game, Moon Patrol 3D, will need
a 3D engine of its own anyway.

## Decision

- The hall is **real 3D seen through a fixed isometric orthographic
  camera** that follows the avatar, rendered with **plain Three.js** (no
  React, no React Three Fiber: one long-lived scene needs no reconciler).
  The camera does not rotate in v1.
- The look is **A Short Hike's**: the scene renders to a low-resolution
  target (about a third to a quarter of the window) upscaled with
  nearest-neighbour filtering, toon shading with a few light bands, warm
  saturated full colour — not a forced NES palette. JollyBlue's twist: a hall
  at night, lit by neon and CRT glow.
- Geometry is **low-poly, built in code** from primitives; painted detail
  (marquees, side art, carpet, posters) is pixel-art texture (ADR-0011).
- **Tokens:** every scene colour and render knob (internal resolution, toon
  bands) lives in `src/palette.ts`; every DOM colour, font, radius, shadow
  and motion in `src/styles.css`. `scripts/design-check.mjs` rejects raw
  colours (`#hex`, `rgb()`, `0xRRGGBB`) and literal styling anywhere else
  under `src/`.

## Consequences

The hall and the games can share one engine and one skill set. Changing the
look (resolution, palette) is a token edit, not an asset redo. A camera
that rotates later is possible without new art.

## Alternatives considered

- **2D isometric sprites (Phaser, PixiJS)** — every cabinet and facing needs
  drawn art, and the camera can never move.
- **A free 3D camera** — not isometric.
- **Voxels** — blocky by construction; neon and CRT glow are hard to sell.
- **A strict 8-bit palette with dithering** — the owner chose A Short Hike's
  full colour over it.
