import { createRng, type Rng } from '../core/rng';
import type { TerrainStyle, TheaterPalette } from '../data/theaters';

// The alien steppe's floors (doc 105), top-down: a seamless 256 × 256 base per theater (golden grass blades, a salt crust
// cracked into polygons, banded red earth, short olive grass, black glass with glowing seams) and the rows of features
// that lie on it (drawn in steppe-features.ts).

export type SteppeFeature =
  | 'tussock' | 'boulder' | 'bones' | 'scorch' | 'trail' | 'saltpool' | 'gully' | 'barrow' | 'menhir' | 'henge' | 'pylon' | 'shard';

type Add = (type: SteppeFeature | 'mesa' | 'crater', r: number) => void;

export function steppeRow(style: TerrainStyle, add: Add, r: Rng): void {
  switch (style) {
    case 'grass':
      if (r.chance(0.6)) add('tussock', r.range(8, 16));
      if (r.chance(0.12)) add('boulder', r.range(8, 20));
      if (r.chance(0.04)) add('bones', r.range(30, 50));
      if (r.chance(0.08)) add('scorch', r.range(16, 34));
      if (r.chance(0.035)) add('trail', r.range(200, 300));
      return;
    case 'salt':
      if (r.chance(0.25)) add('saltpool', r.range(20, 60));
      if (r.chance(0.06)) add('boulder', r.range(8, 16));
      if (r.chance(0.05)) add('scorch', r.range(16, 30));
      if (r.chance(0.03)) add('bones', r.range(30, 46));
      return;
    case 'badlands':
      if (r.chance(0.14)) add('mesa', r.range(30, 70));
      if (r.chance(0.2)) add('gully', r.range(30, 60));
      if (r.chance(0.25)) add('boulder', r.range(8, 22));
      if (r.chance(0.1)) add('tussock', r.range(6, 10));
      return;
    case 'barrows':
      if (r.chance(0.15)) add('barrow', r.range(30, 60));
      if (r.chance(0.1)) add('menhir', r.range(6, 10));
      if (r.chance(0.03)) add('henge', r.range(46, 70));
      if (r.chance(0.4)) add('tussock', r.range(6, 12));
      if (r.chance(0.08)) add('boulder', r.range(8, 16));
      return;
    case 'impact':
      if (r.chance(0.2)) add('crater', r.range(20, 60));
      if (r.chance(0.12)) add('pylon', r.range(10, 16));
      if (r.chance(0.3)) add('shard', r.range(8, 18));
      if (r.chance(0.15)) add('scorch', r.range(16, 34));
      return;
    default:
      return;
  }
}

const TILE = 256;

/** Draws `fn` at (x, y) and wrapped across the tile's edges, so the tile stays seamless. */
function wrapped(fn: (x: number, y: number) => void, x: number, y: number): void {
  for (const ox of [-TILE, 0, TILE]) for (const oy of [-TILE, 0, TILE]) fn(x + ox, y + oy);
}

function blades(g: CanvasRenderingContext2D, seed: number, n: number, colors: readonly string[], len: number): void {
  const rng = createRng(seed);
  g.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    const x = rng.next() * TILE;
    const y = rng.next() * TILE;
    const l = len * (0.6 + rng.next() * 0.8);
    const lean = (rng.next() - 0.3) * l * 0.6;
    g.strokeStyle = colors[i % colors.length] ?? '#000';
    wrapped((px, py) => {
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(px + lean, py - l);
      g.stroke();
    }, x, y);
  }
}

/** Soft round patches (darker or lighter ground), wrapped across the edges. */
function patches(g: CanvasRenderingContext2D, seed: number, n: number, color: string, size: number): void {
  const rng = createRng(seed);
  g.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const rx = size * (0.6 + rng.next() * 0.8);
    const ry = rx * (0.5 + rng.next() * 0.4);
    wrapped((x, y) => {
      g.beginPath();
      g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      g.fill();
    }, rng.next() * TILE, rng.next() * TILE);
  }
}

function speckle(g: CanvasRenderingContext2D, seed: number, n: number, color: string, size: number): void {
  const rng = createRng(seed);
  g.fillStyle = color;
  for (let i = 0; i < n; i++) g.fillRect(rng.next() * TILE, rng.next() * TILE, size, size);
}

/** A crust cracked into polygons: a jittered grid, periodic over the tile, its neighbours joined. */
function cracks(g: CanvasRenderingContext2D, seed: number, cell: number, color: string, width: number): void {
  const n = TILE / cell;
  const rng = createRng(seed);
  const jit = Array.from({ length: n * n }, () => [(rng.next() - 0.5) * cell * 0.7, (rng.next() - 0.5) * cell * 0.7] as const);
  const at = (i: number, j: number): [number, number] => {
    const [dx, dy] = jit[((i % n + n) % n) * n + ((j % n + n) % n)] ?? [0, 0];
    return [i * cell + dx, j * cell + dy];
  };
  g.strokeStyle = color;
  g.lineWidth = width;
  for (let i = -1; i <= n; i++) for (let j = -1; j <= n; j++) {
    const [x, y] = at(i, j);
    for (const [di, dj] of [[1, 0], [0, 1], [1, 1]] as const) {
      if (di === 1 && dj === 1 && (i + j) % 2 === 0) continue;
      const [x2, y2] = at(i + di, j + dj);
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x2, y2);
      g.stroke();
    }
  }
}

/** A seamless 256 × 256 floor for a steppe theater. */
export function makeSteppeTile(style: TerrainStyle, p: TheaterPalette): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = TILE;
  c.height = TILE;
  const g = c.getContext('2d');
  if (!g) return c;
  g.fillStyle = p.land;
  g.fillRect(0, 0, TILE, TILE);
  switch (style) {
    case 'grass':
      patches(g, 81, 22, 'rgba(120,90,30,0.14)', 22);
      blades(g, 82, 1500, [p.detail, p.landDark, p.sea, '#e8d48a'], 6);
      break;
    case 'salt':
      speckle(g, 83, 400, 'rgba(160,150,130,0.12)', 2);
      cracks(g, 84, 32, 'rgba(150,140,120,0.4)', 1.2);
      cracks(g, 85, 64, 'rgba(255,255,255,0.5)', 0.8);
      break;
    case 'badlands':
      for (let k = 0; k < 9; k++) {
        g.fillStyle = k % 2 ? 'rgba(80,30,10,0.12)' : 'rgba(255,190,140,0.08)';
        g.fillRect(0, k * 28 + 6, TILE, 10 + (k % 3) * 4);
      }
      speckle(g, 86, 300, 'rgba(60,20,10,0.25)', 3);
      speckle(g, 87, 160, 'rgba(255,220,180,0.15)', 2);
      break;
    case 'barrows':
      patches(g, 88, 18, 'rgba(60,60,30,0.14)', 24);
      blades(g, 89, 900, [p.detail, p.landDark, '#9a9658'], 4);
      speckle(g, 90, 120, 'rgba(0,0,0,0.12)', 2);
      break;
    case 'impact':
      cracks(g, 91, 64, 'rgba(199,125,255,0.4)', 1.6);
      patches(g, 95, 10, 'rgba(0,0,0,0.25)', 26);
      speckle(g, 92, 500, 'rgba(0,0,0,0.25)', 3);
      speckle(g, 93, 80, 'rgba(220,180,255,0.3)', 1.5);
      break;
    default:
      speckle(g, 94, 400, 'rgba(0,0,0,0.1)', 3);
  }
  return c;
}
