# 0017 — Mars Patrol 3D's design: side-on, one lane, depth that warns

**Status:** accepted; the scope and the stretch-by-stretch plan are superseded-by-0022
**Date:** 2026-10-04

## Context

Mars Patrol 3D (ADR-0016) replaces the stub behind the game contract
(ADR-0005). It reads only move and action (ADR-0013: the hall owns Back) and
must stay a game whose rules can be tested frame by frame (ADR-0008,
ADR-0019).

## Decision

- **Camera:** side-on 2.5D. A perspective camera off the buggy's left flank,
  pitched 10–15° down, tracking it; the buggy sits about a third of the way
  in so the road ahead is visible. The world is real 3D, with parallax
  layers at real depths.
- **Controls, on the Intent as it is:** `move.x` is the speed lever (right
  accelerates, left brakes, neutral eases back to cruise; the buggy slides
  within the left third of the screen). The press of up — an edge, never
  held — jumps. `action` fires one shot forward along the road and one
  straight up, together. Down does nothing.
- **What 3D adds:** the buggy lives on one lane; the simulation is x along
  the road and y for height. Threats use depth to warn: UFOs fly in from
  the far background before they attack, and a falling bomb throws a shadow
  that grows on the road where it will land. A bomb that misses blows a new
  crater.
- **The first playable version:** one section, checkpoints A → E, ending on
  SECTION CLEAR. Craters, small rocks (jump or one shot), big rocks (two
  shots or a jump), one UFO type that bombs. Mines, tanks, boulders, the
  other UFOs, planes from behind and the sections after E come later.
- **The course is hand-authored data**, one record per section, validated.
  Each letter teaches one thing: A craters; B small rocks; C big rocks and
  crater pairs; D the UFO; E everything, two UFOs at once.
- **Deterministic:** no randomness in gameplay; UFO paths and bomb timings
  are scripted per letter. The core steps at a fixed 1/60 s whatever the
  display's refresh rate. Hit boxes are a little smaller than they look.
  One difficulty; no adaptive difficulty.
- **Scoring:** jumping a crater 50, a small rock 80, a big rock 100 (once
  each, on landing past it); shooting a small rock 100, a big rock 200, a
  UFO 300, a bomb 50. Each checkpoint pays 1,000 plus 100 a second under
  its par time. Clearing the section pays 5,000 plus 2,000 a life left.
- **Lives:** three; extra lives at 10,000 and 30,000. A death respawns the
  buggy at the last checkpoint with the obstacles since restored; score is
  never lost. No continues.
- **A run:** the dive lands on a title screen (the buggy idling, the best
  score, ACTION TO START). A run ends on game over or section clear; then
  the game calls `score(total)` exactly once — zero included — and shows the
  results. Action returns to the title. The game never calls `exit`; Back
  mid-run abandons the run and posts nothing. No pause.
- **Sound:** sound effects synthesised in Web Audio, as recipes in the core;
  the game's own Lyria track, a modern synthwave piece, in a later slice
  under its own record. Game audio goes through the hall's audio graph so
  M mutes it — a change to the contract, recorded when it lands.
- Every number above is a constant in the core, tuned there.

## Consequences

The game is learnable like the original and testable like a function:
scripted inputs give the same run every time. One lane keeps the rules small;
depth carries the novelty without a new input. Variety between runs, a
second difficulty or a pause would each need a new record.

## Alternatives considered

- **A chase camera** — judging a jump at a crater ahead is hard, and
  "forward and up" loses its meaning.
- **An isometric camera** — matches the hall, wastes the frame on a long
  diagonal road.
- **A second button for jump** — closer to the arcade, but changes the hall's
  input layer; a clean upgrade later if jumping on up feels mushy.
- **Depth lanes** — a different game, and no input left to switch lanes.
- **A seeded random course** — variety at the cost of learnability and
  deterministic tests.
- **Posting abandoned runs** — the table would fill with partial runs.
