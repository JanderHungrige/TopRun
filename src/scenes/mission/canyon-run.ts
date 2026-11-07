import type { AudioEngine } from '../../core/audio';
import { CANYON, hitsWall } from '../../game/canyon';
import { PLAYER_RADIUS, type Player } from './player';
import { PF_H, PF_W, type World } from './world';

// Canyon runs in the mission (doc 52): the warning, the start, the crash, and the walls on screen.

/** One tick: the warning before the gorge, its start, and a crash if the helicopter touches a wall. */
export function tickCanyon(w: World, p: Player, audio: AudioEngine, warn: () => void): void {
  const plan = w.canyon;
  if (!plan) return;
  if (!w.canyonWarned && w.t >= plan.at - CANYON.warn) {
    w.canyonWarned = true;
    warn();
  }
  if (w.canyonStart === null && w.t >= plan.at) w.canyonStart = w.terrain.travelled;
  const c = w.canyonAt(p.y);
  if (c && p.alive && hitsWall(p.x, PLAYER_RADIUS + 4, c)) crash(w, p, audio);
}

/** Rock is rock: no roll, dash or armour saves the helicopter. */
function crash(w: World, p: Player, audio: AudioEngine): void {
  p.hull = 0;
  p.alive = false;
  w.crashed = true;
  w.particles.explosion(p.x, p.y, 'huge');
  audio.play('explosionHuge');
  w.addShake(14);
}

const STEP = 12;

/** The gorge's two walls in the theater's dark rock with a light edge. */
export function drawCanyon(ctx: CanvasRenderingContext2D, w: World): void {
  if (w.canyonStart === null) return;
  const left: number[] = [];
  const right: number[] = [];
  for (let y = -STEP; y <= PF_H + STEP; y += STEP) {
    const c = w.canyonAt(y);
    if (!c) continue;
    left.push(c.cx - c.half, y);
    right.push(c.cx + c.half, y);
  }
  if (left.length < 4) return;
  const p = w.terrain.theater.palette;
  wall(ctx, left, 0, p.landDark, p.detail);
  wall(ctx, right, PF_W, p.landDark, p.detail);
}

function wall(ctx: CanvasRenderingContext2D, edge: number[], side: number, rock: string, rim: string): void {
  const y0 = edge[1] ?? 0;
  const y1 = edge[edge.length - 1] ?? 0;
  ctx.beginPath();
  ctx.moveTo(side, y0);
  for (let i = 0; i < edge.length; i += 2) ctx.lineTo(edge[i] ?? 0, edge[i + 1] ?? 0);
  ctx.lineTo(side, y1);
  ctx.closePath();
  ctx.fillStyle = rock;
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fill();
  ctx.beginPath();
  for (let i = 0; i < edge.length; i += 2) {
    const x = (edge[i] ?? 0) + (side === 0 ? -6 : 6);
    if (i === 0) ctx.moveTo(x, edge[i + 1] ?? 0);
    else ctx.lineTo(x, edge[i + 1] ?? 0);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < edge.length; i += 2) {
    if (i === 0) ctx.moveTo(edge[i] ?? 0, edge[i + 1] ?? 0);
    else ctx.lineTo(edge[i] ?? 0, edge[i + 1] ?? 0);
  }
  ctx.strokeStyle = rim;
  ctx.lineWidth = 3;
  ctx.stroke();
}
