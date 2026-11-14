import { CARRIER_AREAS, HELI_AREAS, JUNGLE_AREAS, SEA_AREAS, SPACE_AREAS, STEPPE_AREAS } from './base-docks';
import type { CampaignId } from './types';

// Hangar base (doc 30): the areas of the home-base hangar — where each one is on the 1280 × 720 screen, which row
// it sits in for ↑ / ↓, where its name plate goes and where the pilot stands in front of it. Left → right order.
// The base has four looks (docs 73, 74, 86, 91): the carrier lounge (maps 1–3), the sea dock (map 4), the space dock
// (map 5) and the jungle base's crew hut (map 6), which alone has the ground base and the lab (doc 82). BASE_AREAS is the
// code-drawn carrier hangar's (doc 30), which stands in while a picture loads.

export type BaseAreaId = 'fun' | 'tv' | 'locker' | 'photos' | 'jet' | 'base' | 'lab' | 'ladder' | 'chalk' | 'exit';

/** `wall`: mounted high on the back wall; `mid`: lower on the wall (the chalkboard, doc 40); `floor`: at floor level. */
export type AreaRow = 'wall' | 'mid' | 'floor';

/** Rows top → bottom (↑ / ↓ move along this). */
export const AREA_ROWS: readonly AreaRow[] = Object.freeze(['wall', 'mid', 'floor'] as const);

export interface AreaRect { x: number; y: number; w: number; h: number }

export interface BaseAreaDef {
  id: BaseAreaId;
  row: AreaRow;
  /** Hotspot in logical px: hover, click / tap and the highlight brackets. */
  hot: AreaRect;
  /** Centre of the area's name plate (logical px). */
  plate: { x: number; y: number };
  /** Floor x the pilot walks to (logical px). */
  standX: number;
  /** On a look with depth (doc 92): the floor line the pilot stands on there (logical y; the front line PILOT_FLOOR_Y when
   *  absent), and the x of the free lane the pilot walks up from the front line to reach it (standX when absent). */
  standY?: number;
  via?: number;
}

/** Left → right; ← / → step through this order (the areas a look has). */
export const BASE_AREA_IDS: readonly BaseAreaId[] = Object.freeze(['fun', 'tv', 'locker', 'photos', 'jet', 'base', 'lab', 'ladder', 'chalk', 'exit'] as const);

/** A look's areas: every look has the eight of the carrier hangar; the jungle base adds the ground base and the lab, the
 *  steppe tent the lab (doc 111). */
export type AreaTable = Readonly<Partial<Record<BaseAreaId, BaseAreaDef>>>;

/** One area of a look; throws for an area the look doesn't have (only ids from `areaIds` are asked for). */
export function areaDef(areas: AreaTable, id: BaseAreaId): BaseAreaDef {
  const a = areas[id];
  if (!a) throw new Error(`no area ${id} here`);
  return a;
}

/** The areas a look has, left → right. */
export const areaIds = (areas: AreaTable): BaseAreaId[] => BASE_AREA_IDS.filter((id) => areas[id] !== undefined);

const area = (id: BaseAreaId, row: AreaRow, hot: AreaRect, plate: { x: number; y: number }, standX: number): BaseAreaDef =>
  ({ id, row, hot, plate, standX });

export const BASE_AREAS: AreaTable = Object.freeze({
  fun: area('fun', 'floor', { x: 18, y: 214, w: 202, h: 286 }, { x: 119, y: 200 }, 120),
  // The old TV on its cart in front of the rec room (doc 63): opens the tape shelf.
  tv: area('tv', 'floor', { x: 124, y: 404, w: 92, h: 162 }, { x: 170, y: 390 }, 170),
  locker: area('locker', 'floor', { x: 246, y: 300, w: 196, h: 212 }, { x: 344, y: 286 }, 344),
  photos: area('photos', 'wall', { x: 466, y: 182, w: 176, h: 168 }, { x: 554, y: 166 }, 556),
  // The parked jet below the chalkboard: opens the LOADOUT (doc 02).
  jet: area('jet', 'floor', { x: 530, y: 440, w: 530, h: 140 }, { x: 790, y: 604 }, 640),
  ladder: area('ladder', 'wall', { x: 652, y: 110, w: 396, h: 170 }, { x: 850, y: 296 }, 850),
  chalk: area('chalk', 'mid', { x: 692, y: 314, w: 316, h: 122 }, { x: 850, y: 440 }, 850),
  exit: area('exit', 'floor', { x: 1090, y: 120, w: 190, h: 380 }, { x: 1185, y: 104 }, 1176),
});

/** The pilot's feet (logical y) while walking the hangar floor. */
export const PILOT_FLOOR_Y = 640;
/** Walking speed and the hurry when an area is being opened (logical px / s). */
export const WALK_SPEED = 300;
export const RUN_SPEED = 900;
/** Floor distance covered by one walk cycle (8 key frames). */
export const STRIDE_PX = 120;
export const WALK_FRAMES = 8;

/** The base's look: the carrier lounge on maps 1–2 (doc 91), the helicopter base's hangar corner on map 3 (doc 92), the
 *  underwater dock on map 4, the space-station dock on map 5 (doc 74), the jungle base on map 6 (doc 86), the steppe
 *  outpost's command tent on map 7 (doc 111). */
export type BaseLook = 'carrier' | 'heli' | 'space' | 'sea' | 'jungle' | 'steppe';

const LOOK_OF: Readonly<Record<CampaignId, BaseLook>> = {
  1: 'carrier', 2: 'carrier', 3: 'heli', 4: 'sea', 5: 'space', 6: 'jungle', 7: 'steppe',
};
export const baseLookOf = (c: CampaignId): BaseLook => LOOK_OF[c];

const AREAS_OF: Readonly<Record<BaseLook, AreaTable>> = { carrier: CARRIER_AREAS, heli: HELI_AREAS, space: SPACE_AREAS, sea: SEA_AREAS, jungle: JUNGLE_AREAS, steppe: STEPPE_AREAS };
export const baseAreas = (look: BaseLook): AreaTable => AREAS_OF[look];
