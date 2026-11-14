import type { BossId } from '../data/types';
import type { BossDrawState } from './draw-bosses';
import type { Pal } from './draw-ground-units';
import { bossPal } from './bosses-2';
import { drawCached, variantOf, type Box } from './detail/sprite';
import { alienMono, type AlienPal } from './enemies/steppe-pal';

// Map 7's bosses in detail (docs 105, 116), in data/bosses-7.ts's local coordinates, fronts down (+y): their palettes,
// warning lights, the boxes of their cached hulls and the helpers the hulls share — the static hull is painted once per
// palette variant through the sprite cache (the flash is its one-colour version), the moving parts live. The hulls:
// HARVESTER and LONGSHANKS in bosses-7a.ts, JUGGERNAUT, DREADNOUGHT and the MOTHERSHIP in bosses-7b.ts; the guns are
// the alien mounts of boss-mounts.ts.

type Ctx = CanvasRenderingContext2D;
export type HullFn = (ctx: Ctx, p: Pal, s: BossDrawState) => void;
export type Map7Boss = 'harvester' | 'longshanks' | 'juggernaut' | 'dreadnought' | 'mothership';

export const PALS_7: Readonly<Record<Map7Boss, Pal>> = {
  harvester: bossPal('#7a6a4a', '#463a26', '#a8986e', '#3ad8c8', '#ff4ad8'),
  longshanks: bossPal('#6a6478', '#2e2a38', '#a8a2b8', '#3ad8c8', '#ff6a3a'),
  juggernaut: bossPal('#6a5a4a', '#3a2e24', '#9a8a72', '#c84a2a', '#ffb03a'),
  dreadnought: bossPal('#5a5a6e', '#2a2a3a', '#9090a8', '#3ad8c8', '#ff4ad8'),
  mothership: bossPal('#6a6a80', '#2c2c40', '#b0b0c8', '#3ad8c8', '#ff4ad8'),
};

/** The hulls' own palettes (the faction's look in each boss's colours). */
export const ALIEN_7: Readonly<Record<Map7Boss, AlienPal>> = Object.fromEntries(Object.entries(PALS_7).map(([id, p]) => [id, {
  mono: false, shell: p.body, dark: p.dark, light: p.light, under: p.dark, trim: '#3ad8c8', glow: p.glass, core: '#ffe0f8',
  metal: '#5c5a6a', hide: p.body, ink: 'rgba(16,10,22,0.88)',
}])) as Record<Map7Boss, AlienPal>;

export const LIGHTS_7: Readonly<Record<Map7Boss, readonly number[]>> = {
  harvester: [-50, 50, 50, 50, 0, -60, -60, -20, 60, -20],
  longshanks: [0, 40, -40, -20, 40, -20, 0, -50],
  juggernaut: [-20, 110, 20, 110, 0, -40, 0, -120],
  dreadnought: [-140, 0, 140, 0, 0, 80, 0, -90, -60, -40, 60, -40],
  mothership: [-90, -60, 90, -60, -90, 60, 90, 60, 0, -110, 0, 100],
};

/** Half extents of each cached hull: they cover every hitbox and part (tested). */
export const BOSS_BOX_7: Readonly<Record<Map7Boss, Box>> = {
  harvester: [130, 112], longshanks: [90, 92], juggernaut: [72, 168], dreadnought: [144, 120], mothership: [162, 122],
};

/** The beast boss: its parts are organs. */
export const ORGANIC_7: readonly BossId[] = ['juggernaut'];

/** The live palette for moving parts: the boss's own, or one colour while it flashes. */
export const liveOf = (id: Map7Boss, p: Pal): AlienPal => (p.mono ? alienMono(p.body) : ALIEN_7[id]);

/** The static hull through the cache, in the variant the palette asks for. */
export function cachedHull(ctx: Ctx, id: Map7Boss, p: Pal, paint: (g: Ctx, a: AlienPal) => void): void {
  drawCached(ctx, `boss7-${id}`, BOSS_BOX_7[id], (g) => paint(g, ALIEN_7[id]), variantOf(p));
}

