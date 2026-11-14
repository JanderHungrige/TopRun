import type { BossId, EnemyWeapon } from '../data/types';
import type { BossDrawState } from './draw-bosses';
import { HL, rect, ring, SH, type Pal } from './draw-ground-units';
import { bossPal } from './bosses-2';
import { screwBlur } from './enemies/sea';
import { circle, ellipse, fillPair, fillPoly, fillSym } from './shapes';

// Hulls of map 5's bosses (docs 65, 70) in data/bosses-5.ts's local coordinates; tubes, guns, damage and warning lights
// come from the shared boss renderer (draw-bosses.ts). The sea monsters' weak points are glowing organs, not turrets.

type Ctx = CanvasRenderingContext2D;
type HullFn = (ctx: Ctx, p: Pal, s: BossDrawState) => void;
type Map5Boss = 'barracuda' | 'medusa' | 'bastion' | 'goliath' | 'jormungand';

export const PALS_5: Readonly<Record<Map5Boss, Pal>> = {
  barracuda: bossPal('#2c3a48', '#18212b', '#4a5d70', '#c8312a', '#7ff0ff'),
  medusa: bossPal('#c87ab8', '#7a3a78', '#f2c0ea', '#ff5aaa', '#ffe0f4'),
  bastion: bossPal('#6c7880', '#3c444a', '#98a4ac', '#ffb46b', '#ffd27a'),
  goliath: bossPal('#b85a50', '#6e2a26', '#e09080', '#ffd27a', '#fff0c0'),
  jormungand: bossPal('#2e5a52', '#16302c', '#5a9a88', '#c8e86a', '#5ff0e0'),
};

export const LIGHTS_5: Readonly<Record<Map5Boss, readonly number[]>> = {
  barracuda: [0, 150, -30, 60, 30, 60, 0, -120, -18, -40, 18, -40],
  medusa: [-50, 30, 50, 30, 0, 80, 0, -10],
  bastion: [-60, 0, 60, 0, 0, 60, -95, 70, 95, 70],
  goliath: [-30, 20, 30, 20, 0, -100, 0, -40],
  jormungand: [-8, 160, 8, 160, -60, 80, 40, 20, -40, -40],
};

/** The bosses whose parts are organs, not guns. */
export const ORGANIC: ReadonlySet<BossId> = new Set<BossId>(['medusa', 'goliath', 'jormungand']);

const ORGAN: Readonly<Record<EnemyWeapon, string>> = {
  none: '#ffffff', single: '#ffe27a', aimed: '#ffe27a', spread3: '#ff7ad9', missile: '#ff5a4a', flak: '#9aff8a', ring: '#c8ff6a', ray: '#ff6a3a',
};

/** A sea monster's weak point: a fleshy bulb with a core glowing in its weapon's colour. */
export function organPart(ctx: Ctx, r: number, weapon: EnemyWeapon, p: Pal): void {
  ring(ctx, 0, 0, r, p.dark, p.line);
  if (p.mono) return;
  circle(ctx, 0, 0, r * 0.62, ORGAN[weapon]);
  circle(ctx, -r * 0.2, -r * 0.2, r * 0.22, 'rgba(255,255,255,0.7)');
}

/** Bubbles streaming from a point, drifting back (up) and wobbling. */
function bubbleTrail(ctx: Ctx, x: number, y: number, t: number, n: number): void {
  for (let i = 0; i < n; i++) {
    const k = (t * 0.9 + i / n) % 1;
    const bx = x + Math.sin(t * 5 + i * 2.3) * (3 + k * 10);
    circle(ctx, bx, y - k * 70, 1.5 + k * 3, `rgba(210,240,255,${(0.5 * (1 - k)).toFixed(3)})`);
  }
}

// ---------- BARRACUDA: a long, sleek hunter-killer sub with a swept sail, sail planes and an X-tail ----------
const barracuda: HullFn = (ctx, p, s) => {
  if (p.live && !p.mono) bubbleTrail(ctx, 0, -186, s.t, 12);
  screwBlur(ctx, -182, 16, s.t, p);
  fillPair(ctx, [10, -146, 42, -176, 46, -186, 36, -186, 4, -160], p.dark, p.line);
  fillSym(ctx, [0, 160, 14, 150, 26, 126, 34, 92, 38, 40, 38, -60, 34, -110, 24, -148, 12, -168, 0, -176], p.body, p.line);
  if (!p.mono) {
    fillSym(ctx, [0, 150, 8, 140, 12, 90, 12, -120, 0, -150], HL);
    for (const y of [100, 0, -100]) rect(ctx, -37, y, 74, 2, SH);
    ellipse(ctx, 0, 150, 10, 7, 'rgba(255,255,255,0.08)');
  }
  fillPair(ctx, [8, 46, 44, 38, 46, 30, 8, 28], p.dark, p.line);
  fillSym(ctx, [0, 64, 8, 58, 12, 44, 12, 10, 8, 0, 0, -4], p.light, p.line);
  if (p.mono) return;
  rect(ctx, -3, 50, 6, 4, p.glass);
  if (p.live) {
    ellipse(ctx, 0, 182, 12, 22, 'rgba(255,90,70,0.12)');
    circle(ctx, 0, 162, 2.4, p.red);
  }
};

// ---------- MEDUSA: a huge pulsing bell, a frilled rim, tentacles streaming up behind ----------
const medusa: HullFn = (ctx, p, s) => {
  const pulse = Math.sin(s.t * 2.2);
  ctx.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    const x0 = -70 + i * 10.8;
    ctx.strokeStyle = p.mono ? p.body : i % 2 ? 'rgba(242,192,234,0.5)' : 'rgba(200,122,184,0.6)';
    ctx.lineWidth = i % 3 === 0 ? 5 : 2.5;
    ctx.beginPath();
    ctx.moveTo(x0, -10);
    for (let k = 1; k <= 9; k++) ctx.lineTo(x0 + Math.sin(s.t * 2 + i + k * 0.7) * (4 + k), -10 - k * 20);
    ctx.stroke();
  }
  ellipse(ctx, 0, 30, 84 - pulse * 4, 70 + pulse * 6, p.mono ? p.body : 'rgba(200,122,184,0.78)');
  if (p.mono) return;
  ellipse(ctx, 0, 40, 58, 46, 'rgba(242,192,234,0.5)');
  ctx.strokeStyle = 'rgba(122,58,120,0.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 36);
    ctx.lineTo(Math.cos(a) * 60, 36 + Math.sin(a) * 50);
    ctx.stroke();
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    circle(ctx, Math.cos(a) * (80 - pulse * 4), 30 + Math.sin(a) * (66 + pulse * 6), 3, p.trim);
  }
  ellipse(ctx, -24, 4, 18, 10, 'rgba(255,255,255,0.3)');
};

// ---------- BASTION: a domed fortress on a rock shelf, gun domes on pads, pipes between ----------
const bastion: HullFn = (ctx, p) => {
  fillPoly(ctx, [-130, 40, -120, -60, -60, -96, 40, -100, 120, -70, 132, 30, 100, 80, 20, 96, -90, 84], p.dark, p.line);
  if (!p.mono) {
    for (const [x, y, r] of [[-100, -20, 14], [110, 10, 12], [-40, 80, 10], [70, -84, 9]] as const) ellipse(ctx, x, y, r, r * 0.7, SH);
    ctx.strokeStyle = p.light;
    ctx.lineWidth = 5;
    for (const [x, y] of [[-95, 40], [95, 40], [-80, -55], [80, -55]] as const) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }
  for (const [x, y] of [[-95, 40], [95, 40], [-80, -55], [80, -55]] as const) ring(ctx, x, y, 24, p.body, p.line);
  ring(ctx, 0, 0, 62, p.body, p.line);
  ring(ctx, 0, 0, 48, p.light, p.line);
  if (p.mono) return;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    rect(ctx, Math.cos(a) * 55 - 2, Math.sin(a) * 55 - 2, 4, 4, p.glass);
  }
  ellipse(ctx, -16, -16, 20, 12, HL);
};

// ---------- GOLIATH: a giant squid from above — mantle and fins behind, eight arms writhing toward the sub ----------
const goliath: HullFn = (ctx, p, s) => {
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const x0 = -42 + i * 12;
    ctx.strokeStyle = p.mono ? p.body : i % 2 ? p.body : p.dark;
    ctx.lineWidth = 9 - Math.abs(i - 3.5);
    ctx.beginPath();
    ctx.moveTo(x0 * 0.6, 40);
    for (let k = 1; k <= 7; k++) ctx.lineTo(x0 + Math.sin(s.t * 2.6 + i * 0.9 + k * 0.6) * (3 + k * 2.2), 40 + k * 20);
    ctx.stroke();
  }
  fillPair(ctx, [10, -140, 56, -120, 60, -100, 26, -96], p.dark, p.line);
  fillSym(ctx, [0, -170, 18, -150, 36, -100, 44, -40, 42, 10, 30, 44, 0, 52], p.body, p.line);
  if (p.mono) return;
  fillSym(ctx, [0, -150, 10, -120, 18, -60, 16, 0, 0, 10], HL);
  for (let i = 0; i < 18; i++) circle(ctx, ((i * 37) % 70) - 35, -140 + ((i * 53) % 170), 2.2, 'rgba(110,42,38,0.6)');
};

// ---------- JORMUNGAND: a vast sea serpent coiled in an S, scaled back, a horned head with glowing eyes ----------
const SPINE = [0, 150, -60, 80, 40, 20, -40, -40, 50, -100, 0, -170] as const;

const jormungand: HullFn = (ctx, p, s) => {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < SPINE.length / 2; i++) pts.push([(SPINE[i * 2] ?? 0) + Math.sin(s.t * 1.4 + i) * 6, SPINE[i * 2 + 1] ?? 0]);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [w, color] of [[70, p.line], [64, p.dark], [50, p.body], [16, p.mono ? p.body : p.light]] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    pts.forEach(([x, y], i) => {
      const prev = pts[i - 1];
      if (!prev) ctx.moveTo(x, y);
      else ctx.quadraticCurveTo(prev[0], prev[1], (prev[0] + x) / 2, (prev[1] + y) / 2);
    });
    ctx.stroke();
  }
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i] ?? [0, 0];
    fillPoly(ctx, [x - 8, y + 4, x, y - 26, x + 8, y + 4], p.mono ? p.body : p.trim, p.line);
  }
  const [hx, hy] = pts[0] ?? [0, 150];
  ctx.save();
  ctx.translate(hx, hy);
  serpentHead(ctx, p);
  ctx.restore();
};

/** The serpent's head at its own origin: swept-back horns, a broad skull, a dark maw with teeth, glowing eyes. */
function serpentHead(ctx: Ctx, p: Pal): void {
  fillPair(ctx, [16, -4, 40, -34, 24, 2], p.dark, p.line);
  fillSym(ctx, [0, -24, 30, -12, 36, 16, 22, 44, 0, 52], p.body, p.line);
  if (p.mono) return;
  fillSym(ctx, [0, 52, 14, 44, 18, 34, 0, 36], '#0a0f0e');
  ctx.fillStyle = '#e8f0e0';
  for (let i = -3; i <= 3; i++) ctx.fillRect(i * 4 - 0.6, 36, 1.2, 4);
  for (const sx of [-16, 16]) {
    circle(ctx, sx, 8, 6, 'rgba(95,240,224,0.35)');
    circle(ctx, sx, 8, 3, p.glass);
  }
}

export const HULLS_5: Readonly<Record<Map5Boss, HullFn>> = { barracuda, medusa, bastion, goliath, jormungand };
