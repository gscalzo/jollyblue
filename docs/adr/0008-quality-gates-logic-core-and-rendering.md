# 0008 — Bottega's gates on the logic core; rendering is smoke-tested

**Status:** accepted; the smoke-test clause is superseded-by-0012
**Date:** 2026-10-04

## Context

The owner's projects share one gate suite (raffaello, Bottega). JollyBlue is
mostly a game loop over Three.js, where line coverage and mutation testing of
shader and scene code produce noise, not confidence.

## Decision

`npm run gate` runs, at Bottega's bars: typecheck (two tsconfigs), ESLint at
zero warnings (complexity 10, cognitive complexity 12, 500 lines per file,
depth 4, 5 parameters, no `any`), Prettier, design-check (ADR-0002),
coverage, CRAP ≤ 15, Halstead difficulty ≤ 50, zero duplication (jscpd) and
no dead code (knip). `npm run mutation` (Stryker) breaks on any surviving
mutant. CI runs both on every push.

The code is split in two:

- **The logic core** — `shared/`, `worker/` (minus its entry point) and
  `src/core/`: input mapping, movement and collision, proximity and
  interaction, the hall schema, the game contract's lifecycle, audio
  sequencing and falloff. Coverage at 100 % lines, functions, branches and
  statements, and 100 % mutation score.
- **Rendering and wiring** — `src/render/` (scene building, shaders,
  post-processing) and `src/main.ts`. Excluded from coverage and mutation;
  checked by a boot smoke test (it renders a frame without errors) and by
  screenshots. Lint, Halstead, duplication and design-check still apply.

## Consequences

Logic must not hide in the rendering layer: anything with a branch worth
testing moves to `src/core/`. The thresholds are ratchets; lowering one or
moving a file out of the measured set needs a superseding record.

## Alternatives considered

- **The same thresholds over all code** — mutation-testing shaders.
- **A loose prototype, gates later** — retrofitting gates onto a game loop
  is the expensive direction.
