import { parkedJet } from './aircraft';
import { text } from '../text';
import { C, DECK_Y, ELEVATORS, type Elevator, HANGAR_FLOOR, HULL_NUMBER, HANGAR_TOP, KEEL_DY, STEM, STERN, stemX, sternX } from './geometry';
import { cachedGradient, type Layer, Pen, StaticArt } from './pen';

/** Hull plating below the flight deck: shape, shading, hangar bays, doors, waterline and anchor (static). */

function outline(pen: Pen): void {
  const pts: number[] = [STERN[0] ?? 0, 8, STEM[0] ?? 0, 8];
  for (let i = 2; i < STEM.length; i += 2) pts.push(STEM[i] ?? 0, STEM[i + 1] ?? 0);
  for (let i = STERN.length - 2; i >= 2; i -= 2) pts.push(STERN[i] ?? 0, STERN[i + 1] ?? 0);
  pen.poly(pts);
}

const hullShade = (ctx: CanvasRenderingContext2D): CanvasGradient => cachedGradient(ctx, 'carrier-hull', () => {
  const g = ctx.createLinearGradient(0, DECK_Y + 8, 0, DECK_Y + KEEL_DY);
  g.addColorStop(0, '#3f4850');
  g.addColorStop(0.16, C.hull);
  g.addColorStop(0.62, '#727c86');
  g.addColorStop(1, C.hullLo);
  return g;
});

const bay = (e: Elevator): { x: number; w: number; top: number } => ({ x: e.x + 5, w: e.w - 10, top: e.down ? 9 : HANGAR_TOP });

function bayInterior(pen: Pen): void {
  for (const e of ELEVATORS) {
    const b = bay(e);
    pen.rect(b.x, b.top, b.w, HANGAR_FLOOR - b.top);
  }
  pen.rect(-1056, 15, 44, 30); // open fantail under the stern overhang
}

function bayCeiling(pen: Pen): void {
  for (const e of ELEVATORS) {
    const b = bay(e);
    pen.rect(b.x, b.top, b.w, 5);
    pen.rect(b.x, HANGAR_FLOOR - 3, b.w, 3);
  }
}

function bayBeams(pen: Pen): void {
  for (const e of ELEVATORS) {
    const b = bay(e);
    for (let x = b.x + 4; x < b.x + b.w; x += 9) pen.line(x, b.top, x, b.top + 5);
    pen.line(b.x, b.top + 14, b.x + b.w, b.top + 14);
  }
}

function bayLights(pen: Pen): void {
  for (const e of ELEVATORS) {
    const b = bay(e);
    for (let x = b.x + 8; x < b.x + b.w - 4; x += 20) pen.rect(x, b.top + 5.4, 4, 1.2);
  }
}

function bayGlow(pen: Pen): void {
  for (const e of ELEVATORS) {
    const b = bay(e);
    for (let x = b.x + 10; x < b.x + b.w - 4; x += 20) pen.ellipse(x, HANGAR_FLOOR - 3.5, 9, 2);
  }
}

/** Dim aircraft parked inside the bays (far wall). */
function bayAircraft(pen: Pen): void {
  const [e1, e2] = ELEVATORS;
  if (e1) parkedJet(pen.at(e1.x + 46, HANGAR_FLOOR - 3, 0.62));
  if (e2) parkedJet(pen.at(e2.x + 30, HANGAR_FLOOR - 3, 0.62, true));
}

function guideRails(pen: Pen): void {
  for (const e of ELEVATORS) {
    pen.rect(e.x, 8, 5, HANGAR_FLOOR - 2);
    pen.rect(e.x + e.w - 5, 8, 5, HANGAR_FLOOR - 2);
  }
}

function railEdges(pen: Pen): void {
  for (const e of ELEVATORS) {
    pen.line(e.x + 5, 8, e.x + 5, HANGAR_FLOOR + 6);
    pen.line(e.x + e.w - 0.5, 8, e.x + e.w - 0.5, HANGAR_FLOOR + 6);
  }
}

/** Raised platforms show their truss underside across the top of the bay. */
function platformTruss(pen: Pen): void {
  for (const e of ELEVATORS) {
    if (e.down) continue;
    pen.rect(e.x + 5, 8, e.w - 10, HANGAR_TOP - 8);
  }
}

function trussLines(pen: Pen): void {
  for (const e of ELEVATORS) {
    if (e.down) continue;
    for (let x = e.x + 5; x < e.x + e.w - 12; x += 10) {
      pen.line(x, HANGAR_TOP - 1, x + 5, 9);
      pen.line(x + 5, 9, x + 10, HANGAR_TOP - 1);
    }
  }
}

function loweredPlatform(pen: Pen): void {
  for (const e of ELEVATORS) if (e.down) pen.rect(e.x - 2, HANGAR_FLOOR, e.w + 4, 6);
}

function loweredJet(pen: Pen): void {
  for (const e of ELEVATORS) if (e.down) parkedJet(pen.at(e.x + e.w / 2, HANGAR_FLOOR, 0.86));
}

function seams(pen: Pen): void {
  for (const dy of [34, 58, 74]) pen.line(sternX(dy) + 3, dy, stemX(dy) - 3, dy);
  for (let x = -1010; x < 530; x += 46) pen.line(x, 52, x, 82);
}

function bootTop(pen: Pen): void {
  pen.poly([sternX(83), 83, stemX(83), 83, stemX(KEEL_DY), KEEL_DY, sternX(KEEL_DY), KEEL_DY]);
}

function flare(pen: Pen): void {
  pen.poly([360, 8, stemX(8), 8, stemX(20), 20, stemX(34), 34, stemX(44), 44, 528, 32, 460, 18]);
}

function doors(pen: Pen): void {
  for (const x of [34, 128, 232, -552, -790, -836]) pen.rect(x, 28, 9, 17);
}

function portholes(pen: Pen): void {
  for (let x = 172; x < 520; x += 24) pen.circle(x, 63, 1.3);
  for (let x = -990; x < -720; x += 24) pen.circle(x, 63, 1.3);
}

function draftMarks(pen: Pen): void {
  for (const dy of [62, 70, 78]) {
    pen.rect(stemX(dy) - 10, dy - 0.6, 5, 1.2);
    pen.rect(sternX(dy) + 5, dy - 0.6, 5, 1.2);
  }
}

const ANCHOR_X = 545;

function anchorPocket(pen: Pen): void {
  const a = ANCHOR_X;
  pen.poly([a - 8, 22, a + 8, 21, a + 13, 27, a + 12, 44, a + 6, 49, a - 7, 49, a - 12, 43, a - 12, 28]);
}

function anchor(pen: Pen): void {
  const a = ANCHOR_X;
  pen.rect(a - 1.6, 24.5, 3.2, 16);
  pen.poly([a - 10, 40, a + 10, 40, a + 7, 46.5, a - 7, 46.5]);
  pen.poly([a - 10, 40, a - 8, 32.5, a - 5.5, 40]);
  pen.poly([a + 5.5, 40, a + 8, 32.5, a + 10, 40]);
  pen.ellipse(a, 23.2, 2.4, 1.5);
}

/** Replenishment-at-sea stations (recess with a kingpost) and ventilation grilles under the deck edge. */
function rasRecess(pen: Pen): void {
  for (const x of [176, -440]) pen.rect(x, 17, 28, 27);
}

function rasGear(pen: Pen): void {
  for (const x of [176, -440]) {
    pen.rect(x + 12, 13, 3, 31);
    pen.poly([x + 4, 19, x + 24, 19, x + 24, 21, x + 4, 21]);
    pen.rect(x + 2, 41, 24, 1.6);
  }
  for (const x of [-980, -900, -770, -520, -360, 20, 96, 268, 470]) pen.rect(x, 18.5, 9, 3.2);
}

const LAYERS = (): readonly Layer[] => [
  { fill: hullShade, build: outline },
  { fill: 'rgba(255,255,255,0.07)', build: flare },
  { stroke: 'rgba(20,26,32,0.28)', width: 0.7, build: seams },
  { fill: C.bootTop, build: bootTop },
  { fill: C.bay, build: bayInterior },
  { fill: 'rgba(225,232,205,0.10)', build: bayGlow },
  { fill: '#1f262d', build: bayAircraft },
  { fill: C.bayCeil, build: bayCeiling },
  { stroke: 'rgba(84,95,106,0.7)', width: 0.8, build: bayBeams },
  { fill: '#eef2d8', build: bayLights },
  { fill: '#2c333a', build: platformTruss },
  { stroke: 'rgba(130,140,150,0.55)', width: 0.7, build: trussLines },
  { fill: C.metal, build: guideRails },
  { stroke: 'rgba(190,200,208,0.35)', width: 0.8, build: railEdges },
  { fill: '#5f6872', build: loweredPlatform },
  { fill: '#4a535c', stroke: 'rgba(20,26,32,0.5)', width: 0.6, build: loweredJet },
  { fill: '#424b54', stroke: 'rgba(16,20,24,0.55)', width: 0.8, build: doors },
  { fill: '#232a31', build: portholes },
  { fill: 'rgba(240,244,246,0.7)', build: draftMarks },
  { fill: '#2b3239', build: rasRecess },
  { fill: '#59626b', stroke: 'rgba(20,26,32,0.45)', width: 0.5, build: rasGear },
  { fill: '#2a3137', stroke: 'rgba(150,160,170,0.35)', width: 0.6, build: anchorPocket },
  { fill: '#59626b', stroke: 'rgba(20,26,32,0.6)', width: 0.6, build: anchor },
];

const art = new StaticArt(LAYERS, 0, DECK_Y);

export function drawHull(ctx: CanvasRenderingContext2D): void {
  art.draw(ctx);
  const x = 498;
  const y = DECK_Y + 40;
  text(ctx, HULL_NUMBER, x + 1.4, y + 1.4, { size: 21, display: true, color: 'rgba(24,30,36,0.7)', align: 'center' });
  text(ctx, HULL_NUMBER, x, y, { size: 21, display: true, color: '#e6eaed', align: 'center' });
}
