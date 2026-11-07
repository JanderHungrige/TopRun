import { gunTurret, HL, missileRack, rect, ring, SH, slab, type Pal, type UnitFn } from '../draw-ground-units';
import { circle, ellipse, fillPair, fillPoly, fillSym } from '../shapes';

// Map 4's space adversaries (docs 56, 58), noses down (+y): the raider fighter, the gun satellite, the corvette, the
// interceptor, the gunship, the lunar battery and the battlecruiser mini-boss. Generic shapes in code, no insignia.

type SpaceKind = 'raider' | 'satgun' | 'corvette' | 'interceptor' | 'gunship' | 'battery' | 'warden';

/** Engine glow at the stern. */
function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, p: Pal): void {
  if (p.mono || !p.live) return;
  ellipse(ctx, x, y, r, r * (1.6 + Math.sin(t * 30 + x) * 0.3), 'rgba(120,190,255,0.55)');
  ellipse(ctx, x, y, r * 0.5, r * 0.9, 'rgba(230,245,255,0.9)');
}

/** A forward-swept dart with twin engines and a cockpit bubble. */
const raider: UnitFn = (ctx, p, t) => {
  for (const sx of [-1, 1]) glow(ctx, sx * 4, -15, 2.6, t, p);
  fillPair(ctx, [3, -6, 15, 6, 16, 10, 12, 10, 4, 4], p.dark, p.line);
  fillSym(ctx, [0, 17, 3, 12, 5, 2, 6, -10, 5, -14, 0, -15], p.body, p.line);
  if (p.mono) return;
  fillSym(ctx, [0, 14, 2, 10, 3, 2, 0, 1], HL);
  ellipse(ctx, 0, 6, 1.8, 3.4, p.glass);
  fillPair(ctx, [12, 7, 16, 10, 12, 10], p.trim);
};

/** A gun platform: a hexagonal bus, two solar panels, a turret that tracks. */
const satgun: UnitFn = (ctx, p, t, aim) => {
  for (const sx of [-1, 1]) {
    rect(ctx, sx > 0 ? 9 : -25, -5, 16, 10, p.dark);
    if (!p.mono) for (let i = 0; i < 4; i++) rect(ctx, (sx > 0 ? 10 : -24) + i * 4, -4, 3, 8, '#24407a');
  }
  fillPoly(ctx, [-6, -10, 6, -10, 11, 0, 6, 10, -6, 10, -11, 0], p.body, p.line);
  if (!p.mono) rect(ctx, -6, -9, 12, 2, HL);
  ctx.save();
  ctx.rotate(aim);
  gunTurret(ctx, 5.5, 2, 0, p, 1.8);
  ctx.restore();
  if (p.live && !p.mono && Math.sin(t * 4) > 0.6) circle(ctx, 0, -12, 1.4, '#ff5a4a');
};

/** A slab-sided warship: a long hull, a missile rack aft, a gun turret forward, engines glowing at the stern. */
const corvette: UnitFn = (ctx, p, t, aim) => {
  for (const sx of [-1, 0, 1]) glow(ctx, sx * 9, -46, 4, t, p);
  fillSym(ctx, [0, 46, 8, 40, 14, 22, 15, -30, 13, -42, 0, -44], p.body, p.line);
  fillPair(ctx, [15, -18, 24, -24, 24, -36, 15, -34], p.dark, p.line);
  if (!p.mono) {
    fillSym(ctx, [0, 40, 6, 35, 10, 20, 10, -26, 0, -28], p.light);
    for (let y = -24; y < 30; y += 9) rect(ctx, -9, y, 18, 1.5, SH);
    ring(ctx, 0, -2, 6, p.dark, p.line);
    ellipse(ctx, 0, -2, 3, 4, p.glass);
  }
  ctx.save();
  ctx.translate(0, 26);
  ctx.rotate(aim);
  gunTurret(ctx, 7, 2, 0, p, 1.8);
  ctx.restore();
  ctx.save();
  ctx.translate(0, -22);
  missileRack(ctx, 4, 7, 0, p);
  ctx.restore();
};

/** A long-nosed delta with a missile under each wing and one big engine. */
const interceptor: UnitFn = (ctx, p, t) => {
  glow(ctx, 0, -17, 3.4, t, p);
  fillSym(ctx, [0, 20, 3, 12, 16, -8, 17, -12, 6, -12, 4, -16, 0, -17], p.body, p.line);
  if (p.mono) return;
  fillSym(ctx, [0, 18, 2, 12, 3, 0, 0, -2], HL);
  ellipse(ctx, 0, 6, 1.8, 3.6, p.glass);
  for (const sx of [-1, 1]) rect(ctx, sx * 10 - 1, -6, 2, 9, p.trim);
};

/** A blunt armoured hull with a three-barrel turret forward and a flak mount aft. */
const gunship: UnitFn = (ctx, p, t, aim) => {
  for (const sx of [-1, 1]) glow(ctx, sx * 8, -30, 3.4, t, p);
  fillSym(ctx, [0, 30, 14, 26, 22, 10, 22, -20, 16, -28, 0, -29], p.body, p.line);
  fillPair(ctx, [22, -4, 30, -10, 30, -22, 22, -18], p.dark, p.line);
  if (!p.mono) {
    for (let y = -20; y < 20; y += 8) rect(ctx, -18, y, 36, 1.5, SH);
    rect(ctx, -6, -24, 12, 4, p.trim);
  }
  ctx.save();
  ctx.translate(0, 12);
  ctx.rotate(aim);
  gunTurret(ctx, 7, 3, 0, p, 1.7);
  ctx.restore();
  ring(ctx, 0, -14, 5, p.dark, p.line);
};

/** A dug-in gun pit on the regolith: a sandbag-grey ring, a flak turret and a missile pod beside it. */
const battery: UnitFn = (ctx, p, t, aim) => {
  ring(ctx, 0, 0, 18, p.dark, p.line);
  if (!p.mono) for (let k = 0; k < 10; k++) rect(ctx, Math.cos(k * 0.63) * 15 - 2, Math.sin(k * 0.63) * 15 - 2, 4, 4, HL);
  ctx.save();
  ctx.translate(10, -10);
  missileRack(ctx, 2, 6, 0, p);
  ctx.restore();
  ctx.save();
  ctx.rotate(aim);
  gunTurret(ctx, 7, 2, 0, p, 1.9);
  ctx.restore();
  if (p.live && !p.mono && Math.sin(t * 3) > 0.7) circle(ctx, -12, 12, 1.6, '#4f8cff');
};

/** The battlecruiser: a long wedge with two turrets, a missile deck and three engines. */
const warden: UnitFn = (ctx, p, t, aim) => {
  for (const sx of [-1, 0, 1]) glow(ctx, sx * 14, -62, 5, t, p);
  fillSym(ctx, [0, 64, 14, 52, 26, 20, 30, -40, 24, -58, 0, -60], p.body, p.line);
  fillPair(ctx, [30, -10, 44, -22, 44, -46, 30, -40], p.dark, p.line);
  if (!p.mono) {
    fillSym(ctx, [0, 56, 10, 46, 18, 20, 0, 18], p.light);
    for (let y = -50; y < 40; y += 10) rect(ctx, -24, y, 48, 1.5, SH);
    slab(ctx, -8, -12, 16, 18, 3, p.dark, p.line);
    rect(ctx, -6, -6, 12, 3, p.glass);
  }
  for (const y of [34, 14]) {
    ctx.save();
    ctx.translate(0, y);
    ctx.rotate(aim);
    gunTurret(ctx, 8, 3, 0, p, 1.8);
    ctx.restore();
  }
  ctx.save();
  ctx.translate(0, -34);
  missileRack(ctx, 4, 9, 0, p);
  ctx.restore();
};

export const SPACE_UNITS: Readonly<Record<SpaceKind, UnitFn>> = { raider, satgun, corvette, interceptor, gunship, battery, warden };
