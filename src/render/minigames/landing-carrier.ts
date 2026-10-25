import { deckHeave, deckPitch, DECK, type SeaState } from '../../game/minigames/landing-deck';
import { fillPoly, project, projectLine, projectPoly, v3, type Cam, type Vec3 } from './landing-view';

// Carrier Landing ship (doc 18): an original, unmarked carrier in the dark — hull, flight deck with the angled
// landing area, its paint lines and wires, the island and the wake. Ship coordinates (a forward from the stern,
// b to starboard) are turned 9° to the right of the landing axis; the deck pitches and heaves about the pivot.

const RAD = Math.PI / 180;
const ANG = DECK.angle * RAD;
const STERN = { x: 4, z: -3 };

/** Ship coordinates → landing frame at rest. */
export const ship = (a: number, b: number, y = 0): Vec3 =>
  v3(STERN.x + Math.sin(ANG) * a + Math.cos(ANG) * b, y, STERN.z + Math.cos(ANG) * a - Math.sin(ANG) * b);

export type Frame = (p: Vec3) => Vec3;

/** Maps rest-frame ship points to where the pitching, heaving ship has them now. */
export function shipFrame(sea: SeaState, t: number): Frame {
  const phi = deckPitch(sea, t);
  const h = deckHeave(sea, t);
  const c = Math.cos(phi);
  const s = Math.sin(phi);
  return (p) => {
    const dz = p.z - DECK.pivot;
    return v3(p.x, p.y * c + dz * s + h, DECK.pivot + dz * c - p.y * s);
  };
}

const OUTLINE: readonly (readonly [number, number])[] = [
  [0, -22], [40, -30], [110, -40], [150, -49], [215, -51], [236, -37], [262, -28], [312, -17], [334, -5],
  [334, 6], [300, 25], [230, 37], [120, 38], [40, 31], [0, 20],
];
const DECK_PTS = OUTLINE.map(([a, b]) => ship(a, b));
const WATER_PTS = OUTLINE.map(([a, b]) => ship(Math.min(320, Math.max(8, a)), b * 0.58, -DECK.freeboard));
const LANE = [v3(-DECK.lane, 0.02, 0), v3(DECK.lane, 0.02, 0), v3(DECK.lane, 0.02, DECK.length), v3(-DECK.lane, 0.02, DECK.length)];

interface Box {
  a0: number;
  a1: number;
  b0: number;
  b1: number;
  y0: number;
  y1: number;
}
const ISLAND: readonly Box[] = [
  { a0: 172, a1: 206, b0: 25, b1: 36, y0: 0, y1: 19 },
  { a0: 178, a1: 199, b0: 26, b1: 34, y0: 19, y1: 26 },
];
export const MAST = { top: ship(189, 30, 43), base: ship(189, 30, 26) };

function drawHull(ctx: CanvasRenderingContext2D, cam: Cam, f: Frame): void {
  const n = DECK_PTS.length;
  for (let i = 0; i < n; i++) {
    const a = DECK_PTS[i];
    const b = DECK_PTS[(i + 1) % n];
    const wa = WATER_PTS[i];
    const wb = WATER_PTS[(i + 1) % n];
    if (!a || !b || !wa || !wb) continue;
    fillPoly(ctx, projectPoly(cam, [f(a), f(b), f(wb), f(wa)]), i === n - 1 ? '#0e131a' : '#0a0e14');
  }
}

function drawDeck(ctx: CanvasRenderingContext2D, cam: Cam, f: Frame): void {
  const deck = projectPoly(cam, DECK_PTS.map(f));
  fillPoly(ctx, deck, '#181d24');
  if (deck.length > 2) {
    ctx.strokeStyle = 'rgba(150,170,195,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  fillPoly(ctx, projectPoly(cam, LANE.map(f)), '#181d24');
  ctx.save();
  ctx.lineCap = 'round';
  const line = (a: Vec3, b: Vec3, color: string, w: number): void => {
    const l = projectLine(cam, f(a), f(b));
    if (!l) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(0.6, Math.min(6, w * (l[0].s + l[1].s) * 0.5));
    ctx.beginPath();
    ctx.moveTo(l[0].x, l[0].y);
    ctx.lineTo(l[1].x, l[1].y);
    ctx.stroke();
  };
  for (const side of [-1, 1]) line(v3(side * DECK.lane, 0.03, 0), v3(side * DECK.lane, 0.03, DECK.length), 'rgba(220,226,232,0.22)', 0.3);
  for (let z = 4; z < DECK.length; z += 12) line(v3(0, 0.03, z), v3(0, 0.03, z + 5), 'rgba(220,226,232,0.2)', 0.35);
  for (const w of DECK.wires) line(v3(-DECK.lane + 1, 0.12, w), v3(DECK.lane - 1, 0.12, w), 'rgba(150,160,170,0.55)', 0.09);
  ctx.restore();
}

function boxFaces(b: Box): Vec3[][] {
  const p = (a: number, s: number, y: number): Vec3 => ship(a, s, y);
  return [
    [p(b.a0, b.b0, b.y0), p(b.a0, b.b1, b.y0), p(b.a0, b.b1, b.y1), p(b.a0, b.b0, b.y1)],
    [p(b.a1, b.b0, b.y0), p(b.a1, b.b1, b.y0), p(b.a1, b.b1, b.y1), p(b.a1, b.b0, b.y1)],
    [p(b.a0, b.b0, b.y0), p(b.a1, b.b0, b.y0), p(b.a1, b.b0, b.y1), p(b.a0, b.b0, b.y1)],
    [p(b.a0, b.b1, b.y0), p(b.a1, b.b1, b.y0), p(b.a1, b.b1, b.y1), p(b.a0, b.b1, b.y1)],
    [p(b.a0, b.b0, b.y1), p(b.a1, b.b0, b.y1), p(b.a1, b.b1, b.y1), p(b.a0, b.b1, b.y1)],
  ];
}
const FACE_TONE = ['#0f141a', '#0b0f14', '#111820', '#0b0f14', '#151b22'];

function drawIsland(ctx: CanvasRenderingContext2D, cam: Cam, f: Frame): void {
  for (const box of ISLAND) {
    const faces = boxFaces(box).map((pts, i) => {
      const moved = pts.map(f);
      const c = moved.reduce((acc, p) => v3(acc.x + p.x / 4, acc.y + p.y / 4, acc.z + p.z / 4), v3(0, 0, 0));
      return { moved, tone: FACE_TONE[i] ?? '#0b0f14', d: Math.hypot(c.x - cam.x, c.y - cam.y, c.z - cam.z) };
    });
    faces.sort((a, b) => b.d - a.d);
    for (const face of faces) fillPoly(ctx, projectPoly(cam, face.moved), face.tone);
  }
  const mast = projectLine(cam, f(MAST.base), f(MAST.top));
  if (!mast) return;
  ctx.strokeStyle = '#11171e';
  ctx.lineWidth = Math.max(1, 0.8 * mast[0].s);
  ctx.beginPath();
  ctx.moveTo(mast[0].x, mast[0].y);
  ctx.lineTo(mast[1].x, mast[1].y);
  ctx.stroke();
}

/** The wake on the water behind the stern, along the ship's own axis (does not pitch with the ship). */
function drawWake(ctx: CanvasRenderingContext2D, cam: Cam): void {
  const y = -DECK.freeboard;
  for (const [len, w0, grow, alpha] of [[900, 8, 0.03, 0.06], [220, 5, 0.03, 0.14]] as const) {
    const ks = [0, len * 0.08, len * 0.25, len * 0.5, len * 0.75, len];
    const left = ks.map((k) => ship(-k, -(w0 + grow * k), y));
    const right = ks.map((k) => ship(-k, w0 + grow * k, y)).reverse();
    const near = project(cam, ship(0, 0, y));
    const far = project(cam, ship(-len, 0, y));
    let fill: string | CanvasGradient = `rgba(150,175,200,${alpha * 0.5})`;
    if (near && far) {
      const g = ctx.createLinearGradient(near.x, near.y, far.x, far.y);
      g.addColorStop(0, `rgba(170,195,220,${alpha})`);
      g.addColorStop(1, 'rgba(170,195,220,0)');
      fill = g;
    }
    fillPoly(ctx, projectPoly(cam, [...left, ...right]), fill);
  }
}

/** A faint red glow of the island's deck floodlights. */
function drawDeckGlow(ctx: CanvasRenderingContext2D, cam: Cam, f: Frame): void {
  const p = project(cam, f(ship(175, 18, 0.5)));
  if (!p) return;
  const r = Math.min(300, 32 * p.s);
  if (r < 2) return;
  const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
  g.addColorStop(0, 'rgba(255,70,50,0.09)');
  g.addColorStop(1, 'rgba(255,70,50,0)');
  ctx.fillStyle = g;
  ctx.fillRect(p.x - r, p.y - r, 2 * r, 2 * r);
}

/** The whole ship except its lights. */
export function drawCarrier(ctx: CanvasRenderingContext2D, cam: Cam, f: Frame): void {
  drawWake(ctx, cam);
  drawHull(ctx, cam, f);
  drawDeck(ctx, cam, f);
  drawDeckGlow(ctx, cam, f);
  drawIsland(ctx, cam, f);
}
