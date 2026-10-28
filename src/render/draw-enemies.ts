import { ENEMIES, isAir, SEA_KINDS } from '../data/enemies';
import type { EnemyKind } from '../data/types';
import { GROUND_UNITS, monoPal, type Pal, type UnitFn } from './draw-ground-units';
import { AIR_UNITS } from './enemies/air-units';
import { GROUND_UNITS_2 } from './enemies/ground-2';
import { fire, hash, scorch, smoke } from './enemies/fx';
import { ellipse } from './shapes';

export { exhaust, fire, hash, roundel, scorch, smoke } from './enemies/fx';

/** Public entry for enemy art: dispatch for every enemy kind, shadows and wrecks. Noses / bows point down (+y). */

/** heading: 0 = nose down (rotates the unit); aim: turret angle, 0 = up, clockwise; bank: -1..1 roll (air). */
export interface EnemyDrawOpts { t: number; flash?: boolean; shadow?: boolean; heading?: number; aim?: number; bank?: number }

const pal = (body: string, dark: string, light: string, trim: string, glass = '#58a6bd'): Pal =>
  ({ body, dark, light, trim, glass, red: '#c8312a', line: 'rgba(12,14,16,0.6)', mono: false, live: true });

/** Aircraft bring their own camouflage (src/render/enemies/); they only read mono/live from this. */
const AIR = pal('#7a8288', '#4b5258', '#9aa2a8', '#5f666c');

const PALS: Readonly<Record<EnemyKind, Pal>> = {
  drone: AIR, fishbed: AIR, fulcrum: AIR, flanker: AIR, hind: AIR, bear: AIR,
  foxbat: AIR, felon: AIR, jammer: AIR, backfire: AIR,
  aa: pal('#b5a274', '#3f3b2e', '#cdbd8e', '#59633f'),
  sam: pal('#8e8d85', '#4a5436', '#a9a89f', '#5d6844'),
  tank: pal('#5d6838', '#3a4123', '#7b8850', '#2c2f24'),
  radar: pal('#9c998b', '#5f5d55', '#d8dbd4', '#7f7d72', '#2b3a44'),
  depot: pal('#c6c8c0', '#6d6f69', '#e4e6e0', '#7b7869'),
  boat: pal('#8e98a0', '#4f5960', '#b0b9bf', '#3d454b', '#22303a'),
  destroyer: pal('#7f8a92', '#4f5961', '#a7b0b7', '#3d454b', '#22303a'),
  // Doc 44.
  shilka: pal('#66703f', '#3a4123', '#86925a', '#2c2f24'),
  bunker: pal('#a3a196', '#5d5c55', '#c4c2b6', '#6f6d63'),
  frigate: pal('#86919a', '#4f5961', '#aab3ba', '#3d454b', '#22303a'),
  fortress: pal('#b6a57c', '#5b5242', '#d0c19a', '#7c7058'),
  cruiser: pal('#7a858e', '#4a545c', '#a2abb2', '#3a4248', '#22303a'),
};
const FLASH = monoPal('#ffffff', true);
const SILHOUETTE = monoPal('#000000', false);
const BURNT: Pal = { ...pal('#2e2a26', '#1a1816', '#3e3933', '#25221f', '#141312'), red: '#3b2a22', line: 'rgba(0,0,0,0.55)', live: false };

const DRAW: Readonly<Record<EnemyKind, UnitFn>> = { ...AIR_UNITS, ...GROUND_UNITS, ...GROUND_UNITS_2 };

const sprites = new Map<EnemyKind, HTMLCanvasElement>();

/** Uniform shadow: the silhouette is rendered once per kind into a sprite, then blitted at 28 % alpha. */
function drawShadow(ctx: CanvasRenderingContext2D, kind: EnemyKind): void {
  const r = Math.ceil(ENEMIES[kind].radius * 1.35 + 6);
  let c = sprites.get(kind);
  if (!c) {
    c = document.createElement('canvas');
    c.width = c.height = r * 4;
    const g = c.getContext('2d');
    if (!g) return;
    g.scale(2, 2);
    g.translate(r, r);
    g.lineWidth = 0.8;
    DRAW[kind](g, SILHOUETTE, 0, Math.PI);
    sprites.set(kind, c);
  }
  ctx.globalAlpha *= 0.28;
  ctx.drawImage(c, -r, -r, r * 2, r * 2);
}

export function drawEnemy(ctx: CanvasRenderingContext2D, kind: EnemyKind, x: number, y: number, o: EnemyDrawOpts): void {
  const heading = o.heading ?? 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(heading);
  if (isAir(kind)) ctx.scale(1 - Math.min(1, Math.abs(o.bank ?? 0)) * 0.3, 1);
  if (o.shadow) drawShadow(ctx, kind);
  else {
    ctx.lineWidth = 0.8;
    ctx.lineJoin = 'round';
    DRAW[kind](ctx, o.flash ? FLASH : PALS[kind], o.t, (o.aim ?? Math.PI) - heading);
  }
  ctx.restore();
}

/** Burnt wreck/crater left on the ground after a ground or sea unit dies (scrolls with terrain). */
export function drawWreck(ctx: CanvasRenderingContext2D, kind: EnemyKind, x: number, y: number, t: number): void {
  const r = ENEMIES[kind].radius;
  const seed = hash(Math.round(x) * 0.37 + r) * 100;
  const sea = SEA_KINDS.includes(kind);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 0.8;
  ctx.lineJoin = 'round';
  if (sea) ellipse(ctx, 0, 0, r * 0.75, r * 1.25, 'rgba(12,14,18,0.4)');
  else scorch(ctx, 0, 0, r * 1.3, seed, 'rgba(20,16,12,0.72)');
  ctx.save();
  ctx.rotate((hash(seed) - 0.5) * 0.7);
  ctx.scale(0.9, sea ? 0.75 : 0.9);
  if (sea) ctx.globalAlpha *= 0.7;
  if (isAir(kind)) scorch(ctx, 0, 0, r * 0.6, seed + 1, BURNT.dark);
  else DRAW[kind](ctx, BURNT, 0, seed);
  ctx.restore();
  const fx = (hash(seed + 2) - 0.5) * r * 0.6;
  const fy = (hash(seed + 3) - 0.5) * r * 0.6;
  fire(ctx, fx, fy, Math.max(2, r * 0.16), t, seed);
  smoke(ctx, fx, fy - 2, Math.max(3, r * 0.3), t, seed);
  ctx.restore();
}
