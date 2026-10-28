import { MEDALS, type MedalId, type MedalShape } from '../data/medals';

// Locker (doc 31): where every earned medal sits on the dress-whites tunic, like real full dress — the hanging
// medals in court-mounted rows on the left breast (each row hanging a little over the one below, medals in a row
// overlapping), standing on the pocket flap and filling up (the wings badge on top); the ribbon-only awards (the
// campaign ribbons) as ribbon bars on the right breast above the name plate. The top row of each block holds the
// remainder and is centred; precedence reads like text, and the senior medal is in front. Pure — the scene draws it.

export interface Box { x: number; y: number; w: number; h: number }
export type SlotKind = 'ribbon' | 'medal';
export type SlotDir = 'left' | 'right' | 'up' | 'down';

export interface UniformSlot {
  id: MedalId;
  kind: SlotKind;
  /** Row within its block, 0 = top. */
  row: number;
  /** Medal: top centre of the brooch bar (drawMedal's anchor). Ribbon: the bar's top-left. */
  x: number;
  y: number;
  /** Medal: frame height for drawMedal. Ribbon: bar height. */
  size: number;
  /** Selection / hit rectangle around the art. */
  box: Box;
}

export interface UniformLayout {
  /** Catalogue order (ribbons first, as in the catalogue). */
  slots: UniformSlot[];
  /** Centre of the wings badge's top edge. */
  wings: { x: number; y: number };
  /** Topmost logical y the medal block reaches (the wings' top). */
  top: number;
}

/** The two breasts of the jacket (logical units) and the rack's sizes. */
export interface ChestFrame {
  /** Viewer's right (wearer's left) breast: the medals. */
  left: number;
  right: number;
  /** The pocket flap's top edge: the medals stand on it. */
  pocketTop: number;
  /** The rack never reaches above this (the collar). */
  minTop: number;
  medalSize: number;
  medalsPerRow: number;
  /** Gap between medals, rows and the wings. */
  gap: number;
  /** Share of a row's height the row above always hangs over it (court-mounted, like a real full-dress rack). */
  rowOverlap: number;
  wingsH: number;
  /** Viewer's left (wearer's right) breast: the ribbon bars stand on the name plate. */
  ribbonCentre: number;
  ribbonBottom: number;
  ribbonW: number;
  ribbonH: number;
  ribbonsPerRow: number;
}

/** The tunic in the locker picture (src/render/locker/plate.ts): its breast pockets, collar and shoulders, measured. */
export const LOCKER_CHEST: ChestFrame = {
  left: 464, right: 584, pocketTop: 346, minTop: 226, medalSize: 48, medalsPerRow: 5, gap: 4, rowOverlap: 0.3, wingsH: 18,
  ribbonCentre: 360, ribbonBottom: 300, ribbonW: 40, ribbonH: 13, ribbonsPerRow: 3,
};

/** Each shape's art in the 64 × 96 medal frame: half-width and bottom (matches src/render/medals). */
export const MEDAL_ART: Readonly<Record<MedalShape, { half: number; bottom: number }>> = {
  ribbon: { half: 18, bottom: 92 },
  star: { half: 23, bottom: 92 },
  cross: { half: 25, bottom: 90 },
  disc: { half: 23, bottom: 88 },
  wings: { half: 31, bottom: 72 },
  pin: { half: 18, bottom: 85 },
};

/** Splits into rows of `per`; the first (top) row takes the remainder. */
export function rackRows<T>(items: readonly T[], per: number): T[][] {
  const out: T[][] = [];
  const rem = items.length % per;
  if (rem > 0) out.push(items.slice(0, rem));
  for (let i = rem; i < items.length; i += per) out.push(items.slice(i, i + per));
  return out;
}

const art = (id: MedalId): { half: number; bottom: number } => MEDAL_ART[MEDALS[id].look.shape];

/** One row of hanging medals with its top at `top`, centred on the breast; gaps close (overlap) if too wide. */
function medalRow(ids: readonly MedalId[], row: number, top: number, c: ChestFrame): UniformSlot[] {
  const u = c.medalSize / 96;
  const widths = ids.map((id) => 2 * art(id).half * u);
  const sum = widths.reduce((a, b) => a + b, 0);
  const gap = ids.length > 1 ? Math.min(c.gap, (c.right - c.left - sum) / (ids.length - 1)) : 0;
  let x = (c.left + c.right) / 2 - (sum + gap * (ids.length - 1)) / 2;
  return ids.map((id, i) => {
    const w = widths[i] ?? 0;
    const cx = x + w / 2;
    x += w + gap;
    const h = art(id).bottom * u;
    return { id, kind: 'medal', row, x: cx, y: top, size: c.medalSize, box: { x: cx - w / 2, y: top - 2, w, h: h + 2 } };
  });
}

function ribbonRow(ids: readonly MedalId[], row: number, top: number, c: ChestFrame): UniformSlot[] {
  const gap = 2;
  const x0 = c.ribbonCentre - (ids.length * c.ribbonW + (ids.length - 1) * gap) / 2;
  return ids.map((id, i) => {
    const x = x0 + i * (c.ribbonW + gap);
    return { id, kind: 'ribbon', row, x, y: top, size: c.ribbonH, box: { x, y: top, w: c.ribbonW, h: c.ribbonH } };
  });
}

const rowHeight = (ids: readonly MedalId[], c: ChestFrame): number => Math.max(0, ...ids.map((id) => art(id).bottom * (c.medalSize / 96)));

function medalBlock(ids: readonly MedalId[], c: ChestFrame): { slots: UniformSlot[]; top: number } {
  const rows = rackRows(ids, c.medalsPerRow);
  const overlap = (r: number): number => Math.round(c.rowOverlap * rowHeight(rows[r] ?? [], c));
  const natural = rows.reduce((sum, row, r) => sum + rowHeight(row, c) + c.gap - (r < rows.length - 1 ? overlap(r + 1) : 0), 0);
  const room = c.pocketTop - c.gap - c.minTop - c.wingsH;
  // Still too tall for the chest: every upper row tucks further over the one below by the same step.
  const tuck = natural > room && rows.length > 1 ? Math.ceil((natural - room) / (rows.length - 1)) : 0;
  const out: UniformSlot[][] = [];
  let cursor = c.pocketTop - c.gap;
  for (let r = rows.length - 1; r >= 0; r--) {
    const row = rows[r] ?? [];
    const top = Math.round(cursor - rowHeight(row, c));
    out.unshift(medalRow(row, r, top, c));
    cursor = top - c.gap + (r > 0 ? tuck + overlap(r) : 0);
  }
  return { slots: out.flat(), top: cursor };
}

function ribbonBlock(ids: readonly MedalId[], c: ChestFrame): UniformSlot[] {
  const rows = rackRows(ids, c.ribbonsPerRow);
  return rows.flatMap((row, r) => ribbonRow(row, r, c.ribbonBottom - (rows.length - r) * (c.ribbonH + 2) + 2, c));
}

/** The rack for the earned medals (catalogue order). */
export function uniformLayout(medals: readonly MedalId[], c: ChestFrame = LOCKER_CHEST): UniformLayout {
  const ribbons = ribbonBlock(medals.filter((id) => MEDALS[id].look.shape === 'ribbon'), c);
  const hanging = medalBlock(medals.filter((id) => MEDALS[id].look.shape !== 'ribbon'), c);
  const wingsY = Math.round(hanging.top - c.wingsH);
  const byId = new Map([...ribbons, ...hanging.slots].map((s) => [s.id, s]));
  const slots = medals.map((id) => byId.get(id)).filter((s): s is UniformSlot => s !== undefined);
  return { slots, wings: { x: (c.left + c.right) / 2, y: wingsY }, top: wingsY };
}

const centre = (b: Box): { x: number; y: number } => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

/** The nearest slot above (−1) or below (+1) — rows compared by their tops (medals in a row differ in height),
 *  preferring ones straight up / down. */
function vertical(layout: UniformLayout, index: number, sign: -1 | 1): number {
  const cur = layout.slots[index];
  if (!cur) return index;
  const c = centre(cur.box);
  let best = index;
  let bestScore = Infinity;
  layout.slots.forEach((s, i) => {
    const along = (s.box.y - cur.box.y) * sign;
    const across = Math.abs(centre(s.box).x - c.x);
    const score = along + 2.5 * across;
    if (i !== index && along > 4 && score < bestScore) {
      best = i;
      bestScore = score;
    }
  });
  return best;
}

/** Keyboard / pad navigation: LEFT / RIGHT step through the catalogue order (clamped), UP / DOWN go to the
 *  nearest slot above / below. Nothing selected yet → the first slot. */
export function moveSlot(layout: UniformLayout, index: number, dir: SlotDir): number {
  const n = layout.slots.length;
  if (!layout.slots[index]) return n > 0 ? 0 : -1;
  switch (dir) {
    case 'left': return Math.max(0, index - 1);
    case 'right': return Math.min(n - 1, index + 1);
    case 'up': return vertical(layout, index, -1);
    case 'down': return vertical(layout, index, 1);
    default: throw new Error(`unhandled: ${dir satisfies never}`);
  }
}

/** The slot under a point: the selected one first (it is drawn on top), then the earlier ones — the rack is drawn
 *  back to front from the last slot, so upper rows and senior medals are in front. */
export function slotAt(layout: UniformLayout, p: { x: number; y: number }, selected = -1): number {
  const inside = (b: Box): boolean => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
  const sel = layout.slots[selected];
  if (sel && inside(sel.box)) return selected;
  return layout.slots.findIndex((s) => inside(s.box));
}
