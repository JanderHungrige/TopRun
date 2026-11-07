import { gunTurret, HL, missileRack, rect, ring, SH, type Pal, type UnitFn } from '../draw-ground-units';
import { circle, ellipse, fillPair, fillPoly, fillSym } from '../shapes';

// Map 4's space adversaries (doc 56), noses down (+y): the raider fighter, the gun satellite and the corvette.
// Generic shapes in code, no insignia.

type SpaceKind = 'raider' | 'satgun' | 'corvette';

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

export const SPACE_UNITS: Readonly<Record<SpaceKind, UnitFn>> = { raider, satgun, corvette };
