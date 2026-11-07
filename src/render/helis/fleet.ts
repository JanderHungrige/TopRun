import type { HeliSide, HeliTop } from './heli-art';

// The Tiger, Comanche and Hind as geometry for heli-art.ts (doc 51), from their real dimensions: top views 3.6 units
// per metre (nose up), side views in metres. Generic shapes only, no insignia.

type Ctx = CanvasRenderingContext2D;

function pod(ctx: Ctx, x: number, y0: number, len: number, w: number): void {
  ctx.fillStyle = '#3b4128';
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y0, w, len, w / 2);
  ctx.fill();
  ctx.fillStyle = '#c9c4a8';
  ctx.fillRect(x - w / 2, y0, w, 0.8);
}

function rail(ctx: Ctx, x: number, y0: number, len: number): void {
  for (const dx of [-0.6, 0.6]) {
    ctx.fillStyle = '#6b7052';
    ctx.fillRect(x + dx - 0.4, y0, 0.8, len);
    ctx.fillStyle = '#2a2d22';
    ctx.fillRect(x + dx - 0.4, y0, 0.8, 0.9);
  }
}

/** Eurocopter Tiger: 14 m, a 13 m four-blade rotor with the mast sight on top, twin endplate fins. */
export const TIGER_TOP: HeliTop = {
  body: [0, -21, 0.9, -20.6, 1.5, -19.2, 1.8, -16, 2.0, -11, 2.3, -6, 2.6, -2, 2.6, 3, 2.2, 7, 1.4, 11, 1.0, 16, 0.8, 24,
    0.7, 28, 0, 28.6],
  canopies: [[0, -18.6, 1.2, -17.8, 1.6, -14.5, 1.65, -10.5, 1.4, -7.4, 0, -7]],
  nacelle: [2.2, -3.5, 3.4, -4.4, 4.2, -3.6, 4.4, 3, 3.9, 7, 2.6, 7.6],
  wing: [2.4, -1.2, 7.8, -1.6, 8.1, -0.9, 8.1, 1.2, 7.8, 1.6, 2.5, 1.9],
  stab: [0.7, 24.2, 5.2, 23.8, 5.4, 24.4, 5.4, 26.4, 0.7, 26.8],
  fins: [5.0, 22.6, 5.8, 22.6, 5.9, 28, 5.0, 28],
  stores(ctx) {
    for (const sx of [-1, 1]) {
      pod(ctx, sx * 4.7, -3.6, 6.8, 2.2);
      rail(ctx, sx * 7.2, -4, 5.6);
    }
  },
  hub: { x: 0, y: -3.5 },
  rotor: { r: 23.4, blades: 4, spin: 12 },
  tail: { kind: 'rotor', x: 1.7, y: 26.6, half: 4.3 },
  mast: 1.5,
};

export const TIGER_SIDE: HeliSide = {
  xm: 4.5,
  top: [0, 1.25, 0.4, 1.6, 1.2, 2.0, 2.2, 2.35, 3.4, 2.55, 4.3, 2.9, 5.6, 2.95, 6.6, 2.6, 8.0, 2.1, 12.4, 1.9, 13.4, 2.1],
  bottom: [0, 1.25, 0.4, 0.95, 1.5, 0.8, 3.0, 0.78, 5.5, 0.85, 7.4, 1.1, 8.6, 1.5, 12.4, 1.5, 13.4, 1.6],
  canopies: [[0.7, 1.7, 1.4, 2.15, 2.4, 2.45, 3.4, 2.65, 3.9, 2.7, 3.7, 2.1, 2.3, 1.95, 1.2, 1.6]],
  nacelle: [4.2, 2.5, 4.5, 2.85, 6.8, 2.8, 7.2, 2.5, 7.0, 2.1, 4.4, 2.05],
  wing: [3.6, 1.5, 5.4, 1.55, 5.4, 1.35, 3.8, 1.3],
  fin: [12.6, 1.9, 13.0, 1.9, 13.9, 3.0, 14.1, 3.0, 14.1, 1.5, 13.4, 1.4],
  stab: [12.5, 1.7, 14.0, 1.72, 14.0, 1.6, 12.6, 1.56],
  hub: [4.9, 3.75],
  rotorHalf: 6.5,
  tail: { kind: 'rotor', x: 13.9, h: 2.55, r: 1.2 },
  wheels: [[4.5, 0.32], [12.6, 0.2]],
  mast: 0.55,
};

/** RAH-66 Comanche: 13.2 m, faceted, a 12 m five-blade rotor, a shrouded fan in the tail under a T-tail. */
export const COMANCHE_TOP: HeliTop = {
  body: [0, -21.5, 1.0, -20.8, 2.0, -18.5, 2.8, -14, 3.3, -8, 3.4, -2, 3.2, 4, 2.6, 9, 1.6, 13, 1.2, 18, 1.0, 21, 1.6, 22.5,
    2.0, 25, 1.4, 27, 0, 27.4],
  canopies: [[0, -19.2, 1.4, -18.2, 1.9, -14.5, 2.0, -10.5, 1.6, -7.5, 0, -7]],
  exhaust: [2.0, 6, 2.9, 5.4, 2.6, 9, 1.8, 9.4],
  wing: [3.3, -1.8, 7.0, -2.2, 7.2, -1.4, 7.2, 0.6, 3.2, 1.0],
  stab: [0.9, 23.4, 4.8, 23.2, 5.0, 23.9, 4.8, 25.0, 0.9, 25.2],
  stores(ctx) {
    for (const sx of [-1, 1]) rail(ctx, sx * 5.6, -3.6, 5.2);
  },
  hub: { x: 0, y: -3 },
  rotor: { r: 21.4, blades: 5, spin: 13 },
  tail: { kind: 'fan', x: 0, y: 24.4, half: 2.4 },
};

export const COMANCHE_SIDE: HeliSide = {
  xm: 4.0,
  top: [0, 1.2, 0.5, 1.55, 1.3, 1.95, 2.4, 2.3, 3.4, 2.5, 4.4, 2.8, 5.6, 2.85, 6.8, 2.5, 8.0, 2.0, 10.5, 1.9, 11.4, 2.1,
    12.6, 3.2, 13.2, 3.3],
  bottom: [0, 1.2, 0.5, 0.9, 1.6, 0.72, 3.0, 0.7, 5.6, 0.8, 7.6, 1.05, 9.2, 1.4, 11.2, 1.5, 12.4, 1.4, 13.2, 1.6],
  canopies: [[0.8, 1.7, 1.5, 2.1, 2.5, 2.4, 3.5, 2.6, 4.0, 2.62, 3.8, 2.0, 2.4, 1.85, 1.3, 1.55]],
  wing: [3.4, 1.4, 5.0, 1.45, 5.0, 1.28, 3.5, 1.24],
  fin: [11.3, 1.6, 11.8, 2.2, 12.6, 3.25, 13.2, 3.35, 13.2, 1.5, 12.2, 1.4],
  stab: [12.5, 3.3, 13.4, 3.35, 13.4, 3.22, 12.5, 3.18],
  hub: [4.8, 3.4],
  rotorHalf: 5.95,
  tail: { kind: 'fan', x: 12.45, h: 2.2, r: 0.62 },
  wheels: [[4.0, 0.28], [11.5, 0.18]],
};

/** Mi-24 Hind: 17.5 m, a 17.3 m five-blade rotor, stepped bubble canopies, a cabin, six stations on the stub wings. */
export const HIND_TOP: HeliTop = {
  body: [0, -25, 1.1, -24.5, 2.0, -22.8, 2.6, -19, 3.0, -14, 3.4, -8, 3.6, -2, 3.6, 6, 3.2, 11, 2.2, 15, 1.4, 20, 1.1, 30,
    0.9, 36, 0, 37],
  canopies: [[0, -23.5, 1.4, -22.6, 1.9, -20, 1.9, -17.4, 1.2, -16.2, 0, -16], [0, -15, 1.5, -14.2, 2.0, -11.5, 1.8, -9.2, 0, -8.8]],
  nacelle: [2.6, -8, 3.6, -9.4, 4.6, -8.4, 4.8, 4, 4.2, 7.8, 2.8, 8.4],
  exhaust: [4.4, 6.5, 5.8, 7.2, 5.6, 8.8, 4.2, 8.4],
  wing: [3.4, -2.8, 12.0, -3.6, 12.4, -2.6, 12.4, 1.0, 11.8, 1.6, 3.4, 2.6],
  stab: [1.0, 31.4, 6.4, 30.8, 6.8, 31.6, 6.6, 33.6, 1.0, 34.0],
  stores(ctx) {
    for (const sx of [-1, 1]) {
      pod(ctx, sx * 5.8, -5, 7.4, 2.4);
      pod(ctx, sx * 8.2, -5.2, 7.4, 2.4);
      rail(ctx, sx * 11.2, -5.4, 6.2);
    }
  },
  hub: { x: 0, y: -4 },
  rotor: { r: 31, blades: 5, spin: 9 },
  tail: { kind: 'rotor', x: -2.2, y: 35, half: 6 },
};

export const HIND_SIDE: HeliSide = {
  xm: 6.2,
  top: [0, 1.3, 0.6, 1.8, 1.4, 2.05, 2.4, 2.4, 3.2, 2.3, 3.8, 2.8, 4.8, 3.0, 5.6, 3.6, 9.2, 3.55, 10.2, 3.0, 12.0, 2.6,
    16.2, 2.4, 17.5, 2.6],
  bottom: [0, 1.3, 0.6, 1.0, 1.6, 0.85, 4.0, 0.8, 7.0, 0.9, 9.6, 1.2, 11.4, 1.8, 16.2, 2.0, 17.5, 2.1],
  canopies: [[0.6, 1.8, 1.2, 2.3, 2.2, 2.5, 2.6, 2.3, 2.2, 1.9, 1.0, 1.7], [3.0, 2.4, 3.6, 2.95, 4.6, 3.05, 5.0, 2.8, 4.6, 2.4, 3.4, 2.3]],
  nacelle: [5.2, 3.0, 5.6, 3.7, 9.0, 3.7, 9.6, 3.3, 9.4, 2.9, 5.4, 2.85],
  wing: [5.4, 1.6, 8.4, 1.7, 8.4, 1.45, 5.6, 1.4],
  fin: [16.0, 2.4, 16.4, 2.4, 17.4, 4.0, 17.8, 4.0, 17.6, 2.1, 16.6, 2.0],
  stab: [15.0, 2.15, 16.6, 2.2, 16.6, 2.05, 15.2, 2.0],
  hub: [7.0, 4.4],
  rotorHalf: 8.65,
  tail: { kind: 'rotor', x: 17.4, h: 3.4, r: 1.95 },
  wheels: [[1.6, 0.25], [6.2, 0.38]],
  windows: [[6.0, 2.2], [7.0, 2.25], [8.0, 2.3]],
};
