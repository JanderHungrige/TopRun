// The shape of a paint job (docs 09, 100): colours and pattern parameters that a craft's drawing lays onto its
// outline. Shared by the jets' looks (livery-art.ts) and the fleet's (fleet-looks.ts).

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

export const NO_TAIL: TailArt = { kind: 'none', color: '', mark: '', mark2: '' };
export const tail = (kind: TailKind, color: string, mark = '', mark2 = ''): TailArt => ({ kind, color, mark, mark2 });

export const look = (base: string, swatch: readonly [string, string, string], extra: Partial<Look>): Look => ({
  base, under: base, twoTone: null, radome: null, camo: null, tail: NO_TAIL, band: null, tips: [], tiger: null,
  rays: null, stabs: null, stripes: null, trim: null, ink: 'rgba(18,24,32,0.55)', panel: 'rgba(18,24,32,0.26)', gloss: 1, swatch, ...extra,
});

