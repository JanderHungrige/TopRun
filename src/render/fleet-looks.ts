import { look } from './look';
import { TANK_LOOKS } from './tank-looks';

// The fleet's paint jobs (doc 100): two per theater of maps 3–5 — a region camo once the theater opens, the 3★ reward —
// for the helicopters, the subs and the spacecraft. Generic schemes, no insignia. The helicopters and subs take the base,
// the underside, the camouflage and a trim stripe; the spacecraft its hull (base), shading (under), outlines (ink) and
// accent strips (trim).

const camo = (kind: 'blobs' | 'splinter', colors: readonly string[], cover: readonly number[], size: number, seed: number) =>
  ({ kind, colors, cover, size, seed });

/** Map 3: the helicopters. */
const HELI = {
  fjordsplinter: look('#7f8c93', ['#7f8c93', '#55626b', '#a5b0b4'], {
    under: '#93a0a6', camo: camo('splinter', ['#55626b', '#a5b0b4'], [0.34, 0.3], 1.1, 101), ink: 'rgba(20,28,34,0.6)', gloss: 0.5,
  }),
  northlights: look('#1d2b3e', ['#1d2b3e', '#2fae8f', '#7af0c8'], {
    under: '#24344a', camo: camo('blobs', ['#2fae8f', '#3a6fb0'], [0.2, 0.18], 1.4, 103), trim: '#7af0c8',
    ink: 'rgba(4,8,16,0.75)', panel: 'rgba(150,220,210,0.14)', gloss: 0.8,
  }),
  snowfield: look('#e9edf0', ['#e9edf0', '#9aa3aa', '#c6ccd1'], {
    camo: camo('blobs', ['#9aa3aa', '#c6ccd1'], [0.3, 0.3], 1.2, 107), ink: 'rgba(40,48,56,0.55)', panel: 'rgba(40,48,56,0.2)', gloss: 0.6,
  }),
  rescue: look('#f2f2ee', ['#f2f2ee', '#d8342a', '#2a2c30'], {
    camo: camo('splinter', ['#d8342a'], [0.34], 1.7, 109), trim: '#d8342a', ink: 'rgba(40,40,44,0.55)', panel: 'rgba(40,40,44,0.2)', gloss: 1.2,
  }),
  deltaswamp: look('#5a5d3a', ['#5a5d3a', '#3b4a2a', '#7a6440'], {
    under: '#6a6c48', camo: camo('blobs', ['#3b4a2a', '#7a6440'], [0.35, 0.3], 1.2, 113), ink: 'rgba(14,16,8,0.65)', gloss: 0.4,
  }),
  swamptiger: look('#6b7038', ['#6b7038', '#1a1a14', '#3d4528'], {
    camo: camo('splinter', ['#1a1a14', '#3d4528'], [0.3, 0.22], 0.8, 127), ink: 'rgba(8,10,4,0.7)', gloss: 0.5,
  }),
  mesasand: look('#c9a676', ['#c9a676', '#9c5a32', '#e0c79c'], {
    under: '#d6b98d', camo: camo('blobs', ['#9c5a32', '#e0c79c'], [0.3, 0.28], 1.2, 131), ink: 'rgba(50,30,14,0.6)', gloss: 0.5,
  }),
  redrock: look('#8e3b22', ['#8e3b22', '#c9a676', '#5e2615'], {
    camo: camo('splinter', ['#5e2615', '#c9a676'], [0.3, 0.16], 1.3, 137), trim: '#e0c79c', ink: 'rgba(30,10,4,0.7)', gloss: 0.9,
  }),
  ashgrey: look('#6e6e6c', ['#6e6e6c', '#4a4a49', '#9a9894'], {
    camo: camo('splinter', ['#4a4a49', '#9a9894'], [0.34, 0.3], 1.1, 139), ink: 'rgba(12,12,12,0.65)', gloss: 0.4,
  }),
  lava: look('#1c1a1a', ['#1c1a1a', '#e0561f', '#ffb13b'], {
    camo: camo('blobs', ['#e0561f', '#ffb13b'], [0.16, 0.07], 1.2, 149), ink: 'rgba(0,0,0,0.8)', panel: 'rgba(224,86,31,0.18)', gloss: 0.7,
  }),
};

/** Map 4: the subs. */
const SUB = {
  reefblue: look('#2d6f9c', ['#2d6f9c', '#1d4f74', '#5fa7c9'], {
    under: '#4b8fbd', camo: camo('blobs', ['#1d4f74', '#5fa7c9'], [0.3, 0.24], 1.3, 151), ink: 'rgba(6,20,32,0.7)', gloss: 0.6,
  }),
  coral: look('#f0ece4', ['#f0ece4', '#e46b55', '#2f3a44'], {
    under: '#e46b55', camo: camo('splinter', ['#e46b55'], [0.26], 1.6, 157), trim: '#e46b55', ink: 'rgba(40,30,30,0.55)', gloss: 1.1,
  }),
  kelpgreen: look('#2f4a32', ['#2f4a32', '#1c2e1f', '#5a7a3c'], {
    under: '#3e5c3f', camo: camo('blobs', ['#1c2e1f', '#5a7a3c'], [0.34, 0.26], 1.3, 163), ink: 'rgba(6,12,6,0.72)', gloss: 0.4,
  }),
  serpent: look('#28603f', ['#28603f', '#e8c837', '#173a26'], {
    under: '#3b7a50', camo: camo('splinter', ['#173a26', '#e8c837'], [0.3, 0.12], 1.2, 167), trim: '#e8c837', ink: 'rgba(6,16,10,0.72)', gloss: 0.8,
  }),
  rusthulk: look('#6b4a36', ['#6b4a36', '#9c5a2c', '#3e2d24'], {
    under: '#7d5a43', camo: camo('blobs', ['#9c5a2c', '#3e2d24'], [0.34, 0.3], 1.2, 173), ink: 'rgba(20,10,4,0.7)', gloss: 0.3,
  }),
  ghostship: look('#9fb0a6', ['#9fb0a6', '#7e8f86', '#cfdad2'], {
    under: '#b8c5bd', camo: camo('blobs', ['#7e8f86', '#cfdad2'], [0.3, 0.26], 1.4, 179), ink: 'rgba(30,40,36,0.5)', gloss: 0.6,
  }),
  trenchblack: look('#15191f', ['#15191f', '#222b38', '#3a4656'], {
    under: '#1d232b', camo: camo('splinter', ['#222b38'], [0.35], 1.3, 181), ink: 'rgba(0,0,0,0.8)', panel: 'rgba(120,140,170,0.14)', gloss: 0.4,
  }),
  angler: look('#101317', ['#101317', '#f4d35e', '#2a2f36'], {
    under: '#181c22', trim: '#f4d35e', ink: 'rgba(0,0,0,0.85)', panel: 'rgba(244,211,94,0.14)', gloss: 0.6,
  }),
  abyssviolet: look('#2a1f3d', ['#2a1f3d', '#1a1328', '#4a3a6e'], {
    under: '#3a2c52', camo: camo('blobs', ['#1a1328', '#4a3a6e'], [0.32, 0.26], 1.3, 191), ink: 'rgba(6,2,12,0.75)', gloss: 0.5,
  }),
  kraken: look('#5c1a1f', ['#5c1a1f', '#1a0b0d', '#a3343a'], {
    under: '#74242a', camo: camo('splinter', ['#1a0b0d'], [0.34], 1.4, 193), trim: '#a3343a', ink: 'rgba(10,2,2,0.75)', gloss: 0.6,
  }),
};

/** Map 5: the spacecraft. */
const SHIP = {
  orbitalwhite: look('#eef1f5', ['#eef1f5', '#c3cad3', '#5a6472'], { under: '#c3cad3', ink: 'rgba(30,40,56,0.6)', gloss: 1 }),
  stationstripes: look('#e9edf2', ['#e9edf2', '#2f6fd0', '#b9c3cf'], { under: '#b9c3cf', trim: '#2f6fd0', ink: 'rgba(20,34,60,0.6)', gloss: 1.1 }),
  asteroid: look('#7f7a72', ['#7f7a72', '#5f5b55', '#a39d92'], { under: '#5f5b55', ink: 'rgba(16,14,12,0.7)', gloss: 0.4 }),
  prospector: look('#e2b72a', ['#e2b72a', '#1a1a1a', '#9a7d1c'], { under: '#9a7d1c', trim: '#1a1a1a', ink: 'rgba(30,20,0,0.75)', gloss: 0.8 }),
  lunardust: look('#c9c3b5', ['#c9c3b5', '#a39d90', '#6e695f'], { under: '#a39d90', ink: 'rgba(30,28,24,0.6)', gloss: 0.5 }),
  moonshot: look('#d7dbe0', ['#d7dbe0', '#d0302a', '#a8aeb6'], { under: '#a8aeb6', trim: '#d0302a', ink: 'rgba(30,34,40,0.6)', gloss: 1.4 }),
  ringgold: look('#b8904a', ['#b8904a', '#8a6a33', '#e2c27c'], { under: '#8a6a33', ink: 'rgba(40,26,6,0.7)', gloss: 1.2 }),
  saturn: look('#efe2c2', ['#efe2c2', '#c99a3a', '#c9b48a'], { under: '#c9b48a', trim: '#c99a3a', ink: 'rgba(50,40,20,0.55)', gloss: 1.1 }),
  deepspace: look('#1e1b2b', ['#1e1b2b', '#14121e', '#5a4f8a'], { under: '#14121e', ink: 'rgba(150,140,200,0.55)', gloss: 0.5 }),
  nebula: look('#3b2357', ['#3b2357', '#e24bd1', '#28173d'], { under: '#28173d', trim: '#e24bd1', ink: 'rgba(230,180,240,0.5)', gloss: 1 }),
};

export const FLEET_LOOKS = { ...HELI, ...SUB, ...SHIP, ...TANK_LOOKS };
