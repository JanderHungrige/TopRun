import type { BossPartDef } from '../data/bosses';
import type { BossId } from '../data/types';
import { TAU } from '../core/math';
import type { MountFn } from './boss-mounts';
import { liveOf, roundPts, SHIP_4, type Map4Boss } from './bosses-4';
import { shade } from './detail/color';
import { bolts, cylinder, DARK, edges, glow, LIGHT, path } from './detail/parts';
import { drawCached, variantOf } from './detail/sprite';
import type { Pal } from './draw-ground-units';
import { cells } from './enemies/space-gear';
import { turret } from './enemies/space-guns';
import { lamp, plating, rgbOf, seams } from './enemies/space-kit';
import type { ShipPal } from './enemies/space-pal';

// The weapon mounts of space's bosses in detail (map 5; the files keep the world's old number 4; doc 119), registered
// in CUSTOM_MOUNTS (bosses-later.ts) and drawn at the part's centre in the boss's own colours: each sits on an armoured
// barbette (cached per boss, kind and radius); railgun turrets (aimed, single), heavy triple turrets (spread3), twin flak
// turrets beside their ammunition drums, armoured missile cell blocks with a ready light, beam emitters with a glowing
// lens. The turrets turn to the aim (heading: 0 = up, clockwise); lenses and lights are live.

type Ctx = CanvasRenderingContext2D;
type Kind = 'gun' | 'flak' | 'cells' | 'emitter';

const OCTAGON = (r: number): number[] =>
  Array.from({ length: 8 }, (_, k) => [Math.cos((k / 8) * TAU + TAU / 16) * r, Math.sin((k / 8) * TAU + TAU / 16) * r]).flat();

/** The barbette: an octagonal armoured plate, its bolts and the well the turret turns in. */
function barbette(g: Ctx, a: ShipPal, r: number): void {
  plating(g, OCTAGON(r * 1.3), shade(a.dark, 0.12), a, 0.9);
  bolts(g, roundPts(0, 0, r * 1.14, 8), Math.max(0.6, r * 0.05));
  g.fillStyle = shade(a.metal, -0.4);
  g.beginPath();
  g.arc(0, 0, r * 0.98, 0, TAU);
  g.fill();
  edges(g, roundPts(0, 0, r * 0.98, 16), 1, DARK, LIGHT);
}

function drums(g: Ctx, a: ShipPal, r: number): void {
  for (const s of [-1, 1]) {
    cylinder(g, s * r * 1.02 - r * 0.2, -r * 0.55, r * 0.4, r * 1.1, a.metal, 'y');
    seams(g, [s * r * 1.02 - r * 0.2, 0, s * r * 1.02 + r * 0.2, 0], 0.5);
  }
}

function block(g: Ctx, a: ShipPal, r: number): void {
  plating(g, OCTAGON(r * 1.3), shade(a.dark, 0.12), a, 0.9);
  const s = (r * 1.5) / 3;
  cells(g, -r * 0.75, -s, 3, 2, s, a);
  for (const y of [-r * 1.08, r * 0.86]) {
    g.save();
    g.beginPath();
    g.rect(-r * 0.75, y, r * 1.5, r * 0.22);
    g.clip();
    g.fillStyle = '#e0b424';
    g.fillRect(-r * 0.75, y, r * 1.5, r * 0.22);
    g.fillStyle = '#1c1c1c';
    for (let x = -r; x < r; x += r * 0.3) g.fill(path([x, y + r * 0.22, x + r * 0.15, y + r * 0.22, x + r * 0.37, y, x + r * 0.22, y]));
    g.restore();
  }
}

function emitterDome(g: Ctx, a: ShipPal, r: number): void {
  barbette(g, a, r);
  const d = g.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r * 0.8);
  d.addColorStop(0, shade(a.light, 0.3));
  d.addColorStop(1, shade(a.hull, -0.4));
  g.fillStyle = d;
  g.beginPath();
  g.arc(0, 0, r * 0.8, 0, TAU);
  g.fill();
  for (let k = 0; k < 6; k++) seams(g, [Math.cos((k / 6) * TAU) * r * 0.45, Math.sin((k / 6) * TAU) * r * 0.45, Math.cos((k / 6) * TAU) * r * 0.78, Math.sin((k / 6) * TAU) * r * 0.78], 0.6);
}

function base(ctx: Ctx, id: Map4Boss, d: BossPartDef, p: Pal, kind: Kind): void {
  const r = d.r;
  drawCached(ctx, `space-mount-${id}-${kind}-${r}`, [r * 1.8, r * 1.8], (g) => {
    const a = SHIP_4[id];
    switch (kind) {
      case 'gun': return barbette(g, a, r);
      case 'flak': barbette(g, a, r); return drums(g, a, r);
      case 'cells': return block(g, a, r);
      case 'emitter': return emitterDome(g, a, r);
      default: throw new Error(`unhandled: ${kind satisfies never}`);
    }
  }, variantOf(p));
}

/** A beam emitter's lens glowing toward the aim. */
function lensGlow(ctx: Ctx, q: ShipPal, r: number, aim: number): void {
  if (q.mono) return;
  const lx = Math.sin(aim) * r * 0.25, ly = -Math.cos(aim) * r * 0.25;
  glow(ctx, lx, ly, r * 1.2, rgbOf(q.trim), 0.6);
  lamp(ctx, q, lx, ly, r * 0.3, rgbOf(q.glass), 1);
}

/** The mounts of one boss: its colours, its parts' weapons. */
const spaceMount = (id: Map4Boss): MountFn => (ctx, d, aim, p) => {
  const q = liveOf(id, p);
  const r = d.r;
  switch (d.weapon) {
    case 'aimed':
    case 'single':
      base(ctx, id, d, p, 'gun');
      return turret(ctx, q, r * 0.86, d.weapon === 'aimed' ? 2 : 1, 2.1, aim);
    case 'spread3':
      base(ctx, id, d, p, 'gun');
      return turret(ctx, q, r * 0.96, 3, 1.75, aim);
    case 'flak':
      base(ctx, id, d, p, 'flak');
      return turret(ctx, q, r * 0.72, 2, 1.45, aim);
    case 'missile':
      base(ctx, id, d, p, 'cells');
      return lamp(ctx, q, r * 0.95, -r * 0.95, Math.max(1, r * 0.09), '255,70,60', 1); // the ready light
    case 'ray':
    case 'ring':
      base(ctx, id, d, p, 'emitter');
      return lensGlow(ctx, q, r, aim);
    case 'none':
      return base(ctx, id, d, p, 'gun');
    default:
      throw new Error(`unhandled: ${d.weapon satisfies never}`);
  }
};

export const MOUNTS_4: Readonly<Partial<Record<BossId, MountFn>>> = {
  halo: spaceMount('halo'),
  quarry: spaceMount('quarry'),
  crater: spaceMount('crater'),
  trident: spaceMount('trident'),
  ark: spaceMount('ark'),
};
