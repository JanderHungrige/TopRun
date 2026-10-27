import type { BossDrawState } from './draw-bosses';
import { exhaust, fire, roundel, smoke } from './draw-enemies';
import { HL, rect, ring, SH, slab, type Pal } from './draw-ground-units';
import { circle, ellipse, fillPair, fillPoly, fillSym } from './shapes';

// Hulls of the five map-2 bosses (doc 35) in data/bosses-2.ts's local coordinates (nose / bow down, +y). Turrets,
// launchers, damage and warning lights come from the shared boss renderer (draw-bosses.ts).

type Ctx = CanvasRenderingContext2D;
type HullFn = (ctx: Ctx, p: Pal, s: BossDrawState) => void;
type Map2Boss = 'kraken' | 'condor' | 'python' | 'scorpion' | 'colossus';

export const bossPal = (body: string, dark: string, light: string, trim: string, glass: string): Pal =>
  ({ body, dark, light, trim, glass, red: '#c8312a', line: 'rgba(10,12,14,0.6)', mono: false, live: true });

export const PALS_2: Readonly<Record<Map2Boss, Pal>> = {
  kraken: bossPal('#7a6f5f', '#4a4238', '#a0927c', '#c9a227', '#25323d'),
  condor: bossPal('#6b7480', '#454c55', '#8d97a3', '#56606b', '#1f2a33'),
  python: bossPal('#4f5a3c', '#2f3624', '#717d55', '#8a6a3a', '#1d2418'),
  scorpion: bossPal('#6d6450', '#3e3a2e', '#948a70', '#b0532a', '#1e2228'),
  colossus: bossPal('#3d434c', '#2b2f36', '#5b636e', '#8a1f2e', '#d14a3a'),
};

export const LIGHTS_2: Readonly<Record<Map2Boss, readonly number[]>> = {
  kraken: [-60, -60, 60, -60, -60, 60, 60, 60, -170, -76, 170, -76, 0, -146],
  condor: [-214, -12, 214, -12, 0, 126, 0, -126, -60, -30, 60, -30],
  python: [-228, -16, 238, -16, -95, -22, 45, -22, 115, -22],
  scorpion: [-60, 48, 60, 48, 0, -176, -78, -40, 78, -40],
  colossus: [-250, -46, 250, -46, -150, -40, 150, -40, 0, 128, 0, -60],
};

// ---------- KRAKEN: a ring of armoured rig platforms on legs ----------
function rigDeck(ctx: Ctx, x: number, y: number, s: number, fill: string, p: Pal): void {
  for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) ring(ctx, x + dx * (s / 2 - 6), y + dy * (s / 2 - 6), 7, p.dark, p.line);
  slab(ctx, x - s / 2, y - s / 2, s, s, 6, fill, p.line);
  if (p.mono) return;
  rect(ctx, x - s / 2 + 3, y - s / 2 + 3, s - 6, 2, HL);
  for (let i = 0; i < s - 12; i += 12) rect(ctx, x - s / 2 + 6 + i, y + s / 2 - 6, 6, 3, p.trim);
}

const kraken: HullFn = (ctx, p, s) => {
  if (p.live) for (const [x, y] of [[-150, 20], [150, 20], [-56, 66], [56, 66], [0, -60]] as const) ring(ctx, x, y, 12 + Math.sin(s.t * 2 + x) * 2, 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0.3)');
  rect(ctx, -110, -36, 220, 12, p.dark);
  rect(ctx, -6, -110, 12, 60, p.dark);
  for (const sx of [-1, 1]) rigDeck(ctx, sx * 125, -30, 96, p.body, p);
  rigDeck(ctx, 0, -110, 78, p.light, p);
  rigDeck(ctx, 0, 0, 132, p.body, p);
  if (p.mono) return;
  ring(ctx, 0, 6, 24, '#3d3a34', p.line);
  rect(ctx, -9, -4, 3, 20, '#e8e4d8');
  rect(ctx, 6, -4, 3, 20, '#e8e4d8');
  rect(ctx, -6, 4, 12, 3, '#e8e4d8');
  rect(ctx, 34, -150, 5, 26, p.dark);
  if (p.live) fire(ctx, 36, -154, 5, s.t, 3);
  fillPoly(ctx, [-60, -40, -20, -58, -18, -54, -58, -36], p.trim, p.line);
  roundel(ctx, 40, 44, 7, p);
};

// ---------- CONDOR: a four-engine gunship, nose down ----------
const condor: HullFn = (ctx, p, s) => {
  fillPair(ctx, [24, -32, 214, -22, 218, -4, 24, 14], p.body, p.line);
  fillPair(ctx, [8, -100, 72, -112, 74, -122, 8, -122], p.body, p.line);
  fillSym(ctx, [0, 130, 14, 120, 26, 96, 30, 40, 30, -80, 22, -110, 10, -128, 0, -130], p.light, p.line);
  for (const x of [80, 150]) {
    for (const sx of [-1, 1]) ellipse(ctx, sx * x, -4, 10, 24, p.dark);
    if (!p.mono && p.live) {
      for (const sx of [-1, 1]) {
        const a = s.t * 30 + x;
        ctx.strokeStyle = 'rgba(30,34,40,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx * x + Math.cos(a) * 20, 20 + Math.sin(a) * 4);
        ctx.lineTo(sx * x - Math.cos(a) * 20, 20 - Math.sin(a) * 4);
        ctx.stroke();
      }
    }
  }
  if (p.mono) return;
  fillSym(ctx, [0, 124, 9, 118, 12, 108, 0, 106], p.glass);
  for (let y = -60; y < 80; y += 18) for (const sx of [-1, 1]) rect(ctx, sx * 27 - 2, y, 4, 6, '#20262c');
  fillPair(ctx, [30, -24, 210, -16, 210, -13, 30, -21], SH);
  rect(ctx, -1.5, -128, 3, 30, p.trim);
  roundel(ctx, 180, -12, 6, p);
};

// ---------- PYTHON: an armoured train on its track, running left–right ----------
const PY_CARS: readonly (readonly [number, number])[] = [[-200, 58], [-130, 64], [-60, 64], [10, 64], [80, 64], [150, 64]];

const python: HullFn = (ctx, p, s) => {
  if (!p.mono) {
    for (let x = -300; x <= 300; x += 14) rect(ctx, x, -20, 5, 40, '#4a3a2a');
    for (const y of [-15, 13]) rect(ctx, -310, y, 620, 2, '#8c8f94');
  }
  for (const [x, w] of PY_CARS) slab(ctx, x - w / 2, -24, w, 48, 7, p.body, p.line);
  fillPoly(ctx, [184, -24, 240, -24, 252, -12, 252, 12, 240, 24, 184, 24], p.dark, p.line);
  if (p.mono) return;
  for (const [x, w] of PY_CARS) {
    rect(ctx, x - w / 2 + 4, -21, w - 8, 3, HL);
    rect(ctx, x + w / 2, -4, 6, 8, p.dark);
  }
  slab(ctx, 196, -16, 36, 32, 5, p.trim, p.line);
  ring(ctx, 214, 0, 6, '#2a2724', p.line);
  if (p.live) smoke(ctx, 214, -6, 7, s.t, 4);
  rect(ctx, 244, -8, 6, 16, p.glass);
  for (const x of [-200, -60, 80]) rect(ctx, x - 10, 14, 20, 3, p.red);
};

// ---------- SCORPION: a tracked missile crawler with claws and a sting ----------
const scorpion: HullFn = (ctx, p, s) => {
  for (const sx of [-1, 1]) {
    slab(ctx, sx > 0 ? 48 : -78, -66, 30, 132, 8, p.dark, p.line);
    if (!p.mono) for (let y = -60 + ((s.t * 40) % 10); y < 62; y += 10) rect(ctx, sx > 0 ? 50 : -76, y, 26, 2, '#23211b');
  }
  fillPair(ctx, [40, 46, 76, 58, 100, 92, 92, 104, 70, 82, 36, 70], p.body, p.line);
  fillSym(ctx, [0, 70, 34, 64, 54, 34, 58, -20, 44, -54, 0, -62], p.body, p.line);
  for (const [y, r] of [[-82, 26], [-112, 22], [-140, 20]] as const) {
    ring(ctx, 0, y, r, p.body, p.line);
    if (!p.mono) rect(ctx, -r * 0.7, y - 2, r * 1.4, 2, SH);
  }
  if (p.mono) return;
  fillSym(ctx, [0, 60, 26, 54, 40, 30, 42, -10, 30, -40, 0, -46], p.light);
  fillSym(ctx, [0, 40, 12, 38, 14, 26, 0, 24], p.glass);
  rect(ctx, -30, 2, 60, 3, p.trim);
  if (p.live) for (const sx of [-1, 1]) smoke(ctx, sx * 64, 74, 6, s.t, sx + 2);
};

// ---------- COLOSSUS: the flying fortress ----------
const colossus: HullFn = (ctx, p, s) => {
  if (p.live) for (const x of [-180, -110, -40, 40, 110, 180]) exhaust(ctx, x, Math.abs(x) > 150 ? -64 : -70, 9, 0.6, s.t + x, s.enraged ? 1.8 : 1.3);
  fillSym(ctx, [0, 132, 40, 110, 72, 60, 150, 10, 250, -34, 256, -50, 220, -60, 180, -52, 140, -68, 100, -56, 60, -74, 20, -62, 0, -70], p.body, p.line);
  if (p.mono) return;
  fillSym(ctx, [0, 120, 36, 100, 62, 56, 70, 0, 56, -48, 24, -60, 0, -56], p.light);
  fillPair(ctx, [72, 56, 150, 10, 250, -34, 246, -30, 148, 15, 74, 60], '#4a5059');
  for (let x = -40; x <= 40; x += 16) rect(ctx, x - 4, 74, 8, 4, p.glass);
  fillPair(ctx, [90, -2, 240, -42, 240, -38, 90, 2], p.trim);
  for (const x of [120, 210]) fillPair(ctx, [x - 8, -30, x + 8, -36, x + 8, -40, x - 8, -34], SH);
  circle(ctx, 0, 20, 14, '#20242a');
  circle(ctx, 0, 20, 6, p.glass);
  roundel(ctx, 160, -16, 8, p);
};

export const HULLS_2: Readonly<Record<Map2Boss, HullFn>> = { kraken, condor, python, scorpion, colossus };
