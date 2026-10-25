import { PAL, type Ramp } from '../pixel/palette';
import { shifted, union, type Mask, type Pix } from '../pixel/raster';
import { BASE, D1, D2, L1, L2 } from '../portraits/parts';
import type { Rig } from '../portraits/types';

/**
 * Realistic pixel features for the pilot avatars (doc 29, style rules doc 20): small eyes with whites, iris, pupil,
 * a dark upper lid line, lower lid and crease (no catch-light); brows with a little attitude; a modelled nose; natural
 * lips. Laid out pixel by pixel from frame measurements so they read at every art size; moods move brows, lids and
 * mouth corners, the talking frames open the mouth, a tilted head moves each feature whole (`Pix.nudge`).
 */

export interface EyeSpec { x: number; y: number; w: number; h: number; iris: Ramp; lid: number }
/** `attitude` lowers the inner ends (a steady, slightly cool look); `arch` raises the peak. */
export interface BrowSpec { x0: number; x1: number; y: number; th: number; color: number; arch?: number; attitude?: number }
export interface NoseSpec { y0: number; tip: number; w: number }
/** `smirk` lifts the right corner (a half-smile); colours: lip line, upper lip, lower lip. */
export interface MouthSpec { y: number; w: number; line: number; upper: number; lower: number; smirk?: number }

const EYE = PAL.eye;

/** One eye, columns counted from its outer corner (i = 0) inwards. */
interface Spot { at: (i: number) => number; r0: number; ew: number; eh: number; shade: boolean; look: number }

function shut(p: Pix, s: Spot, e: EyeSpec, skin: Ramp): void {
  const r = s.r0 + s.eh - 1;
  for (let i = 0; i < s.ew; i++) p.set(s.at(i), r, e.lid);
  if (p.k >= 0.8) for (let i = 1; i < s.ew - 1; i++) p.set(s.at(i), r - 1, skin[D1] ?? 0);
  if (p.k >= 0.9) p.set(s.at(-1), r, e.lid);
}

function whites(p: Pix, s: Spot, top: number, last: number): void {
  for (let j = top; j <= last; j++) {
    const cut = s.eh >= 2 && (j === top || j === last) && !(top === last);
    for (let i = cut ? 1 : 0; i < s.ew - (cut ? 1 : 0); i++) {
      const dim = s.shade || j === top || i === 0 || i === s.ew - 1;
      p.set(s.at(i), s.r0 + j, (dim ? EYE[2] : EYE[3]) ?? 0);
    }
  }
}

function iris(p: Pix, s: Spot, e: EyeSpec, top: number, last: number): void {
  const iw = s.ew >= 6 ? 3 : 2;
  const i0 = Math.round((s.ew - iw) / 2);
  const col = (i: number): number => s.at(i0 + i) + s.look;
  for (let j = top; j <= last; j++) {
    const tone = j === top && last > top ? e.iris[D1] : j === last && last - top >= 2 ? e.iris[L1] : e.iris[BASE];
    for (let i = 0; i < iw; i++) p.set(col(i), s.r0 + j, tone ?? 0);
  }
  const pj = last - top >= 2 ? top + 1 : top;
  p.set(col(iw === 3 ? 1 : 0), s.r0 + pj, e.iris[0] ?? 0);
}

function open(p: Pix, s: Spot, e: EyeSpec, r: Rig, skin: Ramp): void {
  const top = r.blink === 1 ? Math.ceil(s.eh / 2) : Math.min(s.eh - 1, Math.floor(r.m.lidTop * s.eh + 0.25));
  const low = r.blink > 0 ? 0 : Math.min(s.eh - 1 - top, Math.round(r.m.lidLow * s.eh));
  const last = s.eh - 1 - low;
  for (let j = 0; j < top; j++) for (let i = 1; i < s.ew - 1; i++) p.set(s.at(i), s.r0 + j, skin[D1] ?? 0);
  whites(p, s, top, last);
  iris(p, s, e, top, last);
  for (let i = 0; i < s.ew; i++) p.set(s.at(i), s.r0 + top - 1, e.lid);
  if (p.k >= 0.9) p.set(s.at(-1), s.r0 + top, e.lid); // the outer corner's lash line
  if (p.k >= 0.8 && top === 0) for (let i = 1; i < s.ew - 1; i++) p.set(s.at(i), s.r0 - 2, skin[D1] ?? 0); // crease
  if (p.k >= 0.75) for (let i = 1; i < s.ew - 2; i++) p.set(s.at(i), s.r0 + last + 1, skin[D1] ?? 0); // lower lid
}

/** Both eyes: whites, iris + pupil, lid line, crease and lower lid; mood lids, a three-frame blink, glances. */
export function eyes(p: Pix, r: Rig, e: EyeSpec, skin: Ramp): void {
  const ew = Math.max(3, Math.round(e.w * p.k));
  const eh = Math.max(1, Math.round(e.h * p.k));
  const c0 = Math.round(p.X(-e.x) - ew / 2);
  const r0 = Math.round(p.Y(e.y) - eh / 2);
  for (const sd of [-1, 1] as const) {
    const [dc, dr] = p.nudge(sd * e.x, e.y);
    const s: Spot = { at: (i) => (sd < 0 ? c0 + i : p.mirror(c0 + i)) + dc, r0: r0 + dr, ew, eh, shade: sd > 0, look: r.look };
    if (r.blink === 2) shut(p, s, e, skin);
    else open(p, s, e, r, skin);
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

function browSide(p: Pix, r: Rig, b: BrowSpec, sd: number): Mask {
  const iy = b.y + r.m.browIn + (b.attitude ?? 0);
  const oy = b.y + r.m.browOut + 0.5;
  const mx = b.x0 + (b.x1 - b.x0) * 0.58;
  const my = Math.min(iy, oy) - 0.6 - r.m.arch * 0.6 - (b.arch ?? 0);
  const line = p.lineMask(p.lineMask(p.blank(), sd * b.x0, iy, sd * mx, my), sd * mx, my, sd * b.x1, oy);
  const th = Math.max(1, Math.round(b.th * p.k));
  if (th < 2) return line;
  const body = p.lineMask(p.blank(), sd * b.x0, iy, sd * mx, my);
  let m = line;
  for (let i = 1; i < th; i++) m = union(m, shifted(body, p.w, 0, i));
  return m;
}

/** Brows: a short stroke rising from a slightly lowered inner end to an outer arch, thicker towards the nose. */
export function brows(p: Pix, r: Rig, b: BrowSpec): void {
  const left = browSide(p, r, b, -1);
  p.paint(union(left, p.rot === 0 ? mirrored(p, left) : browSide(p, r, b, 1)), b.color);
}

/** Nose: shadow side of the bridge, a broken highlight on the lit side, the tip, wings, nostrils and the shadow
 *  it casts down to the right. */
export function nose(p: Pix, n: NoseSpec, s: Ramp): void {
  const [dc, dr] = p.nudge(0, n.tip);
  const C = (x: number): number => p.col(x) + dc;
  const R = (y: number): number => p.row(y) + dr;
  const tip = R(n.tip);
  const d1 = s[D1] ?? 0;
  if (p.k >= 0.6) for (let y = R(n.y0 + 1.5); y < tip - 1; y++) p.set(C(1.3), y, d1);
  if (p.k >= 0.8) for (let y = R(n.y0 + 3); y < tip - 2; y += 2) p.set(C(-0.5), y, s[L1] ?? 0);
  p.hspan(C(-n.w * 0.2), C(n.w * 1.1), tip + 1, d1);
  p.set(C(n.w * 0.8), tip - 1, d1);
  p.set(C(n.w), tip, d1);
  if (p.k < 0.75) return;
  p.set(C(-n.w), tip, d1);
  p.set(C(-n.w * 0.45), tip, s[D2] ?? 0);
  p.set(C(n.w * 0.5), tip, s[D2] ?? 0);
  p.set(C(-0.3), tip - 1, s[L2] ?? 0);
}

interface Col { c: number; top: number; gap: number; u: number }

function mouthCols(p: Pix, r: Rig, ms: MouthSpec): Col[] {
  const k = p.k;
  const open = [0, 0.5, 1][r.mouth] ?? 0;
  const hw = Math.max(2, Math.round((ms.w + r.m.widen * 0.8 - open * 1.2) * k));
  const reach = Math.round(2 * p.ox) % 2 === 1 ? hw : hw - 0.5;
  const lift = Math.max(-2, Math.min(3, Math.round(r.m.lift * k * 0.75)));
  const smirk = Math.round((ms.smirk ?? 0) * k * 0.75);
  const gap = Math.round(open * 3.2 * k);
  const cy = p.row(ms.y + open * 0.4);
  const [dc, dr] = p.nudge(0, ms.y);
  const slope = Math.sin(p.rot);
  const cols: Col[] = [];
  for (let c = Math.floor(p.ox - reach); c <= Math.ceil(p.ox + reach); c++) {
    const off = c + 0.5 - p.ox;
    if (Math.abs(off) > reach + 1e-6) continue;
    const u = off / reach;
    const l = lift + (u > 0 ? smirk : 0);
    const top = cy - Math.round(l * Math.pow(Math.abs(u), 2.4)) + dr + Math.round(off * slope);
    cols.push({ c: c + dc, u, top, gap: Math.round(gap * Math.sqrt(Math.max(0, 1 - u * u))) });
  }
  return cols;
}

/** Lips: the line between them, a darker upper lip, a lit lower lip with its shadow below; open frames show the
 *  dark mouth and a row of teeth. */
export function mouth(p: Pix, r: Rig, ms: MouthSpec, s: Ramp): void {
  for (const m of mouthCols(p, r, ms)) {
    const a = Math.abs(m.u);
    p.set(m.c, m.top, a > 0.86 ? s[D1] ?? 0 : ms.line);
    for (let j = 1; j <= m.gap; j++) {
      const teeth = j === 1 && a < 0.7;
      p.set(m.c, m.top + j, (teeth ? PAL.teeth[2] : PAL.mouth[1]) ?? 0);
    }
    if (m.gap > 0) p.set(m.c, m.top + m.gap + 1, ms.line);
    const below = m.top + m.gap + (m.gap > 0 ? 2 : 1);
    if (p.k < 0.75) continue;
    if (a < 0.72) p.set(m.c, m.top - 1, ms.upper);
    if (a < 0.6) p.set(m.c, below, m.u < -0.15 && m.u > -0.45 ? s[L1] ?? 0 : ms.lower);
    if (a < 0.34 && p.k >= 0.9) p.set(m.c, below + 1, s[D1] ?? 0);
  }
}
