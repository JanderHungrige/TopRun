// Dev-only preview of the detailed enemies (docs 115–120): http://localhost:5173/dev/art-detail.html?world=7 — each kind of
// the world large, then at mission size live, flashed, as its shadow and as a wreck; ?part=bosses shows the bosses.
// It draws once at a fixed time (a hidden tab runs no animation frames); ?t=… picks the time.
import { BOSSES } from '../src/data/bosses';
import { ENEMIES } from '../src/data/enemies';
import type { BossId, CampaignId, EnemyKind } from '../src/data/types';
import { drawBoss } from '../src/render/draw-bosses';
import { drawEnemy, drawWreck } from '../src/render/draw-enemies';
import { MISSIONS_BY } from './art-detail-kinds';

const W = 1280;
const H = 960;
const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
canvas.width = W * 2;
canvas.height = H * 2;
canvas.style.width = '100vw';
ctx.scale(2, 2);
const q = new URLSearchParams(location.search);
const world = Number(q.get('world') ?? 7) as CampaignId;
const t = Number(q.get('t') ?? 1.3);
const { kinds, bosses } = MISSIONS_BY(world);

function units(): void {
  ctx.fillStyle = q.get('bg') ?? '#c9a24e';
  ctx.fillRect(0, 0, W, H);
  kinds.forEach((k: EnemyKind, i: number) => {
    const r = ENEMIES[k].radius;
    const big = Math.min(4, 46 / r);
    const x = 70 + (i % 7) * 175;
    const y = 80 + Math.floor(i / 7) * 330;
    ctx.save();
    ctx.translate(x, y + 40);
    ctx.scale(big, big);
    drawEnemy(ctx, k, 0, 0, { t, aim: Math.PI - 0.5, heading: 0 });
    ctx.restore();
    const sy = y + 170;
    drawEnemy(ctx, k, x - 50 + 4, sy + 6, { t, heading: 0, shadow: true });
    drawEnemy(ctx, k, x - 50, sy, { t, aim: Math.PI + 0.4, heading: 0 });
    drawEnemy(ctx, k, x, sy, { t, heading: 0, flash: true });
    drawEnemy(ctx, k, x + 50, sy, { t, heading: 0, shadow: true });
    drawWreck(ctx, k, x + 10, sy + 80, t);
  });
}

function bossSheet(): void {
  ctx.fillStyle = q.get('bg') ?? '#c9a24e';
  ctx.fillRect(0, 0, W, H);
  bosses.forEach((id: BossId, i: number) => {
    const def = BOSSES[id];
    const x = 200 + (i % 3) * 420;
    const y = 220 + Math.floor(i / 3) * 460;
    const parts = def.parts.map((d, k) => ({ id: d.id, alive: k !== 0, flash: false, aim: Math.PI - 0.4 }));
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(0.9, 0.9);
    drawBoss(ctx, id, 0, 0, { t, flash: false, enraged: false, damage: 0.2, parts } as Parameters<typeof drawBoss>[4]);
    ctx.restore();
  });
}

if (q.get('part') === 'bosses') bossSheet();
else units();
