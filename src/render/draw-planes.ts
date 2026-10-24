import type { PlaneId } from '../data/types';
import { ellipse, fillPair, fillSym, flame } from './shapes';

/** Top-down player jets, nose pointing up (-y), drawn around (0, 0). */

export interface PlaneDrawOpts {
  bank?: number; // -1 (rolling left) .. 1 (rolling right)
  sweep?: number; // F-14 wing sweep 0 (forward) .. 1 (fully swept)
  throttle?: number; // afterburner 0..1
  t?: number;
  flash?: boolean;
  shadow?: boolean;
}

interface Palette {
  body: string;
  dark: string;
  light: string;
  canopy: string;
  accent: string;
  line: string;
}

const PALETTES: Readonly<Record<PlaneId, Palette>> = {
  f16: { body: '#b7c1cb', dark: '#8794a1', light: '#d9e1e8', canopy: '#e9b949', accent: '#5a6673', line: 'rgba(20,28,36,0.55)' },
  f14: { body: '#a9b3bd', dark: '#7f8a96', light: '#cfd7de', canopy: '#7fc6e8', accent: '#e8c01c', line: 'rgba(20,28,36,0.55)' },
  sr71: { body: '#262a31', dark: '#16181c', light: '#3d4450', canopy: '#5d7f99', accent: '#b23a3a', line: 'rgba(0,0,0,0.6)' },
};

const solid = (c: string): Palette => ({ body: c, dark: c, light: c, canopy: c, accent: c, line: c });

function palette(id: PlaneId, o: PlaneDrawOpts): Palette {
  if (o.shadow) return solid('rgba(0,0,0,0.28)');
  if (o.flash) return solid('#ffffff');
  return PALETTES[id];
}

function drawF16(ctx: CanvasRenderingContext2D, p: Palette, o: PlaneDrawOpts): void {
  const t = o.t ?? 0;
  if (!o.shadow) flame(ctx, 0, 29, 6, o.throttle ?? 0.4, t);
  fillPair(ctx, [6, -9, 25, 7, 25, 12, 6, 15], p.body, p.line); // wings
  fillPair(ctx, [24, 0, 26, 0, 26, 14, 24, 14], p.dark); // wingtip rails
  fillPair(ctx, [5, 19, 16, 26, 16, 29, 5, 28], p.dark, p.line); // stabilators
  fillSym(ctx, [0, -33, 2.5, -27, 4, -20, 6, -10, 6.5, 18, 5, 27, 3, 29, 0, 29], p.body, p.line);
  fillSym(ctx, [0, -10, 3, -6, 3.2, 22, 0, 24], p.light);
  ellipse(ctx, 0, -17, 2.6, 6.5, p.canopy);
  if (!o.shadow && !o.flash) {
    ellipse(ctx, -0.8, -19, 0.8, 2.6, 'rgba(255,255,255,0.55)');
    ctx.fillStyle = p.accent;
    ctx.fillRect(-0.6, 8, 1.2, 18); // dorsal spine / tail fin seen from above
  }
}

function tomcatWing(ctx: CanvasRenderingContext2D, p: Palette, sweep: number): void {
  const angle = (20 + sweep * 48) * (Math.PI / 180);
  const len = 27 - sweep * 6;
  const px = 13;
  const py = -1;
  const tipX = px + Math.cos(angle) * len;
  const tipY = py + Math.sin(angle) * len;
  const chord = 5 + sweep * 2;
  fillPair(ctx, [px, py - 3, tipX, tipY - 1, tipX - 1, tipY + chord * 0.6, px, py + 9], p.body, p.line);
}

function drawF14(ctx: CanvasRenderingContext2D, p: Palette, o: PlaneDrawOpts): void {
  const t = o.t ?? 0;
  if (!o.shadow) {
    flame(ctx, -10, 31, 6, o.throttle ?? 0.4, t);
    flame(ctx, 10, 31, 6, o.throttle ?? 0.4, t + 0.3);
  }
  tomcatWing(ctx, p, o.sweep ?? 0.3);
  fillPair(ctx, [11, 21, 24, 29, 23, 33, 11, 31], p.dark, p.line); // stabilators
  fillSym(ctx, [0, -35, 3, -29, 5, -20, 8, -11, 15, -3, 16, 5, 15.5, 22, 14, 31, 6, 31, 4, 26, 0, 26], p.body, p.line);
  fillPair(ctx, [7, 0, 13, 0, 13, 31, 7, 31], p.dark); // widely spaced engine nacelles
  fillSym(ctx, [0, -12, 4, -6, 5, 24, 0, 25], p.light); // "pancake" between the engines
  fillPair(ctx, [11, 14, 13.5, 14, 13, 30, 11, 30], p.accent); // twin tails from above
  ellipse(ctx, 0, -20, 3, 8, p.canopy);
  if (!o.shadow && !o.flash) {
    ellipse(ctx, -1, -23, 1, 3, 'rgba(255,255,255,0.5)');
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(-0.5, -19, 1, 6);
  }
}

function drawSR71(ctx: CanvasRenderingContext2D, p: Palette, o: PlaneDrawOpts): void {
  const t = o.t ?? 0;
  if (!o.shadow) {
    flame(ctx, -14, 33, 7, o.throttle ?? 0.4, t);
    flame(ctx, 14, 33, 7, o.throttle ?? 0.4, t + 0.4);
  }
  // Fuselage + chines + delta wing as one blended outline.
  fillSym(ctx, [0, -44, 2.5, -32, 6, -20, 11, -6, 16, 4, 29, 24, 29, 28, 17, 29, 7, 31, 3, 36, 0, 36], p.body, p.line);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.roundRect(side * 14 - 3.6, -11, 7.2, 44, 3.4); // nacelles
    ctx.fillStyle = p.dark;
    ctx.fill();
    ctx.strokeStyle = p.line;
    ctx.stroke();
    ctx.fillStyle = p.light;
    ctx.fillRect(side * 14 - 1.4, -9, 1.6, 40); // cylinder highlight
  }
  fillPair(ctx, [14, -19, 16.4, -11, 11.6, -11], p.light); // inlet spikes
  fillPair(ctx, [13, 14, 15, 14, 13, 31, 11, 31], p.light); // canted fins
  fillSym(ctx, [0, -30, 1.8, -24, 2.5, 20, 0, 24], p.light);
  ellipse(ctx, 0, -25, 1.8, 4.5, p.canopy);
  if (!o.shadow && !o.flash) {
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-24, 22);
    ctx.lineTo(24, 22);
    ctx.stroke();
  }
}

export function drawPlaneTop(
  ctx: CanvasRenderingContext2D, id: PlaneId, x: number, y: number, scale: number, o: PlaneDrawOpts = {},
): void {
  const bank = o.bank ?? 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * (1 - Math.abs(bank) * 0.32), scale);
  ctx.lineWidth = 0.8;
  ctx.lineJoin = 'round';
  const p = palette(id, o);
  switch (id) {
    case 'f16': drawF16(ctx, p, o); break;
    case 'f14': drawF14(ctx, p, o); break;
    case 'sr71': drawSR71(ctx, p, o); break;
    default: throw new Error(`unhandled: ${id satisfies never}`);
  }
  ctx.restore();
}
