// Ladder flags (doc 28): small pixel flags drawn in code for the common countries; every other country shows a
// badge with its code. Simplified on purpose (a 20 × 13 flag has no room for coats of arms); five complex flags
// (US, GB, GR, AU, NZ) have their own painters in render/flags.ts. All sizes are fractions of the flag (3 : 2).

/** A simple shape on top of the bands, in flag units (0–1): a box, the disc or diamond inside it, or the hoist
 *  triangle (left edge to the point `w` across, mid-height). */
export interface FlagMark {
  shape: 'rect' | 'disc' | 'diamond' | 'hoist';
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type FlagSpec =
  | { kind: 'h' | 'v'; bands: readonly string[]; marks?: readonly FlagMark[] }
  | { kind: 'nordic'; field: string; cross: string; inner?: string }
  | { kind: 'painted' };

const W = '#ffffff';
const K = '#000000';
const rect = (color: string, x: number, y: number, w: number, h: number): FlagMark => ({ shape: 'rect', color, x, y, w, h });
/** A round disc of radius `r` (in flag heights) centred at (cx, cy); 3 : 2 makes it 2/3 as wide in flag units. */
const disc = (color: string, cx: number, cy: number, r: number): FlagMark =>
  ({ shape: 'disc', color, x: cx - (r * 2) / 3, y: cy - r, w: (r * 4) / 3, h: r * 2 });
const hoist = (color: string, w: number): FlagMark => ({ shape: 'hoist', color, x: 0, y: 0, w, h: 1 });
const h = (bands: readonly string[], marks?: readonly FlagMark[]): FlagSpec => ({ kind: 'h', bands, marks });
const v = (bands: readonly string[], marks?: readonly FlagMark[]): FlagSpec => ({ kind: 'v', bands, marks });
const nordic = (field: string, cross: string, inner?: string): FlagSpec => ({ kind: 'nordic', field, cross, inner });
const PAINTED: FlagSpec = { kind: 'painted' };

export const FLAGS: Readonly<Record<string, FlagSpec>> = Object.freeze({
  DE: h([K, '#dd0000', '#ffce00']),
  AT: h(['#ed2939', W, '#ed2939']),
  CH: h(['#da291c'], [rect(W, 0.42, 0.2, 0.16, 0.6), rect(W, 0.3, 0.4, 0.4, 0.2)]),
  LI: h(['#002b7f', '#ce1126']),
  NL: h(['#ae1c28', W, '#21468b']),
  LU: h(['#ef3340', W, '#00a3e0']),
  BE: v([K, '#fdda24', '#ef3340']),
  FR: v(['#0055a4', W, '#ef4135']),
  IT: v(['#009246', W, '#ce2b37']),
  IE: v(['#169b62', W, '#ff883e']),
  ES: h(['#aa151b', '#f1bf00', '#f1bf00', '#aa151b']),
  PT: v(['#046a38', '#da291c', '#da291c'], [disc('#ffe900', 0.4, 0.5, 0.18)]),
  GB: PAINTED,
  US: PAINTED,
  GR: PAINTED,
  AU: PAINTED,
  NZ: PAINTED,
  DK: nordic('#c8102e', W),
  SE: nordic('#006aa7', '#fecc00'),
  NO: nordic('#ba0c2f', W, '#00205b'),
  FI: nordic(W, '#003580'),
  IS: nordic('#02529c', W, '#dc1e35'),
  FO: nordic(W, '#0065bd', '#ef303e'),
  PL: h([W, '#dc143c']),
  CZ: h([W, '#d7141a'], [hoist('#11457e', 0.5)]),
  SK: h([W, '#0b4ea2', '#ee1c25']),
  HU: h(['#ce2939', W, '#477050']),
  SI: h([W, '#005ce6', '#ed1c24']),
  HR: h(['#ff0000', W, '#171796'], [rect('#ff0000', 0.42, 0.3, 0.16, 0.36), rect(W, 0.46, 0.36, 0.04, 0.12)]),
  RS: h(['#c6363c', '#0c4076', W]),
  RO: v(['#002b7f', '#fcd116', '#ce1126']),
  BG: h([W, '#00966e', '#d62612']),
  AL: h(['#e41e20'], [disc(K, 0.5, 0.5, 0.22)]),
  TR: h(['#e30a17'], [disc(W, 0.4, 0.5, 0.25), disc('#e30a17', 0.45, 0.5, 0.2), disc(W, 0.62, 0.5, 0.07)]),
  CY: h([W], [rect('#d57800', 0.3, 0.35, 0.4, 0.2)]),
  UA: h(['#0057b7', '#ffd700']),
  RU: h([W, '#0039a6', '#d52b1e']),
  BY: h(['#c8313e', '#c8313e', '#4aa657']),
  EE: h(['#0072ce', K, W]),
  LV: h(['#9e3039', '#9e3039', W, '#9e3039', '#9e3039']),
  LT: h(['#fdb913', '#006a44', '#c1272d']),
  MC: h(['#ce1126', W]),
  ID: h(['#ce1126', W]),
  CA: v(['#d52b1e', W, W, '#d52b1e'], [disc('#d52b1e', 0.5, 0.5, 0.2)]),
  MX: v(['#006847', W, '#ce1126'], [disc('#8c5a2b', 0.5, 0.5, 0.12)]),
  BR: h(['#009c3b'], [{ shape: 'diamond', color: '#ffdf00', x: 0.1, y: 0.12, w: 0.8, h: 0.76 }, disc('#002776', 0.5, 0.5, 0.2)]),
  AR: h(['#74acdf', W, '#74acdf'], [disc('#f6b40e', 0.5, 0.5, 0.11)]),
  CO: h(['#fcd116', '#fcd116', '#003893', '#ce1126']),
  CL: h([W, '#d52b1e'], [rect('#0039a6', 0, 0, 0.34, 0.5), disc(W, 0.17, 0.25, 0.09)]),
  JP: h([W], [disc('#bc002d', 0.5, 0.5, 0.3)]),
  KR: h([W], [disc('#cd2e3a', 0.5, 0.5, 0.25), disc('#0047a0', 0.53, 0.58, 0.14)]),
  CN: h(['#ee1c25'], [disc('#ffde00', 0.17, 0.27, 0.12), disc('#ffde00', 0.33, 0.12, 0.04), disc('#ffde00', 0.37, 0.3, 0.04)]),
  VN: h(['#da251d'], [disc('#ffcd00', 0.5, 0.5, 0.22)]),
  TH: h(['#a51931', W, '#2d2a4a', '#2d2a4a', W, '#a51931']),
  IN: h(['#ff9933', W, '#138808'], [disc('#000080', 0.5, 0.5, 0.1)]),
  PH: h(['#0038a8', '#ce1126'], [hoist(W, 0.45), disc('#fcd116', 0.15, 0.5, 0.09)]),
  IL: h([W], [rect('#0038b8', 0, 0.1, 1, 0.12), rect('#0038b8', 0, 0.78, 1, 0.12), disc('#0038b8', 0.5, 0.5, 0.14), disc(W, 0.5, 0.5, 0.08)]),
  NG: v(['#008751', W, '#008751']),
});

/** The marks of a spec (none for crosses and painted flags). */
export const flagMarks = (spec: FlagSpec): readonly FlagMark[] => (spec.kind === 'h' || spec.kind === 'v' ? spec.marks ?? [] : []);
