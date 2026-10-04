# 0009 — jollyblue on effectivecode.co.uk and gioscalzo.com, deployed from main

**Status:** accepted
**Date:** 2026-10-04

## Context

The owner's sites answer on `<name>.effectivecode.co.uk` and
`<name>.gioscalzo.com`; both zones live in the same Cloudflare account.

## Decision

The Worker `jollyblue` answers on `jollyblue.effectivecode.co.uk` and
`jollyblue.gioscalzo.com` (custom domains); `workers.dev` and preview URLs
are off. The repository is public at `gscalzo/jollyblue`: code and content
only, scores live in D1. GitHub Actions deploys on every push to `main`
(gate, build, D1 migrations, `wrangler deploy`) with the
`CLOUDFLARE_API_TOKEN` secret. See `docs/DEPLOYMENT.md`.

## Consequences

Merging is shipping. Each slice of the plan is its own merge, visible on the
real URL.

## Alternatives considered

- **One hostname** — inconsistent with the other sites.
- **Deploying by hand** — the gate would only run when remembered.
