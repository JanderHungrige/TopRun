import type { Box } from '../detail/sprite';
import type { DetailArt } from '../detail/unit';

// Space's fleet in detail (doc 119): the world's palette — plated hulls in each kind's grey, bare metal for barrels and
// engine bells, sky-blue cockpit glass, blue-white engine light, the kind's accent paint — per kind, its one-colour
// version for the flash and the shadow, and the half extents of each kind's cached body (exhausts, turrets that aim and
// blinking lights are drawn live around it).

export interface ShipPal {
  mono: boolean;
  hull: string;
  dark: string;
  light: string;
  /** The kind's accent paint: stripes, wing tips, missile bands. */
  trim: string;
  /** Bare metal: barrels, engine bells, greebles. */
  metal: string;
  glass: string;
  /** The engines' light (plumes, hot throats). */
  engine: string;
  /** Solar cells. */
  cell: string;
  ink: string;
}

export const shipMono = (c: string): ShipPal =>
  ({ mono: true, hull: c, dark: c, light: c, trim: c, metal: c, glass: c, engine: c, cell: c, ink: c });

const pal = (hull: string, dark: string, light: string, trim: string, extra: Partial<ShipPal> = {}): ShipPal => ({
  mono: false, hull, dark, light, trim, metal: '#5e6474', glass: '#7fd0ff', engine: '#78beff', cell: '#24407a',
  ink: 'rgba(8,10,16,0.88)', ...extra,
});

export type SpaceKind = 'raider' | 'satgun' | 'corvette' | 'interceptor' | 'gunship' | 'battery' | 'warden';

/** The kinds' colours: the hulls and accents of draw-enemies' space palettes. */
export const SPACE_PAL: Readonly<Record<SpaceKind, ShipPal>> = {
  raider: pal('#8a93a6', '#3a4152', '#b9c1d2', '#c84a3a'),
  satgun: pal('#a7adb8', '#4e5462', '#d2d6de', '#5b7cff'),
  corvette: pal('#7b8496', '#3c4352', '#a8b0c0', '#c84a3a'),
  interceptor: pal('#6f7890', '#2f3546', '#a3abc0', '#e8a43a'),
  gunship: pal('#868a7e', '#46493f', '#b0b4a6', '#c84a3a', { metal: '#5a5c56' }),
  battery: pal('#9a9ca2', '#55575e', '#c6c8cd', '#4f8cff', { metal: '#62646c' }),
  warden: pal('#6c7488', '#343a4a', '#98a0b4', '#ff5a6a'),
};

/** Half extents of each kind's cached body around its centre (tested against the hit radii). */
export const SPACE_BOX: Readonly<Record<SpaceKind, Box>> = {
  raider: [17, 18], satgun: [26, 13], corvette: [26, 48], interceptor: [18, 21], gunship: [31, 32], battery: [20, 20],
  warden: [46, 66],
};

/** A kind's art from its palette and box. */
export const shipArt = (kind: SpaceKind, a: Pick<DetailArt<ShipPal>, 'body' | 'under' | 'over'>): DetailArt<ShipPal> =>
  ({ pal: SPACE_PAL[kind], mono: shipMono, box: SPACE_BOX[kind], ...a });
