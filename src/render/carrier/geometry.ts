/**
 * Side-view carrier world (doc 04). World x runs along the deck (catapult start = 0, bow to the right);
 * screen y is absolute. Art below the deck is authored in deck-relative units: `dy` = y - DECK_Y.
 */
export const DECK_Y = 430;
export const SEA_Y = 520;
export const CARRIER_STERN = -1100;
export const CARRIER_BOW = 620;

/** Waterline, deck-relative. */
export const WATER_DY = SEA_Y - DECK_Y;
/** Lowest hull point drawn (just under the waterline, hidden by the foam). */
export const KEEL_DY = WATER_DY + 3;

/** Island footprint (world x of its aft end) and length. */
export const ISLAND_X = -480;
export const ISLAND_W = 170;

/** Jet blast deflector: hinge on its forward edge, panel length, full raise angle. */
export const JBD_X = -88;
export const JBD_LEN = 36;
export const JBD_ANGLE = 0.95;

/** Catapult track: rear end, forward end (water brake) and the shuttle's rest position. */
export const CAT_START = -22;
export const CAT_END = 568;
export const SHUTTLE_X = 40;

/** Hangar bay, deck-relative: top of the openings and the hangar deck. */
export const HANGAR_TOP = 15;
export const HANGAR_FLOOR = 50;

export interface Elevator {
  x: number;
  w: number;
  /** Lowered to the hangar deck (shows the platform and the bay above it). */
  down: boolean;
}

/** Starboard deck-edge elevators: two forward of the island, one aft (lowered). */
export const ELEVATORS: readonly Elevator[] = [
  { x: -298, w: 100, down: false },
  { x: -186, w: 92, down: false },
  { x: -694, w: 104, down: true },
];

/** Bow stem (x, dy) from the flight deck down to the keel, and the stern transom likewise. */
export const STEM: readonly number[] = [585, 8, 583, 18, 578, 32, 571, 48, 562, 64, 552, 80, 545, KEEL_DY];
export const STERN: readonly number[] = [-1066, 8, -1063, 28, -1057, 48, -1049, 70, -1042, KEEL_DY];

function along(path: readonly number[], dy: number): number {
  for (let i = 2; i < path.length; i += 2) {
    const y0 = path[i - 1] ?? 0;
    const y1 = path[i + 1] ?? 0;
    if (dy <= y1 || i === path.length - 2) {
      const k = y1 === y0 ? 0 : Math.min(1, Math.max(0, (dy - y0) / (y1 - y0)));
      return (path[i - 2] ?? 0) + ((path[i] ?? 0) - (path[i - 2] ?? 0)) * k;
    }
  }
  return path[0] ?? 0;
}

/** World x of the bow stem / stern transom at a deck-relative height. */
export const stemX = (dy: number): number => along(STEM, dy);
export const sternX = (dy: number): number => along(STERN, dy);

/** Neutral hull number (no real ship) on the island and the bow. */
export const HULL_NUMBER = '92';

/** Haze-grey palette shared by the carrier modules. */
export const C = Object.freeze({
  deck: '#394047',
  deckFar: '#59616a',
  deckLine: '#e9ecef',
  edge: '#77818b',
  edgeHi: '#a7b0b8',
  edgeLo: '#4b545d',
  hullTop: '#48515a',
  hull: '#6b757f',
  hullLo: '#5a636c',
  bay: '#14191f',
  bayCeil: '#222930',
  bootTop: '#1d2227',
  island: '#8a949e',
  islandLit: '#9aa4ad',
  islandDark: '#717b85',
  islandLine: 'rgba(28,34,40,0.55)',
  glass: '#1b2836',
  glassHi: 'rgba(160,200,228,0.5)',
  rail: '#b3bcc4',
  metal: '#4f5862',
  white: '#eef1f3',
  hazard: '#f2c230',
  ink: '#1a1f25',
});
