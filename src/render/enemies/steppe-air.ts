import type { Pal, UnitFn } from '../draw-ground-units';
import { circle, ellipse, fillPoly } from '../shapes';

// The invasion's fliers (doc 105), fronts down (+y): the small scout disc with its lights running round the rim, the disc
// fighter with two forward prongs and a hot engine glow behind, the bomber manta — a bio-machine ray beating its wide
// wings slowly, bomb sacs under its belly. Flashed or as a shadow they keep the outline.

type SteppeAir = 'scoutdisc' | 'discfighter' | 'manta';

/** Lights running round a rim. */
function rimLights(ctx: CanvasRenderingContext2D, r: number, n: number, t: number, rgb: string): void {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + t * 2.5;
    const on = 0.35 + 0.65 * Math.max(0, Math.sin(t * 6 + i * 1.7));
    circle(ctx, Math.cos(a) * r, Math.sin(a) * r * 0.9, 1.1, `rgba(${rgb},${on.toFixed(2)})`);
  }
}

const scoutdisc: UnitFn = (ctx, p, t) => {
  ellipse(ctx, 0, 0, 13, 12, p.mono ? p.body : p.line);
  ellipse(ctx, 0, 0, 12, 11, p.body);
  ellipse(ctx, 0, 0, 5.5, 5, p.mono ? p.body : p.dark); // the dome
  if (p.mono) return;
  ctx.strokeStyle = p.trim;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 8, 0, 0, Math.PI * 2);
  ctx.stroke();
  rimLights(ctx, 10.5, 8, t, '90,230,220');
  ellipse(ctx, -1.5, -1.5, 2.6, 2, 'rgba(255,170,240,0.6)');
  circle(ctx, 0, 0, 1.4, p.glass);
};

const discfighter: UnitFn = (ctx, p, t) => {
  for (const side of [-1, 1]) { // the forward prongs
    fillPoly(ctx, [side * 7, 8, side * 12, 22, side * 9, 23, side * 4, 10], p.mono ? p.body : p.line);
    fillPoly(ctx, [side * 7, 9, side * 11, 21, side * 9.4, 21.6, side * 5, 10.5], p.mono ? p.body : p.dark);
    if (!p.mono) circle(ctx, side * 10.6, 21.5, 1.3, p.glass);
  }
  ellipse(ctx, 0, 0, 17, 15, p.mono ? p.body : p.line);
  ellipse(ctx, 0, 0, 16, 14, p.body);
  if (!p.mono && p.live) { // the engine glow behind
    const heat = 0.6 + 0.4 * Math.sin(t * 20);
    ellipse(ctx, 0, -14, 7, 3 + heat * 2, `rgba(255,120,230,${(0.5 * heat).toFixed(2)})`);
  }
  ellipse(ctx, 0, 1, 7, 6, p.mono ? p.body : p.dark);
  if (p.mono) return;
  ctx.strokeStyle = p.trim;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 10.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  rimLights(ctx, 14, 10, t, '255,90,216');
  ellipse(ctx, -2, -1, 3, 2.2, 'rgba(255,255,255,0.3)');
};

const manta: UnitFn = (ctx, p, t) => {
  const beat = Math.sin(t * 1.6) * 5;
  ctx.strokeStyle = p.mono ? p.body : p.dark;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath(); // the long tail
  ctx.moveTo(0, -12);
  ctx.quadraticCurveTo(Math.sin(t * 1.3) * 5, -26, Math.sin(t * 1.3 + 1) * 4, -38);
  ctx.stroke();
  const wing = [0, 16, 12, 10, 30, 0 + beat, 34, -4 + beat, 22, -8, 6, -14, 0, -14];
  fillPoly(ctx, wing, p.mono ? p.body : p.line);
  fillPoly(ctx, wing.map((v, i) => (i % 2 ? v : -v)), p.mono ? p.body : p.line);
  const inner = [0, 14, 11, 9, 28, 0 + beat, 31, -3 + beat, 21, -6.5, 6, -12.5, 0, -12.5];
  fillPoly(ctx, inner, p.body);
  fillPoly(ctx, inner.map((v, i) => (i % 2 ? v : -v)), p.body);
  ellipse(ctx, 0, 2, 9, 14, p.mono ? p.body : p.dark); // the body
  if (p.mono) return;
  for (const side of [-1, 1]) {
    ctx.strokeStyle = p.trim; // ribs in the wings
    ctx.lineWidth = 1;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.moveTo(side * 6, 4 - k * 5);
      ctx.lineTo(side * (22 + k * 3), -1 - k * 2 + beat);
      ctx.stroke();
    }
    ellipse(ctx, side * 5, 0, 3, 4, '#3a2030'); // bomb sacs
    circle(ctx, side * 5, 1, 1.2, p.glass);
  }
  circle(ctx, -3, 13, 1.2, '#ffb03a');
  circle(ctx, 3, 13, 1.2, '#ffb03a');
};

export const STEPPE_AIR: Readonly<Record<SteppeAir, UnitFn>> = { scoutdisc, discfighter, manta };

export const steppeAirPals = (pal: (body: string, dark: string, light: string, trim: string, glass?: string) => Pal): Readonly<Record<SteppeAir, Pal>> => ({
  scoutdisc: pal('#8a8aa0', '#3a3a4e', '#c8c8dc', '#3ad8c8', '#ff4ad8'),
  discfighter: pal('#6a6a86', '#2c2c40', '#a8a8c4', '#3ad8c8', '#ff4ad8'),
  manta: pal('#4a5a6a', '#22303a', '#8aa0b0', '#3ad8c8', '#ff7ae0'),
});
