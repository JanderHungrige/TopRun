import type { Pts, Rect } from './geom';

/** A rectangle of the airframe that a livery paints as a unit (wingtip, nose, stabilator). */
export interface Zone extends Rect {
  dir: 'x' | 'y'; // direction that bands and tiger stripes run in
  out: 1 | -1; // which end of the other axis is the outer edge (wingtip bands start there)
}

/** A stabilator zone; sunburst rays fan out from (ox, oy). */
export interface TailZone extends Zone {
  ox: number;
  oy: number;
}

/**
 * One paintable surface of an airframe in one view: its outline (clip) and the places a livery decorates.
 * Precomputed once per jet and view.
 */
export interface Surface {
  key: string; // cache key for generated camouflage
  clip: Path2D; // union outline (consistent winding)
  box: Rect; // bounds of the outline
  cell: number; // camouflage cell size in local units
  under?: Path2D; // side view: lower surfaces
  twoTone?: Path2D; // darker area of the factory two-tone scheme
  radome?: Path2D;
  band?: Rect; // nose band
  nose?: Zone; // forward fuselage (tiger stripes)
  tips?: readonly Zone[]; // wingtips
  tails?: readonly TailZone[]; // stabilators (top view)
  stripes?: readonly Pts[]; // show-stripe centre curves, each [x0, y0, cx, cy, x1, y1] (quadratic)
  trim?: readonly Pts[]; // pinstripe polylines
}

/** Fin geometry for tail art: the fin outline and its corners [rootLE, tipLE, tipTE, rootTE]. */
export interface Fin {
  path: Path2D;
  q: Pts;
}

/** Normalised top-view draw options. */
export interface TopOpts {
  bank: number;
  sweep: number;
  throttle: number;
  t: number;
}

/** Normalised side-view draw options. */
export interface SideOpts {
  throttle: number;
  t: number;
  gear: number;
  hook: boolean;
}
