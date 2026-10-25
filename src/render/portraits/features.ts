import { PAL, type Ramp } from '../pixel/palette';
import { shifted, union, type Mask, type Pix } from '../pixel/raster';
import { BASE, D1, D2, L1 } from './parts';
import type { Rig } from './types';

/**
 * Hand-placed pixel features (doc 20): eyes, brows, mouth and nose are laid out pixel by pixel from the
 * character's measurements so every expression reads at any art size — iris + pupil + catch-light, mood lids,
 * a three-frame blink, brows that tilt per mood and a mouth with three talking frames.
 */

/** `irisW` (0..1 of the eye width) draws a bigger iris than the default (the kids' big eyes, doc 29). */
export interface Eyes { x: number; y: number; rx: number; ry: number; iris: Ramp; lash?: boolean; irisW?: number }
export interface Brows { x0: number; x1: number; y: number; th: number; color: number; bias?: number }
/** `full` paints full lips in that colour; `lower` tints only the lower lip. */
export interface Mouth { y: number; w: number; grin?: boolean; smirk?: number; full?: number; lower?: number }

const LID = PAL.ink[1] ?? 1;
const EYE = PAL.eye;

/** One eye laid out from its outer corner (i = 0) inwards; `at` maps i to a screen column. */
interface EyeSpot { at: (i: number) => number; r0: number; ew: number; eh: number; look: number }

function closedEye(p: Pix, s: EyeSpot): void {
  const r = s.r0 + Math.floor(s.eh * 0.6);
  for (let i = 0; i < s.ew; i++) p.set(s.at(i), r, LID);
  p.set(s.at(-1), r + 1, LID);
}

function iris(p: Pix, s: EyeSpot, e: Eyes, r: Rig, rows: readonly [number, number]): void {
  const big = e.irisW !== undefined;
  const iw = big ? Math.max(2, Math.min(s.ew - 2, Math.round(s.ew * (e.irisW ?? 0.5)))) : s.ew >= 7 ? 4 : s.ew >= 5 ? 3 : 2;
  const i0 = Math.ceil((s.ew - iw) / 2);
  const col = (i: number): number => s.at(i0 + i) + s.look;
  for (let j = rows[0]; j <= rows[1]; j++) {
    const tone = j === rows[0] ? e.iris[D2] : j === s.eh - 1 && s.eh >= 4 ? e.iris[L1] : e.iris[BASE];
    for (let i = 0; i < iw; i++) p.set(col(i), s.r0 + j, tone ?? 0);
  }
  const pupil = big ? (iw % 2 === 1 ? [(iw - 1) / 2] : [iw / 2 - 1, iw / 2])
    : iw === 4 && r.m.pupil > 0.85 ? [1, 2] : [iw === 4 ? 2 : 1];
  const pj1 = s.eh >= 4 ? s.eh - 2 : s.eh - 1;
  const pj0 = r.m.pupil < 0.8 && s.eh >= 4 ? 1 : 0;
  for (let j = Math.max(rows[0], pj0); j <= Math.min(rows[1], pj1); j++) for (const i of pupil) p.set(col(i), s.r0 + j, e.iris[0] ?? 0);
  const left = Math.min(col(0), col(iw - 1));
  if (s.ew >= 5 && s.eh >= 3 && rows[0] <= 1) p.set(left, s.r0 + Math.max(1, rows[0]), EYE[4] ?? 0);
  if (big && iw >= 5 && s.eh >= 6 && rows[0] <= 1) p.set(left + 1, s.r0 + Math.max(1, rows[0]), EYE[4] ?? 0);
}

function openEye(p: Pix, s: EyeSpot, e: Eyes, r: Rig, skin: Ramp): void {
  const top = r.blink === 1 ? Math.ceil(s.eh / 2) : Math.floor(r.m.lidTop * s.eh + 0.3);
  const low = r.blink > 0 ? 0 : Math.round(r.m.lidLow * s.eh);
  const last = s.eh - 1 - low;
  for (let j = top; j <= last; j++) {
    const corner = s.ew >= 5 && s.eh >= 3 && (j === 0 || j === s.eh - 1 || (low > 0 && j === last));
    const tone = j === top && s.eh >= 4 ? EYE[2] : EYE[3];
    for (let i = corner ? 1 : 0; i < s.ew - (corner ? 1 : 0); i++) p.set(s.at(i), s.r0 + j, tone ?? 0);
  }
  iris(p, s, e, r, [top, last]);
  for (let i = 0; i < s.ew; i++) p.set(s.at(i), s.r0 + top - 1, LID);
  p.set(s.at(-1), s.r0 + top, LID);
  if (e.lash) {
    p.set(s.at(-2), s.r0 + top - 1, LID);
    if (s.ew >= 6) for (let i = 0; i < s.ew / 2; i++) p.set(s.at(i), s.r0 + top - 2, LID);
  }
  if (low > 0) for (let i = 1; i < s.ew - 1; i++) p.set(s.at(i), s.r0 + last + 1, skin[D1] ?? 0);
}

/** Both eyes: almond whites, iris + pupil + catch-light, mood lids and the blink. */
export function eyes(p: Pix, r: Rig, e: Eyes, skin: Ramp): void {
  const ew = Math.max(3, Math.round(2 * e.rx * p.k));
  const eh = Math.max(2, Math.round(2 * e.ry * p.k));
  const c0 = Math.round(p.X(-e.x) - ew / 2);
  const r0 = Math.round(p.Y(e.y) - eh / 2);
  const [lc, lr] = p.nudge(-e.x, e.y); // a tilted head moves each eye whole (doc 29)
  const [rc, rr] = p.nudge(e.x, e.y);
  const spots: EyeSpot[] = [
    { at: (i) => c0 + i + lc, r0: r0 + lr, ew, eh, look: r.look },
    { at: (i) => p.mirror(c0 + i) + rc, r0: r0 + rr, ew, eh, look: r.look },
  ];
  for (const s of spots) {
    if (r.blink === 2) closedEye(p, s);
    else openEye(p, s, e, r, skin);
  }
}

function mirrored(p: Pix, m: Mask): Mask {
  const out = p.blank();
  for (let i = 0; i < m.length; i++) {
    if (!m[i]) continue;
    const c = i % p.w;
    const mc = p.mirror(c);
    if (mc >= 0 && mc < p.w) out[i - c + mc] = 1;
  }
  return out;
}

/** One brow stroke (sd = -1 left, +1 right) through inner end, apex and outer end, thickened downwards. */
function browSide(p: Pix, b: Brows, sd: number, iy: number, my: number, oy: number): Mask {
  const mx = (b.x0 + b.x1) / 2;
  const line = p.lineMask(p.lineMask(p.blank(), sd * b.x0, iy, sd * mx, my), sd * mx, my, sd * b.x1, oy);
  const inner = p.lineMask(p.lineMask(p.blank(), sd * b.x0, iy, sd * mx, my), sd * mx, my, sd * (mx + (b.x1 - mx) * 0.55), (my + oy) / 2);
  let m = line;
  const th = Math.max(1, Math.round(b.th * p.k * 0.75));
  for (let i = 1; i < th; i++) m = union(m, shifted(inner, p.w, 0, i));
  return m;
}

/** Brows as pixel strokes: the inner end drops for stern, rises for worried; thick ones taper outwards.
 *  Upright heads mirror the left brow; a tilted head (doc 29) draws each side along its own turned line. */
export function brows(p: Pix, r: Rig, b: Brows): void {
  const iy = b.y + r.m.browIn + (b.bias ?? 0);
  const oy = b.y + r.m.browOut;
  const my = ((iy + oy) / 2 + ((iy + oy) / 2 - r.m.arch - 0.8)) / 2; // the quadratic brow's actual apex
  const m = browSide(p, b, -1, iy, my, oy);
  p.paint(union(m, p.rot === 0 ? mirrored(p, m) : browSide(p, b, 1, iy, my, oy)), b.color);
}

interface MouthCol { c: number; top: number; gap: number; u: number }

function mouthCols(p: Pix, r: Rig, ms: Mouth): MouthCol[] {
  const k = p.k;
  const open = [0, 0.5, 1][r.mouth] ?? 0;
  const grin = ms.grin === true && r.mood === 'happy';
  const hw = Math.max(2, Math.round((ms.w + r.m.widen - open * 1.4) * k));
  const odd = Math.round(2 * p.ox) % 2 === 1;
  const reach = odd ? hw : hw - 0.5;
  const lift = Math.max(-2, Math.min(3, Math.round(r.m.lift * k * 0.8)));
  const smirk = Math.round((ms.smirk ?? 0) * k * 0.7);
  const gap = Math.max(Math.round(open * 3.6 * k), grin ? (k >= 0.8 ? 2 : 1) : 0);
  const cy = p.row(ms.y + open * 0.5);
  const [dc, dr] = p.nudge(0, ms.y); // a tilted head moves the mouth and slants it (doc 29)
  const slope = Math.sin(p.rot);
  const cols: MouthCol[] = [];
  for (let c = Math.floor(p.ox - reach); c <= Math.ceil(p.ox + reach); c++) {
    const off = c + 0.5 - p.ox;
    if (Math.abs(off) > reach + 1e-6) continue;
    const u = off / reach;
    const l = lift + (u > 0 ? smirk : 0);
    const top = cy - Math.round(l * Math.pow(Math.abs(u), 2.2)) + dr + Math.round(off * slope);
    cols.push({ c: c + dc, u, top, gap: Math.round(gap * Math.sqrt(Math.max(0, 1 - u * u))) });
  }
  return cols;
}

/** Mouth from closed (frame 0) to wide open (frame 2), corners lifted or dropped by the mood. */
export function mouth(p: Pix, r: Rig, ms: Mouth, skin: Ramp): void {
  const cols = mouthCols(p, r, ms);
  const grin = ms.grin === true && r.mood === 'happy';
  const line = PAL.mouth[1] ?? 0;
  cols.forEach((m, n) => {
    const prev = cols[n - 1];
    if (prev && Math.abs(prev.top - m.top) > 1) {
      const outer = Math.abs(prev.u) > Math.abs(m.u) ? prev : m;
      for (let y = Math.min(prev.top, m.top) + 1; y < Math.max(prev.top, m.top); y++) p.set(outer.c, y, line);
    }
    p.set(m.c, m.top, m.gap > 0 ? line : PAL.mouth[2] ?? line);
    for (let j = 1; j <= m.gap; j++) {
      const tooth = j === 1 && (m.gap >= 2 || grin) && Math.abs(m.u) < 0.85;
      const tongue = j === m.gap && m.gap >= 3 && Math.abs(m.u) < 0.5;
      p.set(m.c, m.top + j, (tooth ? PAL.teeth[3] : tongue ? PAL.mouth[3] : PAL.mouth[1]) ?? 0);
    }
    if (m.gap > 0) p.set(m.c, m.top + m.gap + 1, line);
    lips(p, m, ms, skin);
  });
}

function lips(p: Pix, m: MouthCol, ms: Mouth, skin: Ramp): void {
  const a = Math.abs(m.u);
  const below = m.top + m.gap + (m.gap > 0 ? 2 : 1);
  if (ms.full !== undefined) {
    if (a < 0.75) p.set(m.c, m.top - 1, ms.full);
    if (a < 0.65) p.set(m.c, below, ms.full);
    if (a < 0.4 && p.k >= 0.8) p.set(m.c, below + 1, ms.full);
    return;
  }
  if (ms.lower !== undefined) { // a tinted lower lip only (the pilots' faces, doc 29)
    if (a < 0.6) p.set(m.c, below, ms.lower);
    if (a < 0.3 && p.k >= 0.8) p.set(m.c, below + 1, skin[D1] ?? 0);
    return;
  }
  if (p.k >= 0.75 && a < 0.4) p.set(m.c, below + (m.gap > 0 ? 0 : 1), skin[D1] ?? 0);
}

/** Nose: bridge shadow on the right (light from the left), the shadow under the tip, nostrils, a highlight. */
export function nose(p: Pix, s: Ramp, y0: number, y1: number, w: number): void {
  const [dc, dr] = p.nudge(0, y1); // a tilted head moves the nose whole (doc 29)
  const col = (x: number): number => p.col(x) + dc;
  const row = (y: number): number => p.row(y) + dr;
  const tip = row(y1);
  const right = col(w * 0.45);
  if (p.k >= 0.6) for (let r = row(y0 + (y1 - y0) * 0.45); r < tip - 1; r++) p.set(right, r, s[D1] ?? 0);
  p.set(right, tip - 1, s[D1] ?? 0);
  p.hspan(col(-w * 0.4), right, tip, s[D1] ?? 0);
  if (p.k >= 0.75) {
    p.set(col(-w * 0.55), tip, s[D2] ?? 0);
    p.set(right, tip, s[D2] ?? 0);
    p.set(col(-w * 0.2), tip - 1, s[L1] ?? 0);
  }
}
