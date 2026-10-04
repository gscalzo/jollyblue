# 0003 — Keyboard and gamepad through one input layer; no touch

**Status:** accepted
**Date:** 2026-10-04

## Context

The owner plays at a desk. An arcade wants a controller; Moon Patrol wants
keys.

## Decision

All input goes through one layer that maps devices to three intents —
**move** (a 2D vector), **action** and **back** — so neither the hall nor a
game reads a key or a button directly. Keyboard (WASD or arrows, E or Enter,
Esc) and the browser Gamepad API are supported from the first playable
slice. Touch and mobile layouts are out of scope.

## Consequences

Adding a device is a new adapter, not a change to the hall or a game. The
mapping is pure and sits in the tested core (ADR-0008).

## Alternatives considered

- **Keyboard only** — retrofitting a gamepad later means touching every
  consumer.
- **Touch as well** — doubles the input and layout work; Moon Patrol on
  glass is its own design problem.
