import type { BossId } from '../data/types';
import type { BossDrawState } from './draw-bosses';
import type { Pal } from './draw-ground-units';
import { bossPal } from './bosses-2';
import { drawCached, variantOf, type Box } from './detail/sprite';
import { jungleMono, type JunglePal } from './enemies/jungle-pal';

// Map 6's bosses in detail (docs 81, 118), in data/bosses-6.ts's local coordinates, fronts down (+y): their palettes,
// warning lights, the boxes of their cached hulls and the helpers the hulls share — the static hull is painted once per
// palette variant through the sprite cache (the flash is its one-colour version), the moving parts live. The hulls:
// RAVAGER and SENTINEL in bosses-6a.ts, MANTIS and the HIVE QUEEN in bosses-6b.ts, BASILISK and the registry in
// bosses-6c.ts; their parts are the jungle's own mounts (boss-mounts-6.ts). RAVAGER and SENTINEL are machines; MANTIS,
// BASILISK and the HIVE QUEEN are creatures whose weak points are organs.

type Ctx = CanvasRenderingContext2D;
export type HullFn = (ctx: Ctx, p: Pal, s: BossDrawState) => void;
export type Map6Boss = 'ravager' | 'mantis' | 'basilisk' | 'sentinel' | 'queen';

export const PALS_6: Readonly<Record<Map6Boss, Pal>> = {
  ravager: bossPal('#6a6a46', '#3a3a24', '#909066', '#c84a2a', '#ff6a3a'),
  mantis: bossPal('#5a9a3a', '#2e5a1e', '#9ad06a', '#e8d84a', '#ff5a3a'),
  basilisk: bossPal('#4a5a3a', '#26301c', '#7a8a5a', '#c8a040', '#ffd23a'),
  sentinel: bossPal('#8a8a7a', '#55554a', '#b8b8a4', '#4a8a3a', '#5affd0'),
  queen: bossPal('#6a3a5a', '#3a1e32', '#a06a90', '#ff7ad2', '#ffb0e8'),
};

export const LIGHTS_6: Readonly<Record<Map6Boss, readonly number[]>> = {
  ravager: [-40, 40, 40, 40, 0, -50, -80, 50, 80, 50],
  mantis: [0, 62, -20, -30, 20, -30, 0, -110],
  basilisk: [-14, 130, 14, 130, 0, 30, 0, -60],
  sentinel: [0, 24, -40, -40, 40, -40, 0, -90],
  queen: [-14, 118, 14, 118, 0, -80, -60, -100, 60, -100],
};

/** The creature bosses: their parts are organs. */
export const ORGANIC_6: readonly BossId[] = ['mantis', 'basilisk', 'queen'];

/** Half extents of each cached hull: they cover every hitbox and part (tested). */
export const BOSS_BOX_6: Readonly<Record<Map6Boss, Box>> = {
  ravager: [110, 106], mantis: [100, 160], basilisk: [70, 172], sentinel: [130, 122], queen: [128, 184],
};

const jp = (p: Pal, extra: Partial<JunglePal>): JunglePal => ({
  mono: false, body: p.body, dark: p.dark, light: p.light, trim: p.trim, glow: p.glass, core: '#fff6dc', metal: '#4a4a3e',
  bone: '#e8dcc0', skin: p.dark, glass: '#7fd0ff', ink: 'rgba(14,16,10,0.88)', ...extra,
});

/** The hulls' own palettes (the boss colours in the jungle's detail palette). */
export const JUNGLE_6: Readonly<Record<Map6Boss, JunglePal>> = {
  ravager: jp(PALS_6.ravager, { metal: '#4e4e40' }),
  mantis: jp(PALS_6.mantis, { skin: '#c8ffc8', bone: '#f0f4c8' }),
  basilisk: jp(PALS_6.basilisk, { skin: '#3a5a20' }),
  sentinel: jp(PALS_6.sentinel, { metal: '#6a6a5c', core: '#e8fff8' }),
  queen: jp(PALS_6.queen, { skin: '#ffc8f0', core: '#ffffff' }),
};

/** The live palette for moving parts: the boss's own, or one colour while it flashes. */
export const liveOf = (id: Map6Boss, p: Pal): JunglePal => (p.mono ? jungleMono(p.body) : JUNGLE_6[id]);

/** The static hull through the cache, in the variant the palette asks for. */
export function cachedHull(ctx: Ctx, id: Map6Boss, p: Pal, paint: (g: Ctx, a: JunglePal) => void): void {
  drawCached(ctx, `boss6-${id}`, BOSS_BOX_6[id], (g) => paint(g, JUNGLE_6[id]), variantOf(p));
}
