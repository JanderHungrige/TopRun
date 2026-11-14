// Dev-only preview of map 7's art (docs 104, 105): http://localhost:5173/dev/art-steppe.html — the four vehicles from
// above and from the side, the invasion army, the five bosses, a strip of each steppe floor. ?part=units|bosses|floors.
import { BOSSES_7 } from '../src/data/bosses-7';
import { ENEMIES_7 } from '../src/data/enemies-7';
import { THEATERS_7 } from '../src/data/theaters-7';
import type { BossId, EnemyKind } from '../src/data/types';
import { TANK_IDS } from '../src/data/types';
import { drawBoss } from '../src/render/draw-bosses';
import { drawEnemy } from '../src/render/draw-enemies';
import { drawPlaneTop } from '../src/render/draw-planes';
import { drawPlaneSide } from '../src/render/draw-planes-side';
import { Terrain } from '../src/render/draw-terrain';

const W = 1280;
const H = 960;
const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
canvas.width = W;
canvas.height = H;
canvas.style.width = '100vw';
const part = new URLSearchParams(location.search).get('part') ?? 'units';
const terrains = Object.values(THEATERS_7).map((th, i) => new Terrain(th, 77 + i));

function units(t: number): void {
  ctx.fillStyle = '#c9a24e';
  ctx.fillRect(0, 0, W, H);
  TANK_IDS.forEach((id, i) => {
    const x = 140 + i * 300;
    drawPlaneTop(ctx, id, x + 10, 140 + 14, 3, { shadow: true, yaw: Math.sin(t) * 0.3 });
    drawPlaneTop(ctx, id, x, 140, 3, { t, yaw: Math.sin(t) * 0.3, turret: Math.sin(t * 0.7) * 0.5, driven: t * 120 });
    drawPlaneSide(ctx, id, x, 360, 2.4, { t });
  });
  (Object.keys(ENEMIES_7) as EnemyKind[]).forEach((k, i) => {
    const x = 90 + (i % 7) * 175;
    const y = 520 + Math.floor(i / 7) * 220;
    const s = k === 'wartripod' ? 1.2 : 2.4;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    drawEnemy(ctx, k, 0, 0, { t: t + i, aim: Math.PI + Math.sin(t) * 0.6, heading: 0 });
    ctx.restore();
  });
}

function bosses(t: number): void {
  ctx.fillStyle = '#b08a3e';
  ctx.fillRect(0, 0, W, H);
  (Object.keys(BOSSES_7) as BossId[]).forEach((id, i) => {
    const x = 220 + (i % 3) * 420;
    const y = 240 + Math.floor(i / 3) * 460;
    const parts = BOSSES_7[id as keyof typeof BOSSES_7].parts.map((p) => ({ id: p.id, alive: true, aim: Math.PI, flash: false }));
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(0.85, 0.85);
    drawBoss(ctx, id, 0, 0, { t, flash: false, parts, damage: 0.2, enraged: false });
    ctx.restore();
  });
}

function floors(dt: number, t: number): void {
  terrains.forEach((tr, i) => {
    tr.update(dt, 40);
    ctx.save();
    ctx.translate(i * 256, 0);
    ctx.beginPath();
    ctx.rect(0, 0, 250, H);
    ctx.clip();
    tr.renderGround(ctx);
    tr.renderSky(ctx, t);
    ctx.restore();
  });
}

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = now / 1000;
  if (part === 'bosses') bosses(t);
  else if (part === 'floors') floors(dt, t);
  else units(t);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
