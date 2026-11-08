import { TAU } from '../core/math';
import { STOMP, stompRadius } from '../game/mech-walk';

// The mechs' shots and blasts (docs 79, 80): the mortar shell arcing ahead, the plasma lance's green bolt, the rail
// cannon's beam and the Strider's stomp ring. Playfield-local.

interface LobView { x: number; y: number; t: number }
interface LanceView { x: number; y: number }
interface BeamView { x: number; y: number; t: number }

/** A mortar shell in flight: it grows towards the top of its arc and shrinks as it comes down. */
export function mortarShell(ctx: CanvasRenderingContext2D, b: LobView): void {
  const arc = Math.sin(Math.min(1, b.t / 0.6) * Math.PI);
  const s = 3 + arc * 3;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(b.x + arc * 10, b.y + arc * 14, s, s * 0.7, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#4e5a2e';
  ctx.beginPath();
  ctx.ellipse(b.x, b.y, s, s * 1.4, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#d8b030';
  ctx.fillRect(b.x - s, b.y - 1, s * 2, 2);
}

export function plasmaLance(ctx: CanvasRenderingContext2D, l: LanceView, t: number): void {
  const flick = 0.75 + Math.sin(t * 40 + l.y) * 0.25;
  ctx.fillStyle = `rgba(120,255,150,${(0.35 * flick).toFixed(2)})`;
  ctx.beginPath();
  ctx.ellipse(l.x, l.y + 6, 9, 22, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#d8ffe0';
  ctx.beginPath();
  ctx.ellipse(l.x, l.y, 3.5, 12, 0, 0, TAU);
  ctx.fill();
}

export function railBeam(ctx: CanvasRenderingContext2D, b: BeamView): void {
  const a = 1 - b.t / 0.35;
  ctx.fillStyle = `rgba(90,180,255,${(0.35 * a).toFixed(2)})`;
  ctx.fillRect(b.x - 9, 0, 18, b.y);
  ctx.fillStyle = `rgba(230,248,255,${(0.9 * a).toFixed(2)})`;
  ctx.fillRect(b.x - 2.5, 0, 5, b.y);
}

export function stompRing(ctx: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  const r = stompRadius(t);
  const a = Math.max(0, 1 - t / (STOMP.time + 0.3));
  ctx.strokeStyle = `rgba(200,170,110,${(0.7 * a).toFixed(2)})`;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(1, r), Math.max(1, r * 0.8), 0, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,240,200,${(0.5 * a).toFixed(2)})`;
  ctx.lineWidth = 2;
  ctx.stroke();
}
