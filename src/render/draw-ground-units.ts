import { circle, ellipse, fillPair, fillPoly, fillSym } from './shapes';

/** Ground + sea unit art (front / bow pointing down, +y, around 0,0), plus the turret mounts and ship wake the bosses reuse. */

export interface Pal {
  body: string; dark: string; light: string; trim: string; glass: string; red: string; line: string;
  /** Silhouette pass (shadow / hit flash): skip small details. */
  mono: boolean;
  /** Animated extras: wakes, exhaust flames, blinking lights. */
  live: boolean;
}

/** Unit painter. `aim` is the turret angle in the unit's own frame (0 = up, clockwise). */
export type UnitFn = (ctx: CanvasRenderingContext2D, p: Pal, t: number, aim: number) => void;

export const monoPal = (c: string, live: boolean): Pal =>
  ({ body: c, dark: c, light: c, trim: c, glass: c, red: c, line: c, mono: true, live });

export const HL = 'rgba(255,255,255,0.2)';
export const SH = 'rgba(0,0,0,0.28)';
const missileColor = (p: Pal): string => (p.mono ? p.body : p.live ? '#e8e8e0' : p.light);

/** Rounded rectangular pad / slab. */
export function slab(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, line?: string): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (line) stroke(ctx, line);
}

function stroke(ctx: CanvasRenderingContext2D, line: string): void {
  ctx.strokeStyle = line;
  ctx.stroke();
}

export function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string): void {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

export function ring(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, line: string): void {
  circle(ctx, x, y, r, fill);
  stroke(ctx, line);
}

// ---------- wake + mounts (also used by the bosses) ----------

const FOAM = [[2.7, 0.8, 1.6, 'rgba(235,246,255,0.22)'], [1.35, 0.68, 1.2, 'rgba(235,246,255,0.42)'], [0.3, 0.55, 0.8, 'rgba(235,246,255,0.7)']] as const;

/** Bow wave, side foam and stern churn for a ship of half-beam w (bow at bowY > sternY). */
export function wake(ctx: CanvasRenderingContext2D, w: number, bowY: number, sternY: number, t: number): void {
  const len = bowY - sternY;
  ctx.save();
  ctx.globalAlpha *= 0.5 + 0.06 * Math.sin(t * 7);
  for (const [c, rx, ry, col] of FOAM) ellipse(ctx, 0, sternY - w * c, w * rx, w * ry, col);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1, w * 0.07);
  ctx.setLineDash([w * 0.5 + 2, w * 0.35 + 2]);
  ctx.lineDashOffset = t * 24;
  ctx.beginPath();
  for (const s of [-1, 1]) {
    ctx.moveTo(s * w * 0.3, bowY - w * 0.6);
    ctx.lineTo(s * (w * 0.9 + len * 0.17), bowY - len * 0.8);
  }
  ctx.stroke();
  ellipse(ctx, 0, bowY - w * 0.62, w * 0.6, w * 0.82, '#ffffff');
  ctx.restore();
}

/** Gun turret of radius r with n barrels pointing at local angle a; `len` = barrel length in r. */
export function gunTurret(ctx: CanvasRenderingContext2D, r: number, n: number, a: number, p: Pal, len = 1.6): void {
  ctx.save();
  ctx.rotate(a);
  const bw = Math.max(1.2, r * 0.17);
  ctx.fillStyle = p.dark;
  for (let i = 0; i < n; i++) {
    const bx = (i - (n - 1) / 2) * r * 0.38;
    ctx.fillRect(bx - bw / 2, -r * len, bw, r * len);
    ctx.fillRect(bx - bw * 0.7, -r * len, bw * 1.4, r * 0.16); // muzzle
  }
  fillSym(ctx, [0, -r * 0.8, r * 0.6, -r * 0.76, r * 0.95, -r * 0.1, r * 0.82, r * 0.6, r * 0.45, r * 0.92, 0, r * 0.95], p.body, p.line);
  if (!p.mono) {
    fillSym(ctx, [0, -r * 0.62, r * 0.42, -r * 0.56, r * 0.62, 0, r * 0.4, r * 0.55, 0, r * 0.6], HL);
    circle(ctx, r * 0.32, r * 0.42, r * 0.15, p.dark);
  }
  ctx.restore();
}

/** Twin-barrel AA mount of radius r. */
export function twinGun(ctx: CanvasRenderingContext2D, r: number, a: number, p: Pal): void {
  ctx.save();
  ctx.rotate(a);
  ctx.fillStyle = p.dark;
  ctx.fillRect(-r * 0.5, -r * 2.2, r * 0.26, r * 2.1);
  ctx.fillRect(r * 0.24, -r * 2.2, r * 0.26, r * 2.1);
  ring(ctx, 0, 0, r, p.trim, p.line);
  if (!p.mono) {
    fillPoly(ctx, [-r * 0.85, -r * 0.45, r * 0.85, -r * 0.45, r * 0.6, -r * 0.9, -r * 0.6, -r * 0.9], SH);
    circle(ctx, -r * 0.25, -r * 0.1, r * 0.42, HL);
    circle(ctx, 0, r * 0.4, r * 0.22, p.dark);
  }
  ctx.restore();
}

/** n missiles side by side on a rail frame, noses toward local angle a. */
export function missileRack(ctx: CanvasRenderingContext2D, n: number, len: number, a: number, p: Pal): void {
  ctx.save();
  ctx.rotate(a);
  const w = len * 0.15;
  const half = ((n - 1) / 2) * w * 1.5;
  fillPoly(ctx, [-half - w, -len * 0.28, half + w, -len * 0.28, half + w, len * 0.56, -half - w, len * 0.56], p.dark, p.line);
  for (let i = 0; i < n; i++) {
    const x = -half + i * w * 1.5;
    fillPoly(ctx, [x - w / 2, len * 0.5, x - w / 2, -len * 0.38, x, -len * 0.56, x + w / 2, -len * 0.38, x + w / 2, len * 0.5], missileColor(p), p.line);
    if (!p.mono) fillPoly(ctx, [x - w / 2, -len * 0.36, x, -len * 0.56, x + w / 2, -len * 0.36], p.red);
  }
  ctx.restore();
}

function hazard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  rect(ctx, x, y, w, h, '#e0b424');
  for (let sx = x - h; sx < x + w; sx += h * 1.6) fillPoly(ctx, [sx, y + h, sx + h * 0.8, y + h, sx + h * 1.6, y, sx + h * 0.8, y], '#1c1c1c');
  ctx.restore();
}

// ---------- units ----------

const aa: UnitFn = (ctx, p, _t, aim) => {
  ring(ctx, 0, 0, 15.5, p.dark, p.line);
  if (!p.mono) circle(ctx, 0, 0, 9.5, '#5a4b33');
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ellipse(ctx, Math.cos(a) * 12.3, Math.sin(a) * 12.3, 3.8, 2.5, i % 2 ? p.body : p.light, a + Math.PI / 2);
  }
  twinGun(ctx, 5.5, aim, p);
};

const sam: UnitFn = (ctx, p, _t, aim) => {
  slab(ctx, -17, -17, 34, 34, 4, p.body, p.line);
  if (!p.mono) {
    ctx.fillStyle = SH;
    ctx.fillRect(-17, -0.5, 34, 1);
    ctx.fillRect(-0.5, -17, 1, 34);
    hazard(ctx, -17, 13, 34, 4);
    ellipse(ctx, 0, -10, 8, 5, 'rgba(30,26,22,0.3)');
  }
  ring(ctx, 0, 0, 8, p.trim, p.line);
  missileRack(ctx, 4, 21, aim, p);
};

const tank: UnitFn = (ctx, p, t, aim) => {
  fillPair(ctx, [7.5, -15.5, 11.5, -15.5, 11.5, 15.5, 7.5, 15.5], p.trim, p.line);
  if (!p.mono) {
    ctx.fillStyle = SH;
    for (let y = -15 + ((t * 14) % 3); y < 15; y += 3) {
      ctx.fillRect(7.9, y, 3.2, 1);
      ctx.fillRect(-11.1, y, 3.2, 1);
    }
  }
  fillSym(ctx, [0, 16, 6, 15.5, 8.5, 12, 8.5, -13, 7, -15, 0, -15], p.body, p.line);
  if (!p.mono) {
    fillSym(ctx, [0, 15, 5.5, 14.5, 7.3, 11.5, 0, 11], HL);
    ctx.fillStyle = SH;
    for (let i = 0; i < 4; i++) ctx.fillRect(-5, -13 + i * 1.8, 10, 0.8);
  }
  ctx.save();
  ctx.translate(0, -1);
  ctx.rotate(aim);
  ctx.fillStyle = p.dark;
  ctx.fillRect(-1, -20, 2, 16);
  ctx.fillRect(-1.6, -21, 3.2, 2.6);
  fillSym(ctx, [0, -7.5, 4.5, -6.5, 6.8, -2, 6.5, 4, 4, 7, 0, 7.5], p.light, p.line);
  if (!p.mono) {
    fillSym(ctx, [0, -6, 3, -5, 4.4, -1.5, 0, -1], HL);
    circle(ctx, 2.4, 2, 1.7, p.dark);
    rect(ctx, -4.5, 4.6, 9, 1.2, p.red);
  }
  ctx.restore();
};

const radar: UnitFn = (ctx, p, t) => {
  slab(ctx, -21, -19, 42, 38, 3, p.trim);
  fillPoly(ctx, [-14, -12, 14, -12, 14, 12, -14, 12], p.body, p.line);
  if (!p.mono) {
    rect(ctx, -14, -12, 28, 2, p.light);
    ctx.fillStyle = p.dark;
    ctx.fillRect(-14, 10, 28, 2);
    ctx.fillRect(-11, 4, 5, 4);
    circle(ctx, -11, -9, 1.3, p.live && Math.sin(t * 6) > 0 ? '#ff3a2a' : '#5a1a14');
  }
  ring(ctx, 15, 13, 5, p.light, p.line);
  ring(ctx, 0, 0, 3.2, p.dark, p.line);
  ctx.save();
  ctx.rotate(t * 2.4);
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.quadraticCurveTo(0, -8, 18, 0);
  ctx.lineTo(18, 2.6);
  ctx.quadraticCurveTo(0, -5.2, -18, 2.6);
  ctx.closePath();
  ctx.fillStyle = p.light;
  ctx.fill();
  stroke(ctx, p.line);
  rect(ctx, -0.6, -3.5, 1.2, 8, p.dark);
  circle(ctx, 0, 5, 1.4, p.dark);
  ctx.restore();
};

const TANKS = [-12, -10, 9.5, 12, -10, 9.5, -12, 9.5, 7.5, 12, 9.5, 7.5] as const;

const depot: UnitFn = (ctx, p) => {
  slab(ctx, -25, -24, 50, 48, 4, p.trim, p.line);
  if (!p.mono) {
    hazard(ctx, -25, 19, 50, 5);
    ctx.save();
    ctx.strokeStyle = p.dark;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-12, -10); ctx.lineTo(12, -10); ctx.lineTo(12, 9.5); ctx.lineTo(-12, 9.5); ctx.closePath();
    ctx.moveTo(0, -10); ctx.lineTo(0, 20);
    ctx.stroke();
    ctx.restore();
    fillPoly(ctx, [-3.5, 6, 3.5, 6, 3.5, 13, -3.5, 13], p.light, p.line);
  }
  for (let i = 0; i < TANKS.length; i += 3) {
    const [x, y, r] = [TANKS[i] ?? 0, TANKS[i + 1] ?? 0, TANKS[i + 2] ?? 0];
    ring(ctx, x, y, r, p.dark, p.line);
    circle(ctx, x, y, r - 1.4, p.body);
    if (p.mono) continue;
    circle(ctx, x - r * 0.22, y - r * 0.22, r * 0.5, p.light);
    circle(ctx, x, y, r * 0.16, p.dark);
    rect(ctx, x - r + 1.6, y + r * 0.45, 2.4, 1.2, p.red);
  }
};

const boat: UnitFn = (ctx, p, t, aim) => {
  if (p.live) wake(ctx, 6.5, 22, -19, t);
  fillSym(ctx, [0, 23, 3.6, 17, 6, 9, 6.6, -6, 6.2, -17, 5, -19.5, 0, -19.5], p.dark, p.line);
  fillSym(ctx, [0, 20.5, 3, 15.5, 5, 8.5, 5.4, -6, 5, -17.5, 0, -18], p.body);
  fillSym(ctx, [0, 5, 3.8, 4, 4.1, -7, 3, -9, 0, -9], p.light, p.line);
  if (!p.mono) {
    rect(ctx, -3.2, 2, 6.4, 1.8, p.glass);
    rect(ctx, -0.5, -6, 1, 5, p.dark);
    fillSym(ctx, [0, -11, 2, -12.5, 2, -15.5, 0, -14], p.red);
  }
  ctx.save();
  ctx.translate(0, 12);
  gunTurret(ctx, 3.4, 1, aim, p, 2.4);
  ctx.restore();
};

function vls(ctx: CanvasRenderingContext2D, y: number, cols: number, rows: number, p: Pal): void {
  const w = cols * 3 + 1;
  fillPoly(ctx, [-w / 2, y, w / 2, y, w / 2, y + rows * 3 + 1, -w / 2, y + rows * 3 + 1], p.light);
  ctx.fillStyle = p.dark;
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) ctx.fillRect(-w / 2 + 1 + c * 3, y + 1 + r * 3, 2.2, 2.2);
}

function destroyerTop(ctx: CanvasRenderingContext2D, p: Pal, t: number): void {
  fillSym(ctx, [0, 18, 8, 17, 11.5, 10, 11.5, -9, 9, -12, 0, -12], p.light, p.line);
  fillSym(ctx, [0, -25, 10, -25, 10.5, -37, 0, -37], p.light, p.line);
  if (p.mono) return;
  rect(ctx, -7, 14.5, 14, 2, p.glass);
  vls(ctx, 23, 4, 3, p);
  vls(ctx, -31, 4, 2, p);
  ellipse(ctx, 0, -17, 4.6, 6, p.dark);
  ellipse(ctx, 0, -18.5, 3, 3.6, '#1b1e21');
  ring(ctx, 0, 4, 2.4, p.dark, p.line);
  ctx.save();
  ctx.translate(0, 4);
  ctx.rotate(t * 3);
  rect(ctx, -6.5, -0.9, 13, 1.8, p.dark);
  ctx.restore();
  fillSym(ctx, [0, 53, 3, 50, 3, 47, 0, 49.5], p.red);
}

const destroyer: UnitFn = (ctx, p, t, aim) => {
  if (p.live) wake(ctx, 21, 66, -61, t);
  fillSym(ctx, [0, 67, 6, 56, 12, 40, 17, 22, 20.5, 4, 21.5, -15, 21, -40, 19.5, -55, 17.5, -61, 0, -61], p.dark, p.line);
  fillSym(ctx, [0, 63, 5.5, 54, 11, 39, 15.5, 22, 18.5, 4, 19.5, -15, 19, -40, 17.5, -54, 15.5, -59, 0, -59], p.body);
  destroyerTop(ctx, p, t);
  for (const y of [42, -47]) {
    ctx.save();
    ctx.translate(0, y);
    gunTurret(ctx, 6.5, 1, aim, p, 2.2);
    ctx.restore();
  }
};

type GroundKind = 'aa' | 'sam' | 'tank' | 'radar' | 'depot' | 'boat' | 'destroyer';
export const GROUND_UNITS: Readonly<Record<GroundKind, UnitFn>> = { aa, sam, tank, radar, depot, boat, destroyer };
