# 0004 — The hall is data; the avatar is built from primitives

**Status:** accepted; the jingle clause is superseded-by-0015
**Date:** 2026-10-04

## Context

On day one only Moon Patrol 3D exists, but a single cabinet does not feel
like an arcade.

## Decision

- The hall is described in one typed data file: the room, and about ten
  cabinets, each with a position, a facing, a marquee, screen art, an
  attract-mode jingle (ADR-0010) and an optional `game` id. A cabinet
  without a game plays its attract loop and answers Action with "OUT OF
  ORDER". The placeholder cabinets carry invented titles, never real
  trademarks. Nothing but cabinets for now.
- You walk as a **visible character in third person**: a small figure in a
  hoodie made of primitives (capsule body, sphere head, stubby limbs),
  animated procedurally (bob, limb swing, squash). No rigging, no skeletal
  assets.

## Consequences

Adding a game is one entry in the hall file. Collision and proximity are
computed from that data, so they are pure and tested. The avatar can be
restyled or swapped without touching the rest.

## Alternatives considered

- **One cabinet** — honest, but not an arcade.
- **Grow the room with the games** — an empty-feeling hall for a long time.
- **No avatar, a panning camera** — reads as a map, not a place.
