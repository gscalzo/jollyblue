# 0006 — One Hono Worker, Vite-built assets, D1 for high scores only

**Status:** accepted
**Date:** 2026-10-04

## Context

A score event only matters if it lands somewhere; real cabinets cycle their
high-score table in attract mode. Bottega already proves the stack.

## Decision

One Cloudflare Worker serves the Vite-built hall as static assets; only
`/api/*` runs Worker code (Hono). D1 holds one table, `scores` (game,
three-letter initials, score, played_at). Two routes:

- `GET /api/scores/:game` — the top ten, highest first, older first on a
  tie;
- `POST /api/scores/:game` — `{ initials, score }`, initials `[A-Z]{3}`,
  score a whole number from 0 to 999 999 999.

A game id is a kebab-case slug of at most 32 characters. The rules live in
`shared/scores.ts`, used by both sides. Preferences that are per-browser
conveniences (mute, last cabinet) stay in `localStorage`.

## Consequences

One owner, no users table. Anything else to remember needs a new record.

## Alternatives considered

- **A pure static site** — scores would have nowhere to go.
- **Backend later** — the contract's `score` event would be a dead end until
  then.
