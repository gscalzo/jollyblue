# 0012 — The render smoke test builds the scene; WebGL is checked by eye

**Status:** accepted
**Date:** 2026-10-04

## Context

ADR-0008 promised a boot smoke test that "renders a frame without errors".
Vitest runs in node, where there is no WebGL and no 2D canvas; a real frame
would need a headless browser in CI (Playwright and its browsers).

## Decision

The render smoke test (`src/render/scene.test.ts`) builds the whole scene in
node — the room, its lights, every cabinet and one frame of every attract
loop — over a fake canvas (`src/test/fake-canvas.ts`) whose 2D context
swallows every call, and checks the scene graph (lights present, every
screen in front of its cabinet). Whether WebGL draws it as intended is
checked by screenshots of the running hall before a slice merges. This
replaces ADR-0008's "renders a frame" clause; the rest of ADR-0008 stands.

## Consequences

CI catches a scene that throws while building, not a shader that fails to
compile or a frame that looks wrong. A headless-browser test can come later
under its own record.

## Alternatives considered

- **Playwright in CI** — a large dependency and browser download for one
  check that a screenshot covers today.
- **jsdom** — has no 2D canvas either without the native `canvas` package.
