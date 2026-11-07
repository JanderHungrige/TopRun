import type { BossDrawState } from './draw-bosses';
import { fire, smoke } from './enemies/fx';
import { HL, rect, ring, SH, slab, type Pal } from './draw-ground-units';
import { bossPal } from './bosses-2';
import { circle, ellipse, fillPoly, fillSym } from './shapes';
import { TAU } from '../core/math';

// Hulls of map 4's bosses (docs 56, 58) in data/bosses-4.ts's local coordinates; turrets, launchers, damage and warning
// lights come from the shared boss renderer (draw-bosses.ts).

type Ctx = CanvasRenderingContext2D;
type HullFn = (ctx: Ctx, p: Pal, s: BossDrawState) => void;
type Map4Boss = 'halo' | 'quarry' | 'crater' | 'trident' | 'ark';

export const PALS_4: Readonly<Record<Map4Boss, Pal>> = {
  halo: bossPal('#8d96a8', '#4c5466', '#c3cad8', '#5b7cff', '#9fd0ff'),
  quarry: bossPal('#6a5a4a', '#43372d', '#8f7c66', '#ff9d4a', '#ffcf8a'),
  crater: bossPal('#9a9da4', '#61646c', '#c9ccd2', '#4f8cff', '#9fd0ff'),
  trident: bossPal('#58627a', '#353c4e', '#7d88a2', '#ff5a6a', '#ffb0b8'),
  ark: bossPal('#4a3e58', '#2b2236', '#6e5f82', '#ff6a8a', '#ffc0d8'),
};

export const LIGHTS_4: Readonly<Record<Map4Boss, readonly number[]>> = {
  halo: [0, 128, 0, -128, -128, 0, 128, 0, 0, 0],
  quarry: [-92, 0, 92, 0, 0, -104, -40, 96, 40, 96],
  crater: [-120, 0, 120, 0, 0, 80, 0, -130],
  trident: [0, 158, 0, -140, -72, 110, 72, 110, -72, -70, 72, -70],
  ark: [-160, 10, 160, 10, 0, 170, 0, -140, -90, 100, 90, 100],
};

// ---------- HALO: a ring battle station with four pods on spokes and a glowing hub ----------
const halo: HullFn = (ctx, p, s) => {
  ctx.save();
  ctx.lineWidth = 22;
  ctx.strokeStyle = p.dark;
  ctx.beginPath();
  ctx.arc(0, 0, 105, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = 16;
  ctx.strokeStyle = p.body;
  ctx.stroke();
  ctx.restore();
  for (let k = 0; k < 4; k++) {
    ctx.save();
    ctx.rotate((k * TAU) / 4 + Math.PI / 4);
    rect(ctx, -5, 30, 10, 70, p.dark);
    ctx.restore();
  }
  for (const [x, y] of [[0, 105], [0, -105], [-105, 0], [105, 0]] as const) ring(ctx, x, y, 26, p.body, p.line);
  ring(ctx, 0, 0, 44, p.body, p.line);
  if (p.mono) return;
  ctx.save();
  ctx.rotate(s.t * 0.25);
  for (let k = 0; k < 12; k++) {
    const a = (k * TAU) / 12;
    rect(ctx, Math.cos(a) * 105 - 2, Math.sin(a) * 105 - 2, 4, 4, k % 3 === 0 ? p.trim : HL);
  }
  ctx.restore();
  circle(ctx, 0, 0, 30, p.light);
  circle(ctx, 0, 0, 16 + Math.sin(s.t * 3) * 2, p.glass);
  circle(ctx, 0, 0, 8, '#ffffff');
  fillPoly(ctx, [-40, -6, 40, -6, 40, 6, -40, 6], SH);
};

// ---------- QUARRY: a hollowed asteroid with gun pits, a mining drill at the front, glowing seams ----------
const quarry: HullFn = (ctx, p, s) => {
  fillPoly(ctx, [0, -112, 52, -100, 98, -62, 112, -4, 96, 52, 70, 86, 28, 118, -30, 116, -74, 90, -104, 40, -110, -18, -84, -74, -40, -106], p.body, p.line);
  if (!p.mono) fillPoly(ctx, [-20, -96, 40, -90, 80, -52, 30, -60, -10, -70], p.light);
  for (const [x, y] of [[-70, -40], [70, -40], [-60, 50], [60, 50]] as const) ring(ctx, x, y, 24, p.dark, p.line);
  fillSym(ctx, [0, 126, 16, 104, 24, 78, 0, 72], p.dark, p.line);
  if (p.mono) return;
  for (const [x, y, r] of [[-30, -22, 14], [34, 6, 10], [-8, 40, 8], [22, -52, 7]] as const) {
    circle(ctx, x, y, r, SH);
    circle(ctx, x + 1.5, y + 1.5, r * 0.6, p.dark);
  }
  ctx.strokeStyle = `rgba(255,170,90,${(0.55 + Math.sin(s.t * 2) * 0.2).toFixed(2)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-52, -8);
  ctx.lineTo(-12, 12);
  ctx.lineTo(30, -4);
  ctx.lineTo(62, 22);
  ctx.stroke();
  circle(ctx, 0, 0, 20, '#20242a');
  circle(ctx, 0, 0, 9 + Math.sin(s.t * 3), p.glass);
  if (p.live) smoke(ctx, -42, 72, 4, s.t, 2);
};

// ---------- CRATER: a domed citadel in a crater, four rim turrets and a missile silo ----------
const crater: HullFn = (ctx, p, s) => {
  if (!p.mono) {
    circle(ctx, 0, 0, 150, 'rgba(0,0,0,0.22)');
    ctx.strokeStyle = p.light;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 146, 0, Math.PI * 2);
    ctx.stroke();
  }
  slab(ctx, -110, -76, 220, 152, 18, p.dark, p.line);
  for (const [x, y] of [[-95, -60], [95, -60], [-95, 60], [95, 60]] as const) ring(ctx, x, y, 26, p.body, p.line);
  slab(ctx, -14, -126, 28, 44, 6, p.body, p.line);
  ring(ctx, 0, 0, 62, p.body, p.line);
  if (p.mono) return;
  circle(ctx, 0, 0, 50, p.light);
  for (let k = -2; k <= 2; k++) rect(ctx, k * 18 - 1, -48, 2, 96, SH);
  circle(ctx, -14, -16, 14, 'rgba(255,255,255,0.35)');
  circle(ctx, 0, 0, 12 + Math.sin(s.t * 4) * 1.5, p.glass);
  rect(ctx, -60, 74, 120, 4, p.trim);
  if (p.live) fire(ctx, 70, 10, 4, s.t, 3);
};

// ---------- TRIDENT: a long central hull flanked by two shorter ones, joined by beams ----------
const trident: HullFn = (ctx, p, s) => {
  for (const y of [-40, 50]) rect(ctx, -72, y - 6, 144, 12, p.dark);
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.translate(sx * 72, 20);
    fillSym(ctx, [0, 96, 16, 70, 22, 10, 20, -60, 12, -84, 0, -88], p.body, p.line);
    if (!p.mono) for (let y = -60; y < 60; y += 20) rect(ctx, -16, y, 32, 2, SH);
    ctx.restore();
  }
  fillSym(ctx, [0, 160, 22, 128, 36, 60, 40, -80, 32, -132, 0, -142], p.body, p.line);
  if (p.mono) return;
  fillSym(ctx, [0, 150, 16, 124, 26, 64, 0, 60], p.light);
  for (let y = -110; y < 50; y += 22) rect(ctx, -34, y, 68, 2, SH);
  slab(ctx, -16, -20, 32, 40, 6, p.dark, p.line);
  rect(ctx, -12, -8, 24, 5, p.glass);
  for (const sx of [-1, 0, 1]) ellipse(ctx, sx * (sx === 0 ? 0 : 72), sx === 0 ? -146 : -72, 6, 8 + Math.sin(s.t * 30 + sx) * 2, 'rgba(255,120,140,0.6)');
  rect(ctx, -2, 60, 4, 70, p.trim);
  rect(ctx, -30, 0, 60, 2, HL);
};

// ---------- ARK: the mothership — a broad hull with launch bays, broadside batteries and a glowing core ----------
const ark: HullFn = (ctx, p, s) => {
  fillSym(ctx, [0, 172, 40, 140, 100, 96, 160, 40, 168, -20, 140, -80, 70, -130, 30, -150, 0, -150], p.body, p.line);
  for (const sx of [-1, 1]) slab(ctx, sx * 110 - 28, -84, 56, 48, 10, p.dark, p.line);
  if (p.mono) return;
  fillSym(ctx, [0, 160, 34, 130, 86, 92, 60, 60, 0, 70], p.light);
  for (let y = -110; y < 120; y += 24) rect(ctx, -60, y, 120, 2, SH);
  for (const sx of [-1, 1]) {
    rect(ctx, sx * 110 - 20, -74, 40, 28, '#120e18');
    for (let k = 0; k < 4; k++) rect(ctx, sx * 110 - 18 + k * 10, -48, 6, 2, p.trim);
  }
  const pulse = 0.65 + Math.sin(s.t * 2.5) * 0.25;
  circle(ctx, 0, 0, 46, '#1a1420');
  circle(ctx, 0, 0, 34, `rgba(255,106,138,${pulse.toFixed(2)})`);
  circle(ctx, 0, 0, 16, p.glass);
  circle(ctx, 0, 0, 7, '#ffffff');
  for (const x of [-120, -60, 0, 60, 120]) ellipse(ctx, x, -150 + Math.abs(x) * 0.5, 7, 10 + Math.sin(s.t * 28 + x) * 2, 'rgba(255,140,170,0.55)');
  if (p.live) smoke(ctx, 120, 40, 5, s.t, 4);
};

export const HULLS_4: Readonly<Record<Map4Boss, HullFn>> = { halo, quarry, crater, trident, ark };
