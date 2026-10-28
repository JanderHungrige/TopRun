---
id: 41-rank-quiz
title: Rank Quiz - Name the Insignia of US and German Navy and Army Ranks
edition: TopRun
depends_on: [10-minigames-core, 11-base-hub, 07-i18n]
relates: [10-minigames-core]
source_files:
  - src/data/rank-quiz.ts
  - src/game/minigames/ranks.ts
  - src/scenes/minigames/ranks.ts
  - src/scenes/minigames/ranks-phases.ts
  - src/render/minigames/ranks.ts
  - src/render/minigames/rank-insignia.ts
  - src/render/minigames/rank-insignia-us.ts
  - src/render/minigames/rank-sprites.ts
  - src/i18n/minigames/ranks.ts
routes: []
models: []
test_files:
  - tests/unit/rank-quiz.test.ts
data_flow: greenfield
last_synced: 2026-10-28
status: complete
phase: all
mdd_version: 11
tags: [minigames, quiz, ranks, insignia, navy, army, bundeswehr]
path: Game/Minigames/RankQuiz
initiative: off-duty-minigames-2
wave: off-duty-minigames-2-wave-1
wave_status: active
integration_contracts:
  - function: "MinigameModule (src/scenes/minigames/contract.ts), PLAYABLE (registry.ts)"
    when: "the rec room plays `ranks` once mission 10 is cleared; the shell runs rules card, 3-2-1, the round, the result"
satisfies_contracts: []
known_issues:
  - "Insignia are drawn from the Wikipedia comparison tables (NATO armies / navies, officers / enlisted, 2026-10-28), simplified to pixel art: German shoulder-strap piping is one neutral colour, not the branch colours; US Navy petty officers and chiefs use the collar devices (no rating mark)."
  - "US Army Private E-1 (no insignia) is left out; 'Private' is the E-2 with one chevron."
  - "v1 (ten text questions): German enlisted ranks without a NATO code only appeared in order questions — moot since the rework (no codes asked)."
security_read_sites: []
sister_projects: []
---

# 41 — Rank Quiz

> **2026-10-28 rework (owner: *"I would rather have the rank symbol shown and asked what it is called. Separated
> german english. First show all, then ask for random 5"*; answer: *pick one of 4 charts*).** The first version
> (ten text questions mixing all four forces: which is higher, pay grades, NATO codes, equivalents) is replaced:
> the player picks **one chart**, studies **all its insignia with their names**, then names **5 random insignia**.
> **Owner exception to the no-insignia rule** (public site): the Rank Quiz shows real rank insignia, redrawn in
> pixel art. Unlocks after mission 10.

## Flow

1. **Pick a chart** — four cards: US NAVY, US ARMY, MARINE (German Navy), HEER (German Army). ← → / ↑ ↓ /
   hover move, ENTER / click / tap picks. The language does not decide; any player may pick any chart.
2. **Study** — every rank of the chart in one grid, lowest top-left, each tile its insignia with the name under it.
   No clock, no score. ENTER / the READY button / a tap on it starts the quiz.
3. **Quiz** — **5 random ranks** of that chart, never the same twice: the insignia big on the left, four names on
   the right (the right one and three others of the same chart, mostly near it in rank — the hard ones). **12 s**
   each: 100 + up to 50 for speed, 0 for wrong or time out. After each answer the right name lights green (a wrong
   pick red) for 1.8 s ("Hauptbootsmann"); ENTER / tap skips. Score 0 … 750, higher is better. Medals: **bronze 400,
   silver 550, gold 700**.

## The charts (`src/data/rank-quiz.ts`)

Lowest first; each rank is a name (proper name, the same in EN and DE) and an insignia descriptor drawn by
`render/minigames/rank-insignia*.ts`:

| Chart | Ranks | Insignia system (as on the reference tables) |
|-------|-------|-----------------------------------------------|
| US Navy (19) | Seaman Recruit, Seaman Apprentice, Seaman, Petty Officer Third / Second / First Class, Chief, Senior Chief, Master Chief Petty Officer, Ensign, Lieutenant Junior Grade, Lieutenant, Lieutenant Commander, Commander, Captain, Rear Admiral (lower half), Rear Admiral, Vice Admiral, Admiral | 1 / 2 / 3 white diagonal stripes on navy blue; silver eagle over 1 / 2 / 3 chevrons; gold fouled anchor with silver "USN", + 1 / 2 silver stars; gold sleeve stripes under a star: 1 medium; medium + thin; 2 medium; medium, thin, medium; 3; 4; 1 wide; wide + 1 / 2 / 3 medium |
| US Army (21) | Private, Private First Class, Specialist, Corporal, Sergeant, Staff Sergeant, Sergeant First Class, Master Sergeant, First Sergeant, Sergeant Major, Command Sergeant Major, Second / First Lieutenant, Captain, Major, Lieutenant Colonel, Colonel, Brigadier / Major / Lieutenant General, General | light chevrons on dark green: 1; 1 + rocker (closed); the specialist shield with an eagle; 2; 3; 3 + 1 / 2 / 3 rockers; + diamond; + star; + star in a wreath; on dark shoulder marks: gold bar, silver bar, two silver bars, gold oak leaf, silver oak leaf, silver eagle, 1 – 4 silver stars |
| Marine (26) | Matrose, Gefreiter, Obergefreiter, Hauptgefreiter, Stabsgefreiter, Oberstabsgefreiter, Korporal, Stabskorporal, Maat, Obermaat, Bootsmann, Oberbootsmann, Hauptbootsmann, Stabsbootsmann, Oberstabsbootsmann, Leutnant zur See, Oberleutnant zur See, Kapitänleutnant, Stabskapitänleutnant, Korvettenkapitän, Fregattenkapitän, Kapitän zur See, Flottillenadmiral, Konteradmiral, Vizeadmiral, Admiral | gold on navy blue: none; 1 – 5 diagonal stripes; a wide band; wide band + thin stripe; hexagon with a dark diamond; + a chevron; 1 / 2 chevrons; the loop ("Kopfwinkel") over 1 / 2 / 3 chevrons; gold sleeve stripes under a star: 1 medium; 2; medium, thin, medium; medium, thin, thin, medium; 3; medium, medium, thin, medium (top); 4; wide + thin; wide + 1 / 2 / 3 medium |
| Heer (26) | Soldat, Gefreiter, Obergefreiter, Hauptgefreiter, Stabsgefreiter, Oberstabsgefreiter, Korporal, Stabskorporal, Unteroffizier, Stabsunteroffizier, Feldwebel, Oberfeldwebel, Hauptfeldwebel, Stabsfeldwebel, Oberstabsfeldwebel, Leutnant, Oberleutnant, Hauptmann, Stabshauptmann, Major, Oberstleutnant, Oberst, Brigadegeneral, Generalmajor, Generalleutnant, General | grey shoulder strap with a button: plain; 1 – 5 diagonal bars; a wide bar; wide + thin bar; gold braid open at the bottom; braid all round; + 1 / 2 chevrons; + loop over 1 / 2 / 3 chevrons; silver pips 1 / 2 / 3 (column), 4 (Stabshauptmann: 2 + a pair); silver oak wreath + 1 / 2 / 3 pips; gold wreath + 1 – 4 gold pips (generals, red piping) |

Sources: Wikipedia, "Ranks and insignia of NATO armies officers / enlisted" and "… NATO navies' officers /
enlisted" (Germany and United States rows), viewed 2026-10-28.

## Pure parts (`src/game/minigames/ranks.ts`)

`makeQuiz(chart, seed)` → 5 questions `{ index, options: string[], answer }`: five different ranks; options are
the right name plus three other names of the chart, drawn from the nearest ranks first (±3, then anywhere);
shuffled; deterministic for a seed. `answerPoints(correct, timeLeft)` = 100 + round(50 × timeLeft / 12), 0 when
wrong. `RANK_QUIZ = { questions: 5, time: 12 }`, `RANKS_MEDALS`.

## Screen (logical 1280 × 720)

Ready-room wall (dark panels, table edge). Every insignia sits on a **paper plate** (like a printed rank chart) so
dark cloth shows against the dark boxes. The art is a 32 × 52 pixel buffer per rank (`rank-sprites.ts` kit:
patches, straps, chevrons, bands, hand-made sprites for stars, pips, eagle, anchor, oak leaf, wreaths, the loop),
painted once and cached, drawn with smoothing off — snapped to whole device pixels per art pixel unless that
changes its size by more than 15 % (small canvases keep the size).
**Pick**: four cards (270 × 340) side by side, a sample insignia at 4× (US Navy Commander, US Army Master Sergeant,
Kapitän zur See, Hauptmann), the chart name and its subtitle. **Study**: the chart title and "n ranks, lowest
first", a grid of three rows (as many columns as needed, tiles up to 150 × 152: insignia 2× on paper, the name
under it in at most two lines, smaller then squeezed when a word is long), the READY button on the table bottom
right. **Quiz**: "QUESTION 2 / 5" and the chart tag, the insignia 6× on paper in a frame on the left
(x 120 … 500), "Who wears this?" and four name cards stacked on the right (x 560 … 1160), the timer bar under both,
the verdict and the rank's name at the bottom.

## Text

`src/i18n/minigames/ranks.ts` (EN + DE): rules, controls, chart names (US NAVY / US ARMY / MARINE / HEER — the
German names stay German in EN, with a subtitle "German Navy" / "German Army"), "Study the insignia, then name five
of them", READY, question counter, "Who wears this?" / "Wer trägt das?", verdicts, score format.

## Verification (2026-10-28)

Vitest `rank-quiz.test.ts` (9): chart sizes 19 / 21 / 26 / 26, unique names and **unique insignia** per chart (a
shared one could not be named), the pick-card samples exist; rounds of five different ranks with four different
names and the right one at `answer` (40 seeds × 4 charts), wrong names all within ±3 ranks, same seed same round,
the answer slot moving, every rank reached over 200 rounds; points 150 / 125 / 100 / 0 and the medals. The German
insignia were re-checked against the reference tables (Heer enlisted and officers, Marine enlisted) before
drawing. Dev server: contact sheet of all 92 insignia; rules card → pick (arrows move, MARINE / HEER) → study grid
(26 tiles, READY) → five questions (verdict green / red, the name under it) → result card (298 points for always
answering card 1); the rec-room card shows the icon.

## Business Rules

- Never the same rank twice in a round; exactly one right option per question (names in a chart are unique).
- The study grid shows every rank of the chart, in order, before any question.

## Dependencies

10 (shell, medals, bests), 11 (rec-room card), 07 (languages).

## Security

None (static data, local scores).

## Known Issues

- Insignia are simplified pixel art of the reference tables: one neutral piping colour on German shoulder straps
  (not the branch colours); US Navy petty officers and chiefs use the collar devices (no rating mark).
- US Army Private E-1 (no insignia) is left out; "Private" is the E-2 with one chevron.

## Bugs

(none yet — populated by /mdd bug when issues are reported)
