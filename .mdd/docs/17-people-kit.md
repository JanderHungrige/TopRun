---
id: 17-people-kit
title: People Kit - Reusable Semi-Realistic Human Figures for Sports Minigames
edition: TopRun
depends_on: []
relates: [12-pushup-challenge, 25-medal-ceremony, 30-hangar-base]
source_files:
  - src/render/people/uniform.ts
  - src/render/people/index.ts
  - src/render/people/types.ts
  - src/render/people/palette.ts
  - src/render/people/paths.ts
  - src/render/people/anatomy.ts
  - src/render/people/extremities.ts
  - src/render/people/garments.ts
  - src/render/people/head-profile.ts
  - src/render/people/face-profile.ts
  - src/render/people/hair.ts
  - src/render/people/side-figure.ts
  - src/render/people/front-body.ts
  - src/render/people/front-head.ts
  - src/render/people/front-figure.ts
  - src/render/people/pixel.ts
routes: []
models: []
test_files: []
data_flow: greenfield
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [render, people, characters, anatomy, clothing, minigames, vector-art]
path: Render/People
initiative: off-duty-minigames
wave: off-duty-minigames-wave-2
wave_status: complete
integration_contracts: []
satisfies_contracts:
  - function: "drawSideFigure / drawFrontFigure (src/render/people/index.ts)"
    when: "a sports minigame draws people (push-ups now; beach volleyball, motorbike rider, piano bar, crowds later)"
known_issues: []
security_read_sites: []
sister_projects: []
---

# 17 — People Kit

> **Uniforms and ceremony poses (2026-10-25, doc 25), all additive:** `TorsoWear` adds `dressWhites`
> (standing collar, gold buttons, shoulder boards in `trim`, gold cuff stripes) and `flightSuit` (open collar,
> zip, chest pockets, blank name tape, cuffs in `trim`); both are long-sleeved (`longSleeved(w)`): the whole arm
> takes `top`, in the front and the side view (side view uses the T-shirt region for the body). Details live in
> `uniform.ts`, drawn after the neck. `FrontPose.reach?: [Vec | null, Vec | null]` sets wrist targets in the hip
> frame (shoulders at y −94) per arm, overriding `raise` (salutes, pinning a medal; quantised to 1.5 units in the
> cache key). `drawFrontFigure(…, extras?, opts?: PixelOpts)` passes the art grid to the pixel capture — e.g.
> `{ units: 3 / scale }` keeps a scaled-down figure on the same pixel size as full-size ones.
> `frontChestPoint(turn, x, y)` maps a torso-front point to floor coordinates (for medals on the chest).

> **Side-view pixel grid (2026-10-25, doc 30), additive:** `drawSideFigure(…, face, opts?: PixelOpts)` takes the
> same optional art-grid options as `drawFrontFigure`, so the hangar base's walking pilot (scale 0.5,
> `{ units: 3 / scale }`) sits on the scene's 3-unit pixel grid.

## Purpose

One shared, reusable way to draw people in the sports minigames: semi-realistic illustrated
figures (clean vector, consistent with the game's portraits) instead of per-game stick figures.
Pure drawing code in `src/render/people/` — no game rules, no assets, no real person or film
character likeness (repo and site are public).

> **Pixel look (2026-10-25, doc 20):** `drawFrontFigure` / `drawSideFigure` keep their signatures but now
> draw through `people/pixel.ts`: the pose and face are quantised to animation frames (joints 1.5 units,
> angles 0.02–0.04 rad, raised arms 1/8, strain 1/4, blink 3 levels, time only for a ponytail or sweat), the
> vector figure (`drawFrontVector` / `drawSideVector`) is rendered at about 3 units per art pixel (a whole
> number of device pixels), cleaned up by `pixel/quantize.ts` (hard alpha, 18 dominant flat colours, outline)
> and cached per frame (LRU 700); mirroring and the caller's bounce stay transforms. `FrontExtras.key` (new,
> optional) names what `head` / `chest` draw when they are closures over changing state (the crowd's whistle).

## Style

- **Proportions**: about 7.8 heads tall (`BODY` in `anatomy.ts`, standing height 328 units, head 42);
  broad shoulders, athletic but natural musculature.
- **Shading**: every body part has a flat base, a soft shadow band on the side turned away from the
  light, a highlight stripe on the lit side, and a few soft muscle-definition shapes (deltoid,
  biceps / triceps, forearm, quads, calf, pecs, serratus, obliques, abs, lats, glutes). The light
  comes from above in world space, so a part's lit side follows the pose. Only the silhouette has a
  thin warm outline; muscles are never outlined.
- **Skin tones** (`SKIN` in `palette.ts`): base + highlight + shadow + deep + lip, six presets from
  fair to deep; any custom tone works.
- **Heads**: profile (side figure) with a real skull, brow ridge, nose, lips, chin, jaw shading, ear,
  lidded eyes with iris; three-quarter (front figure) with two lidded eyes, nose, mouth, ears.
  Expressions: `calm`, `effort`, `strain`, `grin`, `exhausted`, `out` (+ `strain` 0..1 for flush
  and sweat, `blink`).
- **Hair**: `crew`, `buzz`, `bob`, `long` (ponytail that hangs with gravity), `messy`.

## Clothing

- `torso`: `shirtless` (bare torso, optional blank dog tags), `tank` (athletic tank top),
  `sportsTop` (athletic crop top), `tshirt` (short sleeves). Garments are clipped to the body
  silhouette, so they fit any pose; the bare variant shows the muscle shading.
- `legs`: `shorts` (sports shorts with a side stripe) or `trousers` (flight-suit trousers with a
  thigh pocket; `tied: true` adds the suit's sleeves knotted round the waist).
- `feet`: `sneakers` or `barefoot`.
- Tasteful and sporty, never sexualised.

## API

```ts
import { drawFrontFigure, drawSideFigure, solveLimb, BODY, type PersonLook, type SidePose } from '../people';

// Side view: the figure faces +x, world down = +y (mirror with ctx.scale(-1, 1) before the call).
// All joints are points in the caller's frame; 1 unit = 1 px at scale 1 (standing height 328).
const pose: SidePose = {
  hip, shoulder,                  // torso: hip joint → shoulder joint
  head: angle,                    // head rotation, 0 = upright
  near: { arm: { shoulder, elbow, wrist, hand: angle }, leg: { hip, knee, ankle, foot: angle, toe: bend } },
  far:  { arm: { … }, leg: { … } }, // drawn behind the body, dimmed
};
drawSideFigure(ctx, look, pose, { expression: 'effort', strain: 0.4, blink: 0, t });

// Three-quarter standing figure (crowds, spectators); origin on the floor between the feet.
drawFrontFigure(ctx, look, { turn: -0.3, raise: [0.8, 0.2], hands: 'open' }, face, {
  head: (ctx, m) => { /* cap, shades: m.fx(x, z) projects a face point for the turn */ },
  chest: (ctx, torso) => { /* whistle, towel: torso.centre(x) */ },
});
```

- `solveLimb(root, end, upper, lower, bend)` is the two-bone IK used for arms and legs
  (`bend` ±1 picks the side the middle joint goes to).
- Every bone stretches to the distance between its joints, so a shorter upper-arm length in the
  IK foreshortens the arm (push-up elbows flaring out).
- `hand` / `foot` are absolute angles of the hand (wrist → fingers) and foot (along the sole);
  `toe` bends the toes / sneaker toe box at the ball of the foot (`BALL`).
- Lengths come from `BODY` (`upperArm 60, forearm 50, hand 34, thigh 80, shin 79, spine 96` …).
- Expressions map to eye opening, lower-lid raise, brow knit / lift, mouth shape and jaw drop
  (`face-profile.ts`), shared by the profile and three-quarter heads.
- Paths are built once (lazily, so tests in Node never touch `Path2D`) and reused every frame;
  per-figure work is transforms + fills. Budget: two side figures + three front figures at 60 fps.

## Business Rules

- Drawing only; no outcome depends on the kit.
- Never depict a real person or an actor's likeness; never ship photos.

## Data Flow

Greenfield: callers pass `PersonLook` data (from their own `src/render/minigames/*-looks.ts`).

## Dependencies

None (Canvas 2D only; `core/math` helpers).

## Security

None.

## Known Issues

(none yet)
