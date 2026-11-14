import type { ShellInk } from '../detail/organic';
import type { Box } from '../detail/sprite';
import type { DetailArt } from '../detail/unit';

// The jungle planet's enemies in detail (doc 117): each kind keeps its own colours — olive war machines with red-orange
// lamps, green and amber hides, pink jaws, violet spore flesh, teal rays — as a world palette per kind, its one-colour
// version for the flash and the shadow, and the half extents of each kind's cached body (legs, wings, tails, turrets
// and whatever breathes or turns are drawn live around it).

export interface JunglePal {
  mono: boolean;
  /** The hide, shell or armour. */
  body: string;
  dark: string;
  light: string;
  /** Stripes, markings, mandibles, crests. */
  trim: string;
  /** What glows: lamps, eyes, spores, acid, crystal. */
  glow: string;
  /** The hot centre of the glow. */
  core: string;
  /** Gun metal, struts, hydraulics. */
  metal: string;
  /** Horn, teeth, claws, beaks. */
  bone: string;
  /** Secondary flesh: leaves, wing membranes, throat sacs. */
  skin: string;
  /** Canopies and lenses. */
  glass: string;
  ink: string;
}

export const jungleMono = (c: string): JunglePal => ({
  mono: true, body: c, dark: c, light: c, trim: c, glow: c, core: c, metal: c, bone: c, skin: c, glass: c, ink: c,
});

const pal = (body: string, dark: string, light: string, trim: string, glow: string, extra: Partial<JunglePal> = {}): JunglePal => ({
  mono: false, body, dark, light, trim, glow, core: '#fff6dc', metal: '#4a4c42', bone: '#e8dcc0', skin: dark, glass: '#7fd0ff',
  ink: 'rgba(14,16,10,0.88)', ...extra,
});

export type JungleKind =
  | 'walker' | 'brute' | 'hovertank' | 'artillery' | 'gundrone' | 'dropship'
  | 'raptor' | 'beetle' | 'spitter' | 'wasp'
  | 'sporepod' | 'lasher' | 'rhino' | 'toad' | 'spire' | 'totem' | 'lurker'
  | 'glider' | 'leatherwing' | 'dragonfly' | 'balloon' | 'skyjelly';

export const JUNGLE_PAL: Readonly<Record<JungleKind, JunglePal>> = {
  walker: pal('#6a6a48', '#3a3a26', '#9a9a70', '#4a4a32', '#ff6a3a', { metal: '#4e4e40' }),
  brute: pal('#5a5a3c', '#30301e', '#88885e', '#3a3a26', '#ff6a3a', { metal: '#46463a' }),
  hovertank: pal('#7a6a48', '#4a3e28', '#a8986e', '#2c2a20', '#ffb84a', { metal: '#3e3a30' }),
  artillery: pal('#6a6e52', '#3e4232', '#949876', '#2c2f24', '#ff9a3a', { metal: '#3c3e34', skin: '#8a7a52' }),
  gundrone: pal('#8a8e82', '#4a4e46', '#bcc0b4', '#5a5e56', '#ff3a2a', { metal: '#3e423c' }),
  dropship: pal('#6e7468', '#3c4038', '#a0a69a', '#c84a3a', '#ffb84a', { metal: '#4a4e46' }),
  raptor: pal('#7a8a3a', '#3e4c1a', '#b4c46a', '#3a4a1a', '#ffd23a', { skin: '#c8c88a' }),
  beetle: pal('#3a4a5a', '#16202a', '#7a9ab0', '#c8a040', '#ff8a3a', { metal: '#2a3440' }),
  spitter: pal('#c84a7a', '#6a1e3e', '#ff8ab0', '#2e5a1e', '#ff3a3a', { skin: '#4a7a2a', bone: '#fff4d0' }),
  wasp: pal('#d8b030', '#5a4a10', '#f6e080', '#1e1e0c', '#ff3a2a', { skin: '#dcf0ff' }),
  sporepod: pal('#8a6a9a', '#3e2a4a', '#c8a8d8', '#d8b0e8', '#dcff78', { core: '#f8ffe0', skin: '#5a3e66' }),
  lasher: pal('#5a8a3a', '#2a4a1a', '#a8d080', '#c8312a', '#ff4a3a', { skin: '#3a1018', bone: '#f4ead0' }),
  rhino: pal('#6a6058', '#342e28', '#a29890', '#4a443e', '#ff5a3a', { bone: '#e8dcc0' }),
  toad: pal('#5a7a3a', '#2e421a', '#a8c070', '#d8c040', '#9aff3a', { core: '#f0ffd0', skin: '#c8b070' }),
  spire: pal('#7a4a6a', '#3a1e30', '#c890b0', '#5a3048', '#ff78d2', { core: '#ffe0f4', skin: '#e8c8a8' }),
  totem: pal('#8a8670', '#4a483a', '#c8c4a8', '#4ad8ff', '#a8f4ff', { core: '#ffffff', skin: '#4a7a2a' }),
  lurker: pal('#4a5a48', '#232c26', '#7e8e76', '#5a6a40', '#e8d040', { skin: '#3a5a5a' }),
  glider: pal('#3a6a7a', '#1a343e', '#7ab0c0', '#2a4a54', '#7affe8', { core: '#e8fffa', skin: '#2e5a68' }),
  leatherwing: pal('#8a5a3a', '#44281a', '#c8a080', '#e8d0a0', '#ffd23a', { skin: '#7a4a32' }),
  dragonfly: pal('#2a8a6a', '#12483a', '#7ae0b8', '#e8c040', '#ff5a3a', { skin: '#c8f0ff' }),
  balloon: pal('#b8a060', '#6a5a30', '#e8d8a0', '#8a6a3a', '#c8ff5a', { core: '#f4ffd8', skin: '#d8c890' }),
  skyjelly: pal('#f0a8d8', '#a85090', '#ffe0f4', '#ff7ad2', '#aafffa', { core: '#ffffff', skin: '#e878c8' }),
};

/** Half extents of each kind's cached body; its larger side lies between 0.6 and 1.7 hit radii (tested). */
export const JUNGLE_BOX: Readonly<Record<JungleKind, Box>> = {
  walker: [12.5, 6], brute: [35, 16], hovertank: [14, 18], artillery: [18, 18], gundrone: [15, 15], dropship: [31, 31],
  raptor: [7.5, 20], beetle: [16.5, 23], spitter: [15, 15], wasp: [5.5, 18.5],
  sporepod: [12, 12], lasher: [14, 14], rhino: [19, 34.5], toad: [15.5, 15.5], spire: [21, 21], totem: [18, 18], lurker: [12.5, 19.5],
  glider: [12, 15], leatherwing: [5, 19], dragonfly: [5, 21.5], balloon: [17, 18], skyjelly: [18.5, 18.5],
};

/** A kind's art from its palette and box. */
export const art = (kind: JungleKind, a: Pick<DetailArt<JunglePal>, 'body' | 'under' | 'over'>): DetailArt<JunglePal> =>
  ({ pal: JUNGLE_PAL[kind], mono: jungleMono, box: JUNGLE_BOX[kind], ...a });

/** The colours of a palette for the organic painters: the hide, the metal, a darker or lighter step. */
export const hide = (p: JunglePal): ShellInk => ({ base: p.body, dark: p.dark, light: p.light, ink: p.ink });
export const metal = (p: JunglePal): ShellInk => ({ base: p.metal, dark: p.mono ? p.metal : '#1e1f1a', light: p.mono ? p.metal : '#8a8c80', ink: p.ink });
export const darkHide = (p: JunglePal): ShellInk => ({ base: p.dark, dark: p.mono ? p.dark : '#0e120a', light: p.body, ink: p.ink });
export const bone = (p: JunglePal): ShellInk => ({ base: p.bone, dark: p.mono ? p.bone : '#8a7a5a', light: p.mono ? p.bone : '#fffaf0', ink: p.ink });
export const skin = (p: JunglePal): ShellInk => ({ base: p.skin, dark: p.dark, light: p.light, ink: p.ink });
export const trimInk = (p: JunglePal): ShellInk => ({ base: p.trim, dark: p.dark, light: p.light, ink: p.ink });
