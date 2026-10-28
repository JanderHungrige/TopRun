// Hangar base (doc 30): the areas of the home-base hangar — where each one is on the 1280 × 720 screen, which row
// it sits in for ↑ / ↓, where its name plate goes and where the pilot stands in front of it. Left → right order.

export type BaseAreaId = 'fun' | 'locker' | 'photos' | 'ladder' | 'chalk' | 'exit';

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
}

/** Left → right; ← / → step through this order. */
export const BASE_AREA_IDS: readonly BaseAreaId[] = Object.freeze(['fun', 'locker', 'photos', 'ladder', 'chalk', 'exit'] as const);

const area = (id: BaseAreaId, row: AreaRow, hot: AreaRect, plate: { x: number; y: number }, standX: number): BaseAreaDef =>
  ({ id, row, hot, plate, standX });

export const BASE_AREAS: Readonly<Record<BaseAreaId, BaseAreaDef>> = Object.freeze({
  fun: area('fun', 'floor', { x: 18, y: 214, w: 202, h: 286 }, { x: 119, y: 200 }, 120),
  locker: area('locker', 'floor', { x: 246, y: 300, w: 196, h: 212 }, { x: 344, y: 286 }, 344),
  photos: area('photos', 'wall', { x: 466, y: 182, w: 176, h: 168 }, { x: 554, y: 166 }, 556),
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
