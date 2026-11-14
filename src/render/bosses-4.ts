import type { BossDrawState } from './draw-bosses';
import type { Pal } from './draw-ground-units';
import { bossPal } from './bosses-2';
import { drawCached, variantOf, type Box } from './detail/sprite';
import { shipMono, type ShipPal } from './enemies/space-pal';

// Space's bosses in detail (docs 56, 58, 119; the file keeps the world's old map number), in data/bosses-4.ts's local
// coordinates, fronts down (+y): their palettes, warning lights, the boxes of their cached hulls and the helpers the
// hulls share — the static hull is painted once per palette variant through the sprite cache (the flash is its
// one-colour version), what moves or glows is drawn live. The hulls: HALO and QUARRY in bosses-4a.ts, CRATER and
// TRIDENT in bosses-4b.ts (with the hull table), the ARK in bosses-4c.ts; the guns are the mounts of boss-mounts-4.ts.

type Ctx = CanvasRenderingContext2D;
export type HullFn = (ctx: Ctx, p: Pal, s: BossDrawState) => void;
export type Map4Boss = 'halo' | 'quarry' | 'crater' | 'trident' | 'ark';

export const PALS_4: Readonly<Record<Map4Boss, Pal>> = {
  halo: bossPal('#8d96a8', '#4c5466', '#c3cad8', '#5b7cff', '#9fd0ff'),
  quarry: bossPal('#6a5a4a', '#43372d', '#8f7c66', '#ff9d4a', '#ffcf8a'),
  crater: bossPal('#9a9da4', '#61646c', '#c9ccd2', '#4f8cff', '#9fd0ff'),
  trident: bossPal('#58627a', '#353c4e', '#7d88a2', '#ff5a6a', '#ffb0b8'),
  ark: bossPal('#4a3e58', '#2b2236', '#6e5f82', '#ff6a8a', '#ffc0d8'),
};

export const LIGHTS_4: Readonly<Record<Map4Boss, readonly number[]>> = {
  halo: [0, 128, 0, -128, -128, 0, 128, 0, 0, 0],
  quarry: [-92, 0, 92, 0, 0, -104, -40, 96, 40, 96],
  crater: [-120, 0, 120, 0, 0, 80, 0, -130],
  trident: [0, 158, 0, -140, -72, 110, 72, 110, -72, -70, 72, -70],
  ark: [-160, 10, 160, 10, 0, 170, 0, -140, -90, 100, 90, 100],
};

/** Half extents of each cached hull: they cover every hitbox and part (tested). */
export const BOSS_BOX_4: Readonly<Record<Map4Boss, Box>> = {
  halo: [140, 140], quarry: [116, 130], crater: [154, 154], trident: [104, 168], ark: [170, 178],
};

const ENGINE: Readonly<Record<Map4Boss, string>> = {
  halo: '#78beff', quarry: '#ffb070', crater: '#78beff', trident: '#ff7890', ark: '#ff8caa',
};

/** The hulls' own palettes: each boss's colours as a space ship's (plating, accent, glass, engine light). */
export const SHIP_4: Readonly<Record<Map4Boss, ShipPal>> = Object.fromEntries(Object.entries(PALS_4).map(([id, p]) => [id, {
  mono: false, hull: p.body, dark: p.dark, light: p.light, trim: p.trim, metal: '#5e6474', glass: p.glass,
  engine: ENGINE[id as Map4Boss], cell: '#24407a', ink: 'rgba(8,10,16,0.88)',
}])) as Record<Map4Boss, ShipPal>;

/** The live palette for moving parts: the boss's own, or one colour while it flashes. */
export const liveOf = (id: Map4Boss, p: Pal): ShipPal => (p.mono ? shipMono(p.body) : SHIP_4[id]);

/** The static hull through the cache, in the variant the palette asks for. */
export function cachedHull(ctx: Ctx, id: Map4Boss, p: Pal, paint: (g: Ctx, a: ShipPal) => void): void {
  drawCached(ctx, `boss4-${id}`, BOSS_BOX_4[id], (g) => paint(g, SHIP_4[id]), variantOf(p));
}

/** A flat point list turned by `a` about the origin (parts laid out round a station). Pure. */
export function turn(pts: readonly number[], a: number): number[] {
  const c = Math.cos(a), s = Math.sin(a);
  const out: number[] = [];
  for (let i = 0; i < pts.length; i += 2) out.push((pts[i] ?? 0) * c - (pts[i + 1] ?? 0) * s, (pts[i] ?? 0) * s + (pts[i + 1] ?? 0) * c);
  return out;
}

/** Points round a circle (an n-gon), for round plates and drop shadows. Pure. */
export function roundPts(x: number, y: number, r: number, n = 24): number[] {
  return Array.from({ length: n }, (_, k) => [x + Math.cos((k / n) * Math.PI * 2) * r, y + Math.sin((k / n) * Math.PI * 2) * r]).flat();
}
