import type { BossId } from '../data/types';
import type { BossDrawState } from './draw-bosses';
import type { Pal } from './draw-ground-units';
import { bossPal } from './bosses-2';
import { circle, ellipse, fillPoly, fillSym } from './shapes';

// Hulls of map 7's bosses (doc 105) in data/bosses-7.ts's local coordinates, fronts down (+y); guns, damage and warning
// lights come from the shared boss renderer. HARVESTER, LONGSHANKS, DREADNOUGHT and the MOTHERSHIP are machines in the
// invasion's violet-grey with teal trim; JUGGERNAUT is a beast whose weak points are organs.

type Ctx = CanvasRenderingContext2D;
type HullFn = (ctx: Ctx, p: Pal, s: BossDrawState) => void;
type Map7Boss = 'harvester' | 'longshanks' | 'juggernaut' | 'dreadnought' | 'mothership';

export const PALS_7: Readonly<Record<Map7Boss, Pal>> = {
  harvester: bossPal('#7a6a4a', '#463a26', '#a8986e', '#3ad8c8', '#ff4ad8'),
  longshanks: bossPal('#6a6478', '#2e2a38', '#a8a2b8', '#3ad8c8', '#ff6a3a'),
  juggernaut: bossPal('#6a5a4a', '#3a2e24', '#9a8a72', '#c84a2a', '#ffb03a'),
  dreadnought: bossPal('#5a5a6e', '#2a2a3a', '#9090a8', '#3ad8c8', '#ff4ad8'),
  mothership: bossPal('#6a6a80', '#2c2c40', '#b0b0c8', '#3ad8c8', '#ff4ad8'),
};

export const LIGHTS_7: Readonly<Record<Map7Boss, readonly number[]>> = {
  harvester: [-50, 50, 50, 50, 0, -60, -60, -20, 60, -20],
  longshanks: [0, 40, -40, -20, 40, -20, 0, -50],
  juggernaut: [-20, 110, 20, 110, 0, -40, 0, -120],
  dreadnought: [-140, 0, 140, 0, 0, 80, 0, -90, -60, -40, 60, -40],
  mothership: [-90, -60, 90, -60, -90, 60, 90, 60, 0, -110, 0, 100],
};

/** The beast boss: its parts are organs. */
export const ORGANIC_7: readonly BossId[] = ['juggernaut'];

/** A long leg from (x0, y0) to its foot, a joint bent outward. */
function leg(ctx: Ctx, p: Pal, x0: number, y0: number, x1: number, y1: number, w: number, bend: number): void {
  const mx = (x0 + x1) / 2 + bend;
  const my = (y0 + y1) / 2 - Math.abs(bend) * 0.4;
  ctx.lineCap = 'round';
  ctx.strokeStyle = p.line;
  ctx.lineWidth = w + 3;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(mx, my);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.strokeStyle = p.dark;
  ctx.lineWidth = w;
  ctx.stroke();
  circle(ctx, mx, my, w * 0.7, p.light);
  ellipse(ctx, x1, y1, w * 1.1, w * 0.8, p.dark);
}

const harvester: HullFn = (ctx, p, s) => {
  for (let i = 0; i < 3; i++) for (const side of [-1, 1]) { // six squat legs
    const step = Math.sin(s.t * 2 + i * 2 + (side > 0 ? 1 : 0)) * 10;
    leg(ctx, p, side * 54, -40 + i * 34, side * 96, -46 + i * 34 + step, 10, side * 8);
  }
  fillSym(ctx, [0, -76, 46, -70, 64, -36, 64, 40, 52, 54, 0, 56], p.body, p.line); // the body
  fillSym(ctx, [0, -66, 38, -62, 52, -36, 0, -40], p.light);
  fillPoly(ctx, [-126, 46, 126, 46, 126, 80, -126, 80], p.line); // the reaper bar across the front
  fillPoly(ctx, [-123, 49, 123, 49, 123, 77, -123, 77], p.dark);
  for (let k = -12; k <= 12; k++) fillPoly(ctx, [k * 10 - 4, 80, k * 10 + 4, 80, k * 10, 90], '#c8c8b8'); // the teeth
  for (const side of [-1, 1]) { // two spinning drums of blades
    for (let k = 0; k < 8; k++) {
      const y = 50 + ((k * 3.5 + s.t * 50) % 28);
      ctx.fillStyle = k % 2 ? '#d0d0c0' : '#6a6a5e';
      ctx.fillRect(side * 84 - 34, y, 68, 1.8);
    }
  }
  if (!s.flash) for (let i = 0; i < 18; i++) { // chaff thrown up by the reapers
    const k = (s.t * 1.3 + i * 0.37) % 1;
    circle(ctx, ((i * 53) % 240) - 120, 92 + k * 46, 2, `rgba(240,210,120,${(0.85 * (1 - k)).toFixed(2)})`);
  }
  fillPoly(ctx, [26, -62, 44, -62, 42, -92, 28, -92], p.dark, p.line); // the chimney
  if (!s.flash) for (let i = 0; i < 4; i++) { // its smoke
    const k = (s.t * 0.6 + i * 0.25) % 1;
    circle(ctx, 35 - k * 14, -96 - k * 50, 6 + k * 10, `rgba(80,70,60,${(0.5 * (1 - k)).toFixed(2)})`);
  }
  ctx.fillStyle = p.trim;
  ctx.fillRect(-64, -8, 128, 4);
  ellipse(ctx, 0, -30, 22, 16, p.line); // the cab's glass with the pilot's shape
  ellipse(ctx, 0, -30, 20, 14, 'rgba(120,220,210,0.55)');
  ellipse(ctx, 0, -28, 6, 7, 'rgba(40,20,50,0.7)');
  ellipse(ctx, -7, -36, 6, 4, 'rgba(255,255,255,0.35)');
};

const longshanks: HullFn = (ctx, p, s) => {
  for (let i = 0; i < 3; i++) { // three long legs striding in turn
    const a = (i / 3) * Math.PI * 2 - Math.PI / 2 + 0.2;
    const lift = Math.max(0, Math.sin(s.t * 1.2 + i * 2.1)) * 22;
    const r = 150 - lift;
    leg(ctx, p, Math.cos(a) * 30, Math.sin(a) * 30, Math.cos(a) * r, Math.sin(a) * r + 40, 10, (i - 1) * 24);
  }
  ellipse(ctx, 0, 0, 56, 50, p.line);
  ellipse(ctx, 0, 0, 54, 48, p.body);
  ellipse(ctx, 0, -10, 38, 28, p.light); // the hood
  for (const side of [-1, 1]) {
    ellipse(ctx, side * 58, 34, 18, 16, p.line);
    ellipse(ctx, side * 58, 34, 16, 14, p.dark);
  }
  ctx.strokeStyle = p.trim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 46, 40, 0, 0.2, Math.PI - 0.2);
  ctx.stroke();
  fillPoly(ctx, [-20, 22, 20, 22, 14, 30, -14, 30], p.glass);
};

const juggernaut: HullFn = (ctx, p, s) => {
  for (let i = 0; i < 3; i++) for (const side of [-1, 1]) { // six heavy legs
    const step = Math.sin(s.t * 1.8 + i * 1.9 + (side > 0 ? 1.2 : 0)) * 12;
    leg(ctx, p, side * 40, -70 + i * 60, side * 70, -66 + i * 60 + step, 12, side * 10);
  }
  ctx.strokeStyle = p.dark; // the tail
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -120);
  ctx.quadraticCurveTo(Math.sin(s.t) * 20, -150, Math.sin(s.t + 1) * 14, -168);
  ctx.stroke();
  ellipse(ctx, 0, -10, 62, 120, p.line); // the body
  ellipse(ctx, 0, -10, 60, 118, p.body);
  ctx.fillStyle = p.dark;
  for (let k = 0; k < 6; k++) ctx.fillRect(-50, -100 + k * 34, 100, 4); // hide bands
  ellipse(ctx, 0, 112, 32, 26, p.line); // the head
  ellipse(ctx, 0, 112, 30, 24, p.dark);
  for (const side of [-1, 1]) fillPoly(ctx, [side * 14, 124, side * 40, 150, side * 22, 128], '#e8dcc0', p.line); // tusks
  fillPoly(ctx, [-30, -38, 30, -38, 34, 18, -34, 18], p.line); // the howdah fort on its back
  fillPoly(ctx, [-27, -35, 27, -35, 31, 15, -31, 15], '#5a4a3a');
  ctx.fillStyle = '#3a2e24';
  for (let k = 0; k < 5; k++) ctx.fillRect(-28 + k * 13, -42, 6, 6); // crenels
  circle(ctx, -10, 120, 3, p.glass);
  circle(ctx, 10, 120, 3, p.glass);
};

const dreadnought: HullFn = (ctx, p, s) => {
  if (!s.flash) for (const [x, y] of [[-70, -40], [70, -40], [-70, 50], [70, 50]] as const) { // the anti-grav pads glowing below
    ellipse(ctx, x, y, 24, 18, `rgba(255,74,216,${(0.25 + 0.15 * Math.sin(s.t * 4 + x)).toFixed(2)})`);
  }
  fillSym(ctx, [0, -112, 40, -100, 70, -40, 130, -14, 140, 20, 100, 40, 60, 70, 30, 96, 0, 104], p.body, p.line);
  fillSym(ctx, [0, -100, 32, -90, 54, -40, 0, -50], p.light);
  fillSym(ctx, [0, -30, 50, -20, 90, 0, 50, 20, 0, 24], p.dark); // the deck
  ctx.strokeStyle = p.trim;
  ctx.lineWidth = 2;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 20, -96);
    ctx.lineTo(side * 128, 4);
    ctx.stroke();
  }
  for (let k = 0; k < 6; k++) circle(ctx, -50 + k * 20, 64, 2.2, `rgba(255,220,120,${(0.4 + 0.6 * Math.max(0, Math.sin(s.t * 3 + k))).toFixed(2)})`);
};

const mothership: HullFn = (ctx, p, s) => {
  ellipse(ctx, 0, 0, 140, 104, p.line);
  ellipse(ctx, 0, 0, 138, 102, p.body);
  ellipse(ctx, 0, 0, 104, 76, p.dark);
  for (let i = 0; i < 16; i++) { // panel ribs
    const a = (i / 16) * Math.PI * 2 + s.t * 0.15;
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 104, Math.sin(a) * 76);
    ctx.lineTo(Math.cos(a) * 136, Math.sin(a) * 100);
    ctx.stroke();
  }
  for (let i = 0; i < 24; i++) { // the rim lights running round
    const a = (i / 24) * Math.PI * 2 - s.t * 0.8;
    const on = 0.3 + 0.7 * Math.max(0, Math.sin(s.t * 5 + i));
    circle(ctx, Math.cos(a) * 122, Math.sin(a) * 90, 3, `rgba(90,230,220,${on.toFixed(2)})`);
  }
  ellipse(ctx, 0, 0, 52, 40, p.light); // the dome
  const core = 0.5 + 0.5 * Math.sin(s.t * 2.2);
  ellipse(ctx, 0, 0, 30, 24, `rgba(255,74,216,${(0.5 + core * 0.4).toFixed(2)})`);
  circle(ctx, 0, 0, 10, '#ffe0f8');
  ellipse(ctx, -16, -12, 14, 8, 'rgba(255,255,255,0.3)');
};

export const HULLS_7: Readonly<Record<Map7Boss, HullFn>> = { harvester, longshanks, juggernaut, dreadnought, mothership };
