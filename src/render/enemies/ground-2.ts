import { HL, missileRack, rect, ring, SH, slab, twinGun, gunTurret, wake, type Pal, type UnitFn } from '../draw-ground-units';
import { circle, ellipse, fillPair, fillPoly, fillSym } from '../shapes';

/**
 * Doc 44's ground and sea adversaries (front / bow pointing down, +y): the Shilka AA tank, the hardened bunker,
 * the missile frigate, and the two ground mini-bosses — the AA fortress and the missile cruiser.
 */

/** Track pair with moving links. */
function tracks(ctx: CanvasRenderingContext2D, p: Pal, x: number, len: number, t: number): void {
  fillPair(ctx, [x, -len, x + 4, -len, x + 4, len, x, len], p.trim, p.line);
  if (p.mono) return;
  ctx.fillStyle = SH;
  for (let y = -len + 0.5 + ((t * 14) % 3); y < len; y += 3) {
    ctx.fillRect(x + 0.4, y, 3.2, 1);
    ctx.fillRect(-x - 3.6, y, 3.2, 1);
  }
}

const shilka: UnitFn = (ctx, p, t, aim) => {
  tracks(ctx, p, 7.5, 15, t);
  fillSym(ctx, [0, 16, 6, 15.5, 8.4, 12, 8.4, -13, 7, -15, 0, -15], p.body, p.line);
  if (!p.mono) fillSym(ctx, [0, 15, 5.4, 14.4, 7.2, 11.6, 0, 11], HL);
  ctx.save();
  ctx.translate(0, -2);
  ctx.rotate(aim);
  ctx.fillStyle = p.dark;
  for (const x of [-4.2, -2.6, 2.6, 4.2]) ctx.fillRect(x - 0.55, -17, 1.1, 12);
  fillSym(ctx, [0, -7.5, 6.6, -7, 7.4, 6, 6.2, 8.5, 0, 8.6], p.light, p.line);
  if (!p.mono) {
    fillSym(ctx, [0, -6.4, 5, -6, 5.6, -1, 0, -1], HL);
    ring(ctx, 0, 5.4, 2.6, p.trim, p.line);
    rect(ctx, -2.4, 4.9, 4.8, 1, p.dark); // radar dish edge-on
  }
  ctx.restore();
};

const bunker: UnitFn = (ctx, p, _t, aim) => {
  fillSym(ctx, [0, 20, 13, 19, 20, 11, 20, -12, 13, -19, 0, -20], p.dark, p.line);
  fillSym(ctx, [0, 17, 11, 16, 17, 10, 17, -10.5, 11, -16.4, 0, -17], p.body, p.line);
  if (!p.mono) {
    fillSym(ctx, [0, 17, 11, 16, 17, 10, 14, 8, 9, 13, 0, 13.6], HL);
    fillSym(ctx, [0, -17, 11, -16.4, 17, -10.5, 14, -8.6, 9, -13, 0, -13.6], SH);
    ctx.fillStyle = '#121416';
    for (const x of [-9, -3, 3, 9]) ctx.fillRect(x - 1.8, 14.6, 3.6, 1.1); // firing slits
    for (const [cx, cy, rx, ry] of [[-9, -6, 5, 3.4], [7, 3, 4.4, 3], [-4, 6, 3.4, 2.4]] as const) ellipse(ctx, cx, cy, rx, ry, 'rgba(70,82,48,0.55)');
  }
  ring(ctx, 0, -2, 5, p.light, p.line);
  ctx.save();
  ctx.translate(0, -2);
  gunTurret(ctx, 3.6, 2, aim, p, 2);
  ctx.restore();
};

/** Hull of a warship: dark rim and deck, bow at bow (> 0), stern at stern (< 0). */
function hull(ctx: CanvasRenderingContext2D, p: Pal, w: number, bow: number, stern: number): void {
  const pts = (k: number): number[] => [0, bow * k, w * 0.3, bow * 0.85 * k, w * 0.62, bow * 0.62, w * 0.86, bow * 0.3, w * k, 0, w * k, stern * 0.6,
    w * 0.92 * k, stern * 0.9, w * 0.82 * k, stern * k, 0, stern * k];
  fillSym(ctx, pts(1), p.dark, p.line);
  fillSym(ctx, pts(0.93), p.body);
}

const frigate: UnitFn = (ctx, p, t, aim) => {
  if (p.live) wake(ctx, 11, 38, -34, t);
  hull(ctx, p, 11, 38, -34);
  fillSym(ctx, [0, 12, 6.4, 11, 7.4, 2, 7.4, -12, 5.8, -14, 0, -14], p.light, p.line);
  if (!p.mono) {
    rect(ctx, -5, 9.6, 10, 1.4, p.glass);
    ellipse(ctx, 0, -6, 2.8, 3.6, '#1b1e21'); // funnel
    fillPoly(ctx, [-7, -20, 7, -20, 7, -32, -7, -32], 'rgba(20,24,28,0.25)'); // helipad
    ctx.strokeStyle = '#e8e8e0';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(0, -26, 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(0, 22);
  gunTurret(ctx, 4.2, 1, aim, p, 2.3);
  ctx.restore();
  ctx.save();
  ctx.translate(0, -15.5);
  missileRack(ctx, 2, 10, aim, p);
  ctx.restore();
  ring(ctx, 0, 2, 1.8, p.dark, p.line);
  if (!p.mono) {
    ctx.save();
    ctx.translate(0, 2);
    ctx.rotate(t * 3.4);
    rect(ctx, -4.6, -0.7, 9.2, 1.4, p.dark);
    ctx.restore();
  }
};

/** Corner tower of the fortress: sandbag ring with a twin AA gun. */
function tower(ctx: CanvasRenderingContext2D, p: Pal, x: number, y: number, aim: number): void {
  ctx.save();
  ctx.translate(x, y);
  ring(ctx, 0, 0, 11, p.trim, p.line);
  if (!p.mono) for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    ellipse(ctx, Math.cos(a) * 9, Math.sin(a) * 9, 2.8, 1.9, i % 2 ? p.body : p.light, a + Math.PI / 2);
  }
  twinGun(ctx, 4.2, aim, p);
  ctx.restore();
}

const fortress: UnitFn = (ctx, p, t, aim) => {
  slab(ctx, -62, -62, 124, 124, 8, p.dark, p.line);
  slab(ctx, -55, -55, 110, 110, 5, p.body, p.line);
  if (!p.mono) {
    rect(ctx, -55, -55, 110, 4, HL);
    rect(ctx, -55, 51, 110, 4, SH);
    ctx.fillStyle = 'rgba(40,36,28,0.35)';
    ctx.fillRect(-6, 30, 12, 25); // gate road
    rect(ctx, -12, 50, 24, 5, '#2d2a24'); // gate
    for (const [x, y] of [[-30, 20], [26, 24], [-28, -26]] as const) slab(ctx, x - 9, y - 6, 18, 12, 2, p.light, p.line); // barracks
  }
  for (const [x, y] of [[-48, -48], [48, -48], [-48, 48], [48, 48]] as const) tower(ctx, p, x, y, aim);
  ring(ctx, 0, 0, 17, p.trim, p.line);
  if (!p.mono) ellipse(ctx, 0, -11, 12, 6, 'rgba(30,26,22,0.3)');
  missileRack(ctx, 4, 26, aim, p);
  ctx.save();
  ctx.translate(30, -10);
  ctx.rotate(t * 2.2);
  rect(ctx, -10, -1, 20, 2, p.light);
  ctx.restore();
  ring(ctx, 30, -10, 2.4, p.dark, p.line);
};

const cruiser: UnitFn = (ctx, p, t, aim) => {
  if (p.live) wake(ctx, 19, 64, -58, t);
  hull(ctx, p, 19, 64, -58);
  fillSym(ctx, [0, 14, 10, 13, 12.5, 4, 12.5, -22, 9.5, -26, 0, -26], p.light, p.line);
  if (!p.mono) {
    rect(ctx, -8.5, 11.6, 17, 1.8, p.glass);
    ctx.fillStyle = p.dark;
    for (let c = 0; c < 5; c++) for (let r = 0; r < 4; r++) ctx.fillRect(-8 + c * 3.4, 22 + r * 3.4, 2.6, 2.6); // VLS forward
    ellipse(ctx, -4, -8, 3.4, 4.4, '#1b1e21');
    ellipse(ctx, 4, -8, 3.4, 4.4, '#1b1e21');
    fillSym(ctx, [0, 60, 3, 57, 3, 54, 0, 56.5], p.red);
  }
  for (const y of [42, -40]) {
    ctx.save();
    ctx.translate(0, y);
    gunTurret(ctx, 6, 2, aim, p, 2.1);
    ctx.restore();
  }
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(s * 9, -32);
    missileRack(ctx, 2, 11, aim, p);
    ctx.restore();
  }
  ring(ctx, 0, 0, 2.6, p.dark, p.line);
  ctx.save();
  ctx.rotate(t * 2.6);
  rect(ctx, -8, -1, 16, 2, p.dark);
  ctx.restore();
  if (!p.mono) circle(ctx, 0, -18, 2.2, p.trim);
};

export type GroundKind2 = 'shilka' | 'bunker' | 'frigate' | 'fortress' | 'cruiser';
export const GROUND_UNITS_2: Readonly<Record<GroundKind2, UnitFn>> = { shilka, bunker, frigate, fortress, cruiser };
