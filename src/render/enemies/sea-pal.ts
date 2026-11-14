import type { ShellInk } from '../detail/organic';
import type { Box } from '../detail/sprite';

// Under the sea in detail (doc 120): the world's palette — each kind's paint, hide or shell with its shade and lit side,
// an accent, the fittings (bronze screws, gun metal), glass and the light it gives (lamps, bioluminescence) — its
// one-colour version for the flash and the shadow, and the half extents of each kind's cached body (screws, fins,
// tentacles and swimming bodies are drawn live around it).

export interface SeaPal {
  mono: boolean;
  /** The body: paint, hide or shell. */
  hull: string;
  dark: string;
  light: string;
  /** Accent: bands, stripes, anti-fouling, spots. */
  trim: string;
  /** Fittings: screws, rails, barrels, teeth. */
  metal: string;
  /** Portholes, lenses, eyes. */
  glass: string;
  /** The light it gives: lamps, sparks, bioluminescence. */
  glow: string;
  ink: string;
}

export const seaMono = (c: string): SeaPal =>
  ({ mono: true, hull: c, dark: c, light: c, trim: c, metal: c, glass: c, glow: c, ink: c });

const INK = 'rgba(6,14,20,0.88)';

const pal = (hull: string, dark: string, light: string, trim: string, extra: Partial<SeaPal> = {}): SeaPal => ({
  mono: false, hull, dark, light, trim, metal: '#b08a4a', glass: '#7fd0ff', glow: '#ffe27a', ink: INK, ...extra,
});

export type SeaKind =
  | 'minisub' | 'seadrone' | 'seamine' | 'seaturret' | 'jelly' | 'eel' | 'hunter'
  | 'torpboat' | 'squid' | 'crab' | 'sealab' | 'angler' | 'boomer';

export const SEA_PAL: Readonly<Record<SeaKind, SeaPal>> = {
  minisub: pal('#4c5a5e', '#2a3336', '#7e9094', '#e8c040', { glass: '#ffe27a' }),
  seadrone: pal('#e0b83a', '#7a6420', '#f6e08a', '#c8312a', { metal: '#5a6066', glow: '#7fd0ff' }),
  seamine: pal('#2b2f33', '#121518', '#5a6168', '#7a5034', { metal: '#5a5f64', glass: '#ff3a2a', glow: '#ff4a3a' }),
  seaturret: pal('#6f7a7c', '#3a4244', '#a4b0b2', '#5a5040', { metal: '#4a5254', glass: '#7ff0ff', glow: '#7ff0ff' }),
  jelly: pal('#e88ac0', '#a85088', '#ffd0ea', '#ff5aaa', { metal: '#c86aa8', glass: '#ffe0f4', glow: '#ff7ac8' }),
  eel: pal('#5a6a3a', '#2e3a1e', '#c8c89a', '#3a4a26', { metal: '#8a9a5a', glass: '#ffe27a', glow: '#9ae8ff' }),
  hunter: pal('#3c4652', '#222a32', '#647484', '#ff5a4a', { metal: '#a88a50', glow: '#ff5a4a' }),
  torpboat: pal('#2a3038', '#14181e', '#4e5862', '#8a3a2a', { glow: '#f0faff' }),
  squid: pal('#e8c8c0', '#b07870', '#fff0ea', '#a85a50', { metal: '#d89a8c', glass: '#1a1a22', glow: '#ffb0a0' }),
  crab: pal('#a8503a', '#6a2a1e', '#d88a68', '#3a2a20', { metal: '#f0d8b0', glass: '#1a1210', glow: '#ffd27a' }),
  sealab: pal('#8a96a0', '#4a545c', '#c0ccd4', '#3d454b', { metal: '#5a646c', glass: '#ffd27a', glow: '#ffd27a' }),
  angler: pal('#3a3448', '#1e1a28', '#8a80a0', '#2a2438', { metal: '#e8e8f0', glass: '#c8e8ff', glow: '#5ff0e0' }),
  boomer: pal('#3a4248', '#20262c', '#5e6a72', '#c8312a', { metal: '#a88a50', glow: '#ff5a4a' }),
};

/** Half extents of each kind's cached body around its centre (sized to the hit radius, tested). */
export const SEA_BOX: Readonly<Record<SeaKind, Box>> = {
  minisub: [11, 23], seadrone: [7, 14], seamine: [15, 23], seaturret: [18, 16], jelly: [12, 12], eel: [8, 24],
  hunter: [13, 29], torpboat: [12, 31], squid: [8, 16], crab: [17, 32], sealab: [33, 22], angler: [15, 17],
  boomer: [25, 63],
};

/** "r,g,b" of a #rrggbb colour (for glows and translucent fills). Pure. */
export function rgb(hex: string): string {
  const n = Number.parseInt(hex.replace('#', '').slice(0, 6), 16);
  return Number.isFinite(n) ? `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}` : '0,0,0';
}

/** A colour of the palette at alpha a. */
export const rgba = (hex: string, a: number): string => `rgba(${rgb(hex)},${a.toFixed(3)})`;

/** The shell colours of a palette for the organic painters. */
export const hullInk = (p: SeaPal): ShellInk => ({ base: p.hull, dark: p.dark, light: p.light, ink: p.ink });
export const darkInk = (p: SeaPal): ShellInk => ({ base: p.dark, dark: p.mono ? p.dark : '#0a0e12', light: p.hull, ink: p.ink });
export const metalInk = (p: SeaPal): ShellInk => ({ base: p.metal, dark: p.dark, light: p.light, ink: p.ink });
