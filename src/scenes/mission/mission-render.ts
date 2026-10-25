import { TAU } from '../../core/math';
import { drawEnemy, drawWreck } from '../../render/draw-enemies';
import { drawPlaneTop } from '../../render/draw-planes';
import { flame } from '../../render/shapes';
import type { Player } from './player';
import { drawPickups } from './pickups';
import { PF_H, PF_W, type Enemy, type World } from './world';

const SHADOW_DX = 16;
const SHADOW_DY = 26;

function drawEnemyUnit(ctx: CanvasRenderingContext2D, e: Enemy, t: number): void {
  drawEnemy(ctx, e.kind, e.x, e.y, { t: t + e.phase, flash: e.flash > 0, heading: e.heading, aim: e.aim, bank: Math.max(-1, Math.min(1, -e.vx / 200)) });
}

function drawShots(ctx: CanvasRenderingContext2D, world: World): void {
  for (const b of world.bullets) {
    if (b.kind === 'gun' || b.kind === 'wingman') {
      ctx.fillStyle = '#fff6b0';
      ctx.fillRect(b.x - 1.5, b.y - 7, 3, 12);
    } else if (b.kind === 'flak') {
      ctx.fillStyle = '#ffd36b';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = '#ff5a3c';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffe0a0';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2, 0, TAU);
      ctx.fill();
    }
  }
  for (const m of world.missiles) {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.heading);
    ctx.fillStyle = m.kind === 'enemy' ? '#c94a3a' : m.kind === 'aim54' ? '#f0f0f0' : '#d8dde2';
    ctx.fillRect(-2, -8, 4, 14);
    ctx.fillStyle = '#555';
    ctx.fillRect(-4, 4, 8, 2);
    flame(ctx, 0, 6, 4, 0.5, m.ttl * 10);
    ctx.restore();
  }
  for (const f of world.flares) {
    ctx.fillStyle = `rgba(255,220,120,${Math.min(1, f.ttl)})`;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 4 + Math.sin(f.ttl * 30) * 1.5, 0, TAU);
    ctx.fill();
  }
}

function drawBombs(ctx: CanvasRenderingContext2D, world: World): void {
  for (const b of world.bombs) {
    const s = 1 - b.t * 0.9;
    ctx.fillStyle = '#4c5340';
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, 3.5 * s + 1, 8 * s + 2, 0, 0, TAU);
    ctx.fill();
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, t: number): void {
  if (!p.alive) return;
  const blink = p.invuln > 0 && p.invuln < 0.6 && Math.floor(t * 20) % 2 === 0;
  const special = p.stats.plane.special;
  const rolling = special === 'roll' && p.specialActive > 0;
  const bank = rolling ? Math.cos((1 - p.specialActive / 0.7) * TAU) : p.bank;
  const dash = special === 'dash' && p.specialActive > 0;
  const opts = { bank, t, throttle: dash ? 1 : 0.4 + p.forward * 0.5, sweep: 0.2 + p.forward * 0.8, livery: p.stats.livery };
  drawPlaneTop(ctx, p.stats.plane.id, p.x + SHADOW_DX, p.y + SHADOW_DY, 1, { ...opts, shadow: true });
  if (p.wingman) {
    drawPlaneTop(ctx, 'f14', p.wingman.x + SHADOW_DX, p.wingman.y + SHADOW_DY, 0.9, { shadow: true });
    drawPlaneTop(ctx, 'f14', p.wingman.x, p.wingman.y, 0.9, { t, throttle: 0.5 });
  }
  if (!blink) drawPlaneTop(ctx, p.stats.plane.id, p.x, p.y, 1, opts);
  if (dash) {
    ctx.strokeStyle = 'rgba(180,220,255,0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const lx = p.x - 40 + ((i * 37) % 80);
      ctx.beginPath();
      ctx.moveTo(lx, p.y + 20 + ((t * 900 + i * 53) % 120));
      ctx.lineTo(lx, p.y + 60 + ((t * 900 + i * 53) % 120));
      ctx.stroke();
    }
  }
}

export function renderWorld(ctx: CanvasRenderingContext2D, world: World, p: Player, t: number): void {
  world.terrain.renderGround(ctx);
  for (const w of world.wrecks) drawWreck(ctx, w.kind, w.x, w.y, t);
  for (const e of world.enemies) if (e.layer === 'ground') drawEnemyUnit(ctx, e, t);
  if (world.boss?.def.layer === 'ground') world.boss.render(ctx);
  drawBombs(ctx, world);
  for (const e of world.enemies) {
    if (e.layer === 'air') drawEnemy(ctx, e.kind, e.x + SHADOW_DX, e.y + SHADOW_DY, { t, shadow: true, heading: e.heading });
  }
  drawPickups(ctx, world);
  for (const e of world.enemies) if (e.layer === 'air') drawEnemyUnit(ctx, e, t);
  if (world.boss?.def.layer === 'air') world.boss.render(ctx);
  drawShots(ctx, world);
  drawPlayer(ctx, p, t);
  world.particles.render(ctx);
  world.terrain.renderSky(ctx, t);
}

export function clipPlayfield(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.rect(0, 0, PF_W, PF_H);
  ctx.clip();
}
