# 0018 — The games are shiny and modern; the hall stays low-res

**Status:** accepted
**Date:** 2026-10-04

## Context

ADR-0002 gives the hall a low-resolution, toon-shaded look and expected the
games to share it. The owner wants the games themselves shiny and modern —
possibly with retro-styled models — while the hall stays as it is. Primitives
will later be replaced by 3D models.

## Decision

- A game owns its renderer (ADR-0005) and renders **at full resolution**:
  `devicePixelRatio` capped at 2, antialiasing on, no pixel scale, no toon
  bands.
- **Physically based materials** (`MeshStandardMaterial`,
  `MeshPhysicalMaterial`): metal and clearcoat where it shines, emissive
  glows, rough dust. Reflections from Three.js's `RoomEnvironment`; ACES
  filmic tone mapping; a low sun with soft shadows; light fog for depth.
- **Bloom** through `EffectComposer` and `UnrealBloomPass` from
  `three/examples` — part of the `three` package, no new dependency.
- **A model seam:** each game builds every entity through one factory that
  returns an `Object3D` with named attachment points (wheels, muzzles…).
  Today the factory makes primitives; swapping in glTF models (`GLTFLoader`,
  also in `three/examples`) touches only the factory. The simulation knows
  positions and sizes, never meshes. Real models, their format, source and
  weight, get their own record.
- **The HUD** is crisp text on a 2D canvas at full resolution, composited
  over the scene.
- The hall keeps ADR-0002's look; the dive is the step from one into the
  other. A game's colours and render knobs (exposure, bloom) are still tokens
  in `src/palette.ts`, in a block per game, so design-check is unchanged.

## Consequences

The games and the hall share Three.js but not a look. A game's frame costs
more GPU than the hall's (full resolution, shadows, bloom). Models arrive
without a rewrite. This narrows ADR-0002 to the hall; it does not change it.

## Alternatives considered

- **The hall's low-res toon look in the games** — what ADR-0002 expected;
  the owner wants the games shiny.
- **A post-processing library (`postprocessing`)** — better bloom, one more
  dependency; `three/examples` is enough for now.
- **Models now** — sourcing and loading work before there is a game to put
  them in.
