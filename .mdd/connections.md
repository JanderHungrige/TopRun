---
generated: 2026-10-24
doc_count: 5
connection_count: 10
overlap_count: 0
---

# MDD Connections

## Path Tree

```
Game
├── Campaign   03-campaign-map     complete
├── Engine     01-game-core        complete
├── Hangar     02-hangar-economy   complete
├── Mission    05-mission-combat   complete
└── Takeoff    04-carrier-takeoff  complete
Meta
└── Schema     00-frontmatter-spec complete
```

## Dependency Graph

```mermaid
graph TD
  core[01-game-core]:::complete
  hangar[02-hangar-economy]:::complete
  map[03-campaign-map]:::complete
  takeoff[04-carrier-takeoff]:::complete
  mission[05-mission-combat]:::complete
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
  classDef complete fill:#2f9e5a,color:#fff
  classDef in_progress fill:#d39b1f,color:#000
  classDef draft fill:#5c6f82,color:#fff
  classDef deprecated fill:#333,color:#aaa
```

## Source File Overlap

(none — every source file belongs to exactly one feature doc)

## Warnings

(none)
