---
id: 21-beach-volleyball
title: Beach Volleyball - 2-on-2 at Sunset, You and Duke Against Two Rival Pilots
edition: TopRun
depends_on: [10-minigames-core, 17-people-kit, 20-retro-look]
relates: [10-minigames-core, 12-pushup-challenge, 17-people-kit, 20-retro-look]
source_files:
  - src/game/minigames/volleyball.ts
  - src/game/minigames/volleyball-state.ts
  - src/game/minigames/volleyball-rally.ts
  - src/game/minigames/volleyball-touch.ts
  - src/game/minigames/volleyball-ball.ts
  - src/game/minigames/volleyball-hit.ts
  - src/game/minigames/volleyball-athlete.ts
  - src/game/minigames/volleyball-ai.ts
  - src/game/minigames/volleyball-score.ts
  - src/scenes/minigames/volleyball.ts
  - src/scenes/minigames/volleyball-fx.ts
  - src/scenes/minigames/volleyball-banter.ts
  - src/scenes/minigames/registry.ts
  - src/render/minigames/volleyball-set.ts
  - src/render/minigames/volleyball-court.ts
  - src/render/minigames/volleyball-looks.ts
  - src/render/minigames/volleyball-poses.ts
  - src/render/minigames/volleyball-players.ts
  - src/render/minigames/volleyball-hud.ts
  - src/render/minigames/volleyball-box.ts
  - src/render/minigames/volleyball-icon.ts
  - src/i18n/minigames/volleyball.ts
  - src/i18n/minigames/volleyball-lines.ts
routes: []
models: []
test_files:
  - tests/unit/volleyball.test.ts
  - tests/unit/volleyball-match.test.ts
  - tests/unit/volleyball-pilots.test.ts
  - tests/unit/volleyball-bots.ts
data_flow: reads-existing
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [minigames, off-duty, beach-volleyball, sports, sunset, rally-scoring, ai-teammate, people-kit, pixel-art]
path: Game/Minigames/BeachVolleyball
initiative: off-duty-minigames
wave: off-duty-minigames-wave-4
wave_status: complete
integration_contracts:
  - function: "MinigameModule (src/scenes/minigames/contract.ts)"
    when: "VOLLEYBALL is listed in PLAYABLE; the shell runs rules, 3-2-1, pause, result and saving"
  - function: "drawSideFigure / drawFrontFigure (src/render/people/index.ts, doc 17)"
    when: "the four players are side figures in volleyball poses; spectators and the rivals' banter busts are front figures"
  - function: "drawPortrait('wingman') + pixelFrame / typedLines (doc 20)"
    when: "banter lines in the retro RPG text box"
satisfies_contracts: []
known_issues:
  - "Balance comes from simulated players (tests/unit/volleyball-bots.ts) and an in-browser keyboard bot; no human playtest yet. The bots read the ball path exactly (humans get the same information from the landing marker, but react later)."
  - "Side view, one lateral dimension: digs and blocks are decided by depth, height and timing only; there is no line / cross-court choice."
  - "AI attackers may pick any landing depth (the open spot between the defenders); you aim with three depths (short = tip, middle, deep)."
  - "Duke never saves a ball that is assigned to you (marker cyan); if you leave it, it drops."
  - "The rivals' banter busts are people-kit front figures cropped to head and shoulders, so their faces are a few art pixels (doc 20 known issue)."
  - "When two athletes of a team stand at the same spot their figures overlap; AI support spots keep 1.2 m from the partner, the player can still walk into Duke."
security_read_sites: []
sister_projects: []
---

# 21 — Beach Volleyball

## Purpose

Minigame 4 of the off-duty initiative (unlocks after mission 6, doc 10): 2-on-2 beach volleyball at
sunset on the base beach, side view. The player (in the active pilot's look) and the wingman
Lt. "Duke" Carter play against two pilots from the other squadron — Lt. Marcus "Breaker" Hale and
Lt. Theo "Riptide" Navarro (original characters, not anyone from a film). Arcade and readable, not a
simulation: you run, jump, bump, set and spike; Duke is an AI teammate who sets you up; the rivals
get better as the match heats up. For fun only (best score and medal per pilot, doc 10).

## Architecture

```
game/minigames/volleyball-ball.ts     court / net / gravity constants, exact ball flight (parabola), net
                                      collision (side, tape), predictions (time to a height, landing x,
                                      net crossing height), lob / drive launch helpers
game/minigames/volleyball-hit.ts      reach zones (ground — smaller for hard balls —, air, dive, serve,
                                      block), contact quality, every hit's outcome (pass, set, lob, spike,
                                      tip, serve) with seeded error, the block deflection
game/minigames/volleyball-athlete.ts  the four athletes: run / jump / dive / swing physics, sides, facing
game/minigames/volleyball-ai.ts       touch rules, who plays the next touch, AI reaction / decisions rolled
                                      per ball path (replan), support and defence spots, block jumps, the
                                      path-reading attack choice (openAim / shotFor)
game/minigames/volleyball-score.ts    rally scoring to 7 / win by 2 / cap 9, serve order, final score,
                                      medals, rival skill by score, the pure rand()
game/minigames/volleyball-state.ts    VbState, VbEvent, VbInput, VB_RULES, serve positions
game/minigames/volleyball-touch.ts    a contact (kind, accuracy, target, touch count), the block at the
                                      net, the rally's end (in / out, reason, point, next server)
game/minigames/volleyball-rally.ts    one rally tick: your input, AI intents, contacts, movement, flight
game/minigames/volleyball.ts          createVolleyball / stepVolleyball: serve → live → dead → … → over
scenes/minigames/volleyball.ts        VOLLEYBALL: MinigameModule; VolleyballRound maps keys / pad / touch
                                      onto VbInput, steps the rules, draws the beach in order
scenes/minigames/volleyball-fx.ts     events → sounds, quality pop-ups, sand puffs, point / match banner, cheer
scenes/minigames/volleyball-banter.ts which line on which event, typing, voice syllables
render/minigames/volleyball-set.ts    the sunset beach as pixel art (640 × 360 art buffer, 2 px per art px)
render/minigames/volleyball-court.ts  world → screen, court lines, net + posts (oblique), ball sprite, shadow,
                                      speed trail, landing marker, sand puffs
render/minigames/volleyball-looks.ts  people-kit looks: player per avatar, Duke, Breaker, Riptide, spectators
render/minigames/volleyball-poses.ts  athlete state → side-figure key frames (ready, idle, run ×8, backpedal,
                                      rise, fall, spike ×3, tip, block, bump, set, serve hold / toss / hit,
                                      dive lunge / lie, cheer, slump)
render/minigames/volleyball-players.ts the athletes with shadows; the six spectators on the far sand
render/minigames/volleyball-hud.ts    scoreboard (serve ball, touch pips, MATCH POINT), pop-ups, banners,
                                      key-cap hints, touch strip, your marker
render/minigames/volleyball-box.ts    banter in the RPG text box (Duke's portrait / the rivals' pixel busts)
render/minigames/volleyball-icon.ts   hub / offer card icon
i18n/minigames/volleyball.ts          EN + DE UI strings (rules, controls, HUD, pop-ups, banners, score)
i18n/minigames/volleyball-lines.ts    EN + DE banter lines (Duke, Breaker, Riptide)
```

`stepVolleyball(state, input, dt)` is pure and deterministic for a seed: it never mutates its argument
(each step works on a shallow copy and replaces nested objects) and returns the next state with the
step's `events` (serve, toss, catch, swing, hit, jump, dive, land, net, block, bounce, point, over). The
scene only presents events; it never decides an outcome.

## Business Rules

### Court (world units: metres; x = 0 is the net, your side is x < 0)
- Court half length **7 m** (arcade: real courts are 8 m), net **2.30 m**, ball radius 0.11 m, ball
  gravity **10 m/s²** (exact parabola, no drag). The ball is **in** when its centre lands within
  |x| ≤ 7 + radius (touching the line is in).
- Net: a vertical segment at x = 0. A ball hitting its side drops back (vx × −0.25); a ball clipping
  the tape bounces off it (restitution 0.4) and may fall either side.
- Athletes stay on their side, 0.25 – 9.5 m from the net.

### Athletes
- Run **5.4 m/s** (you; AI 4.2 + 1.6 × skill), acceleration 40 m/s². Jump 4.8 m/s with body gravity
  12 m/s² → **0.96 m**, **0.8 s** in the air, small air control.
- **Swing**: HIT swings at once; for **0.30 s** the ball is hit at its closest point inside the reach
  zone, then **0.2 s** recovery before the next swing (mashing does not help).
- **Reach zones** (f = towards the net):
  - ground (bump / set): a capsule 0.35 – 2.30 m above the feet, centred 0.3 m in front, radius
    0.75 m; a **hard ball** (≥ 12 m/s: spikes, fast serves) only 0.35 – 1.0 m, radius 0.55 m — a spike
    flying past at chest height is beaten;
  - air (spike / tip): centred 0.35 m in front and 2.45 m above the feet, radius 0.9 m;
  - dive: a ball below 1.0 m and within 2.1 m that the ground zone can't reach → HIT lunges at it
    (6.5 m/s, 0.8 s in the sand; reach radius 0.6 m around a point 0.5 m ahead, 0.35 m up), the touch
    counts with quality × 0.6;
  - serve: radius 0.5 m around 2.55 m up, 0.3 m in front;
  - block: in the air within 0.7 m of the net with the feet ≥ 0.4 m up; the hands cover a ball crossing
    the net between the tape and 2.25 m above the feet. The top 0.25 m is a fingertip touch: the ball
    pops up on the blocking side; below it the ball is **stuffed** back down on the attackers' side.
- **Contact quality** q = 1 − (distance / radius)² (square fall-off: forgiving near the centre);
  a hard incoming ball takes up to 45 % off (9 → 18 m/s). Pop-up "PERFECT" ≥ 0.75, "GOOD" ≥ 0.4,
  else "SHANKED". The AI uses its rolled accuracy (below) instead of the geometry.

### Touches and what a hit does
- Up to **3 touches per team**, never the same athlete twice in a row; a hit that would break this
  does not happen (the ball passes). A block counts as the blocking team's touch; a ball stuffed back
  gives the attackers three fresh touches. The serve uses up the serving team's touches.
- The kind comes from the hitter's state, the target from the touch number:
  - ground hit, touch 1 → **pass** (**dig** when diving) to the setter spot 1.3 m from the net (apex 4.3 m,
    down to 2.0 m); to you when Duke passes;
  - ground hit, touch 2 → **set** to the attack spot 1.4 m from the net (apex 5.2 m, down to 3.1 m);
    Duke's sets and passes to you go where you stand, kept 1.0 – 2.6 m from the net;
  - ground hit, touch 3 → **lob** over the net (apex 4.6 m, raised until it clears the tape);
  - air hit → **spike** (**13 + 7 q m/s**, as shallow as the aim allows while clearing the tape by
    0.12 m; from far back it slows down) or, aiming short, a **tip** (0.7 m above the contact, soft, lands
    short behind the block);
  - serve → float serve (**8.5 + 3.5 q m/s**, slowed until it clears the tape at the aimed depth).
- **Aim** (spike, lob, serve): hold towards the opponents → deep (6.0 m past the net), hold away →
  short (1.8 m; in the air: the tip), nothing → middle (3.6 m).
- **Error** grows with (1 − accuracy)²: up to ±3.0 m on passes, ±2.2 m on lobs, ±3.2 m on spikes,
  ±3.0 m on serves (applied to the depth before the clearance search, so a poor attack lands long or
  short, not in the net); apex error ±1 m × (1 − accuracy). Below 0.2 a pass / set / lob is **shanked**
  (flies off behind the hitter) and a spike goes into the net; a serve below 0.15 goes into the net.

### Who plays the ball
- After every change of the ball's path (hit, net, block, serve) the next touch is assigned: on the
  side where the ball comes down, the athlete closer to where it drops through 1 m — or, for the team that
  touched it last, the partner of the last toucher (nobody once the three touches are used). The landing
  marker shows it: cyan you, gold Duke, red a rival, grey nobody. You may still play a ball assigned to
  Duke if you get there first.
- AI athletes leave a ball they judge out (judgement error ± (1 − skill) × 0.9 m).
- Duke: passes to you, sets you, blocks at the net or covers the short ball; when Duke takes the first
  touch you get the second (an air hit attacks; a ground hit sets Duke, who attacks on three).

### AI (Duke 0.85; rivals rising)
- **Rival skill = min(0.9, 0.38 + 0.05 × your points + 0.02 × their points)** — sloppy at 0 : 0, sharp
  once you lead.
- Rolled once per ball path (seeded): reaction delay **0.32 − 0.22 × skill s** (no move, no swing),
  accuracy uniform in **[skill − 0.25, skill + 0.10]**, block attempt **0.04 + 0.22 × skill**, block
  timing (0.05 + (1 − skill) × 0.6 × u s after the attacker leaves the sand), **dig chance against a hard
  ball 0.2 + 0.55 × skill**, dive for an unreachable low ball (chance = skill), the back defender's cover
  spot (mid 3.4 m or deep 5.4 m, 50 / 50), and whether it attacks smart (chance = skill) or with a random
  aim.
- Run speed 4.2 + 1.6 × skill. Attacks on the third touch when the ball can be met 3.2 m high within
  4.2 m of the net (jumping 0.4 s before), otherwise a lob.
- Defence against a coming attack (the opponents have a second or third touch): the net player blocks at
  0.45 m (if its block roll says so) or drops to 2.0 m for the short ball; the back player stands on its
  cover spot. Support spots otherwise: setter 1.3 m, attacker approach 2.9 m, cover 2.4 m, defence
  1.6 / 4.6 m; never closer than 1.2 m to the partner.
- **Smart attack**: simulates every candidate (tip, or a spike landing 2.4 … 6.5 m deep) and picks the
  one whose path stays farthest out of the defenders' reach (allowing them to run 5 m/s after 0.2 s);
  a path into a raised block is ruled out (→ the tip). You get the same read when you look: hit where
  the defender is not — the back defender covers either the middle or the deep ball, never both.

### Serve
- **Rally scoring**: every rally gives a point; the rally winner serves next; when a team wins the serve
  back (side-out) its other player serves. Your team serves first, you first.
- Server 7.8 m from the net behind the baseline, partner at 1.8 m; receivers front 2.0 m / back 5.0 m
  (you receive deep, Duke at the net). Everyone walks back to these spots during the point pause.
- Your serve: HIT tosses (by itself after 4 s), HIT again hits it at the top. The first toss that falls
  below 0.9 m is caught and tossed again; a second one is a **serve fault**. AI servers toss after 1.1 s.

### Rally end
- The ball reaches the sand: in → the other team scores; out → the team that touched it last loses the
  point (an out serve: the server's team). A rally is cut off after 40 s or if the ball leaves the
  picture (14 m) — out. Reasons (pop-up banner and banter): **ace** (serve lands in untouched),
  **kill** (spike / tip), **block** (stuffed ball), **out**, **net** (into the net and down on the
  hitter's side), **fault** (serve fault), **drop** (anything else). 2.0 s pause (winners cheer, losers
  slump), walking back from 0.9 s.

### Match and score
- **First to 7, win by 2, cap 9** (8 : 8 → the next point wins 9 : 8).
- **Score = your points − their points + 5 for a win** (`higherIsBetter: true`, formatted with its
  sign: "+7 pts" / "−3 pts"). Any win is at least +6 (9 : 8); a 7 : 0 shutout is +12.
- **Medals: bronze +6 (any win), silver +8 (win by 3), gold +10 (win by 5)**.

### Controls
- Keyboard: ← / → (A / D) run, ↑ (W) jump, SPACE hits when the ball will be in reach within 0.4 s,
  otherwise jumps (or dives at a low ball just out of reach); in the air SPACE spikes. Hold ← / → while
  hitting to aim (also for the serve).
- Gamepad: stick / d-pad run and aim, up jumps, A = SPACE.
- Touch / mouse: drag in the sand strip at the bottom (y ≥ 620) to run — the player follows the finger;
  tap or click above it = SPACE.
- P / Esc pauses (shell).

## Presentation
- Sunset on the base beach as pixel art, painted once into a 640 × 360 buffer (2 logical px per art
  pixel): banded sky with checker seams and stars, the striped setting sun with its glow, cloud streaks,
  the sea with a carrier silhouette on the horizon, palms, the far sand, speckled court sand. Live on
  the same grid: sun glitter on the water, foam, twinkling stars, two gulls, a jet with a contrail every
  28 s.
- The court in a slight oblique view (far sideline 30 px up, 40 px right of the near one): lines,
  the net mesh with tape and posts (red / white antenna), everyone on the middle line. 74 px per metre.
- Players: people-kit side figures (doc 17) as pixel art (doc 20), **all shirtless** (owner decision for
  sports scenes), athletic, tasteful, barefoot in shorts. The player keeps the avatar's skin, hair,
  eyes and torso choice, shorts in the avatar's flight-suit colour; Duke navy shorts; Breaker (deep skin,
  buzz cut) red; Riptide (tan, sun-bleached messy hair) teal. Poses are fixed key frames (run 8 frames,
  backpedal, jump rise / fall, spike cock / hit / follow-through, tip, block, bump, set, serve hold /
  toss / hit, dive lunge / lying, cheer with a hop, slump with hands on the knees); the head tilts to
  the ball in three steps; faces: effort when hitting, grin when cheering, exhausted when slumping.
  Six spectators (front figures, crew off duty, mixed outfits) on the far sand cheer on points.
- The ball: a 10 × 10 art-pixel sprite with three-colour panels, 8 spin frames; a shadow on the sand; a
  speed trail on hard balls; the landing marker (dashed ring) in the colour of whoever plays it; sand
  puffs on jumps, landings, dives and where the ball hits the sand; a cyan arrow over your head.
- HUD: scoreboard (callsign · DUKE vs. BREAKER · RIPTIDE, big digits, the leader in gold, a serve ball,
  three touch pips for the team in possession, a blinking MATCH POINT tab), quality pop-ups, a point
  banner (KILL! / ACE! / BLOCKED! / OUT! / NET! / SERVE FAULT / DOWN! + OUR POINT / THEIR POINT), the
  big end banner (YOU WIN! / THEY WIN! with the score and your kills · aces · blocks), key-cap hints for
  your serve (SPACE: TOSS / SERVE, ← SHORT · DEEP →), the touch strip on touch devices.
- Banter in the retro RPG text box (doc 20), top left for Duke (his pixel portrait, mouth animated while
  typing, mood by line), top right for the rivals (a pixel bust cropped from their front figure on a
  sunset backdrop). Typed out with `voice` syllables (Duke 1.05, Breaker 0.78, Riptide 1.22). Lines on
  the first serves, on most points (always on aces, blocks, match points; three of four other points),
  and at the end. All lines original.
- Sounds (existing SFX only): pass / dig / lob `uiMove` 0.55, set `uiMove` 0.75, tip `uiMove` 1.2,
  spike `hit`, serve `hit` 0.8, block `special`, net `flare` 0.45, jump `uiMove` 1.8 (quiet), dive
  `splash`, ball in the sand `hit` 0.35, whistle `uiSelect` 1.9, toss / catch `uiMove`, point won `pickup`,
  point lost `denied`, match won `powerup` / lost `denied`; everything panned by x.

## Balance playtest (2026-10-25)

Simulated players (`tests/unit/volleyball-bots.ts`) press real inputs into `stepVolleyball`: after a
reaction time (× 1.6 for hard balls) they run to where the ball drops, with Gaussian noise on where they
stand, when they press SPACE and when they jump (sampled once per touch); they attack on touch 2 / 3 with
some probability, and a smart share of them reads the defence like the AI (`openAim`). 24 seeds:

| Player | react | timing σ | place σ | p10 | p50 | p90 | wins | ≥ silver | gold | your spikes: kill / blocked |
|---|---|---|---|---|---|---|---|---|---|---|
| Does nothing | — | — | — | −7 | −5 | −3 | 0 % | 0 % | 0 % | — |
| Novice (attacks half the time, never aims) | 0.34 s | 110 ms | 0.45 m | −5 | −2 | +9 | 21 % | 21 % | 8 % | 31 % / 13 % |
| Casual (aims 30 %) | 0.26 s | 75 ms | 0.30 m | −3 | +7 | +10 | 54 % | 42 % | 13 % | 31 % / 11 % |
| Good (aims 60 %) | 0.20 s | 50 ms | 0.18 m | +7 | +10 | +12 | 92 % | 83 % | 50 % | 37 % / 7 % |
| Pro (aims 90 %) | 0.14 s | 30 ms | 0.10 m | +10 | +11 | +12 | 100 % | 100 % | 92 % | 46 % / 5 % |

Rival spikes kill 29 % against the novice, 20 % casual, 9 % good, 6 % pro. A match takes about 2 minutes
(113 – 136 s of play for the bots). `tests/unit/volleyball-pilots.test.ts` asserts the key rows over 12
seeds (idle never wins, medians rise with skill, novice ≤ 40 % wins, casual ≥ 25 %, good ≥ 75 % with
≥ 25 % gold, pro ≥ 90 % with ≥ 60 % gold).

How the numbers got here (each step re-run against the players above):
- First draft (spikes 11 + 6 q, 3 aims, defenders where the ball comes down): the game was all defence —
  rivals dug ~80 % of the best player's spikes and Breaker stuffed 30 %; even the pro lost every match.
  In a side view the back defender stands on every spike's path.
- Hard balls can only be dug low (capsule 1.0 m, radius 0.55 m), spikes 13 + 7 q, quadratic quality,
  errors before the net-clearance search (AI serves no longer dump into the net), block attempts
  0.04 + 0.22 × skill with a 0.4 m lift, an explicit hard-ball dig chance 0.2 + 0.55 × skill, and
  defenders that commit to a visible cover spot (mid or deep) — "hit where he isn't" became the skill.
- Rival spikes stayed harmless: sets went 2.2 m from the net, so the clearance search pushed every rival
  spike deep through your reach → sets 1.4 m from the net, AI attacks read the defence path and may pick
  any depth.
- Air zone radius 0.8 → 0.9 m and a 0.26 → 0.30 s swing window (forgiving for people, little change
  for the bots); rival base skill 0.45 → 0.38 so that a casual player wins about half the matches.

**Browser** (dev server 5174, 1280 × 720, an in-page keyboard bot sending real `KeyboardEvent`s, frames
captured from the canvas): full match 6 : 8 (−2, NO MEDAL, the shell's result card and personal best),
kills, an ace, Duke's stuff block, Riptide's dive, every banner and the end banner checked on screen;
touch: a tap tosses and serves, a drag in the strip moves the player; German texts checked (rules card,
HUD, touch strip). Update + render ≈ 0.4 ms per frame on average (one-off spikes while pose frames are
first cached).

## Data Flow

Reads `game.profile` (callsign, avatar) for the label, lines and colours. Writes nothing itself: the
shell records the score (doc 10).

## Dependencies

10 (contract, shell, medals, `gameText` / `mt`), 17 (people kit; Duke's and the avatars' push-up looks,
doc 12), 20 (pixel pipeline, RPG text box, typewriter text), 06 (Duke's portrait, `typingTime`,
`syllableIndex`), 01 (input, audio).

## Security

None (no persisted data of its own).

## Known Issues

See `known_issues` in the frontmatter.

## Bugs

(none yet — populated by /mdd bug when issues are reported)
