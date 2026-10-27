import type { PlaneId } from '../data/types';
import type { LiveryId } from '../data/liveries';
import { drawCamo, noseBand, rayZones, showStripes, tigerZones, tipBands, trimLines } from './planes/livery-patterns';
import type { Surface } from './planes/surface';

/**
 * How each paint job looks (doc 09). A Look is shared by all three jets; the airframe supplies the
 * geometry (a Surface: outline clip, nose band, wingtips, tails, stripe curves) and paintSurface() lays the
 * livery onto it. No insignia, text or logos — generic scheme types only.
 */

export type CamoKind = 'blobs' | 'splinter';

export interface Camo {
  kind: CamoKind;
  colors: readonly string[];
  cover: readonly number[]; // share of cells that get each colour
  size: number; // multiplier on the surface's cell size
  seed: number;
}

export type TailKind = 'none' | 'solid' | 'band' | 'chevrons' | 'skull' | 'rays' | 'tiger' | 'gold' | 'sweep';

export interface TailArt {
  kind: TailKind;
  color: string; // fin base
  mark: string; // chevrons / bones / rays / stripes / band
  mark2: string;
}

export interface Look {
  base: string; // upper surfaces
  under: string; // lower surfaces (side view)
  twoTone: string | null; // darker area of a two-tone factory scheme
  radome: string | null;
  camo: Camo | null;
  tail: TailArt;
  band: { kind: 'solid' | 'diagonal'; colors: readonly [string, string] } | null;
  tips: readonly string[]; // wingtip bands, outermost first
  tiger: readonly [string, string] | null; // orange, black over nose / wingtips / tails
  rays: readonly [string, string] | null; // sunburst rays on the stabilators (top view)
  stabs: string | null; // stabilator colour (top view) for liveries with coloured tails
  stripes: readonly string[] | null; // show stripes, widest first
  trim: string | null; // pinstripes
  ink: string; // outline
  panel: string; // panel lines
  gloss: number; // highlight strength
  swatch: readonly [string, string, string];
}

const NO_TAIL: TailArt = { kind: 'none', color: '', mark: '', mark2: '' };
const tail = (kind: TailKind, color: string, mark = '', mark2 = ''): TailArt => ({ kind, color, mark, mark2 });

const look = (base: string, swatch: readonly [string, string, string], extra: Partial<Look>): Look => ({
  base, under: base, twoTone: null, radome: null, camo: null, tail: NO_TAIL, band: null, tips: [], tiger: null,
  rays: null, stabs: null, stripes: null, trim: null, ink: 'rgba(18,24,32,0.55)', panel: 'rgba(18,24,32,0.26)', gloss: 1, swatch, ...extra,
});

const STANDARD_SWATCH = ['#b3bdc6', '#8a96a2', '#262a31'] as const;

/** Factory schemes, one per jet (doc 09: F-16 two-tone gray, F-14 low-vis gray + yellow tail, SR-71 black). */
const STANDARD: Readonly<Record<PlaneId, Look>> = {
  f16: look('#b3bdc6', STANDARD_SWATCH, { under: '#c8d0d7', twoTone: '#8b97a3', radome: '#99a3ad' }),
  f14: look('#a9b3bd', STANDARD_SWATCH, {
    under: '#c4ccd3', twoTone: '#9aa5b0', radome: '#949ea8', tail: tail('band', '#a9b3bd', '#e8c01c'),
  }),
  sr71: look('#262a31', STANDARD_SWATCH, {
    under: '#22252b', ink: 'rgba(0,0,0,0.75)', panel: 'rgba(150,165,185,0.16)', gloss: 0.9,
  }),
  // Map-2 jets (doc 36): A-10 two-tone grey, F-35 dark radar grey, Tornado grey-green splinter — no insignia.
  a10: look('#8c959c', STANDARD_SWATCH, { under: '#9ba3a9', twoTone: '#737c84', radome: '#7c858c', gloss: 0.6 }),
  f35: look('#6a7178', STANDARD_SWATCH, {
    under: '#646b72', twoTone: '#5a6067', radome: '#5f656c', ink: 'rgba(12,16,20,0.6)', panel: 'rgba(12,16,20,0.2)', gloss: 0.45,
  }),
  tornado: look('#6d7259', STANDARD_SWATCH, {
    under: '#8f9499', camo: { kind: 'splinter', colors: ['#3d4136', '#56654b'], cover: [0.34, 0.3], size: 1.2, seed: 41 },
    ink: 'rgba(14,16,12,0.6)', panel: 'rgba(14,16,12,0.24)', gloss: 0.55,
  }),
};

const DARK_PANEL = 'rgba(200,210,200,0.12)';

/** Map 2 (doc 09, Second Front wave 4): a region camo per theater and its 3★ reward. Generic schemes, no insignia. */
const MAP2_LOOKS = {
  seagrey: look('#7d8a8e', ['#7d8a8e', '#5b686e', '#97a3a3'], {
    under: '#a9b3b5', camo: { kind: 'blobs', colors: ['#5b686e', '#8f9f98'], cover: [0.36, 0.3], size: 1.1, seed: 53 },
    ink: 'rgba(20,28,32,0.55)', panel: 'rgba(20,28,32,0.22)', gloss: 0.7,
  }),
  deepblue: look('#1e3556', ['#1e3556', '#f2f2ee', '#d6ad45'], {
    under: '#2a456b', tips: ['#f2f2ee'], trim: '#d6ad45', tail: tail('band', '#1e3556', '#f2f2ee'),
    ink: 'rgba(5,10,20,0.7)', panel: 'rgba(200,215,235,0.14)', gloss: 1.5,
  }),
  snowrock: look('#e8ebee', ['#e8ebee', '#8c8478', '#b9bcc0'], {
    camo: { kind: 'splinter', colors: ['#8c8478', '#b9bcc0'], cover: [0.3, 0.32], size: 1.2, seed: 61 },
    ink: 'rgba(40,40,44,0.55)', panel: 'rgba(40,40,44,0.2)', gloss: 0.7,
  }),
  polarred: look('#f1f3f4', ['#f1f3f4', '#e2452b', '#b9bfc6'], {
    tips: ['#e2452b'], band: { kind: 'solid', colors: ['#e2452b', '#e2452b'] }, stabs: '#e2452b', tail: tail('solid', '#e2452b'),
    ink: 'rgba(40,44,50,0.5)', panel: 'rgba(40,44,50,0.18)', gloss: 1.3,
  }),
  jungle: look('#7a6b4e', ['#7a6b4e', '#3d5a32', '#5c7341'], {
    under: '#9a8f78', camo: { kind: 'blobs', colors: ['#3d5a32', '#5c7341'], cover: [0.38, 0.34], size: 1.1, seed: 71 },
    ink: 'rgba(16,20,10,0.6)', panel: 'rgba(16,20,10,0.22)', gloss: 0.55,
  }),
  emerald: look('#1f6b4a', ['#1f6b4a', '#d6ad45', '#8a6a1f'], {
    trim: '#d6ad45', tail: tail('gold', '#d6ad45', '#8a6a1f'), ink: 'rgba(8,30,20,0.7)', panel: 'rgba(214,230,200,0.14)', gloss: 1.6,
  }),
  nightops: look('#2f3846', ['#2f3846', '#232a35', '#3e4858'], {
    camo: { kind: 'splinter', colors: ['#232a35', '#3e4858'], cover: [0.36, 0.3], size: 1.15, seed: 83 },
    ink: 'rgba(0,0,0,0.7)', panel: 'rgba(170,185,205,0.12)', gloss: 0.5,
  }),
  nighthawk: look('#16181c', ['#16181c', '#3a3f46', '#5b636e'], {
    stripes: ['#3a3f46'], tail: tail('chevrons', '#16181c', '#3a3f46'), ink: 'rgba(0,0,0,0.8)', panel: DARK_PANEL, gloss: 0.4,
  }),
  stormgrey: look('#5d6670', ['#5d6670', '#4a525b', '#a3242c'], {
    under: '#7d868f', twoTone: '#4a525b', tail: tail('band', '#5d6670', '#a3242c'), ink: 'rgba(10,12,16,0.6)', gloss: 0.6,
  }),
  legend: look('#c9ced4', ['#c9ced4', '#d6ad45', '#f2e6b8'], {
    stripes: ['#d6ad45', '#f2e6b8'], tail: tail('sweep', '#c9ced4', '#d6ad45', '#8a6a1f'), trim: '#d6ad45',
    ink: 'rgba(60,64,70,0.6)', panel: 'rgba(60,64,70,0.18)', gloss: 1.9,
  }),
} satisfies Record<string, Look>;

const LOOKS: Readonly<Record<Exclude<LiveryId, 'standard'>, Look>> = {
  gullgray: look('#c3c4bb', ['#c3c4bb', '#f2f2ee', '#c62828'], {
    under: '#f2f2ee', tail: tail('chevrons', '#c62828', '#f5f5f0'), tips: ['#d23a2a', '#f3c21d', '#d23a2a'],
    ink: 'rgba(30,32,36,0.5)', panel: 'rgba(30,32,36,0.2)', gloss: 1.6,
  }),
  blackflag: look('#8e969d', ['#8e969d', '#121315', '#f2c21b'], {
    under: '#b3bac0', tail: tail('skull', '#121315', '#f2f2ee'), stabs: '#121315', band: { kind: 'diagonal', colors: ['#f2c21b', '#121315'] },
  }),
  desert: look('#ccb07d', ['#ccb07d', '#b08c58', '#86643f'], {
    under: '#d8c59e', camo: { kind: 'blobs', colors: ['#86643f', '#b08c58'], cover: [0.3, 0.32], size: 1, seed: 11 },
    ink: 'rgba(50,38,20,0.55)', panel: 'rgba(60,45,25,0.24)', gloss: 0.6,
  }),
  sunburst: look('#bcc4cb', ['#bcc4cb', '#f08a24', '#d6281f'], {
    under: '#d6dce1', tail: tail('rays', '#f3a23a', '#d6281f', '#f07a1e'), band: { kind: 'solid', colors: ['#d6281f', '#d6281f'] },
    rays: ['#f3a23a', '#d6281f'], gloss: 1.2,
  }),
  arctic: look('#eef2f5', ['#eef2f5', '#b5bfc8', '#a3c3dc'], {
    camo: { kind: 'splinter', colors: ['#b5bfc8', '#a3c3dc'], cover: [0.36, 0.34], size: 1.1, seed: 23 },
    ink: 'rgba(40,55,70,0.5)', panel: 'rgba(40,55,70,0.2)', gloss: 0.7,
  }),
  aggressor: look('#8193a8', ['#8193a8', '#4d6d9c', '#2a3d66'], {
    under: '#a9b7c6', camo: { kind: 'splinter', colors: ['#2a3d66', '#4d6d9c'], cover: [0.38, 0.36], size: 1.15, seed: 37 },
    ink: 'rgba(15,22,38,0.6)', panel: 'rgba(15,22,38,0.24)', gloss: 0.8,
  }),
  woodland: look('#3f4d37', ['#3f4d37', '#4b4f53', '#2e3829'], {
    camo: { kind: 'blobs', colors: ['#4b4f53', '#2e3829'], cover: [0.42, 0.2], size: 1.3, seed: 5 },
    ink: 'rgba(8,12,8,0.65)', panel: DARK_PANEL, gloss: 0.55,
  }),
  tiger: look('#959ea6', ['#959ea6', '#ef8a1d', '#151515'], {
    under: '#b9c0c6', tail: tail('tiger', '#ef8a1d', '#151515'), tiger: ['#ef8a1d', '#151515'],
  }),
  airshow: look('#f4f5f7', ['#f4f5f7', '#c8102e', '#1d3f8f'], {
    tail: tail('sweep', '#f4f5f7', '#c8102e', '#1d3f8f'), stripes: ['#c8102e', '#f4f5f7', '#1d3f8f'], tips: ['#1d3f8f'],
    ink: 'rgba(30,40,60,0.5)', panel: 'rgba(30,40,60,0.17)', gloss: 1.5,
  }),
  blackgold: look('#15161a', ['#15161a', '#d6ad45', '#8a6a1f'], {
    tail: tail('gold', '#d6ad45', '#8a6a1f'), stabs: '#d6ad45', trim: '#d6ad45', ink: 'rgba(120,95,35,0.8)', panel: 'rgba(214,173,69,0.14)', gloss: 1.7,
  }),
  ...MAP2_LOOKS,
};

export function liveryLook(plane: PlaneId, livery: LiveryId): Look {
  return livery === 'standard' ? STANDARD[plane] : LOOKS[livery];
}

/** Three representative colours for the hangar's livery list. */
export function liverySwatch(id: LiveryId): readonly [string, string, string] {
  return id === 'standard' ? STANDARD_SWATCH : LOOKS[id].swatch;
}

/** Lays the livery onto a surface. The caller has already clipped to `s.clip`. */
export function paintSurface(ctx: CanvasRenderingContext2D, l: Look, s: Surface): void {
  ctx.fillStyle = l.base;
  ctx.fill(s.clip);
  if (s.under && l.under !== l.base) {
    ctx.fillStyle = l.under;
    ctx.fill(s.under);
  }
  if (s.twoTone && l.twoTone) {
    ctx.fillStyle = l.twoTone;
    ctx.fill(s.twoTone);
    const a = ctx.globalAlpha;
    ctx.globalAlpha = a * 0.45;
    ctx.strokeStyle = l.twoTone;
    ctx.lineWidth = s.cell * 0.18;
    ctx.stroke(s.twoTone);
    ctx.globalAlpha = a;
  }
  if (l.camo) drawCamo(ctx, l.camo, s);
  if (l.radome && s.radome) {
    ctx.fillStyle = l.radome;
    ctx.fill(s.radome);
  }
  if (l.tiger) tigerZones(ctx, l.tiger, s);
  if (l.rays && s.tails) rayZones(ctx, l.rays, s.tails);
  if (l.stabs && s.tails) {
    ctx.fillStyle = l.stabs;
    for (const z of s.tails) ctx.fillRect(z.x, z.y, z.w, z.h);
  }
  if (l.tips.length > 0 && s.tips) tipBands(ctx, l.tips, s.tips);
  if (l.band && s.band) noseBand(ctx, l.band.kind, l.band.colors, s.band);
  if (l.stripes && s.stripes) showStripes(ctx, l.stripes, s.stripes, s.cell);
  if (l.trim && s.trim) trimLines(ctx, l.trim, s.trim, s.cell);
}
