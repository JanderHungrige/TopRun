import type { BuildingId } from '../data/outpost';
import { drawMechSide } from './mechs/mech-side';

// The ground base's buildings (doc 82), drawn in code on the generated clearing in whole art pixels (4 logical px), each
// at its level and alive: the generator's core glowing and its towers steaming, the refinery's drill pumping, the
// factory's chimney smoking, the lab's dish turning, the mech bay's crane swinging. Level 0 is a staked-out plot.

type Ctx = CanvasRenderingContext2D;

const A = 4;
const INK = '#1c1a12';

/** A block in art px from the plot's foot (x right, y up), outlined. */
function blk(g: Ctx, ox: number, oy: number, x: number, y: number, w: number, h: number, color: string): void {
  g.fillStyle = INK;
  g.fillRect(ox + (x - 1) * A, oy - (y + h + 1) * A, (w + 2) * A, (h + 2) * A);
  g.fillStyle = color;
  g.fillRect(ox + x * A, oy - (y + h) * A, w * A, h * A);
}

/** A flat fill in art px without an outline. */
function px(g: Ctx, ox: number, oy: number, x: number, y: number, w: number, h: number, color: string): void {
  g.fillStyle = color;
  g.fillRect(ox + x * A, oy - (y + h) * A, w * A, h * A);
}

function puff(g: Ctx, ox: number, oy: number, x: number, y: number, t: number, color: string): void {
  for (let i = 0; i < 4; i++) {
    const k = (t * 0.5 + i / 4) % 1;
    const s = 2 + k * 4;
    g.fillStyle = color.replace('A', (0.55 * (1 - k)).toFixed(2));
    g.fillRect(ox + (x + Math.sin(t + i) * 2 * k - s / 2) * A, oy - (y + k * 22 + s) * A, s * A, s * A);
  }
}

/** The staked-out plot of a building not built yet. */
function plot(g: Ctx, ox: number, oy: number, t: number): void {
  px(g, ox, oy, -20, 0, 40, 3, 'rgba(60,40,20,0.45)');
  for (const x of [-20, 19]) blk(g, ox, oy, x, 0, 1, 6, '#c8a060');
  g.strokeStyle = `rgba(255,200,60,${(0.6 + Math.sin(t * 3) * 0.3).toFixed(2)})`;
  g.lineWidth = A / 2;
  g.beginPath();
  g.moveTo(ox - 19.5 * A, oy - 5 * A);
  g.lineTo(ox + 19.5 * A, oy - 5 * A);
  g.stroke();
  blk(g, ox, oy, -3, 0, 6, 5, '#d8c890');
  px(g, ox, oy, -1, 2, 2, 2, '#c84a2a');
}

function generator(g: Ctx, ox: number, oy: number, lvl: number, t: number): void {
  const glow = 0.6 + Math.sin(t * 2.4) * 0.3;
  if (lvl >= 2) {
    for (const x of [-22, 14]) {
      blk(g, ox, oy, x, 0, 9, 22, '#a8a898');
      px(g, ox, oy, x, 18, 9, 2, '#c8c8b8');
      puff(g, ox, oy, x + 4, 24, t + x, 'rgba(230,240,240,A)');
    }
  }
  blk(g, ox, oy, -12, 0, 24, 14, '#6a6e5a');
  px(g, ox, oy, -12, 12, 24, 2, '#8a8e78');
  blk(g, ox, oy, -5, 3, 10, 8, '#1a2a1a');
  px(g, ox, oy, -4, 4, 8, 6, `rgba(120,255,140,${glow.toFixed(2)})`);
  for (let i = 0; i < 4; i++) px(g, ox, oy, -11 + i * 6, 0, 2, 12, '#4a4e3e');
  if (lvl >= 3) {
    blk(g, ox, oy, -8, 14, 16, 8, '#8a8e78');
    px(g, ox, oy, -6, 22, 12, 4, `rgba(120,255,140,${(glow * 0.8).toFixed(2)})`);
    blk(g, ox, oy, 24, 0, 2, 34, '#5a5a4a');
    px(g, ox, oy, 23, 33, 4, 1, Math.sin(t * 4) > 0 ? '#ff4a3a' : '#5a1a1a');
  }
}

function refinery(g: Ctx, ox: number, oy: number, lvl: number, t: number): void {
  const pump = Math.round(Math.sin(t * 3) * 3);
  blk(g, ox, oy, -16, 0, 14, 6, '#7a5a3a'); // the ore pile
  px(g, ox, oy, -14, 6, 10, 3, '#8a6a42');
  for (const dx of [0, 7]) blk(g, ox, oy, dx, 0, 2, 30, '#8a7a5a');
  for (let y = 4; y < 30; y += 6) px(g, ox, oy, 1, y, 7, 1, '#6a5a3a');
  blk(g, ox, oy, -2, 28, 13, 3, '#6a6e5a');
  blk(g, ox, oy, 2, 10 + pump, 5, 10, '#c8a040'); // the pumping head
  if (lvl >= 2) {
    blk(g, ox, oy, 12, 0, 12, 12, '#7a7e6a');
    px(g, ox, oy, 12, 10, 12, 2, '#9a9e88');
    for (let i = 0; i < 3; i++) px(g, ox, oy, -12 + ((t * 6 + i * 5) % 14), 9, 2, 2, '#c8a060'); // ore on the belt
    px(g, ox, oy, -14, 8, 16, 1, '#3a3a2a');
  }
  if (lvl >= 3) {
    blk(g, ox, oy, 26, 0, 10, 18, '#9a9a88');
    px(g, ox, oy, 26, 16, 10, 2, '#b8b8a4');
    puff(g, ox, oy, 31, 20, t * 1.3, 'rgba(200,190,170,A)');
  }
}

function factory(g: Ctx, ox: number, oy: number, lvl: number, t: number): void {
  const w = lvl >= 2 ? 34 : 24;
  blk(g, ox, oy, -w / 2, 0, w, 14, '#7a6a4a');
  for (let x = -w / 2; x < w / 2; x += 3) px(g, ox, oy, x, 14, 2, 4, '#8a8a7a'); // the corrugated roof
  px(g, ox, oy, -w / 2, 14, w, 1, '#5a5a4a');
  blk(g, ox, oy, -4, 0, 8, 9, '#3a3020');
  px(g, ox, oy, -3, 0, 6, 8, '#2a2418');
  blk(g, ox, oy, w / 2 - 6, 14, 4, 14, '#6a5a44');
  puff(g, ox, oy, w / 2 - 4, 28, t, 'rgba(90,90,80,A)');
  if (lvl >= 2) {
    for (let i = 0; i < 3; i++) blk(g, ox, oy, -w / 2 - 10 + i * 4, 0, 3, 3 + (i % 2) * 3, '#6a7a3a');
    px(g, ox, oy, -w / 2 - 10, 0, 1, 1, '#c84a2a');
  }
  if (lvl >= 3) {
    blk(g, ox, oy, w / 2 + 2, 0, 2, 32, '#c8a040');
    blk(g, ox, oy, w / 2 - 10, 30, 14, 2, '#c8a040');
    px(g, ox, oy, w / 2 - 8 + Math.round(Math.sin(t * 0.8) * 4), 24, 1, 6, '#3a3a2a');
    blk(g, ox, oy, -w / 2 + 2, 14, 4, 12, '#6a5a44');
    puff(g, ox, oy, -w / 2 + 4, 26, t + 1.7, 'rgba(90,90,80,A)');
  }
}

function lab(g: Ctx, ox: number, oy: number, lvl: number, t: number): void {
  blk(g, ox, oy, -12, 0, 24, 13, '#8a6a42');
  px(g, ox, oy, -12, 11, 24, 2, '#a8865a');
  blk(g, ox, oy, -8, 4, 7, 5, '#1a2a1a');
  px(g, ox, oy, -7, 5, 5, 3, `rgba(120,255,140,${(0.6 + Math.sin(t * 1.7) * 0.3).toFixed(2)})`);
  blk(g, ox, oy, 4, 0, 5, 9, '#5a4028');
  const turn = Math.sin(t * 0.6);
  blk(g, ox, oy, -2, 13, 2, 6, '#7a7e6a');
  blk(g, ox, oy, -5 + Math.round(turn), 18, 8, 2, '#c8c8b8'); // the dish
  if (lvl >= 2) {
    blk(g, ox, oy, 14, 0, 14, 9, 'rgba(160,220,180,0.55)');
    for (const x of [16, 20, 24]) px(g, ox, oy, x, 2, 2, 3, '#4a8a3a'); // plants in the greenhouse
  }
  if (lvl >= 3) {
    blk(g, ox, oy, -22, 0, 7, 12, '#5a6e5a');
    px(g, ox, oy, -21, 2, 5, 8, `rgba(120,255,200,${(0.5 + Math.sin(t * 3) * 0.3).toFixed(2)})`);
    blk(g, ox, oy, 10, 13, 1, 18, '#5a5a4a');
    px(g, ox, oy, 9, 31, 3, 1, Math.sin(t * 5) > 0 ? '#5affd0' : '#1a3a30');
  }
}

function mechbay(g: Ctx, ox: number, oy: number, lvl: number, t: number): void {
  const w = lvl >= 2 ? 40 : 28;
  for (const x of [-w / 2, w / 2 - 2]) blk(g, ox, oy, x, 0, 2, 30, '#6a6e5a');
  blk(g, ox, oy, -w / 2, 30, w, 2, '#6a6e5a');
  if (lvl >= 2) px(g, ox, oy, -w / 2, 26, w, 4, '#3a5a2a'); // camo netting
  g.save();
  g.translate(ox - (lvl >= 3 ? 9 : 0) * A, oy);
  g.scale(1.6, 1.6);
  drawMechSide(g, lvl >= 3 ? 'titan' : lvl >= 2 ? 'ranger' : 'strider', { t, stride: 0 });
  g.restore();
  if (lvl >= 3) {
    g.save();
    g.translate(ox + 11 * A, oy);
    g.scale(1.4, 1.4);
    drawMechSide(g, 'hornet', { t, stride: 0 });
    g.restore();
    blk(g, ox, oy, w / 2 + 2, 0, 2, 38, '#c8a040');
    blk(g, ox, oy, -4, 36, w / 2 + 8, 2, '#c8a040');
    px(g, ox, oy, Math.round(Math.sin(t * 0.5) * 6), 28, 1, 8, '#3a3a2a');
  }
}

/** One building at its level, its foot at (x, ground) in logical px. */
export function drawBuilding(g: Ctx, id: BuildingId, level: number, x: number, ground: number, t: number): void {
  const ox = Math.round(x / A) * A;
  const oy = Math.round(ground / A) * A;
  g.fillStyle = 'rgba(0,0,0,0.25)';
  g.beginPath();
  g.ellipse(ox, oy, 26 * A, 4 * A, 0, 0, Math.PI * 2);
  g.fill();
  if (level <= 0) return plot(g, ox, oy, t);
  switch (id) {
    case 'generator': return generator(g, ox, oy, level, t);
    case 'refinery': return refinery(g, ox, oy, level, t);
    case 'factory': return factory(g, ox, oy, level, t);
    case 'lab': return lab(g, ox, oy, level, t);
    case 'mechbay': return mechbay(g, ox, oy, level, t);
    default: throw new Error(`unhandled: ${id satisfies never}`);
  }
}
