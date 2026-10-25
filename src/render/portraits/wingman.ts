import { puff, sprite, type ArtView } from '../pixel/bust';
import { vgrad } from '../pixel/fx';
import { PAL } from '../pixel/palette';
import { path } from '../pixel/path';
import type { Pix } from '../pixel/raster';
import { brows, eyes, mouth, nose, type Brows, type Eyes, type Mouth } from './features';
import { gesture, part, type Hand } from './hands';
import { BASE, D1, D2, face, L1, L2, neck, piece, quadPts, torso, torsoPath, type Face } from './parts';
import type { CharacterArt, Frame, Rig } from './types';

/** Lt. "Duke" Carter, your wingman, in pixel art: grey helmet with a red stripe, visor up, mask dangling, olive flight suit. */

const SKIN = PAL.skinLight;
const HELM = PAL.helmet;
const OLIVE = PAL.olive;
const RUBBER = PAL.cup;
const FACE: Face = { w: 16.8, jaw: 12, top: 28, chin: 76 };
const EYES: Eyes = { x: 7.3, y: 50, rx: 3.2, ry: 2.3, iris: PAL.irisGreen };
const BROWS: Brows = { x0: 2.4, x1: 13, y: 43.6, th: 2.4, color: PAL.hairChestnut[2] ?? 0 };
const MOUTH: Mouth = { y: 66.6, w: 7.4, grin: true, smirk: 1.4 };
const HAND: Hand = { skin: PAL.glove, sleeve: OLIVE };
const STRAP = OLIVE[1] ?? 0;

/** In the cockpit: open sky (clouds stream past in ambient, under the canopy bow). */
function background(p: Pix, f: Frame): void {
  const s = PAL.sky;
  vgrad(p, [s[2] ?? 0, s[3] ?? 0, s[4] ?? 0, s[5] ?? 0], f.t, f.b);
}

function canopy(p: Pix, l: number, r: number): void {
  const bow = quadPts([l - 4, 62, 0, -26, r + 4, 62], 16);
  p.paint(p.thick(bow, 3.5), PAL.steel[1] ?? 0);
  p.paint(p.thick(bow.map((v, i) => (i % 2 === 1 ? v + 0.6 : v)), 1), PAL.steel[3] ?? 0);
}

function ambient(g: CanvasRenderingContext2D, v: ArtView): void {
  for (let i = 0; i < 3; i++) {
    const x = ((((v.t * 18 + i * 47) % 150) + 150) % 150) - 75;
    puff(g, v, v.ox - x * v.k, v.oy + (24 + i * 22) * v.k, (16 + i * 4) * v.k, 3.4 * v.k, PAL.white[3] ?? 0, 0.6);
  }
  const l = -v.ox / v.k;
  const bow = sprite('canopy', v.W, v.H, v.radio, (p) => canopy(p, l, -l), v.k, v.ox, v.oy);
  if (bow) g.drawImage(bow, 0, 0);
}

function harness(p: Pix): void {
  for (const s of [-1, 1]) p.paint(p.thick([s * 22, 87, s * 17, 104, s * 14, 126], 2.2), STRAP);
  p.paint(p.thick([-17, 109, 17, 109], 1.7), STRAP);
  for (const s of [-1, 1]) part(p, p.shape(path().rect(s * 15.5 - 3, 106.4, 6, 5.2)), PAL.steel, p.oval(s * 15.5 + 3, 111, 3, 2));
  p.paint(p.oval(-27, 99, 4.4, 4.4), PAL.yellow[3] ?? 0);
  p.paint(p.oval(-27, 99, 3.1, 3.1), PAL.red[3] ?? 0);
  p.fill(path().move(-27, 96.4).line(-25.2, 100.6).line(-28.8, 100.6).close(), PAL.white[3] ?? 0);
  part(p, p.shape(path().rect(21, 97.5, 10, 4.6)), PAL.leather, p.blank());
  p.line(23, 99.6, 29, 99.6, PAL.gold[3] ?? 0);
}

function body(p: Pix): void {
  neck(p, SKIN, 8, FACE.chin);
  torso(p, OLIVE);
  p.fill(path().move(-8.4, 84.4).line(8.4, 84.4).line(0, 97).close(), PAL.teeth[2] ?? 0);
  p.fill(path().move(-8.4, 84.4).line(8.4, 84.4).line(0, 91).close(), SKIN[D1] ?? 0);
  const collar = p.shape(path().pair([8, 83.6, 17, 86, 12.4, 97, 2, 97.6]));
  const seam = p.seam(collar);
  p.paint(collar, OLIVE[L1] ?? 0);
  p.paint(seam, OLIVE[D2] ?? 0);
  p.line(0, 98, 0, 126, OLIVE[1] ?? 0, p.shape(torsoPath()));
  harness(p);
}

/** Shell with the face opening, red callsign stripe, raised visor in its housing. */
function helmet(p: Pix): void {
  const m = piece(p, path().move(-15.4, 64).line(-15.4, 48).cubic(-15, 38.5, -10, 35.2, 0, 35.2).cubic(10, 35.2, 15, 38.5, 15.4, 48)
    .line(15.4, 64).quad(18, 69.5, 20.6, 67).cubic(23.2, 56, 23.6, 42, 22.6, 32).cubic(21.6, 16, 13, 8.6, 0, 8.6)
    .cubic(-13, 8.6, -21.6, 16, -22.6, 32).cubic(-23.6, 42, -23.2, 56, -20.6, 67).quad(-18, 69.5, -15.4, 64).close(),
  HELM, [25, 44, 10, 30], [-11, 18, 4, 2.4]);
  p.fill(path().move(-2.8, 8.9).line(2.8, 8.9).line(3.6, 22).line(-3.6, 22).close(), PAL.red[3] ?? 0, m);
  p.fill(path().move(-1, 8.9).line(0.4, 8.9).line(0.6, 21).line(-1.2, 21).close(), PAL.red[4] ?? 0, m);
  p.fill(path().pair([3.6, 9.4, 4.4, 9.6, 5.4, 22, 4.4, 22]), PAL.white[3] ?? 0, m);
  const visor = p.shape(path().move(-19.6, 33).quad(0, 15.4, 19.6, 33).line(19.8, 28).quad(0, 11.6, -19.8, 28).close());
  const g = PAL.glass;
  if (visor.includes(1)) {
    const seam = p.seam(visor);
    p.paint(visor, g[2] ?? 0);
    p.paint(p.oval(0, 30, 30, 6), g[3] ?? 0, visor);
    p.paint(seam, g[1] ?? 0);
  }
  p.line(-12, 25.6, -5, 22.4, g[6] ?? 0, visor);
  p.paint(p.thick(quadPts([-20, 27.6, 0, 10.4, 20, 27.6]), 1.1), HELM[D1] ?? 0);
  for (const s of [-1, 1]) p.paint(p.oval(s * 20.6, 40, 1.6, 1.6), HELM[D2] ?? 0);
}

/** Oxygen mask unclipped on one side, hanging by its strap beside the jaw; it swings on the idle phase. */
function mask(p: Pix, r: Rig): void {
  const hose = p.thick([-25, 88, -33, 104, -31, 128], 3);
  part(p, hose, RUBBER, p.thick([-23.6, 88, -31.6, 104, -29.6, 128], 1.6));
  if (p.k >= 0.7) for (let y = 92; y < 124; y += 3.4) p.line(-36, y - 0.8, -26, y + 0.6, RUBBER[1] ?? 0, hose);
  p.paint(p.thick([-19.6, 62, -20.8, 69], 0.9), STRAP);
  const a = 0.42 + (r.phase === 1 ? 0.07 : -0.05);
  const c = Math.cos(a);
  const s = Math.sin(a);
  const at = (u: number, v: number): [number, number] => [-22 + u * c - v * s, 79 + u * s + v * c];
  const pa = path().move(...at(0, -10)).cubic(...at(7.6, -10), ...at(8.6, 2.6), ...at(5.8, 7.6)).quad(...at(0, 10.6), ...at(-5.8, 7.6))
    .cubic(...at(-8.6, 2.6), ...at(-7.6, -10), ...at(0, -10)).close();
  const m = p.shape(pa);
  part(p, m, RUBBER, p.oval(...at(4, 3), 4, 6, a));
  p.paint(p.oval(...at(-2.4, -4), 1.6, 3, a + 0.3), RUBBER[L2] ?? 0, m);
  p.paint(p.oval(...at(0, 4), 2.8, 2.8), RUBBER[1] ?? 0, m);
  p.paint(p.oval(...at(0, 4), 1.2, 1.2), RUBBER[BASE] ?? 0, m);
}

function head(p: Pix, r: Rig): void {
  face(p, SKIN, FACE, r);
  eyes(p, r, EYES, SKIN);
  brows(p, r, BROWS);
  nose(p, SKIN, 50, 60.4, 3);
  mouth(p, r, MOUTH, SKIN);
  helmet(p);
  mask(p, r);
}

export const WINGMAN: CharacterArt = {
  background,
  ambient,
  body,
  head,
  gesture: (p, r) => gesture(p, r.gesture, HAND),
};
