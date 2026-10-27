---
id: second-front-wave-2
title: "Wave 2: Three new jets"
initiative: second-front
initiative_version: 1
status: complete
depends_on: second-front-wave-1
demo_state: "With map 2 open, the hangar sells the A-10, F-35 and Tornado; each flies with its own E ability (A-10 cannon burst with its sound, F-35 stealth, Tornado nuke) and the Tornado bleeds hull."
created: 2026-10-27
hash: 315ed629
---

# Wave 2: Three new jets

## Demo-State
With map 2 open, the hangar sells the A-10, F-35 and Tornado; each flies with its own E ability (A-10 cannon burst with its sound, F-35 stealth, Tornado nuke) and the Tornado bleeds hull.
*(This wave is not complete until this can be manually demonstrated.)*

## Features
| # | Feature | Doc | Status | Depends on |
|---|---------|-----|--------|------------|
| 1 | new-jets | 36-new-jets | complete | second-map |

## Open Research (resolved)
- Airframes: `render/planes/{a10,f35,tornado}-{top,side}.ts` in the shared plane kit (dev gallery: `dev/art.html?new`).
- GAU-8 'BRRRT' synthesized as a layer recipe (`sfx-recipes.ts` `cannon`); stealth retuned by playtest (doc 36).
