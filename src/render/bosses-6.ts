import type { BossId } from '../data/types';
import type { BossDrawState } from './draw-bosses';
import { rect, type Pal } from './draw-ground-units';
import { bossPal } from './bosses-2';
import { circle, ellipse, fillPair, fillPoly, fillSym } from './shapes';

// Hulls of map 6's bosses (doc 81) in data/bosses-6.ts's local coordinates, fronts down (+y); guns, damage and warning
// lights come from the shared boss renderer. RAVAGER and SENTINEL are machines; MANTIS, BASILISK and the HIVE QUEEN are
// creatures whose weak points are organs.

type Ctx = CanvasRenderingContext2D;
type HullFn = (ctx: Ctx, p: Pal, s: BossDrawState) => void;
type Map6Boss = 'ravager' | 'mantis' | 'basilisk' | 'sentinel' | 'queen';

export const PALS_6: Readonly<Record<Map6Boss, Pal>> = {
  ravager: bossPal('#6a6a46', '#3a3a24', '#909066', '#c84a2a', '#ff6a3a'),
  mantis: bossPal('#5a9a3a', '#2e5a1e', '#9ad06a', '#e8d84a', '#ff5a3a'),
  basilisk: bossPal('#4a5a3a', '#26301c', '#7a8a5a', '#c8a040', '#ffd23a'),
  sentinel: bossPal('#8a8a7a', '#55554a', '#b8b8a4', '#4a8a3a', '#5affd0'),
  queen: bossPal('#6a3a5a', '#3a1e32', '#a06a90', '#ff7ad2', '#ffb0e8'),
};

export const LIGHTS_6: Readonly<Record<Map6Boss, readonly number[]>> = {
  ravager: [-40, 40, 40, 40, 0, -50, -80, 50, 80, 50],
  mantis: [0, 62, -20, -30, 20, -30, 0, -110],
  basilisk: [-14, 130, 14, 130, 0, 30, 0, -60],
  sentinel: [0, 24, -40, -40, 40, -40, 0, -90],
  queen: [-14, 118, 14, 118, 0, -80, -60, -100, 60, -100],
};

/** The creature bosses: their parts are organs. */
export const ORGANIC_6: readonly BossId[] = ['mantis', 'basilisk', 'queen'];

/** A big walker's foot, striding with time. */
function foot(ctx: Ctx, x: number, y: number, p: Pal): void {
  fillSym(ctx, [0, -18, 14, -14, 18, 10, 10, 20, 0, 22].map((v, i) => (i % 2 ? v + y : v + x)), p.dark, p.line);
}

const ravager: HullFn = (ctx, p, s) => {
  const step = Math.sin(s.t * 1.6) * 14;
  for (const side of [-1, 1]) {
    const fy = 30 + (side < 0 ? step : -step);
    ctx.strokeStyle = p.line;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(side * 26, 10);
    ctx.lineTo(side * 40, fy);
    ctx.stroke();
    ctx.strokeStyle = p.dark;
    ctx.lineWidth = 12;
    ctx.stroke();
    ctx.save();
    ctx.translate(side * 40, fy);
    foot(ctx, 0, 0, p);
    ctx.restore();
  }
  fillSym(ctx, [0, -60, 40, -52, 56, -20, 56, 30, 36, 52, 0, 58], p.body, p.line);
  fillSym(ctx, [0, -52, 32, -46, 44, -20, 0, -24], p.light);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 78, 10);
    fillSym(ctx, [0, -30, 20, -24, 22, 26, 0, 32], p.body, p.line);
    rect(ctx, -6, 20, 12, 34, p.dark);
    ctx.restore();
  }
  rect(ctx, -24, -80, 48, 26, p.dark);
  if (p.mono) return;
  rect(ctx, -14, 32, 28, 12, p.glass);
  for (let i = -2; i <= 2; i++) circle(ctx, i * 9, -67, 3, p.trim);
};

const mantis: HullFn = (ctx, p, s) => {
  const sway = Math.sin(s.t * 1.2) * 4;
  ctx.strokeStyle = p.mono ? p.body : p.dark;
  ctx.lineWidth = 4;
  for (const [y, a] of [[-10, 0.9], [-40, 1.1], [-70, 1.3]] as const) {
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 20, y);
      ctx.lineTo(side * 60, y - 30 * a + Math.sin(s.t * 3 + y) * 4);
      ctx.lineTo(side * 74, y + 10);
      ctx.stroke();
    }
  }
  if (!p.mono) {
    for (const side of [-1, 1]) ellipse(ctx, side * 50, -70, 44, 18, 'rgba(200,255,200,0.22)'); // wings
  }
  ellipse(ctx, 0, -110, 34, 46, p.body);
  ellipse(ctx, 0, -30, 26, 44, p.body);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 50 + sway * side, 70);
    fillPoly(ctx, [0, -40, side * 18, -10, side * 26, 34, side * 6, 10], p.light, p.line); // the scythe
    ctx.restore();
  }
  fillSym(ctx, [0, 82, 24, 40, 30, 20, 0, 14], p.body, p.line);
  if (p.mono) return;
  for (let i = 0; i < 4; i++) ellipse(ctx, 0, -130 + i * 14, 26 - i * 3, 3, p.dark);
  for (const sx of [-14, 14]) circle(ctx, sx, 40, 6, p.trim);
};

const basilisk: HullFn = (ctx, p, s) => {
  const wag = Math.sin(s.t * 1.4) * 10;
  ctx.lineCap = 'round';
  for (const [w, c] of [[30, p.line], [26, p.body]] as const) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.quadraticCurveTo(wag, -100, -wag * 0.6, -150);
    ctx.stroke();
  }
  for (const [y, side] of [[60, -1], [60, 1], [-20, -1], [-20, 1]] as const) {
    fillPoly(ctx, [side * 40, y - 10, side * 76, y + 10 + Math.sin(s.t * 3 + y) * 6, side * 70, y + 24, side * 38, y + 14], p.dark, p.line);
  }
  ellipse(ctx, 0, 30, 54, 64, p.body);
  ellipse(ctx, 0, -50, 42, 46, p.body);
  fillSym(ctx, [0, 160, 22, 140, 34, 100, 18, 84, 0, 80], p.light, p.line);
  if (p.mono) return;
  for (let i = 0; i < 6; i++) fillPoly(ctx, [-6, 70 - i * 22, 0, 54 - i * 22, 6, 70 - i * 22], p.trim, p.line); // spines
  for (const sx of [-12, 12]) circle(ctx, sx, 128, 4, p.glass);
};

const sentinel: HullFn = (ctx, p, s) => {
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 96, 30 + Math.sin(s.t * 0.8 + side) * 6);
    fillSym(ctx, [0, -26, 26, -22, 30, 18, 18, 30, 0, 32], p.dark, p.line); // a stone fist
    ctx.restore();
    rect(ctx, side * 60 - 12, -10, 24, 40, p.dark);
  }
  fillSym(ctx, [0, -70, 56, -66, 70, -20, 66, 50, 40, 70, 0, 74], p.body, p.line);
  fillSym(ctx, [0, -60, 46, -56, 56, -24, 0, -28], p.light);
  fillSym(ctx, [0, -120, 28, -110, 34, -76, 0, -70], p.body, p.line);
  if (p.mono) return;
  ctx.strokeStyle = p.dark;
  ctx.lineWidth = 2;
  for (const y of [-40, 0, 40]) {
    ctx.beginPath();
    ctx.moveTo(-56, y);
    ctx.lineTo(56, y);
    ctx.stroke();
  }
  for (const [x, y] of [[-50, 50], [44, -30], [-30, -60]] as const) ellipse(ctx, x, y, 12, 6, '#4a7a2a'); // moss
  const glow = 0.5 + Math.sin(s.t * 4) * 0.3;
  circle(ctx, 0, 24, 14, `rgba(90,255,208,${(glow * 0.4).toFixed(2)})`);
  for (const gx of [-14, 0, 14]) circle(ctx, gx, -96, 3, p.glass);
};

const queen: HullFn = (ctx, p, s) => {
  const flap = Math.sin(s.t * 5) * 0.12;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.rotate(side * flap);
    if (!p.mono) ellipse(ctx, side * 92, -10, 70, 30, 'rgba(255,200,240,0.25)');
    ctx.strokeStyle = p.mono ? p.body : 'rgba(160,90,140,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(side * 30, 0);
    ctx.lineTo(side * 150, -20);
    ctx.stroke();
    ctx.restore();
  }
  ellipse(ctx, 0, -100, 48, 66, p.body);
  ellipse(ctx, 0, 20, 52, 50, p.body);
  fillSym(ctx, [0, 140, 30, 110, 38, 84, 0, 76], p.light, p.line);
  fillPair(ctx, [14, 140, 24, 160, 6, 150], p.dark, p.line); // mandibles
  if (p.mono) return;
  for (let i = 0; i < 5; i++) ellipse(ctx, 0, -140 + i * 18, 44 - i * 4, 4, p.dark);
  for (const [x, y] of [[-24, -96], [24, -96], [0, -70]] as const) {
    circle(ctx, x, y, 9, `rgba(255,122,210,${(0.5 + Math.sin(s.t * 3 + x) * 0.3).toFixed(2)})`); // egg sacs
  }
  fillSym(ctx, [0, 86, 10, 70, 22, 74, 30, 60, 0, 62], '#ffd23a', p.line); // the crown
  for (const sx of [-14, 14]) circle(ctx, sx, 112, 5, p.glass);
};

export const HULLS_6: Readonly<Record<Map6Boss, HullFn>> = { ravager, mantis, basilisk, sentinel, queen };

