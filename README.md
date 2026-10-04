<div align="center">

# JollyBlue

### An 8-bit arcade hall you can walk into.

A private sala giochi in an isometric 3D world. Walk up to a cabinet, press
Action, and the camera dives into the screen. The first game is Moon Patrol 3D.

[![CI](https://github.com/gscalzo/jollyblue/actions/workflows/ci.yml/badge.svg)](https://github.com/gscalzo/jollyblue/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Cloudflare](https://img.shields.io/badge/deploys%20to-Cloudflare%20Workers-f38020?logo=cloudflare&logoColor=white)
![Mutation](https://img.shields.io/badge/mutation%20score-100%25%20gated-8a2be2)

</div>

---

## The plan

Each step is its own merge to `main`, deployed and visible:

1. **Skeleton** — repo, Vite, Hono Worker, D1 `scores`, gates, CI, both
   hostnames behind Access, the ADRs. A page that says JollyBlue.
2. **The room** — the hall from its data file, low-res toon render,
   isometric camera.
3. **The avatar** — a figure of primitives walking with keyboard or
   gamepad, colliding, the camera following.
4. **Interaction** — highlight and prompt at a cabinet, "OUT OF ORDER", and
   the full game contract with a stub Moon Patrol posting a fake score.
5. **Life** — fal art, attract loops, the high-score table, synthesised
   sound.

The decisions are in [`docs/adr/`](docs/adr/README.md).

## Getting started

```bash
npm install
cp .dev.vars.example .dev.vars   # blank Access vars: every caller is local
npm run db:migrate:local
npm run dev                      # http://localhost:5173, Worker + local D1
npm run gate                     # the quality gate
npm run mutation                 # the mutation gate
```

Deployment is described in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
