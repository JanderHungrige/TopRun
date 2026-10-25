import { text } from '../text';
import { C, DECK_Y, HULL_NUMBER, ISLAND_X } from './geometry';
import { type Layer, Pen, StaticArt } from './pen';

/**
 * The island superstructure (static), in island-local units: x 0 (aft end) … 170 (forward end), y up from the
 * deck (negative). Levels from the deck: flight-deck control, three office levels, flag bridge, navigation
 * bridge and primary flight control (Pri-Fly, overhanging aft), then the roof that carries the mast (mast.ts).
 */

/** [x0, top, x1, bottom] of the plain levels. */
const LEVELS: readonly (readonly [number, number, number, number])[] = [
  [0, -20, 170, 1],
  [2, -36, 168, -20],
  [4, -52, 166, -36],
  [7, -67, 165, -52],
  [11, -81, 163, -67],
];

function levels(pen: Pen): void {
  for (const [x0, top, x1, bottom] of LEVELS) pen.rect(x0, top, x1 - x0, bottom - top);
}

function bridge(pen: Pen): void {
  pen.poly([14, -97, 160, -97, 169, -90, 168, -81, 14, -81]);
}

function priFly(pen: Pen): void {
  pen.poly([10, -113, 150, -113, 152, -97, 10, -97]);
  pen.poly([-9, -114, 34, -114, 34, -97, -2, -97, -9, -104]);
  pen.rect(16, -118, 128, 5);
}

/** Lit top lip of every level and the sunny forward ends. */
function highlights(pen: Pen): void {
  for (const [x0, top, x1, bottom] of LEVELS) {
    pen.rect(x0, top, x1 - x0, 1.2);
    pen.rect(x1 - 4, top, 4, bottom - top);
  }
  pen.rect(14, -97, 146, 1.2);
  pen.rect(-9, -114, 43, 1.2);
  pen.rect(10, -113, 140, 1);
}

/** Shadow under each overhang and along the aft ends. */
function shadows(pen: Pen): void {
  for (const [x0, top, , bottom] of LEVELS) pen.rect(x0, top + 1.2, 3, bottom - top - 1.2);
  pen.rect(14, -81, 152, 2);
  pen.rect(10, -97, 140, 2);
  pen.rect(-2, -97, 36, 1.6);
  pen.rect(0, -1, 170, 2);
}

function seamLines(pen: Pen): void {
  for (const [x0, top, x1] of LEVELS) pen.line(x0, top, x1, top);
  pen.line(14, -97, 160, -97);
  pen.line(10, -113, 150, -113);
  for (let x = 30; x < 160; x += 34) pen.line(x, -66, x, -1);
}

function doors(pen: Pen): void {
  for (const x of [18, 70, 104]) pen.rect(x, -15, 8, 15);
  pen.rect(40, -47, 7, 11);
  pen.rect(116, -78, 6, 10);
}

function portholes(pen: Pen): void {
  for (const dy of [-31, -47, -62]) for (let x = 16; x < 96; x += 12) pen.rect(x, dy, 3, 3);
}

function windows(pen: Pen): void {
  for (let i = 0; i < 5; i++) pen.rect(124 + i * 8.6, -16, 7, 6.5);
  for (let x = 18; x < 156; x += 10) pen.rect(x, -77.5, 7, 5);
  for (let x = 42; x < 146; x += 12) pen.rect(x, -109, 8, 5);
  pen.poly([18, -94.5, 160, -94.5, 165.5, -89, 164, -85, 18, -85]);
  pen.poly([-6.5, -111, 30, -111, 30, -100, -1.5, -100]);
}

function glare(pen: Pen): void {
  pen.poly([40, -94.5, 52, -94.5, 46, -85, 34, -85]);
  pen.poly([110, -94.5, 116, -94.5, 110, -85, 104, -85]);
  pen.poly([4, -111, 12, -111, 8, -100, 0, -100]);
  for (let i = 0; i < 5; i++) pen.rect(124 + i * 8.6, -16, 2.2, 6.5);
}

function mullions(pen: Pen): void {
  for (let x = 24; x < 160; x += 7) pen.line(x, -94.5, x, -85);
  for (let x = 0; x < 30; x += 6) pen.line(x, -111, x, -100);
}

function railings(pen: Pen): void {
  const runs: readonly (readonly [number, number, number])[] = [[7, 165, -67], [11, 163, -81], [16, 144, -118], [-9, 34, -114]];
  for (const [x0, x1, y] of runs) {
    pen.line(x0, y - 3.5, x1, y - 3.5);
    for (let x = x0; x <= x1; x += 5) pen.line(x, y - 3.5, x, y);
  }
}

/** External ladders climbing the aft end, with treads. */
function ladders(pen: Pen): void {
  for (const [x0, y0, x1, y1] of [[24, -1, 46, -20], [46, -21, 24, -36], [24, -37, 46, -52]] as const) {
    pen.line(x0, y0, x1, y1);
    const n = 6;
    for (let i = 1; i < n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      const y = y0 + ((y1 - y0) * i) / n;
      pen.line(x - 1.6, y, x + 1.6, y);
    }
  }
}

function fittings(pen: Pen): void {
  pen.rect(150, -88, 9, 5);
  pen.rect(62, -60, 10, 6);
  pen.rect(132, -60, 12, 4);
  pen.rect(28, -125, 22, 7);
  pen.rect(120, -122, 10, 4);
  pen.rect(-4, -120, 14, 6);
}

function domes(pen: Pen): void {
  pen.ellipse(39, -131, 8, 8, Math.PI, Math.PI * 2);
  pen.rect(31, -131, 16, 6);
  pen.circle(125, -127, 4.5);
  pen.circle(3, -124, 4);
}

function sensors(pen: Pen): void {
  pen.ellipse(161, -85.5, 1.8, 4.5);
  pen.rect(60, -64, 3, 4);
}

const LAYERS = (): readonly Layer[] => [
  { fill: C.island, build: levels },
  { fill: C.islandLit, build: bridge },
  { fill: C.island, build: priFly },
  { fill: 'rgba(255,255,255,0.16)', build: highlights },
  { fill: 'rgba(16,22,28,0.22)', build: shadows },
  { stroke: C.islandLine, width: 0.7, build: seamLines },
  { fill: '#5d6771', stroke: 'rgba(20,26,32,0.5)', width: 0.6, build: doors },
  { fill: '#2b3640', build: portholes },
  { fill: C.glass, build: windows },
  { fill: C.glassHi, build: glare },
  { stroke: 'rgba(120,130,140,0.7)', width: 0.7, build: mullions },
  { fill: '#7a848e', stroke: 'rgba(20,26,32,0.45)', width: 0.6, build: fittings },
  { fill: C.white, stroke: 'rgba(60,70,80,0.5)', width: 0.6, build: domes },
  { fill: '#3e4750', build: sensors },
  { stroke: 'rgba(205,212,218,0.75)', width: 0.55, build: railings },
  { stroke: 'rgba(48,56,64,0.7)', width: 0.8, build: ladders },
];

const art = new StaticArt(LAYERS, ISLAND_X, DECK_Y);

export function drawIsland(ctx: CanvasRenderingContext2D): void {
  art.draw(ctx);
  const x = ISLAND_X + 140;
  const y = DECK_Y - 28;
  text(ctx, HULL_NUMBER, x + 1.6, y + 1.6, { size: 27, display: true, color: 'rgba(24,30,36,0.75)', align: 'center' });
  text(ctx, HULL_NUMBER, x, y, { size: 27, display: true, color: C.white, align: 'center', stroke: 'rgba(40,48,56,0.6)', strokeWidth: 1.2 });
}
