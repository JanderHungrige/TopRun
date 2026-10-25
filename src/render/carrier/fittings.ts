import { C, CARRIER_BOW, CARRIER_STERN, DECK_Y, ELEVATORS, stemX } from './geometry';
import { type Layer, Pen, StaticArt } from './pen';

/**
 * Hull fittings (static, deck-relative units): flight-deck edge, elevator platform edges, catwalks, sponsons
 * with close-in weapons and missile launchers, and the aft whip antennas.
 */

const LEN = CARRIER_BOW - CARRIER_STERN;

function edgeBand(pen: Pen): void {
  pen.poly([CARRIER_STERN, 1, CARRIER_BOW, 1, CARRIER_BOW - 4, 8, CARRIER_STERN + 3, 8]);
}

function edgeShade(pen: Pen): void {
  pen.rect(CARRIER_STERN + 3, 6.6, LEN - 8, 1.6);
  pen.poly([stemX(8), 8, CARRIER_BOW - 4, 8, stemX(8) + 5, 22, stemX(22), 22]);
  pen.poly([CARRIER_STERN + 3, 8, -1066, 8, -1066, 14]);
  for (const e of ELEVATORS) if (e.down) pen.rect(e.x, 1, e.w, 7.2);
}

function edgeLit(pen: Pen): void {
  pen.rect(CARRIER_STERN, 1, LEN, 1.1);
}

function elevatorSeams(pen: Pen): void {
  for (const e of ELEVATORS) {
    pen.line(e.x, 1, e.x, 8);
    pen.line(e.x + e.w, 1, e.x + e.w, 8);
  }
}

/** Yellow/black hazard dashes along the lip of every elevator platform. */
function hazardYellow(pen: Pen): void {
  for (const e of ELEVATORS) {
    pen.rect(e.x + 1, e.down ? 50 : 2.2, e.w - 2, 1.3);
  }
}

function hazardBlack(pen: Pen): void {
  for (const e of ELEVATORS) {
    const y = e.down ? 50 : 2.2;
    for (let x = e.x + 3; x < e.x + e.w - 3; x += 6) pen.poly([x, y, x + 3, y, x + 2, y + 1.3, x - 1, y + 1.3]);
  }
}

/** Catwalk runs along the deck edge, broken by the elevators. */
function catwalkRuns(): readonly (readonly [number, number])[] {
  const cuts = [...ELEVATORS].sort((a, b) => a.x - b.x);
  const runs: [number, number][] = [];
  let from = CARRIER_STERN + 40;
  for (const e of cuts) {
    if (e.x - 2 > from) runs.push([from, e.x - 2]);
    from = e.x + e.w + 2;
  }
  runs.push([from, stemX(8) - 4]);
  return runs;
}

function catwalkFloor(pen: Pen): void {
  for (const [a, b] of catwalkRuns()) {
    pen.rect(a, 8, b - a, 2.2);
    for (let x = a + 6; x < b - 4; x += 22) pen.poly([x, 10.2, x + 4, 10.2, x, 14.5]);
  }
}

function catwalkRails(pen: Pen): void {
  for (const [a, b] of catwalkRuns()) {
    pen.line(a, 3.4, b, 3.4);
    pen.line(a, 5.8, b, 5.8);
    for (let x = a; x <= b; x += 7) pen.line(x, 3.4, x, 8.2);
  }
}

/** [x0, x1] of the starboard sponsons (forward and aft). */
const SPONSONS: readonly (readonly [number, number])[] = [[318, 452], [-1014, -900]];

function sponsons(pen: Pen): void {
  for (const [a, b] of SPONSONS) pen.poly([a, 28, b, 28, b, 36, b - 14, 50, a + 12, 50, a, 36]);
}

function sponsonShade(pen: Pen): void {
  for (const [a, b] of SPONSONS) pen.poly([a, 36, b, 36, b - 14, 50, a + 12, 50]);
}

function sponsonLip(pen: Pen): void {
  for (const [a, b] of SPONSONS) pen.rect(a, 28, b - a, 1.2);
}

function sponsonRails(pen: Pen): void {
  for (const [a, b] of SPONSONS) {
    pen.line(a, 24.5, b, 24.5);
    for (let x = a; x <= b; x += 6) pen.line(x, 24.5, x, 28);
  }
}

const CIWS: readonly number[] = [356, -986];
const NSSM = 414;
const RAM = -930;

function ciwsDome(pen: Pen): void {
  for (const x of CIWS) {
    const p = pen.at(x, 28);
    p.rect(-5, -21, 10, 11);
    p.ellipse(0, -21, 5, 4.4, Math.PI, Math.PI * 2);
    p.rect(-7, -10, 14, 6);
    p.rect(-9.5, -10.5, 5, 7);
  }
}

function ciwsDark(pen: Pen): void {
  for (const x of CIWS) {
    const p = pen.at(x, 28);
    p.rect(-6, -4, 12, 4);
    p.rect(2, -8.6, 15, 2.4);
    p.rect(16, -9.3, 3.2, 3.8);
  }
}

function launchers(pen: Pen): void {
  const n = pen.at(NSSM, 28);
  n.poly([-13, -15, 13, -20, 13, -8, -13, -3]);
  const r = pen.at(RAM, 28);
  r.poly([-8, -21, 9, -24, 9, -9, -8, -6]);
  r.ellipse(0.5, -23, 4, 2.4);
}

function launcherDark(pen: Pen): void {
  for (const x of [NSSM, RAM]) pen.at(x, 28).rect(-4, -6, 8, 6);
  const n = pen.at(NSSM, 28);
  n.poly([11, -19.6, 13, -20, 13, -8, 11, -7.6]);
  const slope = 5 / 26;
  for (let k = -6.5; k < 11; k += 6.5) n.line(k, -14 - slope * (k + 13), k, -4 - slope * (k + 13));
  const r = pen.at(RAM, 28);
  r.poly([7, -23.6, 9, -24, 9, -9, 7, -8.6]);
}

function whips(pen: Pen): void {
  for (const x of [-860, -818, -776]) {
    pen.line(x, 20, x - 7, -22);
    pen.line(x - 2, 20, x + 2, 20);
  }
}

const LAYERS = (): readonly Layer[] => [
  { fill: C.edge, build: edgeBand },
  { fill: C.edgeLo, build: edgeShade },
  { fill: C.edgeHi, build: edgeLit },
  { stroke: 'rgba(30,36,42,0.6)', width: 0.8, build: elevatorSeams },
  { fill: C.hazard, build: hazardYellow },
  { fill: C.ink, build: hazardBlack },
  { fill: '#30373e', build: catwalkFloor },
  { stroke: 'rgba(196,204,211,0.75)', width: 0.55, build: catwalkRails },
  { fill: '#6d7781', stroke: 'rgba(30,36,42,0.45)', width: 0.6, build: sponsons },
  { fill: 'rgba(16,22,28,0.22)', build: sponsonShade },
  { fill: C.edgeHi, build: sponsonLip },
  { stroke: 'rgba(196,204,211,0.7)', width: 0.5, build: sponsonRails },
  { fill: '#3b4249', build: ciwsDark },
  { fill: C.white, stroke: 'rgba(60,70,80,0.55)', width: 0.6, build: ciwsDome },
  { fill: '#b9c1c8', stroke: 'rgba(40,48,56,0.55)', width: 0.6, build: launchers },
  { fill: '#7d868f', stroke: 'rgba(40,48,56,0.5)', width: 0.5, build: launcherDark },
  { stroke: 'rgba(225,230,234,0.6)', width: 0.7, build: whips },
];

const art = new StaticArt(LAYERS, 0, DECK_Y);

export function drawFittings(ctx: CanvasRenderingContext2D): void {
  art.draw(ctx);
}
