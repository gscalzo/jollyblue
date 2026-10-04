# 0007 — Cloudflare Access for the owner; the Worker re-verifies

**Status:** accepted
**Date:** 2026-10-04

## Context

JollyBlue is private: only the owner's Google account may open it.

## Decision

One Cloudflare Access application, `jollyblue`, covers both hostnames
(ADR-0009) with the account's reusable owner-only policy. The Worker
verifies the `Cf-Access-Jwt-Assertion` on every `/api` call — RS256
against the team's certs, audience, issuer, expiry — and admits an email
identity only; a service token, a missing or a bad token gets 401. With the
Access vars blank (local dev) every caller is `local`. `worker/access.ts`
is Bottega's, unchanged in behaviour.

## Consequences

No application auth, no users table. If the Access application is
recreated, its AUD changes and `wrangler.jsonc` must follow.

## Alternatives considered

- **Trusting the edge alone** — a misrouted request would reach the API
  unauthenticated.
