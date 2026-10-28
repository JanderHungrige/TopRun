import { RANK_CHARTS, type Chart, type German, type Insignia } from '../../data/rank-quiz';
import { deviceScale, SpriteCache } from '../pixel/blit';
import { makeCanvas } from '../pixel/post';
import {
  paintArmyChevrons, paintChief, paintGroupRate, paintPettyOfficer, paintSleeve, paintSpecialist, paintUsGeneral, paintUsOfficer,
} from './rank-insignia-us';
import {
  ART_H, ART_W, band, BUTTON, C, chevron, CX, DE_WREATH, LOOP, patch, PIP, px, sprite, strap, type G,
} from './rank-sprites';

// Rank Quiz (doc 41): every insignia of the four charts as pixel art. Each one is painted once into a 32 × 52
// buffer (cached) and drawn scaled up with smoothing off at a whole number of device pixels per art pixel. This
// file has the German ones — Heer shoulder straps, Marine sleeve stripes and NCO tabs — and the dispatch.

/** A Heer shoulder strap: piping (red for generals), grey cloth, the button. */
function heerStrap(g: G, general = false): void {
  strap(g, 0, C.shadow);
  strap(g, 1, general ? C.red : C.piping);
  strap(g, 2, C.grey);
}

const heerButton = (g: G, general = false): void => sprite(g, BUTTON, CX - 3, 5, general ? C.gold : C.silver, C.greyDark);

/** Heer: silver bars rising to the right, the Korporal's wide bar at the bottom. */
function heerBars(g: G, bars: number, wide: boolean): void {
  const thick = [...(wide ? [6] : []), ...Array.from({ length: bars }, () => 2)];
  let y = 46;
  for (const t of thick) {
    y -= t;
    band(g, CX - 6, y + 1, 14, t, -0.5, C.shadow);
    band(g, CX - 7, y, 14, t, -0.5, C.bar);
    y -= 2;
  }
}

/** Marine: gold stripes falling to the right, packed with a navy line between, the wide one at the bottom. */
function marineBars(g: G, bars: number, wide: boolean): void {
  const thick = [...Array.from({ length: bars }, () => 4), ...(wide ? [10] : [])];
  const height = thick.reduce((a, t) => a + t + 1, -1) + 14;
  let y = Math.round((ART_H - height) / 2);
  for (const t of thick) {
    band(g, 4, y, 24, t, 0.6, C.gold);
    band(g, 4, y, 24, 1, 0.6, C.goldLight);
    band(g, 4, y + t - 1, 24, 1, 0.6, C.goldDark);
    y += t + 1;
  }
}

function paintDeBars(g: G, service: German, bars: number, wide: boolean): void {
  if (service === 'marine') {
    patch(g, C.navy, C.navyEdge);
    return marineBars(g, bars, wide);
  }
  heerStrap(g);
  heerButton(g);
  heerBars(g, bars, wide);
}

/** Chevrons stacked up from `apex` (the lowest), the loop crossing into the top one for the three senior ranks. */
function ncoMarks(g: G, n: number, loop: boolean, apex: number, look: { half: number; thick: number; step: number; c: string }): void {
  const { half, thick, step, c } = look;
  const pass = (dy: number, color: string): void => {
    for (let k = 0; k < n; k++) chevron(g, apex - k * step + dy, half, thick, color);
    if (loop) sprite(g, LOOP, CX - 6, apex - (n - 1) * step - LOOP.length + 2 + dy, color);
  };
  pass(1, C.shadow);
  pass(0, c);
}

function paintDeNco(g: G, ins: Extract<Insignia, { kind: 'deNco' }>): void {
  if (ins.service === 'marine') {
    px(g, 7, 3, 18, 46, C.blackEdge);
    px(g, 8, 4, 16, 44, C.black);
    return ncoMarks(g, ins.chevrons, ins.loop, 34, { half: 7, thick: 3, step: 5, c: C.gold });
  }
  heerStrap(g);
  if (ins.braid !== 'none') {
    strap(g, 2, C.goldDark);
    strap(g, 3, C.gold);
    const open = ins.braid === 'open' ? 2 : undefined;
    strap(g, 5, C.goldDark, open);
    strap(g, 6, C.grey, open);
  }
  heerButton(g);
  ncoMarks(g, ins.chevrons, ins.loop, 36, { half: 7, thick: 2, step: 4, c: C.bar });
}

/** Maat: the gold hexagon (points up and down) round a dark diamond; Obermaat with a chevron in its top. */
function paintMaat(g: G, chevronToo: boolean): void {
  patch(g, C.navy, C.navyEdge);
  const top = 9;
  const rows = 34;
  const half = (r: number): number => Math.min(11, 1 + 2 * r, 1 + 2 * (rows - 1 - r));
  for (let r = 0; r < rows; r++) {
    const h = half(r);
    px(g, CX - h, top + r, h * 2, 1, r === 0 || r === rows - 1 ? C.goldDark : C.gold);
    const d = 8 - Math.floor(Math.abs(r - (rows - 1) / 2));
    if (d > 0) px(g, CX - d, top + r, d * 2, 1, C.navyEdge);
    // The Obermaat's chevron: a dark line following the top edges four rows in.
    const e = half(r - 4);
    if (chevronToo && r >= 4 && r < 9) [CX - e, CX + e - 2].forEach((x) => px(g, x, top + r, 2, 1, C.goldDark));
  }
}

/** Heer officers: pips in rows from the bottom; Major and up over an oak wreath (gold for generals). */
function paintPips(g: G, rows: readonly number[], wreath: 'none' | 'silver' | 'gold'): void {
  const general = wreath === 'gold';
  heerStrap(g, general);
  heerButton(g, general);
  const c = general ? C.gold : C.silver;
  const dark = general ? C.goldDark : C.silverDark;
  if (wreath !== 'none') sprite(g, DE_WREATH, CX - 9, 40, c, C.shadow);
  let y = wreath === 'none' ? 40 : 33;
  for (const n of rows) {
    const xs = n === 1 ? [CX - 3] : [CX - 8, CX + 1];
    xs.forEach((x) => sprite(g, PIP, x, y, c, dark));
    y -= 7;
  }
}

export function paintInsignia(g: G, ins: Insignia): void {
  switch (ins.kind) {
    case 'groupRate': return paintGroupRate(g, ins.stripes);
    case 'pettyOfficer': return paintPettyOfficer(g, ins.chevrons);
    case 'chief': return paintChief(g, ins.stars);
    case 'sleeve': return paintSleeve(g, ins.stripes);
    case 'armyChevrons': return paintArmyChevrons(g, ins.chevrons, ins.rockers, ins.device);
    case 'specialist': return paintSpecialist(g);
    case 'usOfficer': return paintUsOfficer(g, ins.device);
    case 'usGeneral': return paintUsGeneral(g, ins.stars);
    case 'deBars': return paintDeBars(g, ins.service, ins.bars, ins.wide);
    case 'deNco': return paintDeNco(g, ins);
    case 'maat': return paintMaat(g, ins.chevron);
    case 'pips': return paintPips(g, ins.rows, ins.wreath);
    default: throw new Error(`unhandled: ${JSON.stringify(ins satisfies never)}`);
  }
}

const cache = new SpriteCache(120);

function art(chart: Chart, index: number): HTMLCanvasElement | null {
  return cache.get(`${chart}:${index}`, () => {
    const ins = RANK_CHARTS[chart][index]?.insignia;
    const canvas = makeCanvas(ART_W, ART_H);
    const g = canvas.getContext('2d');
    if (!ins || !g) return null;
    paintInsignia(g, ins);
    return canvas;
  });
}

/**
 * Draws a rank's insignia centred on (cx, cy) at `scale` logical px per art pixel — snapped to a whole number of
 * device pixels per art pixel when that changes the size by less than 15 % (small screens keep the size instead).
 */
export function drawInsignia(ctx: CanvasRenderingContext2D, chart: Chart, index: number, cx: number, cy: number, scale: number): void {
  const a = art(chart, index);
  if (!a) return;
  const s = deviceScale(ctx);
  const D = Math.max(1, Math.round(scale * s));
  const L = Math.abs(D - scale * s) <= 0.15 * scale * s ? D / s : scale;
  const m = ctx.getTransform();
  const snap = (v: number, k: number, o: number): number => (k !== 0 ? (Math.round(k * v + o) - o) / k : v);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(a, snap(cx - (ART_W * L) / 2, m.a, m.e), snap(cy - (ART_H * L) / 2, m.d, m.f), ART_W * L, ART_H * L);
  ctx.restore();
}
