import { look } from './look';

// The tanks' and buggies' paint jobs (doc 112): two per theater of map 7 — a region camo once the theater opens, the 3★
// reward. Generic schemes, no insignia. Like the helicopters' and subs' (fleet-looks.ts): the base, the underside (the
// turret's shading), the camouflage and a trim stripe, laid over hull and turret / chassis by `paintFleet`.

const camo = (kind: 'blobs' | 'splinter', colors: readonly string[], cover: readonly number[], size: number, seed: number) =>
  ({ kind, colors, cover, size, seed });

export const TANK_LOOKS = {
  steppegold: look('#c4a462', ['#c4a462', '#e2c46a', '#6e6a3a'], {
    under: '#b39352', camo: camo('blobs', ['#e2c46a', '#6e6a3a'], [0.3, 0.24], 1.3, 201), ink: 'rgba(40,28,10,0.65)', gloss: 0.4,
  }),
  grassfire: look('#1e1a16', ['#1e1a16', '#e8641e', '#c42a18'], {
    under: '#2a241e', camo: camo('splinter', ['#e8641e', '#c42a18'], [0.2, 0.14], 1.1, 203), trim: '#ffa33a',
    ink: 'rgba(0,0,0,0.8)', panel: 'rgba(232,100,30,0.16)', gloss: 0.7,
  }),
  saltcrust: look('#ebe8e0', ['#ebe8e0', '#bdbab2', '#8f8c86'], {
    under: '#d4d0c6', camo: camo('splinter', ['#bdbab2'], [0.34], 1.2, 207), ink: 'rgba(50,48,44,0.55)', gloss: 0.6,
  }),
  mirage: look('#a8c8e0', ['#a8c8e0', '#f2f6fa', '#6e94b4'], {
    under: '#90b2cc', camo: camo('blobs', ['#f2f6fa', '#6e94b4'], [0.26, 0.14], 1.4, 209), trim: '#f2f6fa', ink: 'rgba(20,34,52,0.55)', gloss: 1,
  }),
  reddust: look('#a8582e', ['#a8582e', '#d2a06a', '#6e3418'], {
    under: '#93491f', camo: camo('blobs', ['#d2a06a', '#6e3418'], [0.3, 0.26], 1.2, 211), ink: 'rgba(40,14,4,0.65)', gloss: 0.4,
  }),
  raider: look('#3e2a1e', ['#3e2a1e', '#b0502a', '#dcc08e'], {
    under: '#4a3324', camo: camo('splinter', ['#b0502a'], [0.3], 0.9, 213), trim: '#dcc08e', ink: 'rgba(14,6,2,0.75)', gloss: 0.7,
  }),
  barrowmoss: look('#6a6e3c', ['#6a6e3c', '#3c4a26', '#7a5e3a'], {
    under: '#5c6034', camo: camo('blobs', ['#3c4a26', '#7a5e3a'], [0.34, 0.26], 1.3, 217), ink: 'rgba(12,14,6,0.7)', gloss: 0.4,
  }),
  runestone: look('#8a8a82', ['#8a8a82', '#56564f', '#7affc8'], {
    under: '#76766e', camo: camo('splinter', ['#56564f'], [0.32], 1.2, 219), trim: '#7affc8',
    ink: 'rgba(20,20,18,0.7)', panel: 'rgba(122,255,200,0.12)', gloss: 0.5,
  }),
  craterash: look('#38363c', ['#38363c', '#5e5868', '#24222a'], {
    under: '#2e2c32', camo: camo('blobs', ['#5e5868', '#24222a'], [0.3, 0.3], 1.2, 223), ink: 'rgba(0,0,0,0.75)', gloss: 0.4,
  }),
  starfall: look('#1c1428', ['#1c1428', '#c040e0', '#8a5aff'], {
    under: '#241a34', camo: camo('splinter', ['#c040e0'], [0.14], 1.3, 227), trim: '#8a5aff',
    ink: 'rgba(200,160,255,0.45)', panel: 'rgba(192,64,224,0.16)', gloss: 0.9,
  }),
};
