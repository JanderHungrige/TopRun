import type { BossDrawState } from './draw-bosses';
import { fire, smoke } from './draw-enemies';
import { HL, rect, ring, SH, slab, type Pal } from './draw-ground-units';
import { bossPal } from './bosses-2';
import { circle, ellipse, fillPair, fillPoly, fillSym } from './shapes';

// Hulls of the five map-3 bosses (doc 48) in data/bosses-3.ts's local coordinates (nose / bow down, +y). Turrets,
// launchers, damage and warning lights come from the shared boss renderer (draw-bosses.ts).

type Ctx = CanvasRenderingContext2D;
type HullFn = (ctx: Ctx, p: Pal, s: BossDrawState) => void;
type Map3Boss = 'glacier' | 'citadel' | 'caiman' | 'mammoth' | 'behemoth';

export const PALS_3: Readonly<Record<Map3Boss, Pal>> = {
  glacier: bossPal('#5d6873', '#3c444c', '#c8d0d6', '#b3262a', '#1f2a33'),
  citadel: bossPal('#7d7468', '#4d473f', '#a59b8d', '#6a5a3a', '#25323d'),
  caiman: bossPal('#4c5a3e', '#2f3a26', '#6f7d58', '#8a6a3a', '#1d2418'),
  mammoth: bossPal('#6e6a52', '#46432f', '#908a6a', '#9a4a2a', '#1e2228'),
  behemoth: bossPal('#3a3f38', '#262a25', '#565c52', '#8a1f2e', '#2a3a40'),
};

export const LIGHTS_3: Readonly<Record<Map3Boss, readonly number[]>> = {
  glacier: [-40, -100, 40, -100, 0, 140, -46, 60, 46, 60],
  citadel: [-100, -78, 100, -78, -100, 78, 100, 78, 0, 0],
  caiman: [-30, -100, 30, -100, 0, 120, -34, 40, 34, 40],
  mammoth: [-84, -90, 84, -90, -84, 90, 84, 90, 0, -96],
  behemoth: [0, 148, 0, -146, -94, 14, 94, 14, 0, -105, 0, 105],
};

// ---------- GLACIER: an armoured icebreaker pushing through floes ----------
const glacier: HullFn = (ctx, p, s) => {
  if (p.live) {
    for (const [x, y, r] of [[-70, 120, 16], [66, 96, 12], [-62, -40, 14], [72, -90, 18], [-80, 30, 10], [58, 30, 11]] as const) {
      ellipse(ctx, x, y + ((s.t * 18) % 30) - 15, r, r * 0.6, 'rgba(235,242,248,0.85)');
    }
  }
  fillSym(ctx, [0, 152, 30, 122, 46, 72, 50, -100, 40, -138, 0, -146], p.body, p.line);
  fillSym(ctx, [0, 142, 24, 118, 36, 80, 38, 64, 0, 64], p.trim);
  if (p.mono) return;
  for (let y = -110; y < 60; y += 28) rect(ctx, -44, y, 88, 2, SH);
  slab(ctx, -28, -82, 56, 58, 6, p.light, p.line);
  rect(ctx, -24, -32, 48, 4, p.glass);
  slab(ctx, -10, -18, 20, 24, 4, p.dark, p.line);
  rect(ctx, -10, -14, 20, 3, p.trim);
  if (p.live) smoke(ctx, 0, -12, 7, s.t, 2);
  rect(ctx, -46, 2, 92, 3, HL);
};

// ---------- CITADEL: an old mountain fortress with four towers ----------
const citadel: HullFn = (ctx, p, s) => {
  if (!p.mono) fillSym(ctx, [0, 130, 90, 118, 150, 70, 156, -40, 120, -112, 40, -132, 0, -128], '#3a3732');
  slab(ctx, -100, -78, 200, 156, 6, p.body, p.line);
  slab(ctx, -66, -52, 132, 92, 6, p.light, p.line);
  for (const [x, y] of [[-100, -78], [100, -78], [-100, 78], [100, 78]] as const) ring(ctx, x, y, 34, p.dark, p.line);
  if (p.mono) return;
  for (let x = -92; x <= 84; x += 16) {
    rect(ctx, x, -76, 8, 4, HL);
    rect(ctx, x, 72, 8, 4, SH);
  }
  rect(ctx, -54, -40, 108, 68, '#5a5248');
  circle(ctx, 0, -6, 22, '#20242a');
  circle(ctx, 0, -6, 9, p.glass);
  rect(ctx, -16, 64, 32, 14, p.dark);
  rect(ctx, -2, -76, 4, 26, p.trim);
  if (p.live) fire(ctx, 40, -20, 4, s.t, 2);
};

// ---------- CAIMAN: a low river monitor, bow down ----------
const caiman: HullFn = (ctx, p, s) => {
  if (p.live) for (const sx of [-1, 1]) fillPoly(ctx, [sx * 30, -118, sx * 70, -170, sx * 60, -172, sx * 24, -124], 'rgba(255,255,255,0.22)');
  fillSym(ctx, [0, 132, 20, 112, 34, 60, 36, -92, 28, -118, 0, -124], p.body, p.line);
  if (p.mono) return;
  slab(ctx, -26, -96, 52, 176, 8, p.light, p.line);
  for (let y = -88; y < 76; y += 16) rect(ctx, -24, y, 48, 2, SH);
  slab(ctx, -14, -24, 28, 32, 4, p.dark, p.line);
  rect(ctx, -12, 2, 24, 4, p.glass);
  rect(ctx, -30, 100, 60, 3, p.trim);
  if (p.live) smoke(ctx, 0, -14, 5, s.t, 3);
};

// ---------- MAMMOTH: a super-heavy tank on four tracks ----------
const mammoth: HullFn = (ctx, p, s) => {
  for (const sx of [-1, 1]) {
    slab(ctx, sx > 0 ? 66 : -100, -98, 34, 196, 8, p.dark, p.line);
    if (!p.mono) for (let y = -92 + ((s.t * 30) % 10); y < 94; y += 10) rect(ctx, sx > 0 ? 68 : -98, y, 30, 2, '#23211b');
  }
  fillSym(ctx, [0, 100, 60, 92, 66, 60, 66, -82, 54, -98, 0, -102], p.body, p.line);
  if (p.mono) return;
  fillSym(ctx, [0, 88, 50, 82, 56, 56, 56, -72, 46, -86, 0, -90], p.light);
  for (let y = -84; y < -58; y += 6) rect(ctx, -40, y, 80, 2, SH);
  rect(ctx, -56, 4, 112, 3, p.trim);
  if (p.live) for (const sx of [-1, 1]) smoke(ctx, sx * 40, -96, 6, s.t, sx + 2);
};

// ---------- BEHEMOTH: a twin-rotor gunship, nose down ----------
function rotorDisc(ctx: Ctx, y: number, t: number, spin: number): void {
  ctx.save();
  ctx.globalAlpha = 0.22;
  circle(ctx, 0, y, 96, '#2a2e33');
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = '#1c1f22';
  ctx.lineWidth = 5;
  for (let k = 0; k < 3; k++) {
    const a = t * spin + (k * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 94, y + Math.sin(a) * 94);
    ctx.lineTo(Math.cos(a + Math.PI) * 18, y + Math.sin(a + Math.PI) * 18);
    ctx.stroke();
  }
  ctx.restore();
}

const behemoth: HullFn = (ctx, p, s) => {
  fillPair(ctx, [34, -12, 92, -4, 96, 26, 34, 30], p.light, p.line);
  fillSym(ctx, [0, 152, 22, 142, 34, 112, 38, -118, 30, -140, 0, -148], p.body, p.line);
  if (!p.mono) {
    fillSym(ctx, [0, 148, 16, 140, 22, 126, 0, 122], p.glass);
    for (let y = -80; y < 90; y += 20) for (const sx of [-1, 1]) rect(ctx, sx * 30 - 2, y, 4, 7, '#1c2024');
    rect(ctx, -2, -140, 4, 40, p.trim);
  }
  for (const y of [-105, 105]) circle(ctx, 0, y, 12, p.dark);
  if (p.live) {
    rotorDisc(ctx, -105, s.t, 24);
    rotorDisc(ctx, 105, s.t, -24);
  }
};

export const HULLS_3: Readonly<Record<Map3Boss, HullFn>> = { glacier, citadel, caiman, mammoth, behemoth };
