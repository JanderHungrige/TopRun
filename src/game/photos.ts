import type { LiveryId } from '../data/liveries';
import { MISSIONS } from '../data/missions';
import { PHOTO_TIMES, type TimeOfDay } from '../data/photo-looks';
import { THEATERS } from '../data/theaters';
import type { BossId, MissionDef, PlaneId, TheaterId } from '../data/types';
import type { SaveData } from './save';

// Picture wall (doc 32): which photos hang on the wall and what each one shows — one per cleared mission, in
// mission order, from the best run's progress entry (doc 24) with fallbacks for older saves — and the paging of
// the 4 × 3 grid. Pure.

export type PhotoScene = 'boss' | 'carrier' | 'wingman' | 'solo';

export interface PhotoSpec {
  mission: string;
  number: number;
  theater: TheaterId;
  stars: number;
  /** Time of the best run (ms since the epoch), null for entries saved before photos existed. */
  at: number | null;
  plane: PlaneId;
  livery: LiveryId;
  /** True when the entry had no jet: the photo shows the current jet and its paint job. */
  fallback: boolean;
  time: TimeOfDay;
  scene: PhotoScene;
  boss: BossId | null;
}

export const PER_PAGE = 12;
export const COLS = 4;
export const ROWS = 3;

export interface Box { x: number; y: number; w: number; h: number }
/** The corkboard's inside (logical px) and a polaroid: the photo plus its white frame (wide bottom strip). */
export const BOARD: Box = { x: 50, y: 80, w: 1180, h: 574 };
export const POLAROID = { w: 216, h: 174, photoW: 200, photoH: 132, border: 8 } as const;

/** Where the polaroid in page slot `slot` (0 … 11) hangs: its grid cell plus a small hand-pinned offset that
 *  depends on the mission number. Whole logical px, so the photo's art pixels stay on the device grid. */
export function wallSlot(slot: number, missionNumber: number): Box {
  const cw = BOARD.w / COLS;
  const ch = BOARD.h / ROWS;
  const col = slot % COLS;
  const row = Math.floor(slot / COLS);
  const jx = ((missionNumber * 37) % 21) - 10;
  const jy = ((missionNumber * 53) % 9) - 4;
  return {
    x: Math.round(BOARD.x + col * cw + (cw - POLAROID.w) / 2 + jx),
    y: Math.round(BOARD.y + row * ch + (ch - POLAROID.h) / 2 + jy),
    w: POLAROID.w,
    h: POLAROID.h,
  };
}

function sceneOf(m: MissionDef): PhotoScene {
  if (m.objective.type === 'boss') return 'boss';
  if (THEATERS[m.theater].base === 'sea') return m.number % 2 === 0 ? 'carrier' : 'wingman';
  return m.number % 2 === 0 ? 'solo' : 'wingman';
}

/** The time of day a mission's photo is taken at (data/photo-looks.ts). */
export function photoTime(m: MissionDef): TimeOfDay {
  const list = PHOTO_TIMES[m.theater];
  return list[(m.number - 1) % list.length] ?? 'day';
}

/** One photo per cleared mission, in mission order. */
export function photoList(save: SaveData): PhotoSpec[] {
  const out: PhotoSpec[] = [];
  for (const m of MISSIONS) {
    const e = save.progress[m.id];
    if (!e) continue;
    const plane = e.plane ?? save.selectedPlane;
    out.push({
      mission: m.id,
      number: m.number,
      theater: m.theater,
      stars: e.stars,
      at: e.at ?? null,
      plane,
      livery: e.livery ?? save.livery[plane],
      fallback: e.plane === undefined,
      time: photoTime(m),
      scene: sceneOf(m),
      boss: m.objective.type === 'boss' ? m.objective.boss : null,
    });
  }
  return out;
}

/** Everything the photo's art depends on (the caption — stars, date — is drawn separately). */
export const photoKey = (p: PhotoSpec): string => `${p.mission}|${p.plane}|${p.livery}|${p.time}|${p.scene}`;

export const pageCount = (n: number): number => Math.max(1, Math.ceil(n / PER_PAGE));
export const pageOf = (index: number): number => Math.max(0, Math.floor(index / PER_PAGE));
export const pageItems = <T>(list: readonly T[], page: number): T[] => list.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

export type GridDir = 'left' | 'right' | 'up' | 'down';

/** Grid navigation: LEFT / RIGHT through the whole list (crossing pages), UP / DOWN a row within the page. */
export function gridMove(index: number, dir: GridDir, total: number): number {
  if (total <= 0) return -1;
  const i = Math.max(0, Math.min(total - 1, index));
  const pageStart = pageOf(i) * PER_PAGE;
  const pageEnd = Math.min(total, pageStart + PER_PAGE) - 1;
  const slot = i - pageStart;
  switch (dir) {
    case 'left': return Math.max(0, i - 1);
    case 'right': return Math.min(total - 1, i + 1);
    case 'up': return slot >= COLS ? i - COLS : i;
    case 'down': {
      const below = pageStart + (Math.floor(slot / COLS) + 1) * COLS;
      if (below > pageEnd) return i;
      return Math.min(pageEnd, i + COLS);
    }
    default: throw new Error(`unhandled: ${dir satisfies never}`);
  }
}
