import type { BossDrawState } from './draw-bosses';
import { HL, rect, ring, SH, type Pal } from './draw-ground-units';
import { bossPal } from './bosses-2';
import { circle, fillPoly } from './shapes';
import { TAU } from '../core/math';

// Hulls of map 4's bosses (doc 56) in data/bosses-4.ts's local coordinates; turrets, launchers, damage and warning
// lights come from the shared boss renderer (draw-bosses.ts).

type Ctx = CanvasRenderingContext2D;
type HullFn = (ctx: Ctx, p: Pal, s: BossDrawState) => void;
type Map4Boss = 'halo';

export const PALS_4: Readonly<Record<Map4Boss, Pal>> = {
  halo: bossPal('#8d96a8', '#4c5466', '#c3cad8', '#5b7cff', '#9fd0ff'),
};

export const LIGHTS_4: Readonly<Record<Map4Boss, readonly number[]>> = {
  halo: [0, 128, 0, -128, -128, 0, 128, 0, 0, 0],
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

export const HULLS_4: Readonly<Record<Map4Boss, HullFn>> = { halo };
