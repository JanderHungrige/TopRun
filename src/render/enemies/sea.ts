import { gunTurret, HL, rect, ring, SH, type Pal, type UnitFn } from '../draw-ground-units';
import { circle, ellipse, fillPair, fillPoly, fillSym } from '../shapes';

// Map 5's sea machines (doc 68), bows down (+y): the midget sub, the sea drone, the sea mine and the seabed turret.
// Generic shapes in code, no insignia.

type SeaKind = 'minisub' | 'seadrone' | 'seamine' | 'seaturret';

/** A turning screw at the stern: a hub and a blur of blades. */
export function screwBlur(ctx: CanvasRenderingContext2D, y: number, w: number, t: number, p: Pal): void {
  if (p.mono) return;
  ellipse(ctx, 0, y, w * (0.35 + Math.abs(Math.cos(t * 28)) * 0.65), w * 0.25, 'rgba(200,225,235,0.35)');
  circle(ctx, 0, y, w * 0.2, p.dark);
}

/** A stubby dark sub: X-fins aft, a little sail, the bow light glowing ahead. */
const minisub: UnitFn = (ctx, p, t) => {
  screwBlur(ctx, -21, 6, t, p);
  fillPair(ctx, [2, -14, 9, -20, 9, -22, 3, -19], p.dark, p.line);
  fillSym(ctx, [0, 22, 4.5, 19, 7.5, 12, 8.5, 2, 8, -10, 5, -17, 0, -20], p.body, p.line);
  fillSym(ctx, [0, 8, 2.4, 6, 2.6, -1, 1.6, -4, 0, -4.5], p.dark, p.line);
  if (p.mono) return;
  fillSym(ctx, [0, 18, 3, 14, 4, 2, 3, -12, 0, -15], HL);
  rect(ctx, -7, -6, 14, 1.2, SH);
  if (p.live) {
    ellipse(ctx, 0, 27, 4, 7, 'rgba(255,226,122,0.18)');
    circle(ctx, 0, 21, 1.6, p.glass);
  }
};

/** A yellow torpedo-shaped drone with cruciform fins and a red nose band. */
const seadrone: UnitFn = (ctx, p, t) => {
  screwBlur(ctx, -13, 4, t, p);
  fillPair(ctx, [2, -8, 6, -12, 6, -13, 2, -11], p.dark, p.line);
  fillSym(ctx, [0, 13, 2.6, 10.5, 3.6, 5, 3.6, -8, 2.6, -11.5, 0, -12], p.body, p.line);
  if (p.mono) return;
  rect(ctx, -3.6, 6.5, 7.2, 2, p.trim);
  fillSym(ctx, [0, 11, 1.4, 9, 1.8, -6, 0, -8], HL);
};

/** A black horned ball on a broken mooring chain, a red lamp blinking. */
const seamine: UnitFn = (ctx, p, t) => {
  if (!p.mono) for (let i = 0; i < 4; i++) rect(ctx, -1, -12 - i * 3.2, 2, 2.4, p.dark);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    ctx.save();
    ctx.rotate(a);
    fillPoly(ctx, [-1.6, 9, 1.6, 9, 1.1, 14, -1.1, 14], p.dark, p.line);
    ctx.restore();
  }
  ring(ctx, 0, 0, 10.5, p.body, p.line);
  if (p.mono) return;
  ellipse(ctx, -3, -3.5, 3.5, 2.5, HL);
  rect(ctx, -10.5, -0.8, 21, 1.6, SH);
  if (p.live && Math.sin(t * 5) > 0.3) circle(ctx, 0, 3.5, 1.8, p.red);
};

/** An armoured dome bolted to a rock, twin barrels that track the sub. */
const seaturret: UnitFn = (ctx, p, t, aim) => {
  fillPoly(ctx, [-17, 4, -13, -10, -4, -15, 9, -13, 16, -4, 15, 9, 6, 15, -9, 14], p.dark, p.line);
  if (!p.mono) {
    ellipse(ctx, -8, -6, 4, 3, HL);
    ellipse(ctx, 8, 8, 5, 3, SH);
    for (const [cx, cy, c] of [[-12, 8, '#ff8a78'], [11, -9, '#c87ae8'], [13, 6, '#ffb84a']] as const) circle(ctx, cx, cy, 2.2, c);
  }
  ring(ctx, 0, 0, 9, p.body, p.line);
  if (!p.mono) ellipse(ctx, -2.5, -2.5, 4, 3, HL);
  ctx.save();
  ctx.rotate(aim);
  gunTurret(ctx, 6, 2, 0, p, 2);
  ctx.restore();
  if (p.live && !p.mono && Math.sin(t * 3) > 0.7) circle(ctx, 0, 0, 1.4, p.glass);
};

export const SEA_UNITS: Readonly<Record<SeaKind, UnitFn>> = { minisub, seadrone, seamine, seaturret };
