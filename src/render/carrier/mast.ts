import { C, DECK_Y, ISLAND_X } from './geometry';
import { drawLive, type Layer, Pen, StaticArt } from './pen';

/**
 * Island mast and sensors in island-local units (see island.ts): a lattice main mast with platforms, yardarm,
 * radomes and antennas (static), plus the animated parts — three rotating radars, the masthead beacon, the
 * deck-status light and the flight-ops flag.
 */

function lattice(pen: Pen): void {
  pen.line(80, -118, 89, -190);
  pen.line(104, -118, 95, -190);
  pen.line(21, -118, 25, -150);
  pen.line(33, -118, 29, -150);
}

const legL = (y: number): number => 80 + (9 * (y + 118)) / -72;
const legR = (y: number): number => 104 - (9 * (y + 118)) / -72;

function braces(pen: Pen): void {
  for (let y = -118; y > -186; y -= 12) {
    pen.line(legL(y), y, legR(y - 12), y - 12);
    pen.line(legR(y), y, legL(y - 12), y - 12);
  }
  for (let y = -118; y > -146; y -= 8) {
    pen.line(21, y, 33, y - 8);
    pen.line(33, y, 21, y - 8);
  }
}

function platforms(pen: Pen): void {
  pen.rect(66, -148, 52, 2.4);
  pen.rect(76, -174, 32, 2.2);
  pen.rect(54, -162, 76, 1.6);
  pen.rect(15, -152, 24, 2);
  pen.rect(91, -226, 2, 36);
  pen.rect(87.5, -201, 9, 7);
  pen.rect(88.5, -208, 7, 5);
  pen.rect(132, -120, 19, 2.5);
  pen.rect(138, -129, 7, 9);
  pen.rect(89, -180, 6, 6);
  pen.rect(23.5, -156, 5, 4);
}

function rails(pen: Pen): void {
  for (const [x0, x1, y] of [[66, 118, -148], [76, 108, -174]] as const) {
    pen.line(x0, y - 3, x1, y - 3);
    for (let x = x0; x <= x1; x += 4) pen.line(x, y - 3, x, y);
  }
}

function antennas(pen: Pen): void {
  pen.line(56, -162, 52, -188);
  pen.line(128, -162, 132, -188);
  pen.line(84, -213, 100, -213);
  pen.line(85.5, -219, 98.5, -219);
  pen.line(92, -226, 92, -240);
  pen.line(66, -148, 60, -166);
  pen.line(118, -148, 124, -170);
}

function radomes(pen: Pen): void {
  pen.circle(72, -153.5, 5);
  pen.circle(112, -153.5, 5);
  pen.circle(92, -186, 3.2);
}

const LAYERS = (): readonly Layer[] => [
  { stroke: '#5c6670', width: 1.8, build: lattice },
  { stroke: 'rgba(92,102,112,0.9)', width: 0.7, build: braces },
  { fill: '#68727c', stroke: 'rgba(30,36,42,0.5)', width: 0.5, build: platforms },
  { stroke: 'rgba(200,208,214,0.7)', width: 0.5, build: rails },
  { stroke: '#2e353c', width: 0.7, build: antennas },
  { fill: C.white, stroke: 'rgba(60,70,80,0.5)', width: 0.6, build: radomes },
];

const art = new StaticArt(LAYERS, ISLAND_X, DECK_Y);

export function drawMast(ctx: CanvasRenderingContext2D): void {
  art.draw(ctx);
}

/** Rotating antenna seen from the side: width follows |sin|, the face shows when it turns towards the viewer. */
interface Spin {
  cx: number;
  cy: number;
  w: number;
  h: number;
  tilt: number;
}

function planarArray(ctx: CanvasRenderingContext2D, s: Spin, a: number): void {
  const w = Math.max(1.6, s.w * Math.abs(Math.sin(a)));
  const depth = 3 * Math.cos(a);
  const front = Math.sin(a) > 0;
  const body = (pen: Pen, dx: number): void => {
    pen.poly([s.cx - w / 2 + dx + s.tilt, s.cy - s.h / 2, s.cx + w / 2 + dx + s.tilt, s.cy - s.h / 2, s.cx + w / 2 + dx, s.cy + s.h / 2, s.cx - w / 2 + dx, s.cy + s.h / 2]);
  };
  drawLive(ctx, { fill: '#4b545d', build: (pen) => body(pen, -depth) }, ISLAND_X, DECK_Y);
  drawLive(ctx, { fill: front ? '#c3cad0' : '#737d87', stroke: 'rgba(30,36,42,0.6)', width: 0.6, build: (pen) => body(pen, 0) }, ISLAND_X, DECK_Y);
  if (w < 5) return;
  drawLive(ctx, {
    stroke: front ? 'rgba(70,80,90,0.55)' : 'rgba(40,46,52,0.6)',
    width: 0.5,
    build: (pen) => {
      for (let y = s.cy - s.h / 2 + 3; y < s.cy + s.h / 2; y += 3) {
        const k = (y - (s.cy - s.h / 2)) / s.h;
        pen.line(s.cx - w / 2 + s.tilt * (1 - k), y, s.cx + w / 2 + s.tilt * (1 - k), y);
      }
    },
  }, ISLAND_X, DECK_Y);
}

function dish(ctx: CanvasRenderingContext2D, s: Spin, a: number): void {
  const w = Math.max(1.4, s.w * Math.abs(Math.sin(a)));
  const bulge = 5 * Math.cos(a);
  const feed = 9 * Math.cos(a);
  const front = Math.sin(a) > 0;
  drawLive(ctx, {
    stroke: '#3c444c',
    width: 0.9,
    build: (pen) => {
      pen.curve(s.cx, s.cy - s.h / 2, s.cx - bulge * 2, s.cy, s.cx, s.cy + s.h / 2);
      pen.line(s.cx, s.cy, s.cx + feed, s.cy + 1);
    },
  }, ISLAND_X, DECK_Y);
  drawLive(ctx, {
    fill: front ? 'rgba(200,208,214,0.85)' : 'rgba(110,120,130,0.85)',
    stroke: 'rgba(40,48,56,0.7)',
    width: 0.7,
    build: (pen) => pen.ellipse(s.cx, s.cy, w / 2, s.h / 2),
  }, ISLAND_X, DECK_Y);
  drawLive(ctx, { fill: '#5b646d', build: (pen) => pen.rect(s.cx + feed - 1.5, s.cy - 0.5, 3, 3) }, ISLAND_X, DECK_Y);
}

const SPS48: Spin = { cx: 141.5, cy: -143, w: 27, h: 24, tilt: -4 };
const SPS49: Spin = { cx: 26, cy: -162, w: 38, h: 12, tilt: 0 };
const SMALL: Spin = { cx: 92, cy: -183, w: 17, h: 3, tilt: 0 };

export function drawRadars(ctx: CanvasRenderingContext2D, t: number): void {
  dish(ctx, SPS49, t * 1.05 + 1.2);
  planarArray(ctx, SPS48, t * 1.6);
  planarArray(ctx, SMALL, t * 4.2 + 0.5);
}

function lamp(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, glow: string, r: number): void {
  drawLive(ctx, { fill: glow, build: (pen) => pen.circle(x, y, r * 3) }, ISLAND_X, DECK_Y);
  drawLive(ctx, { fill: color, build: (pen) => pen.circle(x, y, r) }, ISLAND_X, DECK_Y);
}

/** Masthead beacon (blinks), yardarm obstruction lights, bridge-wing sidelight and the Pri-Fly status lamp. */
export function drawLights(ctx: CanvasRenderingContext2D, t: number, launched: boolean): void {
  const on = t % 1.4 < 0.22;
  lamp(ctx, 92, -228, on ? '#ff5a4a' : '#6a2622', on ? 'rgba(255,80,60,0.35)' : 'rgba(0,0,0,0)', on ? 2 : 1.4);
  lamp(ctx, 54, -163, '#e0473c', 'rgba(255,70,60,0.12)', 1.1);
  lamp(ctx, 130, -163, '#e0473c', 'rgba(255,70,60,0.12)', 1.1);
  lamp(ctx, 168.5, -87.5, '#5dff8a', 'rgba(90,255,130,0.18)', 1.2);
  const pulse = 0.7 + 0.3 * Math.sin(t * 6);
  const status = launched ? `rgba(80,255,120,${pulse * 0.3})` : `rgba(255,190,60,${pulse * 0.3})`;
  lamp(ctx, -5, -116, launched ? '#7dff9a' : '#ffc23d', status, 1.6);
}

/** Flight-ops flag (white, red diamond) streaming aft from the yardarm in the wind over the deck. */
export function drawFlag(ctx: CanvasRenderingContext2D, t: number): void {
  const at = (k: number, v: number): readonly [number, number] => [54 - k * 15, -158 + v * 9 + Math.sin(t * 9 - k * 4) * 1.7 * k];
  const cloth = (pen: Pen): void => {
    const pts: number[] = [];
    for (let k = 0; k <= 1; k += 0.25) pts.push(...at(k, 0));
    for (let k = 1; k >= 0; k -= 0.25) pts.push(...at(k, 1));
    pen.poly(pts);
  };
  const diamond = (pen: Pen): void => pen.poly([...at(0.5, 0.12), ...at(0.86, 0.5), ...at(0.5, 0.88), ...at(0.14, 0.5)]);
  drawLive(ctx, { stroke: '#2e353c', width: 0.5, build: (pen) => pen.line(54, -162, 54, -146) }, ISLAND_X, DECK_Y);
  drawLive(ctx, { fill: '#f1f3f4', stroke: 'rgba(40,48,56,0.5)', width: 0.4, build: cloth }, ISLAND_X, DECK_Y);
  drawLive(ctx, { fill: '#d8333a', build: diamond }, ISLAND_X, DECK_Y);
}
