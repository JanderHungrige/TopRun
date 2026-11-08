import type { AreaRect } from '../../data/base-areas';
import { hash } from './paint';

// The sea dock's globe (doc 76): a desk globe on a wooden tripod in the room, the way to the campaign map. Drawn in whole
// art pixels on the dock's art layer; the Earth turns slowly under its brass meridian. The jungle base's globe is the
// jungle planet: mostly green land, small blue seas (doc 86).

type Ctx = CanvasRenderingContext2D;

export type GlobeLook = 'earth' | 'jungle';

/** Ocean and land, light → dark, and how much of the sphere is land. */
const LOOKS: Readonly<Record<GlobeLook, { ocean: readonly [string, string, string]; land: readonly [string, string, string]; sea: number }>> = {
  earth: { ocean: ['#5aa6dc', '#2f74b4', '#1d4c80'], land: ['#a8c870', '#6e9a48', '#456a30'], sea: 0.12 },
  jungle: { ocean: ['#5ac8c8', '#2a8a96', '#1a5a66'], land: ['#7ad04a', '#3e8a2a', '#24561c'], sea: -0.18 },
};

const MAP_W = 48;
const MAP_H = 24;
const lands = new Map<GlobeLook, Uint8Array>();

/** A small made-up world map (1 = land), smooth noise thresholded: a few continents and islands. */
function landMap(look: GlobeLook): Uint8Array {
  const known = lands.get(look);
  if (known) return known;
  const out = new Uint8Array(MAP_W * MAP_H);
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      let v = 0;
      for (const [f, w] of [[0.13, 0.6], [0.29, 0.3], [0.61, 0.1]] as const) {
        v += w * (Math.sin(x * f * 2.1 + hash(f * 31) * 6) * Math.cos(y * f * 3.3 + hash(f * 17) * 6) + hash(x * 7.3 + y * 13.1 + f) * 0.35);
      }
      const polar = Math.abs(y - MAP_H / 2) / (MAP_H / 2);
      out[y * MAP_W + x] = v > LOOKS[look].sea || polar > 0.9 ? 1 : 0;
    }
  }
  lands.set(look, out);
  return out;
}

function px(g: Ctx, c: number, r: number, w: number, h: number, color: string): void {
  g.fillStyle = color;
  g.fillRect(c, r, w, h);
}

/** The tripod: three turned wooden legs splaying out to the floor, a brass collar and the spindle up to the sphere. */
function stand(g: Ctx, cx: number, top: number, base: number, R: number): void {
  const dark = '#2a1a10';
  const wood = '#5a341e';
  const light = '#8a5a32';
  for (let r = top; r <= base; r++) {
    const k = (r - top) / Math.max(1, base - top);
    const spread = Math.round(k * R * 0.8);
    px(g, cx - spread - 1, r, 2, 1, wood);
    px(g, cx - spread - 1, r, 1, 1, dark);
    px(g, cx + spread, r, 2, 1, wood);
    px(g, cx + spread + 1, r, 1, 1, dark);
    px(g, cx - 1, r, 2, 1, k < 0.7 ? light : wood);
  }
  px(g, cx - Math.round(R * 0.8) - 2, base, 4, 1, dark);
  px(g, cx + Math.round(R * 0.8) - 1, base, 4, 1, dark);
  px(g, cx - 3, top, 6, 2, '#c8a24a');
  px(g, cx - 3, top + 1, 6, 1, '#8a6a2a');
}

/** The sphere: ocean and land shaded from the upper left, the land map scrolled by the turn. */
function sphere(g: Ctx, cx: number, cy: number, R: number, turn: number, look: GlobeLook): void {
  const map = landMap(look);
  const { ocean: o, land: l } = LOOKS[look];
  for (let dy = -R; dy <= R; dy++) {
    for (let dx = -R; dx <= R; dx++) {
      const d = (dx * dx + dy * dy) / (R * R);
      if (d > 1) continue;
      const z = Math.sqrt(1 - d);
      const lon = Math.atan2(dx / R, z) / Math.PI + turn;
      const lat = Math.asin(dy / R) / Math.PI + 0.5;
      const mx = (((Math.floor(lon * MAP_W) % MAP_W) + MAP_W) % MAP_W);
      const my = Math.min(MAP_H - 1, Math.max(0, Math.floor(lat * MAP_H)));
      const isLand = map[my * MAP_W + mx] === 1;
      const lit = z * 0.7 + (-dx - dy) / (R * 4) + 0.3;
      const k = lit > 0.85 ? 0 : lit > 0.55 ? 1 : 2;
      const ocean = o[k];
      const ground = l[k];
      px(g, cx + dx, cy + dy, 1, 1, isLand ? (my === 0 || my === MAP_H - 1 ? '#e8f0f4' : ground) : ocean);
    }
  }
  px(g, cx - Math.round(R * 0.45), cy - Math.round(R * 0.5), 2, 1, 'rgba(255,255,255,0.7)');
}

/** The brass half meridian on the right of the sphere, tilted like the Earth's axis. */
function meridian(g: Ctx, cx: number, cy: number, R: number): void {
  for (let a = -Math.PI / 2 - 0.4; a <= Math.PI / 2 - 0.4; a += 0.08) {
    px(g, Math.round(cx + Math.cos(a) * (R + 1)), Math.round(cy + Math.sin(a) * (R + 1)), 1, 1, '#c8a24a');
  }
  px(g, cx - 1, cy - R - 2, 2, 1, '#e8c86a');
}

/** The globe filling `r` (logical px; its foot on r's bottom edge), on the art layer of grid size G. */
export function drawDockGlobe(g: Ctx, G: number, r: AreaRect, t: number, look: GlobeLook = 'earth'): void {
  const cx = Math.round((r.x + r.w / 2) / G);
  const base = Math.round((r.y + r.h) / G) - 1;
  const R = Math.max(4, Math.round(r.w / G / 2) - 2);
  const cy = Math.round(r.y / G) + R + 2;
  g.fillStyle = 'rgba(10,20,24,0.4)';
  g.fillRect(cx - R, base, R * 2, 1);
  stand(g, cx, cy + R + 1, base, R);
  sphere(g, cx, cy, R, t * 0.02, look);
  meridian(g, cx, cy, R);
}
