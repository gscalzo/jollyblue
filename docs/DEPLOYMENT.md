# Deployment

JollyBlue runs as one Cloudflare Worker at `jollyblue.effectivecode.co.uk`
and `jollyblue.gioscalzo.com` behind Cloudflare Access (ADR-0007, ADR-0009).
Both zones live in the same Cloudflare account. Everything below is done
once; after that, merging to `main` deploys.

## 1. Cloudflare resources

- D1 database `jollyblue` (created 2026-10-04, id in `wrangler.jsonc`).
- Access application `jollyblue` (created 2026-10-04, id b011ea2d-743a-4a59-ae27-ef985a2b4284). To recreate: Zero Trust → **Access → Applications → Add an application → Self-hosted**:
  name `jollyblue`, domain `jollyblue.effectivecode.co.uk` plus the
  additional domain `jollyblue.gioscalzo.com` (one application, one AUD),
  session duration 730 h, the account's reusable **Allow owner** policy.
  Copy the application's **Audience (AUD) tag** into `ACCESS_AUD` in
  `wrangler.jsonc`. `ACCESS_TEAM_DOMAIN` is `plain-glitter-718b`.

If the application is ever recreated its AUD changes and `wrangler.jsonc`
must follow.

## 2. GitHub

Repository `gscalzo/jollyblue` with the secret `CLOUDFLARE_API_TOKEN`, pushed
once from the owner's shell with `cf-secret`.

`.github/workflows/deploy.yml` runs on every push to `main` (and on demand):
the quality gate, the build, `d1 migrations apply --remote`, `wrangler
deploy`. `ci.yml` runs the gate, the build and the mutation job on every
push.

## Local development

```bash
cp .dev.vars.example .dev.vars       # blank Access vars: every caller is local
npm run db:migrate:local
npm run dev                          # http://localhost:5173, Worker + local D1
```

## Who can open it

Only the owner's email, through the Access application's _Allow owner_
policy. The Worker re-verifies the JWT on every API call and admits an email
identity only; a service token, a missing or a bad token is answered with
401 (ADR-0007).
