import { clamp } from '../../core/math';
import { C, CARRIER_BOW, CARRIER_STERN, CAT_END, CAT_START, DECK_Y, ELEVATORS, JBD_ANGLE, JBD_LEN, JBD_X, SHUTTLE_X } from './geometry';
import { drawLive, type Layer, Pen, StaticArt } from './pen';

/**
 * Flight deck surface seen at a shallow angle (deck-relative band -7 … +1): non-skid, painted lines, tie-down
 * pad eyes, scorch marks, elevator outlines and the catapult track (static). Animated: shuttle and the jet
 * blast deflector, hinged on its forward edge with its rams behind it.
 */

const LEN = CARRIER_BOW - CARRIER_STERN;

function surface(pen: Pen): void {
  pen.poly([CARRIER_STERN + 14, -7, CARRIER_BOW - 3, -7, CARRIER_BOW + 1, -3, CARRIER_BOW, 1, CARRIER_STERN, 1, CARRIER_STERN + 2, -3]);
}

function farEdge(pen: Pen): void {
  pen.rect(CARRIER_STERN + 14, -7.6, LEN - 18, 1);
}

function dashes(pen: Pen): void {
  for (let x = CARRIER_STERN + 26; x < CARRIER_BOW - 24; x += 30) pen.rect(x, -5.9, 17, 0.9);
}

function nearLine(pen: Pen): void {
  pen.rect(CARRIER_STERN + 18, -0.9, LEN - 40, 0.7);
}

function padEyes(pen: Pen): void {
  for (let x = CARRIER_STERN + 20; x < CARRIER_BOW - 10; x += 9) {
    pen.rect(x, -4.9, 1.1, 0.7);
    pen.rect(x + 4.5, -1.9, 1.2, 0.8);
  }
}

/** Exhaust scorch behind the deflector and a few tyre streaks. */
function grime(pen: Pen): void {
  pen.ellipse(-122, -3, 30, 2.6);
  pen.ellipse(-180, -2.5, 22, 1.6);
  for (const [x, w] of [[-760, 60], [-640, 40], [-420, 70], [-20, 50], [220, 80], [430, 60]] as const) pen.ellipse(x, -2.2 - (x % 3), w, 0.8);
}

function catSlot(pen: Pen): void {
  pen.rect(CAT_START, -3.9, CAT_END - CAT_START, 1.3);
  pen.rect(CAT_START - 9, -4.8, 9, 3);
  pen.rect(CAT_END, -4.8, 15, 3);
}

function catEdges(pen: Pen): void {
  pen.rect(CAT_START, -4.5, CAT_END - CAT_START, 0.6);
  pen.rect(CAT_START, -2.6, CAT_END - CAT_START, 0.55);
}

function catPaint(pen: Pen): void {
  pen.rect(CAT_START - 60, -6.6, CAT_END - CAT_START + 76, 0.75);
  for (let x = CAT_END + 2; x < CAT_END + 14; x += 4) pen.poly([x, -4.6, x + 2, -4.6, x + 3.5, -3.3, x + 1.5, -3.3]);
}

function elevatorOutlines(pen: Pen): void {
  for (const e of ELEVATORS) {
    pen.rect(e.x, -3.9, e.w, 0.6);
    pen.rect(e.x, -3.9, 0.8, 4.8);
    pen.rect(e.x + e.w - 0.8, -3.9, 0.8, 4.8);
  }
}

/** Flush deck plates of the deflector well and the bow catapult on the far side. */
function deckPlates(pen: Pen): void {
  pen.rect(JBD_X - JBD_LEN - 2, -6.6, JBD_LEN + 4, 6.2);
  pen.rect(-60, -6.8, 46, 1.2);
}

const LAYERS = (): readonly Layer[] => [
  { fill: C.deck, build: surface },
  { fill: C.deckFar, build: farEdge },
  { fill: 'rgba(12,14,17,0.28)', build: grime },
  { fill: '#272c32', build: padEyes },
  { fill: 'rgba(233,236,239,0.7)', build: dashes },
  { fill: 'rgba(233,236,239,0.32)', build: nearLine },
  { fill: '#22272c', build: deckPlates },
  { fill: '#e8c33c', build: elevatorOutlines },
  { fill: '#e8c33c', build: catPaint },
  { fill: '#101317', build: catSlot },
  { fill: '#8b949c', build: catEdges },
];

const art = new StaticArt(LAYERS, 0, DECK_Y);

export function drawDeck(ctx: CanvasRenderingContext2D): void {
  art.draw(ctx);
}

/** The catapult shuttle at rest under the nose gear; it rides away with the jet on launch. */
export function drawShuttle(ctx: CanvasRenderingContext2D, launched: boolean): void {
  if (launched) return;
  drawLive(ctx, { fill: '#2a3036', stroke: 'rgba(170,180,188,0.6)', width: 0.5, build: (pen) => pen.poly([-6, -3.6, 7, -3.6, 5, -6.6, -3, -6.6]) }, SHUTTLE_X, DECK_Y);
  drawLive(ctx, { fill: '#e8c33c', build: (pen) => pen.rect(2.5, -7.2, 2.6, 1.2) }, SHUTTLE_X, DECK_Y);
}

/** Jet blast deflector: `raise` 0 (flush) … 1 (up). The panel hinges on its forward edge and leans aft. */
export function drawDeflector(ctx: CanvasRenderingContext2D, raise: number): void {
  const a = JBD_ANGLE * clamp(raise, 0, 1);
  const ux = -Math.cos(a);
  const uy = -Math.sin(a);
  const nx = Math.sin(a);
  const ny = -Math.cos(a);
  const T = 4.6;
  const at = (s: number, d: number): readonly [number, number] => [s * ux - d * nx, s * uy - d * ny];
  const ram = at(JBD_LEN * 0.56, T);
  const base: readonly [number, number] = [-JBD_LEN * 0.98, 1];
  const mid: readonly [number, number] = [(ram[0] + base[0]) / 2, (ram[1] + base[1]) / 2];
  if (a > 0.05) {
    drawLive(ctx, { fill: '#15191d', build: (pen) => pen.rect(-JBD_LEN - 1, -6.4, JBD_LEN + 2, 4.6) }, JBD_X, DECK_Y);
    drawLive(ctx, { stroke: '#c9d0d6', width: 1.4, build: (pen) => pen.line(mid[0], mid[1], ram[0], ram[1]) }, JBD_X, DECK_Y - 6);
    drawLive(ctx, { stroke: '#394047', width: 3.2, build: (pen) => pen.line(base[0], base[1], mid[0], mid[1]) }, JBD_X, DECK_Y - 6);
  }
  const panel = (pen: Pen): void => pen.poly([...at(0, 0), ...at(JBD_LEN, 0), ...at(JBD_LEN, T), ...at(0, T)]);
  drawLive(ctx, { fill: '#8e979f', stroke: 'rgba(24,30,36,0.7)', width: 0.7, build: panel }, JBD_X, DECK_Y - 6);
  drawLive(ctx, {
    stroke: 'rgba(40,48,56,0.55)',
    width: 0.6,
    build: (pen) => {
      for (let s = 4; s < JBD_LEN - 1; s += 4) pen.line(...at(s, 0.8), ...at(s, T - 0.8));
    },
  }, JBD_X, DECK_Y - 6);
  drawLive(ctx, { stroke: '#cdd3d8', width: 1, build: (pen) => pen.line(...at(0.5, 0.3), ...at(JBD_LEN, 0.3)) }, JBD_X, DECK_Y - 6);
  drawLive(ctx, { fill: '#3a4148', build: (pen) => pen.circle(0, 2.2, 3) }, JBD_X, DECK_Y - 6);
  drawLive(ctx, { fill: '#a9b1b8', build: (pen) => pen.circle(0, 2.2, 1.2) }, JBD_X, DECK_Y - 6);
}
