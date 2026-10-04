# AGENTS.md — JollyBlue

A private arcade hall for one owner: you walk an isometric 3D world with an
8-bit, _A Short Hike_ look, and play the games on its cabinets. The first
game is Mars Patrol 3D (ADR-0016). Read `docs/adr/README.md` before non-trivial work.

## The ADR rule

Every architecturally significant decision — new dependency, schema change,
hosting or auth change, a content format, the game contract, a quality-gate
threshold — MUST get a record in `docs/adr/` (use `template.md`, update the
index) in the same commit that implements it. Contradicting an accepted
record needs a superseding one (old one marked `superseded-by-NNNN`), never a
silent change.

## Quality gates

- Run `npm run gate` before committing: typecheck (two tsconfigs), lint at
  zero warnings, Prettier, design-check, coverage thresholds, CRAP, Halstead,
  duplication, dead code. Then `npm run mutation` for the mutation gate. CI
  runs all of it on every push (ADR-0008).
- Coverage and mutation hold the logic core (`shared/`, `worker/`,
  `src/core/`, every `src/games/*/core/`) at 100 %. Rendering
  (`src/render/`, a game's `render/`), `src/main.ts` and a game's
  `index.ts` are outside that set: keep them thin, move anything with a
  branch into a `core/` (ADR-0019).
- Never weaken a threshold or exclude files from a gate without a
  superseding record.
- Design (ADR-0002): scene colours and render knobs come from
  `src/palette.ts`, DOM styling from `src/styles.css`; design-check rejects
  anything raw elsewhere.
- Production is `main`: merging deploys to jollyblue.effectivecode.co.uk and
  jollyblue.gioscalzo.com behind Cloudflare Access (ADR-0009,
  `docs/DEPLOYMENT.md`).

## Invariants

- One owner: no users table, no application auth. Cloudflare Access does
  auth; the Worker admits an email identity only (ADR-0007).
- The repository is public: code and content only. Scores live in D1.
- Placeholder cabinets carry invented titles, never real trademarks
  (ADR-0004).
- The fal key never leaves the owner's shell (ADR-0011).

## Key paths

- `shared/` — contracts (`types.ts`) and rules (`scores.ts`) shared by the
  Worker and the hall
- `worker/` — Hono API: `app.ts`, `access.ts` (JWT), `scores.ts`; route tests
  run against the real migrations through `worker/test/fake-d1.ts`
- `src/` — the hall: `core/` (tested logic: geometry, hall data, input,
  avatar, session, game contract, music loop, scoreboard, pixel font),
  `render/` (Three.js and the DOM overlays), `games/` (one folder per game,
  `core/` + `render/` + `index.ts`, registered in `games/index.ts`; games are
  full-resolution and shiny, ADR-0018), the wiring (`main.ts`, `devices.ts`,
  `sound.ts`, `scorebook.ts`, `game-slot.ts`), `palette.ts`, `styles.css`
- `art/manifest.json` — the art recipes; `public/art/` — the committed PNGs;
  regenerate with `node scripts/generate-art.mjs` (needs `FAL_KEY`)
- `art/music.json` — the hall track's recipe; `public/music/hall.mp3`;
  regenerate with `node scripts/generate-music.mjs`, then re-check its
  outro and `loopEnd` in `src/core/music.ts` (ADR-0015)
- `scripts/` — the gate scripts and the art pipeline
- `migrations/` — D1 schema; `docs/adr/` — the decisions
