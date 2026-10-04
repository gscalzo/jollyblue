# 0019 — Each game's core joins the logic core

**Status:** accepted
**Date:** 2026-10-04

## Context

ADR-0008 holds `shared/`, `worker/` and `src/core/` to 100 % coverage and
100 % mutation score; everything else under `src/` is rendering and wiring.
A game is mostly rules — physics, collisions, scoring, a run's flow — which
belong under the same bar.

## Decision

- A game lives in `src/games/<name>/`: `core/` (pure TypeScript: no Three.js,
  no DOM, no Web Audio), `render/` (Three.js, thin) and `index.ts` (the Game
  of ADR-0005, wiring the loop, the core, the render and the audio).
- `src/games/*/core/**/*.ts` is added to the coverage `include`
  (`vitest.config.ts`) and Stryker's `mutate` (`stryker.config.mjs`). The
  measured set grows; no threshold moves.
- A game's `render/` and `index.ts` are outside the set like `src/render/`:
  checked by the render smoke test (ADR-0012), which builds each game's scene
  too, and by eye. Anything with a branch worth testing moves to `core/`.

## Consequences

Every future game inherits the bar by putting its rules in `core/`.

## Alternatives considered

- **Game rules in `src/core/`** — mixes the hall's logic with every game's.
- **A game outside the gates** — rules are exactly what the gates are for.
