import { TAU } from '../core/math';
import { MISSIONS } from '../data/missions';
import { THEATERS } from '../data/theaters';
import { THEATER_IDS, type MissionDef, type TheaterId } from '../data/types';
import { isCleared, isUnlocked } from '../game/progress';
import type { SaveData } from '../game/save';
import { makeBlob } from '../render/terrain-art';
import { theaterName } from '../i18n/content';
import { COLORS, text } from '../render/text';

export const MAP_RECT = { x: 20, y: 76, w: 846, h: 628 };

const LABELS: Readonly<Record<TheaterId, { x: number; y: number }>> = {
  pacific: { x: 260, y: 686 },
  gulf: { x: 120, y: 300 },
  arctic: { x: 560, y: 104 },
  canyon: { x: 720, y: 478 },
  leviathan: { x: 690, y: 548 },
};

let cached: HTMLCanvasElement | null = null;

function blobPath(g: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number): void {
  const blob = makeBlob(seed, 18, 0.45);
  g.beginPath();
  blob.forEach((m, i) => {
    const a = (i / blob.length) * TAU;
    const px = x + Math.cos(a) * r * m;
    const py = y + Math.sin(a) * r * m * 0.8;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  });
  g.closePath();
}

interface Land {
  x: number;
  y: number;
  r: number;
  seed: number;
}

function theaterLand(id: TheaterId): Land[] {
  const th = THEATERS[id];
  return MISSIONS.filter((m) => m.theater === id).map((m, i) => ({
    x: m.map.x + (th.base === 'land' ? 0 : ((i * 37) % 50) - 25),
    y: m.map.y + (th.base === 'land' ? 0 : 26),
    r: th.base === 'land' ? 70 : 36 + (i % 3) * 10,
    seed: th.index * 100 + i,
  }));
}

/** Coastline first (thick stroke), then all fills on top, so overlapping blobs merge into one landmass. */
function drawLandmass(g: CanvasRenderingContext2D, id: TheaterId): void {
  const th = THEATERS[id];
  const land = theaterLand(id);
  g.lineWidth = 5;
  g.strokeStyle = th.palette.landDark;
  for (const l of land) {
    blobPath(g, l.x, l.y, l.r, l.seed);
    g.stroke();
  }
  g.fillStyle = th.palette.land;
  for (const l of land) {
    blobPath(g, l.x, l.y, l.r, l.seed);
    g.fill();
  }
}

function drawStatic(g: CanvasRenderingContext2D): void {
  const { x, y, w, h } = MAP_RECT;
  const sea = g.createLinearGradient(0, y, 0, y + h);
  sea.addColorStop(0, '#123653');
  sea.addColorStop(1, '#0b2235');
  g.fillStyle = sea;
  g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(120,180,220,0.08)';
  g.lineWidth = 1;
  for (let gx = x; gx <= x + w; gx += 47) {
    g.beginPath();
    g.moveTo(gx, y);
    g.lineTo(gx, y + h);
    g.stroke();
  }
  for (let gy = y; gy <= y + h; gy += 47) {
    g.beginPath();
    g.moveTo(x, gy);
    g.lineTo(x + w, gy);
    g.stroke();
  }
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  for (const id of THEATER_IDS) drawLandmass(g, id);
  g.restore();
}

function staticLayer(): HTMLCanvasElement {
  if (cached) return cached;
  const c = document.createElement('canvas');
  c.width = 1280;
  c.height = 720;
  const g = c.getContext('2d');
  if (g) drawStatic(g);
  cached = c;
  return c;
}

export function drawMapBase(ctx: CanvasRenderingContext2D): void {
  ctx.drawImage(staticLayer(), 0, 0);
  const { x, y, w, h } = MAP_RECT;
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  for (const id of THEATER_IDS) {
    const l = LABELS[id];
    text(ctx, theaterName(id).toUpperCase(), l.x, l.y, {
      size: 12, display: true, align: 'center', color: 'rgba(255,255,255,0.7)', letterSpacing: 2, stroke: 'rgba(0,0,0,0.45)', strokeWidth: 3,
    });
  }
}

export function drawRoute(ctx: CanvasRenderingContext2D, save: SaveData, t: number): void {
  ctx.lineWidth = 2.5;
  for (let i = 1; i < MISSIONS.length; i++) {
    const a = MISSIONS[i - 1];
    const b = MISSIONS[i];
    if (!a || !b) continue;
    const done = isCleared(save, a);
    ctx.strokeStyle = done ? 'rgba(255,200,61,0.75)' : 'rgba(200,220,240,0.22)';
    ctx.setLineDash(done ? [] : [6, 7]);
    ctx.lineDashOffset = done ? 0 : -t * 12;
    ctx.beginPath();
    ctx.moveTo(a.map.x, a.map.y);
    ctx.lineTo(b.map.x, b.map.y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawStars(ctx: CanvasRenderingContext2D, x: number, y: number, stars: number, size: number): void {
  for (let i = 0; i < 3; i++) {
    text(ctx, '★', x + (i - 1) * size, y, { size, align: 'center', color: i < stars ? COLORS.gold : 'rgba(255,255,255,0.18)' });
  }
}

export function drawNode(ctx: CanvasRenderingContext2D, m: MissionDef, save: SaveData, selected: boolean, t: number): void {
  const boss = m.objective.type === 'boss';
  const r = boss ? 17 : 13;
  const cleared = isCleared(save, m);
  const open = isUnlocked(save, m);
  if (selected) {
    const pr = r + 9 + Math.sin(t * 5) * 2;
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(m.map.x, m.map.y, pr, 0, TAU);
    ctx.stroke();
    for (let k = 0; k < 4; k++) {
      const a = k * (Math.PI / 2) + t;
      ctx.beginPath();
      ctx.moveTo(m.map.x + Math.cos(a) * (pr + 3), m.map.y + Math.sin(a) * (pr + 3));
      ctx.lineTo(m.map.x + Math.cos(a) * (pr + 10), m.map.y + Math.sin(a) * (pr + 10));
      ctx.stroke();
    }
  } else if (open && !cleared) {
    ctx.strokeStyle = `rgba(255,200,61,${0.4 + Math.sin(t * 4) * 0.3})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(m.map.x, m.map.y, r + 6, 0, TAU);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(m.map.x, m.map.y, r, 0, TAU);
  ctx.fillStyle = cleared ? '#2f9e5a' : open ? (boss ? '#b8322e' : '#d39b1f') : '#33414f';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  const label = boss ? '☠' : String(m.number);
  text(ctx, label, m.map.x, m.map.y + 1, { size: boss ? 18 : 12, display: !boss, align: 'center', baseline: 'middle', color: open ? '#fff' : '#8090a0' });
  if (cleared) drawStars(ctx, m.map.x, m.map.y + r + 13, save.progress[m.id]?.stars ?? 0, 10);
}
