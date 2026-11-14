import { TAU } from '../core/math';
import { NUKE } from '../game/jets';
import type { World } from '../scenes/mission/world';
import { PF_H, PF_W } from '../game/waves';
import { flame } from './shapes';

// The jets' and helicopters' special effects in the mission (docs 36, 51): the Hind's armour shell, the A-10's muzzle
// flash, the Tornado's nuke. Moved out of mission-render.ts.

/** The Hind's Flying Tank: a pulsing amber shell around the helicopter while nothing gets through. */
export function armourGlow(ctx: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  ctx.strokeStyle = `rgba(255,190,90,${(0.55 + Math.sin(t * 12) * 0.25).toFixed(2)})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 34, 0, TAU);
  ctx.stroke();
}

/** A-10 GAU-8 muzzle flash at the nose. */
export function muzzleFlash(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = 'rgba(255,214,120,0.85)';
  ctx.beginPath();
  ctx.ellipse(x, y, 4, 9, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fffbe6';
  ctx.beginPath();
  ctx.ellipse(x, y + 1, 2, 4, 0, 0, TAU);
  ctx.fill();
}

/** Tornado nuke: the missile climbing, then the burst — a white-out fading over the playfield and a shock ring. */
export function drawNuke(ctx: CanvasRenderingContext2D, world: World, t: number): void {
  const n = world.nuke;
  if (n) {
    flame(ctx, n.x, n.y + 10, 6, 1, t);
    ctx.fillStyle = '#e9ecef';
    ctx.fillRect(n.x - 3, n.y - 10, 6, 20);
    ctx.fillStyle = '#ffd400';
    ctx.fillRect(n.x - 3, n.y - 4, 6, 3);
    ctx.fillStyle = '#c8312a';
    ctx.beginPath();
    ctx.ellipse(n.x, n.y - 10, 3, 4, 0, Math.PI, TAU);
    ctx.fill();
  }
  const b = world.blast;
  if (!b) return;
  const k = b.t / NUKE.burstSec;
  ctx.fillStyle = `rgba(255,252,236,${(0.95 * (1 - k) ** 2).toFixed(3)})`;
  ctx.fillRect(0, 0, PF_W, PF_H);
  ctx.strokeStyle = `rgba(255,230,180,${(0.8 * (1 - k)).toFixed(3)})`;
  ctx.lineWidth = 10 * (1 - k) + 2;
  ctx.beginPath();
  ctx.arc(b.x, b.y, 40 + k * 900, 0, TAU);
  ctx.stroke();
}
