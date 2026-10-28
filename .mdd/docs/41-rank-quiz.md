---
id: 41-rank-quiz
title: Rank Quiz - Real US and German Navy and Army Ranks
edition: TopRun
depends_on: [10-minigames-core, 11-base-hub, 07-i18n]
relates: [10-minigames-core]
source_files:
  - src/data/rank-quiz.ts
  - src/game/minigames/ranks.ts
  - src/game/minigames/ranks-ask.ts
  - src/scenes/minigames/ranks.ts
  - src/render/minigames/ranks.ts
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
tags: [minigames, quiz, ranks, navy, army, bundeswehr, nato-codes]
path: Game/Minigames/RankQuiz
initiative: off-duty-minigames-2
wave: off-duty-minigames-2-wave-1
wave_status: active
integration_contracts:
  - function: "MinigameModule (src/scenes/minigames/contract.ts), PLAYABLE (registry.ts)"
    when: "the rec room plays `ranks` once mission 10 is cleared; the shell runs rules card, 3-2-1, the round, the result"
satisfies_contracts: []
known_issues:
  - "German enlisted ranks Hauptgefreiter, Oberstabsgefreiter, Korporal and Stabskorporal have no NATO code in the sources used (Wikipedia, 2026-10-28): they appear only in order questions."
security_read_sites: []
sister_projects: []
---

# 41 — Rank Quiz

## Purpose

Owner (2026-10-28): *"quiz on military navy and army ranks (real ones)"*, forces: **US and German** (navy and
army). Ten questions against the clock in the ready room; for fun and for learning — every answer shows the
fact behind it. **Text only**: rank names, order, pay grades and NATO codes, no insignia drawings (owner rule:
no real insignia on the public site). Unlocks after mission 10.

## The ranks (`src/data/rank-quiz.ts`)

Four forces, each a list from lowest to highest; every entry has its name (a proper name, the same in EN and DE),
its US pay grade (US only) and its NATO code (null where the sources give none). Officer candidates, warrant
officers and the US Army's E-2, Corporal, First Sergeant and Command Sergeant Major are left out so that no two
entries of a force share a place in the order.

| NATO | US Navy | US Army | Marine | Heer |
|------|---------|---------|--------|------|
| OR-1 | Seaman Recruit (E-1) | Private (E-1) | Matrose | Soldat |
| OR-2 | Seaman Apprentice (E-2) | — | Gefreiter | Gefreiter |
| OR-3 | Seaman (E-3) | Private First Class (E-3) | Obergefreiter | Obergefreiter |
| — | | | Hauptgefreiter | Hauptgefreiter |
| OR-4 | Petty Officer Third Class (E-4) | Specialist (E-4) | Stabsgefreiter | Stabsgefreiter |
| — | | | Oberstabsgefreiter, Korporal, Stabskorporal | Oberstabsgefreiter, Korporal, Stabskorporal |
| OR-5 | Petty Officer Second Class (E-5) | Sergeant (E-5) | Maat, Obermaat | Unteroffizier, Stabsunteroffizier |
| OR-6 | Petty Officer First Class (E-6) | Staff Sergeant (E-6) | Bootsmann, Oberbootsmann | Feldwebel, Oberfeldwebel |
| OR-7 | Chief Petty Officer (E-7) | Sergeant First Class (E-7) | Hauptbootsmann | Hauptfeldwebel |
| OR-8 | Senior Chief Petty Officer (E-8) | Master Sergeant (E-8) | Stabsbootsmann | Stabsfeldwebel |
| OR-9 | Master Chief Petty Officer (E-9) | Sergeant Major (E-9) | Oberstabsbootsmann | Oberstabsfeldwebel |
| OF-1 | Ensign (O-1), Lieutenant Junior Grade (O-2) | Second Lieutenant (O-1), First Lieutenant (O-2) | Leutnant zur See, Oberleutnant zur See | Leutnant, Oberleutnant |
| OF-2 | Lieutenant (O-3) | Captain (O-3) | Kapitänleutnant, Stabskapitänleutnant | Hauptmann, Stabshauptmann |
| OF-3 | Lieutenant Commander (O-4) | Major (O-4) | Korvettenkapitän | Major |
| OF-4 | Commander (O-5) | Lieutenant Colonel (O-5) | Fregattenkapitän | Oberstleutnant |
| OF-5 | Captain (O-6) | Colonel (O-6) | Kapitän zur See | Oberst |
| OF-6 | Rear Admiral (lower half) (O-7) | Brigadier General (O-7) | Flottillenadmiral | Brigadegeneral |
| OF-7 | Rear Admiral (O-8) | Major General (O-8) | Konteradmiral | Generalmajor |
| OF-8 | Vice Admiral (O-9) | Lieutenant General (O-9) | Vizeadmiral | Generalleutnant |
| OF-9 | Admiral (O-10) | General (O-10) | Admiral | General |

Sources: US pay grades (DoD), NATO STANAG 2116 codes and the Bundeswehr rank lists as given on Wikipedia
("Dienstgrade der Bundeswehr", "Ranks of the German Bundeswehr", 2026-10-28).

## Questions (`src/game/minigames/ranks.ts`, pure, seeded)

A round is **10 questions** drawn from a seed: never the same question twice, at most three of one kind, all four
forces appear. Kinds:

| Kind | Asks | Options |
|------|------|---------|
| `higher` | "Which rank is higher?" — two ranks of one force | the two |
| `next` | "Which rank comes right after X (force)?" | the next rank + 3 others of that force |
| `grade` | "What pay grade is a US Navy / US Army X?" | the grade + 3 grades of the same group (E / O) |
| `usEquiv` | "A US Army Colonel is equal to which US Navy rank?" (either way, by pay grade) | 4 ranks of the other force |
| `natoEquiv` | "Which Marine / Heer / US rank matches X?" (any two forces, by NATO code) | one rank with the code + 3 with other codes |
| `code` | "What NATO code is X?" | the code + 3 codes of the same group (OR / OF) |

Distractors never share the correct answer's grade / code (no second right answer). Options are shuffled.
Equivalence and code questions use only entries with a code (US: grade too).

## Scoring and medals

Each question has **12 s**. A right answer scores **100 + time bonus** (0 … 50, linear in the time left); a
wrong answer or a timeout scores 0. Score = sum, 0 … 1500, higher is better. Medals: **bronze 700, silver
1000, gold 1300**. After every answer the right option lights green (a wrong pick red) and a fact line shows for
2.6 s, e.g. "Fregattenkapitän = OF-4 = US Navy Commander (O-5)"; CONFIRM / tap skips the rest of the pause.

## Screen (logical 1280 × 720)

The ready room in pixel-art tones: dark panelled wall, a long table edge at the bottom; a big **question board**
(x 140 … 1140, y 92 … 300, gold frame) with "QUESTION 3 / 10", the force tag ("US NAVY", "MARINE" …) and the
question (display 30, wrapped); a **timer bar** under it (cyan → amber → red); **four answer cards** in a 2 × 2 grid
(x 140 / 650, y 330 / 450, 490 × 100, numbers 1–4) or two for `higher`; the **fact line** at y 590. The shell's top
bar shows the live score.

## Input

Arrows / d-pad / stick move between the answer cards, CONFIRM / A picks; mouse hover selects, click / tap picks.

## Text

`src/i18n/minigames/ranks.ts` (`gameText`, EN + DE): rules, controls, question templates with `{rank}`, `{force}`,
`{other}`, force names (EN "US Navy", "US Army", "German Navy", "German Army"; DE "US Navy", "US Army", "Marine",
"Heer"), fact line templates, score format. Rank names, pay grades and NATO codes are not translated.

## Business Rules

- The quiz never asks a question with two right answers (distractors filtered by grade / code / order).
- Entries without a NATO code are never asked about codes or equivalents.
- The same seed always gives the same ten questions in the same order with the same option order.

## Verification (2026-10-28)

Vitest `rank-quiz.test.ts` (9): tables ordered with unique names, US grades rising, classic equivalents; ten
questions per seed, deterministic, ≤ 3 per kind, all four forces, no repeats, exactly one right option, codes
and equivalents only for coded ranks; scoring and medals. Dev server: rules card → question 1 ("A US Army
Specialist is equal to which US Navy rank?"), arrows + ENTER, green verdict and fact line, a full round saved as
the personal best.

## Dependencies

10 (shell, medals, bests), 11 (rec-room card), 07 (languages).

## Security

None (static data, local scores).

## Known Issues

- German enlisted ranks Hauptgefreiter, Oberstabsgefreiter, Korporal and Stabskorporal have no NATO code in the
  sources used: they appear only in order questions.

## Bugs

(none yet — populated by /mdd bug when issues are reported)
