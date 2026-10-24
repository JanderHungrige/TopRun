import { BOSSES, type BossDef, type BossPartDef } from '../data/bosses';
import type { BossId } from '../data/types';
import { exhaust, fire, hash, roundel, scorch, smoke } from './draw-enemies';
import { gunTurret, HL, missileRack, monoPal, rect, ring, SH, slab, twinGun, wake, type Pal } from './draw-ground-units';
import { circle, ellipse, fillPair, fillPoly, fillSym } from './shapes';

/** Boss art in the same local coordinates as data/bosses.ts (nose / bow points down, +y). */

export interface BossPartView { id: string; alive: boolean; aim: number /* heading convention: 0 = up, clockwise */; flash: boolean }
export interface BossDrawState { t: number; flash: boolean; parts: readonly BossPartView[]; damage: number; enraged: boolean }

type Ctx = CanvasRenderingContext2D;
type HullFn = (ctx: Ctx, p: Pal, s: BossDrawState) => void;

const pal = (body: string, dark: string, light: string, trim: string, glass: string): Pal =>
  ({ body, dark, light, trim, glass, red: '#c8312a', line: 'rgba(10,12,14,0.6)', mono: false, live: true });
const PALS: Readonly<Record<BossId, Pal>> = {
  ironclad: pal('#737c83', '#474f56', '#98a1a8', '#5c656c', '#1f2a33'),
  sandstorm: pal('#b39a6a', '#7b6646', '#d6c194', '#5d6640', '#2a2a24'),
  blackjack: pal('#d3d7da', '#9aa1a7', '#eef0f1', '#7d858c', '#25323d'),
  typhoon: pal('#30353a', '#1c1f23', '#4d555d', '#3a4047', '#8a3a2a'),
  leviathan: pal('#4f575d', '#33393e', '#7d868d', '#646d74', '#1e2a33'),
};
/** Turret / launcher colours where they differ from the hull. */
const MOUNT_PALS: Partial<Record<BossId, Pal>> = { sandstorm: pal('#7c7d68', '#33342b', '#9a9a84', '#5d6640', '#2a2a24') };
const FLASH = monoPal('#ffffff', true);
const WHITE = '#dcdcd4';

function radarBar(ctx: Ctx, x: number, y: number, len: number, a: number, p: Pal): void {
  ring(ctx, x, y, 2.6, p.dark, p.line);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  rect(ctx, -len / 2, -1, len, 2, p.dark);
  ctx.restore();
}

// ---------- parts ----------
function pod(ctx: Ctx, r: number, p: Pal): void {
  fillPair(ctx, [r * 0.3, -r, r * 0.9, -r * 1.45, r * 0.9, -r * 1.15, r * 0.3, -r * 0.6], p.dark, p.line);
  slab(ctx, -r * 0.5, -r * 1.35, r, r * 2.6, r * 0.5, p.trim, p.line);
  if (p.mono) return;
  rect(ctx, -r * 0.3, -r * 1.1, r * 0.22, r * 2.1, HL);
  for (const x of [-0.24, 0.24]) circle(ctx, x * r, r * 1.02, r * 0.17, p.red);
}

function ciws(ctx: Ctx, r: number, a: number, p: Pal): void {
  ring(ctx, 0, 0, r, p.dark, p.line);
  ctx.save();
  ctx.rotate(a);
  rect(ctx, -r * 0.13, -r * 1.4, r * 0.26, r * 1.1, p.dark);
  ring(ctx, 0, r * 0.12, r * 0.62, p.mono ? p.body : '#e2e4e1', p.line);
  if (!p.mono) circle(ctx, -r * 0.2, -r * 0.05, r * 0.24, HL);
  ctx.restore();
}

function mount(ctx: Ctx, id: BossId, d: BossPartDef, a: number, p: Pal): void {
  const r = d.r;
  if (BOSSES[id].layer === 'air') {
    if (d.weapon === 'missile') return pod(ctx, r, p);
    ring(ctx, 0, 0, r, p.trim, p.line);
    ring(ctx, 0, 0, r * 0.78, p.mono ? p.body : '#20272e', p.line);
    return twinGun(ctx, r * 0.56, a, p);
  }
  if (d.weapon === 'missile' || d.weapon === 'flak') {
    ring(ctx, 0, 0, r, p.dark, p.line);
    return d.weapon === 'flak' ? twinGun(ctx, r * 0.62, a, p) : missileRack(ctx, 4, r * 1.7, a, p);
  }
  if (id === 'leviathan' && d.weapon === 'aimed') return ciws(ctx, r, a, p);
  const big = id === 'sandstorm';
  gunTurret(ctx, r, big ? 1 : id === 'leviathan' ? 2 : 3, a, p, big ? 2.2 : 1.65);
}

function partWreck(ctx: Ctx, r: number, t: number, seed: number): void {
  scorch(ctx, 0, 0, r * 1.25, seed, 'rgba(16,13,10,0.82)');
  ring(ctx, 0, 0, r * 0.62, '#2b2724', 'rgba(0,0,0,0.6)');
  ctx.save();
  ctx.rotate(hash(seed) * 6.28);
  rect(ctx, -r * 0.1, -r * 1.15, r * 0.2, r * 0.75, '#1c1a18');
  ctx.restore();
  fire(ctx, r * 0.15, 0, r * 0.32, t, seed);
}

function drawPart(ctx: Ctx, id: BossId, d: BossPartDef, v: BossPartView | undefined, t: number): void {
  ctx.save();
  ctx.translate(d.dx, d.dy);
  if (v && !v.alive) partWreck(ctx, d.r, t, d.dx + d.dy * 3);
  else mount(ctx, id, d, v?.aim ?? Math.PI, v?.flash ? FLASH : MOUNT_PALS[id] ?? PALS[id]);
  ctx.restore();
}

// ---------- damage + enrage ----------
/** i-th damage spot: a deterministic point inside one of the hitboxes. */
function spot(def: BossDef, i: number): readonly [number, number] {
  const hb = def.hitboxes[i % def.hitboxes.length] ?? { dx: 0, dy: 0, r: 0 };
  const a = i * 2.39996 + hash(i);
  const d = hb.r * (0.15 + 0.45 * hash(i * 7.3));
  return [hb.dx + Math.cos(a) * d, hb.dy + Math.sin(a) * d * 0.8];
}

const spots = (s: BossDrawState): number => Math.floor(Math.max(0, Math.min(1, s.damage)) * 15);

function damageMarks(ctx: Ctx, def: BossDef, s: BossDrawState): void {
  for (let i = 0; i < spots(s); i++) {
    const [x, y] = spot(def, i);
    scorch(ctx, x, y, 6 + 7 * hash(i * 3.1), i);
    if (i % 3 === 1) fire(ctx, x, y, 3 + s.damage * 3, s.t, i);
  }
}

function smokePass(ctx: Ctx, def: BossDef, s: BossDrawState): void {
  for (let i = 1; i < spots(s); i += 3) {
    const [x, y] = spot(def, i);
    smoke(ctx, x, y - 3, 5 + s.damage * 4, s.t, i);
  }
  for (const d of def.parts) {
    if (s.parts.find((v) => v.id === d.id)?.alive === false) smoke(ctx, d.dx, d.dy - 4, d.r * 0.45, s.t, d.dx + d.dy);
  }
}

const LIGHTS: Readonly<Record<BossId, readonly number[]>> = {
  ironclad: [0, 30, -30, -150, 30, -150, -22, 140, 22, 140, -15, -40, 15, -40],
  sandstorm: [0, -86, -60, 86, 60, 86, -136, 0, 136, 0, 0, -48],
  blackjack: [-178, -44, 178, -44, 0, -132, -55, -20, 55, -20, 0, 98],
  typhoon: [-216, -40, 216, -40, -110, -50, 110, -50, 0, -30, 0, 60],
  leviathan: [86, 0, -62, -220, 62, -220, -40, 210, 40, 210, -88, 20],
};

function warningLights(ctx: Ctx, id: BossId, t: number): void {
  const pts = LIGHTS[id];
  for (let i = 0; i < pts.length; i += 2) {
    if (Math.sin(t * 9 + i * 1.7) < -0.1) continue;
    circle(ctx, pts[i] ?? 0, pts[i + 1] ?? 0, 8, 'rgba(255,42,26,0.3)');
    circle(ctx, pts[i] ?? 0, pts[i + 1] ?? 0, 2.6, '#ffd2c4');
  }
}

// ---------- hulls ----------
function ironcladTop(ctx: Ctx, p: Pal, s: BossDrawState): void {
  fillSym(ctx, [0, 36, 11, 33, 17, 22, 18, -30, 14, -47, 0, -49], p.light, p.line);
  fillSym(ctx, [0, 30, 7, 28, 10, 18, 10, -2, 0, -4], p.trim, p.line);
  if (p.mono) return;
  rect(ctx, -6, 26.5, 12, 2, p.glass);
  ellipse(ctx, 0, -22, 7, 10, p.dark);
  ellipse(ctx, 0, -24, 4.6, 6, '#15181b');
  for (const [x, y] of [[-14, 6], [14, 6], [-12, -38], [12, -38]] as const) {
    ctx.translate(x, y);
    gunTurret(ctx, 4.5, 2, x < 0 ? -1.4 : 1.4, p);
    ctx.translate(-x, -y);
  }
  radarBar(ctx, 0, 10, 18, s.t * 2, p);
  if (p.live) smoke(ctx, 0, -26, 6, s.t, 5);
}

const ironclad: HullFn = (ctx, p, s) => {
  if (p.live) wake(ctx, 40, 178, -168, s.t);
  fillSym(ctx, [0, 181, 9, 166, 21, 140, 31, 108, 38, 72, 42, 30, 42, -60, 40, -120, 35, -152, 27, -168, 0, -171], p.dark, p.line);
  fillPair(ctx, [22, -26, 46, -24, 48, -10, 46, 4, 22, 6], p.dark, p.line);
  fillSym(ctx, [0, 173, 8, 160, 18, 138, 27, 108, 34, 72, 38, 30, 38, -60, 36, -118, 31, -148, 24, -163, 0, -166], p.body);
  if (!p.mono) {
    ctx.save();
    ctx.clip();
    for (let y = -160; y < 170; y += 13) rect(ctx, -40, y, 80, 0.8, SH);
    ctx.restore();
    roundel(ctx, 0, 150, 9, p);
    rect(ctx, -36, -150, 72, 2, HL);
  }
  ironcladTop(ctx, p, s);
};

function sandstormYard(ctx: Ctx, p: Pal): void {
  fillPoly(ctx, [-126, -76, 126, -76, 126, 76, -126, 76], '#a68d5e');
  rect(ctx, -126, -76, 252, 5, SH);
  for (let x = -132; x < 132; x += 9) for (const y of [-86, 83]) rect(ctx, x, y, 4.5, 3, y < 0 ? p.light : '#8a7350');
  ellipse(ctx, -92, 6, 20, 20, '#8f7a52');
  for (const x of [-101, -86]) rect(ctx, x, -3, 3, 18, WHITE);
  rect(ctx, -98, 4.5, 12, 3, WHITE);
  for (const [x, y] of [[84, -30], [100, -30], [84, -14], [104, 20], [88, 26]] as const) slab(ctx, x - 6, y - 5, 12, 10, 1.5, '#7d6a45', p.line);
  for (let i = 0; i < 8; i++) ellipse(ctx, -46 + i * 13, 64, 6.5, 3.5, '#c8b282');
  rect(ctx, -16, -88, 32, 8, '#3a3226');
}

const sandstorm: HullFn = (ctx, p) => {
  fillPoly(ctx, [-168, -104, -60, -114, 70, -110, 168, -102, 176, -20, 170, 104, 60, 112, -70, 110, -170, 102, -176, 10], p.dark, p.line);
  fillPoly(ctx, [-136, -86, 136, -86, 136, 86, -136, 86], p.body, p.line);
  if (!p.mono) sandstormYard(ctx, p);
  for (const [x, y] of [[-130, -80], [130, -80], [-130, 80], [130, 80]] as const) {
    ring(ctx, x, y, 26, p.body, p.line);
    if (!p.mono) circle(ctx, x - 3, y - 3, 19, p.light);
  }
  slab(ctx, -58, -62, 116, 76, 8, p.mono ? p.body : '#9d9580', p.line);
  ring(ctx, 0, 45, 32, p.dark, p.line);
  if (p.mono) return;
  rect(ctx, -58, -62, 116, 4, HL);
  for (const x of [-40, -22, 22, 40]) slab(ctx, x - 6, -48, 12, 9, 2, '#7f786a');
  roundel(ctx, 0, -22, 13, p);
};

const blackjack: HullFn = (ctx, p, s) => {
  if (p.live) for (const x of [-61, -49, 49, 61]) exhaust(ctx, x, -82, 8, 0.6, s.t + x, s.enraged ? 1.8 : 1.4);
  fillPair(ctx, [62, 0, 176, -36, 180, -44, 174, -52, 66, -40], p.body, p.line);
  fillPair(ctx, [6, -96, 50, -112, 52, -120, 6, -118], p.body, p.line);
  fillPair(ctx, [41, -4, 69, -4, 69, -82, 41, -82], p.dark, p.line);
  fillSym(ctx, [0, 108, 3.5, 102, 7, 88, 10.5, 66, 14, 40, 40, 12, 72, -2, 72, -34, 42, -44, 16, -64, 13, -104, 9, -124, 4, -134, 0, -136], p.body, p.line);
  fillSym(ctx, [0, 92, 5, 66, 7, 0, 5, -120, 0, -128], p.light);
  if (p.mono) return;
  for (const x of [-61, -49, 49, 61]) ring(ctx, x, -81, 5.5, '#2a2d30', p.line);
  fillPair(ctx, [168, -34, 176, -36, 180, -44, 174, -52, 167, -50], p.red);
  fillPair(ctx, [80, -10, 172, -40, 172, -42.5, 80, -13.5], SH);
  fillSym(ctx, [0, 89, 4.5, 86, 5.5, 80, 0, 79], p.glass);
  circle(ctx, 0, 105, 2.4, p.trim);
  rect(ctx, -1.5, -134, 3, 70, p.trim);
  rect(ctx, -1.5, -134, 3, 9, p.red);
  for (const x of [-68, 68]) ring(ctx, x, -18, 3.4, p.trim, p.line);
  roundel(ctx, 152, -42, 6, p);
};

const typhoon: HullFn = (ctx, p, s) => {
  if (p.live) for (const x of [-46, -16, 16, 46]) exhaust(ctx, x, Math.abs(x) > 30 ? -49 : -45, 7, 0.6, s.t + x, s.enraged ? 1.6 : 1.2);
  fillSym(ctx, [0, 66, 50, 48, 120, 14, 200, -22, 220, -36, 218, -46, 182, -58, 148, -40, 110, -58, 70, -36, 34, -54, 0, -36], p.body, p.line);
  if (p.mono) return;
  fillSym(ctx, [0, 62, 26, 48, 40, 26, 42, -4, 34, -28, 18, -40, 0, -34], p.trim);
  fillPair(ctx, [0, 66, 50, 48, 120, 14, 200, -22, 220, -36, 214, -33, 198, -18, 118, 18, 48, 51, 0, 69], '#5d656e');
  fillPair(ctx, [42, -6, 50, -14, 50, -30, 42, -22], p.dark);
  fillPair(ctx, [8, -38, 30, -47, 30, -51, 8, -42], '#3a2a24');
  fillPair(ctx, [60, 20, 120, -9, 120, -6, 60, 23], SH);
  fillPair(ctx, [124, -18, 190, -48, 186, -45, 124, -15], SH);
  rect(ctx, -1, -32, 2, 52, '#454c54');
  for (const x of [-216, 216]) circle(ctx, x, -41, 2.2, p.red);
  roundel(ctx, 122, -24, 6, p);
};

function parkedJet(ctx: Ctx, x: number, y: number, a: number, p: Pal): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  fillSym(ctx, [0, 11, 1.8, 6, 2.2, 1, 8.5, -3.5, 8.5, -5.5, 2.4, -4.5, 2, -7.5, 5, -10, 5, -11.5, 0, -11.5], p.light, p.line);
  ellipse(ctx, 0, 4.5, 1.2, 2.6, p.glass);
  ctx.restore();
}

/** Painted deck markings (clipped to the flight deck by the caller). */
function deckLines(ctx: Ctx, p: Pal): void {
  ctx.save();
  ctx.translate(-30, -82);
  ctx.rotate(0.277);
  for (const x of [-23, 22]) rect(ctx, x, -160, 1.2, 300, WHITE);
  for (let y = -150; y < 140; y += 16) rect(ctx, -0.6, y, 1.2, 9, '#e6d24a');
  for (let y = -104; y < -72; y += 8) rect(ctx, -20, y, 40, 0.9, '#1a1e21');
  ctx.restore();
  for (const x of [-22, 22]) {
    rect(ctx, x - 0.7, 112, 1.4, 106, '#22272b');
    rect(ctx, x - 8, 104, 16, 3, p.light);
  }
  for (let x = -58; x < 62; x += 12) rect(ctx, x, -224, 6, 4, x % 24 ? p.red : WHITE);
  for (let y = -200; y < 200; y += 14) rect(ctx, 70, y, 1.2, 7, '#e6d24a');
  roundel(ctx, 0, 196, 13, p);
}

function deckProps(ctx: Ctx, p: Pal, t: number): void {
  ring(ctx, -55, 0, 26, '#e0b424', p.line);
  for (const [x, y, a] of [[52, 100, 0.6], [52, 124, 0.6], [52, 148, 0.6], [-50, -146, -0.5], [-50, -172, -0.5]] as const) parkedJet(ctx, x, y, a, p);
  rect(ctx, 74, 22, 24, 3, p.glass);
  fillPoly(ctx, [78, -14, 94, -12, 94, 6, 78, 8], p.trim, p.line);
  ellipse(ctx, 86, -7, 4, 6, '#1b1e21');
  radarBar(ctx, 86, 12, 20, t * 2, p);
}

const leviathan: HullFn = (ctx, p, s) => {
  if (p.live) wake(ctx, 62, 234, -226, s.t);
  fillSym(ctx, [0, 238, 24, 214, 52, 170, 62, 100, 64, -200, 58, -224, 0, -226], p.dark, p.line);
  for (const [x, y] of [[-78, -185], [78, -185], [-78, 175], [78, 175], [86, -40], [86, 40]] as const) ring(ctx, x, y, 20, p.dark, p.line);
  for (const y of [-112, 88]) fillPoly(ctx, [70, y, 96, y, 96, y + 26, 70, y + 26], p.trim, p.line);
  fillPoly(ctx, [30, 224, 64, 190, 74, 150, 74, -206, 66, -226, -60, -226, -72, -206, -72, -60, -92, -6, -90, 56, -74, 92, -74, 150, -64, 190, -30, 224], p.body, p.line);
  if (!p.mono) {
    ctx.save();
    ctx.clip();
    deckLines(ctx, p);
    ctx.restore();
  }
  fillPoly(ctx, [72, -28, 98, -24, 100, 26, 72, 30], p.light, p.line);
  if (!p.mono) deckProps(ctx, p, s.t);
};

const HULLS: Readonly<Record<BossId, HullFn>> = { ironclad, sandstorm, blackjack, typhoon, leviathan };

export function drawBoss(ctx: CanvasRenderingContext2D, id: BossId, x: number, y: number, s: BossDrawState): void {
  const def = BOSSES[id];
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 1;
  ctx.lineJoin = 'round';
  HULLS[id](ctx, s.flash ? FLASH : s.enraged ? { ...PALS[id], red: '#ff3b24' } : PALS[id], s);
  if (!s.flash) damageMarks(ctx, def, s);
  for (const d of def.parts) drawPart(ctx, id, d, s.parts.find((v) => v.id === d.id), s.t);
  smokePass(ctx, def, s);
  if (s.enraged) warningLights(ctx, id, s.t);
  ctx.restore();
}
