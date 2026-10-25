import { rays, shiftRamp, vgrad } from '../pixel/fx';
import { PAL } from '../pixel/palette';
import { path } from '../pixel/path';
import type { Pix } from '../pixel/raster';
import { brows, mouth, nose, type Brows, type Mouth } from './features';
import { gesture, type Hand } from './hands';
import { BASE, D1, D2, face, jawDrop, L1, L2, neck, piece, shaded, strand, torso, type Face } from './parts';
import type { CharacterArt, Frame, Rig } from './types';

/** Admiral "Ace" Kincaid in pixel art: gold aviators, big swept-back hair, choker dress whites dripping with gold. */

const SKIN = PAL.skinTan;
const HAIR = PAL.hairBrown;
const WHITE = PAL.white;
const GOLD = PAL.gold;
const FACE: Face = { w: 17.5, jaw: 13.6, top: 28, chin: 77 };
const BROWS: Brows = { x0: 2.6, x1: 14.6, y: 41.2, th: 2.9, color: HAIR[1] ?? 0 };
const MOUTH: Mouth = { y: 67.5, w: 8.8, grin: true };
const HAND: Hand = { skin: SKIN, sleeve: WHITE };
const RIBBONS = [PAL.red[3], PAL.blue[3], PAL.yellow[3], PAL.green[2], PAL.purple[2], PAL.orange[3]] as const;

/** Night-blue backdrop with a sunburst behind the head. */
function background(p: Pix, f: Frame): void {
  const n = PAL.night;
  vgrad(p, [n[5] ?? 0, n[4] ?? 0, n[3] ?? 0, n[2] ?? 0, n[1] ?? 0], f.t, f.b);
  shiftRamp(p, rays(p, 0, 46, 12, 0.25, 0.1), n, 1);
}

function star(p: Pix, x: number, y: number, r: number, v: number): void {
  if (r * p.k < 1.4) {
    p.set(p.col(x), p.row(y), v);
    return;
  }
  const pa = path();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const d = i % 2 === 0 ? r : r * 0.45;
    pa.line(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  p.fill(pa.close(), v);
}

/** Shoulder boards with stars, aviator wings and the ribbon bar. */
function insignia(p: Pix): void {
  p.fill(path().pair([22, 87, 40.5, 88.8, 46, 95.5, 24.5, 92.2]), GOLD[BASE] ?? 0);
  p.fill(path().pair([23.4, 91.4, 45.2, 94.2, 46, 95.5, 24.5, 92.2]), GOLD[D1] ?? 0);
  p.fill(path().pair([22, 87, 40.5, 88.8, 41, 89.8, 22.4, 88.2]), GOLD[L1] ?? 0);
  for (const s of [-1, 1]) {
    star(p, s * 37, 91.4, 2.1, WHITE[L1] ?? 0);
    star(p, s * 30.5, 90.4, 1.7, WHITE[L1] ?? 0);
  }
  p.fill(path().move(22, 97.6).line(31, 95.6).line(30, 98).line(26.6, 99.4).line(22, 99.8).close(), GOLD[BASE] ?? 0);
  p.paint(p.oval(21.4, 98.6, 1.9, 2.1), GOLD[D1] ?? 0);
  for (let i = 0; i < 6; i++) {
    const m = p.shape(path().rect(15.2 + (i % 3) * 3.9, 102 + Math.floor(i / 3) * 2.4, 3.7, 2.2));
    p.paint(m, RIBBONS[i] ?? 0);
  }
}

function body(p: Pix): void {
  neck(p, SKIN, 8.6, FACE.chin);
  torso(p, WHITE);
  p.line(0, 90, 0, 126, WHITE[D1] ?? 0);
  piece(p, path().move(-10.5, 78.5).quad(0, 82.5, 10.5, 78.5).line(12, 88).quad(0, 92, -12, 88).close(), WHITE, [16, 86, 6.5, 8]);
  for (const s of [-1, 1]) star(p, s * 7.6, 85.6, 1.5, GOLD[BASE] ?? 0);
  for (let i = 0; i < 4; i++) {
    const b = p.oval(0, 95 + i * 8.5, 1.9, 1.9);
    p.paint(b, GOLD[BASE] ?? 0);
    p.set(p.col(-0.6), p.row(94.4 + i * 8.5), GOLD[L2] ?? 0);
  }
  insignia(p);
}

/** The pompadour: a big wave over the forehead swept back over the crown. */
function hairFront(p: Pix): void {
  p.fill(path().pair([15.4, 40, 17.8, 40, 17.6, 53, 16, 53]), HAIR[BASE] ?? 0);
  const m = piece(p, path().move(-17.6, 43).cubic(-19.6, 28, -17.5, 16.5, -7, 12).cubic(5, 7.5, 18.5, 10.5, 20.8, 22)
    .cubic(21.6, 30, 19.4, 37, 17.6, 43).cubic(16.6, 35, 13, 30.5, 7, 30).cubic(1, 29.6, -4, 33.5, -9, 31.6)
    .cubic(-13.5, 30.2, -16.4, 36, -17.6, 43).close(), HAIR, [20, 27, 6.5, 16], [-6, 16, 5, 2.4]);
  p.paint(p.shape(path().move(-12, 22).quad(-6, 13, 8, 13).quad(0, 16, -9, 26).close()), HAIR[L1] ?? 0, m);
  if (p.k < 0.6) return;
  for (const q of [[-11, 31, -9, 18, 5, 12.4], [-3, 30.6, 0, 19, 13, 14.8], [5, 29.8, 10, 22, 18, 20.8]]) strand(p, q, HAIR[L1] ?? 0, m);
  strand(p, [-15, 36, -15, 22, -5, 15.6], HAIR[D2] ?? 0, m);
}

/** Teardrop lenses with a gold rim, a dark-to-blue sheen and two diagonal reflections. */
function aviators(p: Pix): void {
  const g = PAL.glass;
  for (const s of [-1, 1]) {
    const lens = p.shape(path().move(s * 1.8, 46).cubic(s * 6, 44, s * 13, 44, s * 16.6, 45)
      .cubic(s * 17.3, 49.5, s * 15.6, 55.5, s * 11, 57.2).cubic(s * 6.4, 58.8, s * 2.4, 56, s * 1.8, 51).close());
    vgrad(p, [g[1] ?? 0, g[2] ?? 0, g[3] ?? 0, g[4] ?? 0], 46, 57, lens);
    const cx = s * 9.4;
    p.paint(p.shape(path().move(cx - 6.4, 57).line(cx - 3.6, 57).line(cx + 4.4, 44).line(cx + 1.6, 44).close()), g[6] ?? 0, lens);
    p.paint(p.shape(path().move(cx - 1.6, 57).line(cx - 0.4, 57).line(cx + 7.2, 44).line(cx + 6, 44).close()), g[5] ?? 0, lens);
    p.paint(p.border(lens), GOLD[BASE] ?? 0);
    p.paint(p.border(lens, 'u'), GOLD[L1] ?? 0);
  }
  p.line(-5.5, 44.6, 5.5, 44.6, GOLD[BASE] ?? 0);
  p.line(16.6, 45.4, 19.8, 46.2, GOLD[D1] ?? 0);
  p.line(-16.6, 45.4, -19.8, 46.2, GOLD[BASE] ?? 0);
}

function head(p: Pix, r: Rig): void {
  shaded(p, path().move(-18.6, 56).cubic(-25, 42, -26, 19, -14, 10.5).cubic(-5, 4.5, 11, 4.5, 19.5, 11)
    .cubic(26.5, 18, 25.5, 42, 18.6, 56).close(), HAIR, [23, 40, 9, 26]);
  face(p, SKIN, FACE, r);
  if (p.k >= 0.7) p.line(0, 74.2 + jawDrop(r), 0, 75.6 + jawDrop(r), SKIN[D1] ?? 0);
  nose(p, SKIN, 50, 61, 3.4);
  mouth(p, r, MOUTH, SKIN);
  brows(p, r, BROWS);
  hairFront(p);
  aviators(p);
}

export const ADMIRAL: CharacterArt = {
  background,
  body,
  head,
  gesture: (p, r) => gesture(p, r.gesture, HAND),
};
