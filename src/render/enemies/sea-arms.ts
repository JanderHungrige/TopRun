import type { ShellInk } from '../detail/organic';
import { plateShell, shell } from '../detail/organic';
import { bolts, hatch, sym } from '../detail/parts';
import { shade } from '../detail/color';
import { port } from './sea-kit';
import { hullInk, metalInk, type SeaPal } from './sea-pal';

// The sea's guns in detail (doc 120), drawn along +y (the caller turns them with `aim − π`): turrets with barrels and
// muzzle brakes, missiles with red noses on their launch rails, missile and torpedo tubes. Live parts: in a one-colour
// palette they keep only their outline.

type Ctx = CanvasRenderingContext2D;

/** The shades of one colour for the organic painters; in a one-colour palette, that colour only. */
export const tone = (p: SeaPal, c: string): ShellInk =>
  (p.mono ? { base: p.hull, dark: p.hull, light: p.hull, ink: p.hull } : { base: c, dark: shade(c, -0.45), light: shade(c, 0.45), ink: p.ink });

/** A glossy round body (the organic shell); in a one-colour palette a plain disc, no highlight. */
export function blob(ctx: Ctx, p: SeaPal, x: number, y: number, rx: number, ry: number, c: ShellInk, segments = 0, rot = 0): void {
  if (!p.mono) return shell(ctx, x, y, rx, ry, c, segments, rot);
  ctx.fillStyle = p.hull;
  ctx.beginPath();
  ctx.ellipse(x, y, rx + 0.6, ry + 0.6, rot, 0, Math.PI * 2);
  ctx.fill();
}

/** A gun turret of radius r: n barrels `len` radii long along +y with muzzle brakes, the housing, its sight and hatch. */
export function turret(ctx: Ctx, p: SeaPal, r: number, n: number, len: number): void {
  const bw = Math.max(0.9, r * 0.17);
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * r * 0.38;
    plateShell(ctx, [x - bw / 2, r * 0.3, x + bw / 2, r * 0.3, x + bw * 0.42, r * len, x - bw * 0.42, r * len], metalInk(p), r * 0.05);
    plateShell(ctx, [x - bw * 0.72, r * (len - 0.24), x + bw * 0.72, r * (len - 0.24), x + bw * 0.72, r * (len + 0.04), x - bw * 0.72, r * (len + 0.04)], metalInk(p), r * 0.05);
  }
  plateShell(ctx, sym([0, r * 0.95, r * 0.6, r * 0.9, r * 0.95, r * 0.25, r * 0.95, -r * 0.4, r * 0.65, -r * 0.9, 0, -r]), hullInk(p), r * 0.08);
  if (p.mono) return;
  plateShell(ctx, sym([0, r * 0.7, r * 0.4, r * 0.6, r * 0.58, 0, r * 0.42, -r * 0.6, 0, -r * 0.65]), { base: p.light, dark: p.hull, light: shade(p.light, 0.5), ink: p.ink }, r * 0.04);
  port(ctx, r * 0.55, r * 0.52, r * 0.12, p, p.glass);
  hatch(ctx, -r * 0.24, -r * 0.3, r * 0.24, p.hull);
  bolts(ctx, [-r * 0.7, -r * 0.55, r * 0.7, -r * 0.55, -r * 0.8, r * 0.3, r * 0.8, r * 0.3], r * 0.05);
}

/** A missile lying along +y from y0, `len` long and `w` wide: white body, red nose, tail fins. */
export function missile(ctx: Ctx, p: SeaPal, x: number, y0: number, len: number, w: number): void {
  const fins = tone(p, '#5a6066');
  for (const s of [-1, 1]) plateShell(ctx, [x + s * w * 0.4, y0 + len * 0.02, x + s * w * 1.05, y0, x + s * w * 0.4, y0 + len * 0.22], fins, w * 0.08);
  plateShell(ctx, [x - w / 2, y0, x + w / 2, y0, x + w / 2, y0 + len * 0.74, x, y0 + len, x - w / 2, y0 + len * 0.74], tone(p, '#e6e8e2'), w * 0.1);
  plateShell(ctx, [x - w / 2, y0 + len * 0.74, x + w / 2, y0 + len * 0.74, x, y0 + len], tone(p, '#c8312a'), w * 0.1);
}

/** A launcher of n missiles on a turning cradle of radius r (along +y). */
export function launcher(ctx: Ctx, p: SeaPal, r: number, n: number): void {
  blob(ctx, p, 0, 0, r, r, hullInk(p));
  const w = r * 0.42, span = (n - 1) * w * 1.3;
  plateShell(ctx, [-span / 2 - w, -r * 0.6, span / 2 + w, -r * 0.6, span / 2 + w, r * 0.9, -span / 2 - w, r * 0.9], tone(p, p.dark), r * 0.06);
  for (let i = 0; i < n; i++) missile(ctx, p, -span / 2 + i * w * 1.3, -r * 0.5, r * 2.1, w);
}

/** A tube's mouth seen from above: a bolted collar, the dark bore and the nose of what waits inside. */
export function tubeMouth(ctx: Ctx, p: SeaPal, x: number, y: number, r: number, nose: string): void {
  blob(ctx, p, x, y, r, r, metalInk(p));
  if (p.mono) return;
  ctx.fillStyle = '#05080a';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.68, 0, Math.PI * 2);
  ctx.fill();
  shell(ctx, x, y + r * 0.08, r * 0.42, r * 0.42, tone(p, nose), 0);
  bolts(ctx, Array.from({ length: 6 }, (_, k) => [x + Math.cos(k * 1.047) * r * 0.84, y + Math.sin(k * 1.047) * r * 0.84]).flat(), r * 0.07);
}
