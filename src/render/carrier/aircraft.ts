import { DECK_Y } from './geometry';
import { type Layer, Pen, StaticArt } from './pen';

/**
 * Parked deck aircraft as muted far-side silhouettes (static). Local units: nose right, y = 0 on the deck.
 * Every outline is authored clockwise on screen so overlapping parts of one silhouette union cleanly.
 */

type Kind = 'jet' | 'helo' | 'hawkeye';

interface Part {
  body: (pen: Pen) => void;
  dark: (pen: Pen) => void;
  glass: (pen: Pen) => void;
}

/** Twin-tail fighter with its outer wings folded up. */
export function parkedJet(pen: Pen): void {
  pen.poly([-40, -11, -30, -13.5, -6, -14, 10, -15, 20, -15.5, 30, -13, 38, -10.5, 45, -8.5, 38, -7, 26, -6, -30, -6, -40, -8]);
  pen.poly([-38, -13, -35, -31, -28, -31, -20, -13]);
  pen.poly([-6, -14, -4, -29, 4, -29, 7, -14.5]);
  pen.poly([-45, -10.5, -30, -11.5, -30, -8.5, -45, -8]);
  pen.rect(29.2, -7, 1.6, 5);
  pen.rect(-7, -7, 2, 5);
  pen.circle(30, -1.9, 1.9);
  pen.circle(-6, -2.4, 2.4);
}

const JET: Part = {
  body: parkedJet,
  dark: (pen) => {
    pen.poly([2, -10.2, 14, -10.6, 14, -7, 2, -7]);
    pen.rect(-43, -11.2, 4, 4);
    pen.ellipse(-2, -4.6, 11, 1.8);
    pen.poly([-35, -29, -28.5, -29, -28, -27.5, -35, -27.5]);
  },
  glass: (pen) => pen.poly([14, -15.2, 18, -19.2, 24, -19.2, 29.5, -14.6]),
};

const HELO: Part = {
  body: (pen) => {
    pen.poly([-8, -21, 0, -23, 18, -23, 24, -19, 30, -13, 31, -8, 28, -5, 0, -5, -10, -9, -12, -16]);
    pen.poly([-46, -18.5, -10, -18, -10, -11, -46, -15]);
    pen.poly([-51, -31, -46, -31, -42, -17, -47, -16]);
    pen.poly([-50, -15, -38, -15.5, -38, -13.5, -50, -13]);
    pen.poly([-2, -22, 2, -27, 16, -27, 20, -22]);
    pen.rect(6, -31.5, 5, 4.5);
    pen.poly([-42, -30.2, 8, -31.4, 8, -29.8, -42, -28.9]);
    pen.poly([-40, -28, 8, -29.6, 8, -28.4, -40, -26.6]);
    pen.rect(-36.8, -13, 1.6, 9);
  },
  dark: (pen) => {
    pen.circle(20, -2.6, 2.6);
    pen.circle(-36, -2, 2);
    pen.rect(-4, -21.5, 3, 15);
    pen.circle(-48.5, -25, 1.2);
  },
  glass: (pen) => {
    pen.poly([20, -21, 25, -18, 29.5, -12, 21, -12]);
    pen.rect(3, -18.5, 8, 5);
  },
};

const HAWKEYE: Part = {
  body: (pen) => {
    pen.poly([-40, -11, -20, -14.5, 26, -16, 36, -15, 44, -11.5, 48, -9, 42, -6.5, 30, -5.5, -30, -6, -42, -8]);
    pen.poly([-53, -18, -30, -17, -30, -14.5, -53, -15.5]);
    pen.poly([-53, -31, -47, -31, -45, -8, -51, -8]);
    pen.poly([-41, -29, -36, -29, -35, -13, -40, -13]);
    pen.poly([-12, -16, -9, -30, -6, -30, -6, -16]);
    pen.poly([2, -16, 1, -30, 4, -30, 7, -16]);
    pen.ellipse(-4, -34, 27, 4.6);
    pen.poly([-32, -25, 18, -23, 18, -18.5, -32, -20]);
    pen.poly([4, -24, 21, -23, 26, -17.5, 21, -12, 4, -12]);
    pen.rect(33, -7, 1.6, 5);
    pen.rect(3, -8, 2.4, 6);
  },
  dark: (pen) => {
    pen.circle(34, -1.9, 1.9);
    pen.circle(4, -2.6, 2.6);
    pen.rect(-30.5, -35.2, 53, 1.1);
    pen.rect(24.5, -19, 2, 3);
  },
  glass: (pen) => pen.poly([32, -15.4, 38, -14.4, 43, -10.6, 33, -10.6]),
};

const PARTS: Readonly<Record<Kind, Part>> = { jet: JET, helo: HELO, hawkeye: HAWKEYE };

/** Far-side deck park: [kind, world x, scale, nose aft]. */
const PARK: readonly (readonly [Kind, number, number, boolean])[] = [
  ['helo', -226, 0.92, false],
  ['jet', -552, 0.84, true],
  ['hawkeye', -812, 0.84, true],
  ['jet', -905, 0.84, false],
  ['jet', -1010, 0.84, false],
];

function each(part: keyof Part): (pen: Pen) => void {
  return (pen) => {
    for (const [kind, x, s, flip] of PARK) PARTS[kind][part](pen.at(x, -5.5, s, flip));
  };
}

function propDiscs(pen: Pen): void {
  for (const [kind, x, s, flip] of PARK) {
    const p = pen.at(x, -5.5, s, flip);
    if (kind === 'hawkeye') p.ellipse(27, -17.5, 1.6, 11.5);
    if (kind === 'helo') p.circle(-48.5, -25, 5.5);
  }
}

/** Near-side tow tractor parked by the island's forward end. */
function tractor(pen: Pen): void {
  const p = pen.at(-292, 0.5);
  p.poly([-13, -8, 4, -8, 8, -6, 13, -5, 13, -1.6, -13, -1.6]);
  p.rect(-11, -12, 7, 4);
}

function tractorDark(pen: Pen): void {
  const p = pen.at(-292, 0.5);
  p.circle(-8, -1.8, 2.1);
  p.circle(8, -1.8, 2.1);
  p.rect(-13, -4.4, 26, 0.9);
}

const FAR = (): readonly Layer[] => [
  { fill: '#7b848d', stroke: 'rgba(40,47,54,0.55)', width: 0.6, build: each('body') },
  { fill: '#535c65', build: each('dark') },
  { fill: '#2c3a47', build: each('glass') },
  { fill: 'rgba(220,228,234,0.18)', build: propDiscs },
];

const NEAR = (): readonly Layer[] => [
  { fill: '#d9dcd5', stroke: 'rgba(30,36,42,0.6)', width: 0.6, build: tractor },
  { fill: '#22282e', build: tractorDark },
];

const far = new StaticArt(FAR, 0, DECK_Y);
const near = new StaticArt(NEAR, 0, DECK_Y);

/** Aircraft parked on the far side of the deck (draw before the island). */
export function drawParkedAircraft(ctx: CanvasRenderingContext2D): void {
  far.draw(ctx);
}

/** Vehicles on the near deck edge (draw after the island). */
export function drawDeckVehicles(ctx: CanvasRenderingContext2D): void {
  near.draw(ctx);
}
