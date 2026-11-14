import { shade } from '../detail/color';
import { membrane, plateShell, spines } from '../detail/organic';
import { path, sym, type Pts } from '../detail/parts';
import { ribbon } from './sea-flesh';
import { hullInk, rgba, type SeaPal } from './sea-pal';

// The sea monsters' bodies in detail (doc 120), for the bosses' cached hulls: a jellyfish bell — a glassy dome with
// branching canals, four glowing gonads, the mouth's lips, freckles of light and a gloss — and its frilled margin (live,
// pulsing); a sea serpent — a long body sampled along its spine, rounded by the light and covered in overlapping scales,
// a dorsal fin of spines, glowing spots along its flanks — and its horned head with brow plates, glowing eyes and a
// toothed maw.

type Ctx = CanvasRenderingContext2D;

/** A jellyfish dome at (cx, cy): translucent glass, canals, gonads, the mouth, freckles and the gloss. */
export function bellDome(g: Ctx, a: SeaPal, cx: number, cy: number, rx: number, ry: number): void {
  const grad = g.createRadialGradient(cx - rx * 0.3, cy - ry * 0.35, rx * 0.05, cx, cy, rx);
  grad.addColorStop(0, rgba(a.light, 0.9));
  grad.addColorStop(0.5, rgba(a.hull, 0.66));
  grad.addColorStop(1, rgba(a.dark, 0.82));
  g.fillStyle = grad;
  g.beginPath();
  g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = rgba(a.dark, 0.5);
  g.lineWidth = rx * 0.012;
  for (let k = 0; k < 24; k++) { // radial canals, forking toward the rim
    const b = (k / 24) * Math.PI * 2, c = Math.cos(b), s = Math.sin(b);
    g.stroke(path([cx + c * rx * 0.24, cy + s * ry * 0.24, cx + c * rx * 0.7, cy + s * ry * 0.7], false));
    if (k % 2) continue;
    for (const d of [-0.07, 0.07]) g.stroke(path([cx + c * rx * 0.7, cy + s * ry * 0.7, cx + Math.cos(b + d) * rx * 0.93, cy + Math.sin(b + d) * ry * 0.93], false));
  }
  g.beginPath();
  g.ellipse(cx, cy, rx * 0.93, ry * 0.93, 0, 0, Math.PI * 2);
  g.stroke();
  for (let k = 0; k < 4; k++) { // the four gonads
    const b = (k / 4) * Math.PI * 2 + Math.PI / 4;
    const x = cx + Math.cos(b) * rx * 0.33, y = cy + Math.sin(b) * ry * 0.33;
    for (const [w, c] of [[rx * 0.12, rgba(a.trim, 0.85)], [rx * 0.04, 'rgba(255,235,248,0.85)']] as const) {
      g.lineWidth = w;
      g.strokeStyle = c;
      g.lineCap = 'round';
      g.beginPath();
      g.ellipse(x, y, rx * 0.16, ry * 0.12, b, Math.PI * 0.2, Math.PI * 1.8);
      g.stroke();
    }
  }
  plateShell(g, [cx, cy - ry * 0.14, cx + rx * 0.1, cy, cx, cy + ry * 0.14, cx - rx * 0.1, cy], { base: a.dark, dark: shade(a.dark, -0.4), light: a.light, ink: rgba(a.dark, 0.9) }, rx * 0.01);
  g.fillStyle = 'rgba(255,240,250,0.55)'; // freckles
  for (let k = 0; k < 40; k++) {
    const b = k * 2.4, r = 0.3 + ((k * 37) % 60) / 100;
    g.beginPath();
    g.arc(cx + Math.cos(b) * rx * r, cy + Math.sin(b) * ry * r, rx * 0.012, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = 'rgba(255,255,255,0.4)'; // the gloss
  g.beginPath();
  g.ellipse(cx - rx * 0.38, cy - ry * 0.42, rx * 0.26, ry * 0.12, -0.4, 0, Math.PI * 2);
  g.fill();
}

/** The bell's frilled margin at its pulsing size (live): scallops round the edge; solid in one colour. */
export function bellMargin(ctx: Ctx, a: SeaPal, cx: number, cy: number, rx: number, ry: number): void {
  const pts: number[] = [];
  for (let k = 0; k < 96; k++) {
    const b = (k / 96) * Math.PI * 2, f = 1 + 0.035 * Math.abs(Math.sin(b * 16));
    pts.push(cx + Math.cos(b) * rx * f, cy + Math.sin(b) * ry * f);
  }
  const edge = path(pts);
  if (a.mono) {
    ctx.fillStyle = a.hull;
    ctx.fill(edge);
    return;
  }
  const grad = ctx.createRadialGradient(cx, cy, rx * 0.5, cx, cy, rx);
  grad.addColorStop(0, rgba(a.hull, 0.25));
  grad.addColorStop(1, rgba(a.hull, 0.62));
  ctx.fillStyle = grad;
  ctx.fill(edge);
  ctx.strokeStyle = rgba(a.light, 0.8);
  ctx.lineWidth = 1.2;
  ctx.stroke(edge);
}

/** Points along a smooth spine, every `step` units (the same curve `smooth` draws). */
export function along(spine: Pts, step: number): number[] {
  const out: number[] = [];
  const n = spine.length / 2;
  const P = (i: number, k: number): number => spine[i * 2 + k] ?? 0;
  let sx = P(0, 0), sy = P(0, 1);
  for (let i = 1; i < n; i++) {
    const last = i === n - 1;
    const cx = P(i, 0), cy = P(i, 1);
    const ex = last ? cx : (cx + P(i + 1, 0)) / 2, ey = last ? cy : (cy + P(i + 1, 1)) / 2;
    const len = Math.hypot(cx - sx, cy - sy) + Math.hypot(ex - cx, ey - cy);
    const m = Math.max(2, Math.round(len / step));
    for (let j = i === 1 ? 0 : 1; j <= m; j++) {
      const u = j / m;
      out.push((1 - u) ** 2 * sx + 2 * (1 - u) * u * cx + u * u * ex, (1 - u) ** 2 * sy + 2 * (1 - u) * u * cy + u * u * ey);
    }
    sx = ex;
    sy = ey;
  }
  return out;
}

/** Overlapping scales over a body (clipped to it by the caller): rows of arcs across each sample, opening to the head. */
function scales(g: Ctx, pts: Pts, w0: number, w1: number, a: SeaPal): void {
  const n = pts.length / 2;
  for (let i = 1; i < n; i += 1) {
    const x = pts[i * 2] ?? 0, y = pts[i * 2 + 1] ?? 0;
    const dx = x - (pts[i * 2 - 2] ?? 0), dy = y - (pts[i * 2 - 1] ?? 0);
    const th = Math.atan2(dy, dx), w = (w0 + ((w1 - w0) * i) / n) / 2;
    const nx = -Math.sin(th), ny = Math.cos(th);
    for (let j = -w + (i % 2) * 3; j <= w; j += 6) {
      g.strokeStyle = rgba(a.dark, 0.55);
      g.lineWidth = 0.9;
      g.beginPath();
      g.arc(x + nx * j, y + ny * j, 3.6, th - 1.3, th + 1.3);
      g.stroke();
      g.strokeStyle = rgba(a.light, 0.3);
      g.lineWidth = 0.5;
      g.beginPath();
      g.arc(x + nx * j - Math.cos(th) * 0.9, y + ny * j - Math.sin(th) * 0.9, 3.2, th - 1.1, th + 0.6);
      g.stroke();
    }
  }
}

/** A serpent's body along its spine (head first): outline, shade, the lit back, scales, the dorsal fin, glowing spots. */
export function serpentBody(g: Ctx, a: SeaPal, spine: Pts, w0: number, w1: number): void {
  const pts = along(spine, 6);
  fluke(g, a, pts);
  const body = ribbon(pts, w0, w1);
  g.strokeStyle = a.ink;
  g.lineWidth = 4;
  g.stroke(body);
  g.fillStyle = a.dark;
  g.fill(body);
  g.fillStyle = a.hull;
  g.fill(ribbon(pts, w0, w1, -w0 * 0.07, -w0 * 0.05, 0.76));
  g.save();
  g.clip(body);
  scales(g, pts, w0, w1, a);
  g.fillStyle = rgba(a.light, 0.35);
  g.fill(ribbon(pts, w0, w1, -w0 * 0.16, -w0 * 0.12, 0.2));
  g.restore();
  const n = pts.length / 2, fin: number[] = [];
  for (let i = 8; i < n - 2; i += 3) {
    const x = pts[i * 2] ?? 0, y = pts[i * 2 + 1] ?? 0;
    const th = Math.atan2(y - (pts[i * 2 - 1] ?? 0), x - (pts[i * 2 - 2] ?? 0));
    fin.push(x, y, th, 13, 2.6);
  }
  spines(g, fin, { base: a.trim, dark: shade(a.trim, -0.5), light: shade(a.trim, 0.4), ink: a.ink });
  for (let i = 10; i < n - 4; i += 5) for (const s of [-1, 1]) { // glowing spots along the flanks
    const x = pts[i * 2] ?? 0, y = pts[i * 2 + 1] ?? 0;
    const th = Math.atan2(y - (pts[i * 2 - 1] ?? 0), x - (pts[i * 2 - 2] ?? 0));
    const w = ((w0 + ((w1 - w0) * i) / n) / 2) * 0.62;
    g.fillStyle = rgba(a.glass, 0.25);
    g.beginPath();
    g.arc(x - Math.sin(th) * w * s, y + Math.cos(th) * w * s, 4, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = a.glass;
    g.beginPath();
    g.arc(x - Math.sin(th) * w * s, y + Math.cos(th) * w * s, 1.8, 0, Math.PI * 2);
    g.fill();
  }
}

/** The tail's fluke: a ribbed fin spreading past the last point along the body's way. */
function fluke(g: Ctx, a: SeaPal, pts: Pts): void {
  const n = pts.length / 2;
  const x = pts[n * 2 - 2] ?? 0, y = pts[n * 2 - 1] ?? 0;
  const th = Math.atan2(y - (pts[n * 2 - 5] ?? 0), x - (pts[n * 2 - 6] ?? 0));
  const c = Math.cos(th), s = Math.sin(th);
  const at = (f: number, w: number): [number, number] => [x + c * f - s * w, y + s * f + c * w];
  const outline = [...at(-10, 9), ...at(22, 22), ...at(30, 8), ...at(24, 0), ...at(30, -8), ...at(22, -22), ...at(-10, -9)];
  membrane(g, outline, x, y, [...at(22, 22), ...at(30, 8), ...at(30, -8), ...at(22, -22)], { base: a.trim, dark: a.dark, light: a.light, ink: a.ink }, rgba(shade(a.hull, -0.15), 0.92));
}

/** A swept horn from (x, y), s = ±1: a tapering bone with growth rings. */
function horn(g: Ctx, a: SeaPal, s: number): void {
  const pts = [s * 14, -2, s * 24, -14, s * 34, -28, s * 38, -44];
  const bone = { base: a.metal, dark: shade(a.metal, -0.5), light: '#ffffff', ink: a.ink };
  g.fillStyle = a.ink;
  g.fill(ribbon(pts, 12, 3));
  g.fillStyle = bone.dark;
  g.fill(ribbon(pts, 10, 2));
  g.fillStyle = bone.base;
  g.fill(ribbon(pts, 10, 2, -1, -0.6, 0.65));
  g.strokeStyle = rgba(bone.dark, 0.7);
  g.lineWidth = 0.8;
  for (let k = 1; k < 4; k++) g.stroke(path([s * (16 + k * 6) - 4, -4 - k * 9, s * (16 + k * 6) + 4, -k * 9 + 1], false));
}

/** The serpent's head at its own origin, snout down (+y): horns, the plated skull, brows, eyes, nostrils, the maw. */
export function serpentHead(g: Ctx, a: SeaPal): void {
  for (const s of [-1, 1]) horn(g, a, s);
  const skull = sym([0, -24, 30, -12, 36, 16, 22, 44, 0, 52]);
  plateShell(g, skull, hullInk(a), 2);
  g.save();
  g.clip(path(skull));
  scales(g, along([0, -30, 0, 0, 0, 50], 7), 70, 40, a);
  g.restore();
  for (const s of [-1, 1]) {
    plateShell(g, [s * 8, 4, s * 30, 2, s * 31, 10, s * 12, 12], { ...hullInk(a), base: shade(a.hull, 0.15) }, 1); // brow plate
    g.fillStyle = '#04100e';
    g.beginPath();
    g.ellipse(s * 19, 15, 6.5, 4.6, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = a.glass;
    g.beginPath();
    g.ellipse(s * 19, 15, 5, 3.4, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#04100e';
    g.fillRect(s * 19 - 0.8, 12, 1.6, 6);
    g.fillStyle = 'rgba(255,255,255,0.8)';
    g.fillRect(s * 19 - 3, 12.6, 1.4, 1.2);
    g.fillStyle = '#04100e';
    g.beginPath();
    g.ellipse(s * 6, 44, 1.6, 1, s * 0.4, 0, Math.PI * 2); // nostrils
    g.fill();
  }
  g.fillStyle = '#060a0a'; // the maw at the snout
  g.fill(path(sym([0, 52, 14, 45, 18, 36, 0, 38])));
  for (let i = -3; i <= 3; i++) plateShell(g, [i * 4 - 0.9, 37.6, i * 4 + 0.9, 37.6, i * 4, 42 - Math.abs(i) * 0.6], { base: '#eef4e4', dark: '#8a9a80', light: '#ffffff', ink: 'rgba(0,0,0,0.4)' }, 0.2);
}

