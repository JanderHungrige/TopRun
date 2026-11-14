import type { BossId, EnemyWeapon } from '../data/types';
import type { BossDrawState } from './draw-bosses';
import { ring, type Pal } from './draw-ground-units';
import { bossPal } from './bosses-2';
import { drawCached, variantOf, type Box } from './detail/sprite';
import { seaMono, type SeaPal } from './enemies/sea-pal';
import { circle } from './shapes';

// Map 4's bosses in detail (docs 65, 70, 120; the file keeps the sea's old map number), in data/bosses-5.ts's local
// coordinates, fronts down (+y): their palettes, warning lights, the boxes of their cached hulls and the helpers the
// hulls share — the static hull is painted once per palette variant through the sprite cache (the flash is its
// one-colour version), the moving parts live. The hulls: BARRACUDA and BASTION in bosses-5a.ts, MEDUSA, GOLIATH and
// JORMUNGAND in bosses-5b.ts; the weapons are the sea's mounts (boss-mounts-5.ts) — organs on the monsters.

type Ctx = CanvasRenderingContext2D;
export type HullFn = (ctx: Ctx, p: Pal, s: BossDrawState) => void;
export type Map5Boss = 'barracuda' | 'medusa' | 'bastion' | 'goliath' | 'jormungand';

export const PALS_5: Readonly<Record<Map5Boss, Pal>> = {
  barracuda: bossPal('#2c3a48', '#18212b', '#4a5d70', '#c8312a', '#7ff0ff'),
  medusa: bossPal('#c87ab8', '#7a3a78', '#f2c0ea', '#ff5aaa', '#ffe0f4'),
  bastion: bossPal('#6c7880', '#3c444a', '#98a4ac', '#ffb46b', '#ffd27a'),
  goliath: bossPal('#b85a50', '#6e2a26', '#e09080', '#ffd27a', '#fff0c0'),
  jormungand: bossPal('#2e5a52', '#16302c', '#5a9a88', '#c8e86a', '#5ff0e0'),
};

/** Fittings (screws, horns, teeth, claws) and the light each boss gives. */
const EXTRA: Readonly<Record<Map5Boss, Pick<SeaPal, 'metal' | 'glow'>>> = {
  barracuda: { metal: '#a88a50', glow: '#ff5a4a' },
  medusa: { metal: '#e0a0d0', glow: '#ff7ac8' },
  bastion: { metal: '#4a5258', glow: '#ffd27a' },
  goliath: { metal: '#f0c8b8', glow: '#ffd27a' },
  jormungand: { metal: '#d8e0c0', glow: '#5ff0e0' },
};

/** The hulls' own palettes (the sea's look in each boss's colours). */
export const SEA_5: Readonly<Record<Map5Boss, SeaPal>> = Object.fromEntries(Object.entries(PALS_5).map(([id, p]) => [id, {
  mono: false, hull: p.body, dark: p.dark, light: p.light, trim: p.trim, glass: p.glass, ink: 'rgba(6,14,20,0.88)', ...EXTRA[id as Map5Boss],
}])) as Record<Map5Boss, SeaPal>;

export const LIGHTS_5: Readonly<Record<Map5Boss, readonly number[]>> = {
  barracuda: [0, 150, -30, 60, 30, 60, 0, -120, -18, -40, 18, -40],
  medusa: [-50, 30, 50, 30, 0, 80, 0, -10],
  bastion: [-60, 0, 60, 0, 0, 60, -95, 70, 95, 70],
  goliath: [-30, 20, 30, 20, 0, -100, 0, -40],
  jormungand: [-8, 160, 8, 160, -60, 80, 40, 20, -40, -40],
};

/** Half extents of each cached hull: they cover every hitbox and part (tested). */
export const BOSS_BOX_5: Readonly<Record<Map5Boss, Box>> = {
  barracuda: [48, 190], medusa: [104, 120], bastion: [136, 104], goliath: [80, 174], jormungand: [112, 210],
};

/** The bosses whose parts are organs, not guns. */
export const ORGANIC: ReadonlySet<BossId> = new Set<BossId>(['medusa', 'goliath', 'jormungand']);

/** An organ's glow by the weapon it fires. */
export const ORGAN: Readonly<Record<EnemyWeapon, string>> = {
  none: '#ffffff', single: '#ffe27a', aimed: '#ffe27a', spread3: '#ff7ad9', missile: '#ff5a4a', flak: '#9aff8a', ring: '#c8ff6a', ray: '#ff6a3a',
};

/** A sea monster's weak point in the shared style (the fallback when a boss has no mount of its own). */
export function organPart(ctx: Ctx, r: number, weapon: EnemyWeapon, p: Pal): void {
  ring(ctx, 0, 0, r, p.dark, p.line);
  if (p.mono) return;
  circle(ctx, 0, 0, r * 0.62, ORGAN[weapon]);
  circle(ctx, -r * 0.2, -r * 0.2, r * 0.22, 'rgba(255,255,255,0.7)');
}

/** The live palette for moving parts: the boss's own, or one colour while it flashes. */
export const liveOf = (id: Map5Boss, p: Pal): SeaPal => (p.mono ? seaMono(p.body) : SEA_5[id]);

/** The static hull through the cache, in the variant the palette asks for. */
export function cachedHull(ctx: Ctx, id: Map5Boss, p: Pal, paint: (g: Ctx, a: SeaPal) => void): void {
  drawCached(ctx, `boss5-${id}`, BOSS_BOX_5[id], (g) => paint(g, SEA_5[id]), variantOf(p));
}
