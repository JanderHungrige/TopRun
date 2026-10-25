---
generated: 2026-10-25
doc_count: 19
connection_count: 22
overlap_count: 0
---

# MDD Connections

## Path Tree

```
Game
├── Campaign     03-campaign-map        complete
├── Characters   06-talking-characters  complete
├── Engine       01-game-core           complete
├── Hangar       02-hangar-economy      complete
├── Languages    07-i18n                complete
├── Minigames
│   ├── Core      10-minigames-core      complete
│   ├── Evasion   16-missile-evasion     complete
│   ├── Flyby     13-tower-flyby         complete
│   ├── Formation 14-formation-flying    complete
│   ├── Landing   18-carrier-landing     complete
│   ├── Hub       11-base-hub            complete
│   ├── People    17-people-kit          complete
│   ├── Pushups   12-pushup-challenge    complete
│   ├── Refuel    15-air-refuelling      complete
│   └── Tactics   19-dogfight-tactics    complete
├── Mission      05-mission-combat      complete
├── PaintJobs    09-paint-jobs          complete
├── Pilots       08-pilot-profiles      complete
└── Takeoff      04-carrier-takeoff     complete
Meta
└── Schema       00-frontmatter-spec    complete
```

## Dependency Graph

```mermaid
graph TD
  core[01-game-core]:::complete
  hangar[02-hangar-economy]:::complete
  map[03-campaign-map]:::complete
  takeoff[04-carrier-takeoff]:::complete
  mission[05-mission-combat]:::complete
  chars[06-talking-characters]:::complete
  i18n[07-i18n]:::complete
  pilots[08-pilot-profiles]:::complete
  paint[09-paint-jobs]:::complete
  mgcore[10-minigames-core]:::complete
  hub[11-base-hub]:::complete
  pushups[12-pushup-challenge]:::complete
  flyby[13-tower-flyby]:::complete
  formation[14-formation-flying]:::complete
  refuel[15-air-refuelling]:::complete
  evasion[16-missile-evasion]:::complete
  people[17-people-kit]:::complete
  landing[18-carrier-landing]:::complete
  tactics[19-dogfight-tactics]:::complete
  hangar --> core
  map --> core
  map --> hangar
  takeoff --> core
  takeoff --> hangar
  takeoff --> map
  mission --> core
  mission --> hangar
  mission --> map
  mission --> takeoff
  chars --> core
  chars --> i18n
  chars --> pilots
  i18n --> core
  pilots --> core
  pilots --> i18n
  paint --> hangar
  paint --> map
  paint --> chars
  paint --> i18n
  mgcore --> core
  mgcore --> map
  mgcore --> i18n
  mgcore --> pilots
  hub --> mgcore
  hub --> map
  hub --> chars
  pushups --> mgcore
  flyby --> mgcore
  formation --> mgcore
  refuel --> mgcore
  evasion --> mgcore
  pushups --> people
  landing --> mgcore
  tactics --> mgcore
  tactics --> people
  classDef complete fill:#2f9e5a,color:#fff
  classDef in_progress fill:#d39b1f,color:#000
  classDef draft fill:#5c6f82,color:#fff
  classDef deprecated fill:#333,color:#aaa
```

## Source File Overlap

(none — every source file belongs to exactly one feature doc)

## Warnings

(none)
