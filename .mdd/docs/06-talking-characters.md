---
id: 06-talking-characters
title: Talking Characters - Admiral, Crew Chief, Deck Officer, Wingman
edition: TopRun
depends_on: [01-game-core, 07-i18n, 08-pilot-profiles]
relates: [02-hangar-economy, 03-campaign-map, 04-carrier-takeoff, 05-mission-combat, 25-medal-ceremony]
source_files:
  - src/game/dialogue.ts
  - src/game/dialogue-scripts.ts
  - src/ui/speech.ts
  - src/render/portraits/index.ts
  - src/render/portraits/parts.ts
  - src/render/portraits/types.ts
  - src/render/portraits/features.ts
  - src/render/portraits/hands.ts
  - src/render/typed-text.ts
  - src/render/portraits/admiral.ts
  - src/render/portraits/chief.ts
  - src/render/portraits/shooter.ts
  - src/render/portraits/wingman.ts
  - src/i18n/lines-en.ts
  - src/i18n/lines-de.ts
  - src/scenes/hangar-chief.ts
  - src/scenes/mission/radio.ts
routes: []
models: []
test_files:
  - tests/unit/dialogue.test.ts
data_flow: reads-existing
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [characters, dialogue, speech-bubble, portraits, admiral, debrief, hangar, radio]
path: Game/Characters
integration_contracts:
  - function: "SpeechBox.say(lines) / SpeechBox.update(dt) / SpeechBox.render(ctx)"
    when: "every scene that shows a talking character drives one SpeechBox; nothing else draws speech bubbles"
satisfies_contracts:
  - from: 07-i18n
    function: "line(key, params)"
    when: "every spoken line is looked up through the i18n line tables, never hard-coded"
    status: done
    verified_at: "src/ui/speech.ts:86"
known_issues: []
security_read_sites: []
sister_projects: []
---

# 06 — Talking Characters

> **2026-10-25 update (paint jobs, doc 09):** new lines `adm.livery`, `adm.liveryRare` (debrief) and
> chief event `painted` / line `chief.painted` (hangar PAINT tab).

> **2026-10-25 update (medal ceremony, doc 25):** new admiral lines `adm.medal` (first medal, salute) and
> `adm.medalMore` (each further one, thumbs up), params `{callsign}`, `{medal}`, via `medalLine(index, medal)`
> (no new event table). `SpeechBox` gains optional `layout.holdLast` (the last line stays with its blinking
> cursor until the next `say`; `say([], true)` clears it), `finishLine()` and the `typing` getter.

## Purpose

Four fictional characters talk to the player in comic-style speech bubbles while their vector
portraits "pretend to talk" (animated mouth, blinking, moods, hand gestures, babble voice). They
give the game personality: the admiral delivers the debrief while the pay is counted out, the
crew chief comments in the hangar, the deck officer coaches the carrier launch and the wingman
calls in over the radio during missions.

> **Pixel look (2026-10-25, doc 20):** the portraits are modern hi-res pixel art and the comic bubble is a
> retro RPG text box. `drawPortrait` keeps its API; each character is rasterised through `src/render/pixel/`
> (cached background + outlined figure per animation frame + ambient sprites). Animation is quantised to pixel
> frames: mouth closed/half/open, a 3-frame blink, ±1 px glances, a 2-frame idle phase, a 1-px breathing drop;
> mood tilt is dropped, the mood nod is a whole-pixel drop. Features are hand-placed per pixel
> (`portraits/features.ts`), gestures live in `portraits/hands.ts`. `radio: true` remaps the palette onto a
> green phosphor ramp with pixel scanlines, flicker, noise and corner brackets. `SpeechBox` style `comic` draws
> a dark navy box with a bevelled pixel border, a framed portrait, a gold name plate on the top edge, the line
> in the typewriter font (`FONT_TYPE`) with a blinking block cursor while typing and waiting, and a bobbing ▼
> when more lines are queued; `radio` keeps the green strip with the same typed text and cursor. Timing, voice
> blips, layout rects and the public API are unchanged; the full line is wrapped up front so words no longer
> jump lines while they are typed.

## Architecture

```
game/dialogue.ts          pure: typewriter(), lineDuration(), mouthOpen(), pickVariant()
game/dialogue-scripts.ts  pure: debriefScript(), chiefLine(), shooterLine(), wingmanLine()
                          -> LineRef { key, params, mood, gesture }
i18n/lines-en.ts|de.ts    line pools per LineKey (2–3 variants each, {param} placeholders)
ui/speech.ts              SpeechBox: queue, typewriter, voice blips, portrait + bubble rendering
render/portraits/*        drawPortrait(ctx, id, box, { t, mouth, mood, gesture, radio })
```

Scenes own a `SpeechBox` placed in a fixed layout slot and push `LineRef`s from the script
functions on game events.

## Data Model

```ts
type CharacterId = 'admiral' | 'chief' | 'shooter' | 'wingman';
type Mood = 'neutral' | 'happy' | 'stern' | 'worried';
type Gesture = 'none' | 'thumbsUp' | 'point' | 'salute' | 'facepalm';
interface LineRef { key: LineKey; params?: Record<string, string | number>; mood: Mood; gesture: Gesture }
```

| Character | Name (fictional) | Where | Look | Voice pitch |
|-----------|------------------|-------|------|------------:|
| admiral | Admiral "Ace" Kincaid | Debrief | 80s hotshot-aviator-turned-admiral: gold aviators, swept dark hair, cocky grin, dress whites | 0.85 |
| chief | Chief "Wrench" Kowalski | Hangar | grey flat-top, mustache, brown deck jersey, wrench | 0.75 |
| shooter | Lt. Sam "Shooter" Reyes | Carrier launch | yellow deck jersey, cranial helmet, boom mic | 1.3 |
| wingman | Lt. "Duke" Carter | Mission radio | flight helmet, visor up, mask hanging; radio-feed look | 1.05 (radio) |

All characters are original cartoons — no likeness of any real person or film character.

## API Endpoints

None.

## Business Rules

- **Typewriter**: `typewriter(text, elapsed, cps = 34)` returns the visible prefix; never splits a
  `{param}` (params are substituted before typing). `lineDuration(text) = max(1.8, len / cps + 1.4)`.
- **Mouth**: `mouthOpen(t, talking)` is 0 when not talking, otherwise a deterministic syllable
  pattern in [0, 1] (~9 syllables/s). A voice blip plays on each syllable start while typing
  (not on spaces/punctuation); radio speakers use `radioVoice` and a `radioClick` at open/close.
- **Advance**: a line auto-advances after it has fully typed and been held 1.6 s. Clicking/tapping
  the bubble completes the typing, a second tap skips to the next line. Speech never steals
  keyboard `confirm` from scene buttons.
- **Callsign**: every line may use `{callsign}`; the SpeechBox merges the active pilot's callsign
  (doc 08) into each line's params (admiral openings and finale, chief greetings, shooter spool,
  wingman patrol start and victory use it).
- **Variants**: `pickVariant(pool, seed)` is deterministic per seed; scenes seed with a running
  counter so the same event does not repeat the same sentence twice in a row.
- **Admiral debrief script** (`debriefScript(result, payout, mission, stars, campaignDone)`):
  1. opening by outcome — 3★ (happy, thumbsUp) · 2★ (happy) · 1★ (neutral) · shot down (stern,
     facepalm) · objective failed (stern, point) · aborted (neutral);
  2. one detail line on success — boss destroyed › perfect launch › undamaged hull › kill count;
  3. pay line — "{total}" mission pay on success, salvage on failure;
  4. on a theater's boss mission: the next theater teaser; after mission 30: the campaign finale
     (salute).
  The payout count-up in the debrief runs while lines 1–3 are spoken.
- **Chief** events: enter (rich/poor greeting), buyPlane, buyGun, buySecondary, buyEquipment,
  mount, selectPlane, denied (not enough money), restricted (Phoenix not on this jet), idle (15 s).
- **Shooter** events (since the simplified launch, doc 04): spool, green, notYet, overspeed, locked,
  waitForIt, go, launch, perfect, good, late.
- **Wingman** events (each at most once per mission unless noted): start (objective-flavoured),
  halfway, objectiveDone, bossWarning, hullLow (< 30 %), wingmanSpecial (F-14 special, every use),
  victory.
- **Layout slots** (logical 1280×720): debrief admiral portrait 260×312 at (40, 150), bubble to
  its right; hangar chief 120×144 bottom-left under a shortened item list; takeoff shooter 110×132
  bottom-left; mission radio strip across the top of the playfield (portrait 70×84).

## Data Flow

`MissionResult` + `Payout` + stars (03) → `debriefScript` → `LineRef[]` → `SpeechBox` →
`line(key, params)` (07) → typed text + portrait. Hangar/takeoff/mission scenes call the event
script functions with their own state.

## Dependencies

01 (scenes, input, audio `voice`/`radioVoice`/`radioClick` SFX), 07 (line tables).

## Security

None (static text, no user input rendered).

## Known Issues

(none yet)

## Bugs

(none yet — populated by /mdd bug when issues are reported)
