import type { Contact } from '../../game/cockpit';
import type { Dial } from './layout';
import { PHOSPHOR, roundBezel, rr, screenText } from './metal';

/** Green-phosphor radar CRT: static scope for the plate cache, live sweep + blips per frame. */

const TAU = Math.PI * 2;
const SCREEN = 0.86; // CRT radius as a fraction of the dial radius
const TRAIL = 1.7; // afterglow behind the beam (rad)
const GREEN = '98,240,138';

export function radarStatic(ctx: CanvasRenderingContext2D, d: Dial, seed: number): void {
  const R = d.r * SCREEN;
  roundBezel(ctx, d.cx, d.cy, d.r, R, seed);
  const g = ctx.createRadialGradient(d.cx, d.cy, R * 0.05, d.cx, d.cy, R);
  g.addColorStop(0, '#0d2e19');
  g.addColorStop(1, '#03100a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(d.cx, d.cy, R, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = `rgba(${GREEN},0.2)`;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (const k of [1 / 3, 2 / 3, 0.985]) {
    ctx.moveTo(d.cx + R * k, d.cy);
    ctx.arc(d.cx, d.cy, R * k, 0, TAU);
  }
  ctx.moveTo(d.cx - R, d.cy);
  ctx.lineTo(d.cx + R, d.cy);
  ctx.moveTo(d.cx, d.cy - R);
  ctx.lineTo(d.cx, d.cy + R);
  for (let i = 0; i < 36; i++) {
    const a = (i * TAU) / 36;
    const l = i % 3 === 0 ? 7 : 3.5;
    ctx.moveTo(d.cx + Math.cos(a) * R, d.cy + Math.sin(a) * R);
    ctx.lineTo(d.cx + Math.cos(a) * (R - l), d.cy + Math.sin(a) * (R - l));
  }
  ctx.stroke();
  ctx.fillStyle = PHOSPHOR; // own ship
  ctx.beginPath();
  ctx.moveTo(d.cx, d.cy - 6);
  ctx.lineTo(d.cx + 4.5, d.cy + 4.5);
  ctx.lineTo(d.cx, d.cy + 2.4);
  ctx.lineTo(d.cx - 4.5, d.cy + 4.5);
  ctx.closePath();
  ctx.fill();
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

/** One contact; `glow` 0..1 fades from the moment the beam passed it. */
function blip(ctx: CanvasRenderingContext2D, c: Contact, x: number, y: number, glow: number, t: number): void {
  switch (c.kind) {
    case 'air':
    case 'ground': {
      ctx.fillStyle = `rgba(${GREEN},${(glow * 0.25).toFixed(3)})`;
      dot(ctx, x, y, 6);
      ctx.fillStyle = `rgba(${GREEN},${(0.25 + glow * 0.75).toFixed(3)})`;
      if (c.kind === 'air') dot(ctx, x, y, 2.6);
      else ctx.fillRect(x - 2.4, y - 2.4, 4.8, 4.8);
      return;
    }
    case 'boss': {
      ctx.fillStyle = `rgba(${GREEN},${(0.15 + glow * 0.3).toFixed(3)})`;
      dot(ctx, x, y, 11);
      ctx.fillStyle = `rgba(190,255,205,${(0.5 + glow * 0.5).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(x, y - 7);
      ctx.lineTo(x + 7, y);
      ctx.lineTo(x, y + 7);
      ctx.lineTo(x - 7, y);
      ctx.closePath();
      ctx.fill();
      return;
    }
    case 'missile': {
      if (Math.floor(t * 8) % 2 === 1) return;
      ctx.fillStyle = 'rgba(255,74,58,0.3)';
      dot(ctx, x, y, 6);
      ctx.fillStyle = '#ff5a48';
      dot(ctx, x, y, 2.6);
      return;
    }
    case 'upcoming':
      ctx.strokeStyle = `rgba(255,178,60,${(0.35 + glow * 0.65).toFixed(3)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(x, y, 3.6, 0, TAU);
      ctx.stroke();
      return;
    default:
      throw new Error(`unhandled: ${c.kind satisfies never}`);
  }
}

function earlyTag(ctx: CanvasRenderingContext2D, d: Dial, R: number, label: string, t: number): void {
  const a = 0.75 + Math.sin(t * 5) * 0.25;
  ctx.strokeStyle = `rgba(255,178,60,${(0.5 * a).toFixed(3)})`;
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(d.cx, d.cy, R - 2, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  rr(ctx, d.cx - 34, d.cy + R * 0.62 - 7, 68, 14, 3);
  ctx.fillStyle = 'rgba(40,24,4,0.85)';
  ctx.fill();
  ctx.strokeStyle = `rgba(255,178,60,${a.toFixed(3)})`;
  ctx.lineWidth = 1;
  ctx.stroke();
  screenText(ctx, label, d.cx, d.cy + R * 0.62, { size: 9, align: 'center', maxW: 62, color: '#ffb23c', weight: 800 });
}

/** Jamming (doc 44): flickering noise over the whole scope. */
export function radarJammed(ctx: CanvasRenderingContext2D, d: Dial, t: number): void {
  const R = d.r * SCREEN;
  ctx.save();
  ctx.beginPath();
  ctx.arc(d.cx, d.cy, R, 0, TAU);
  ctx.clip();
  const seed = Math.floor(t * 20);
  for (let i = 0; i < 140; i++) {
    const h = Math.sin((seed + i) * 12.9898) * 43758.5453;
    const k = h - Math.floor(h);
    const a = k * TAU * 7;
    const r = Math.sqrt((Math.sin(i * 78.233 + seed) * 0.5 + 0.5)) * R;
    ctx.fillStyle = `rgba(${GREEN},${(0.25 + k * 0.55).toFixed(2)})`;
    ctx.fillRect(d.cx + Math.cos(a) * r, d.cy + Math.sin(a) * r, 2 + k * 3, 1.5);
  }
  ctx.restore();
}

export function radarLive(
  ctx: CanvasRenderingContext2D, d: Dial, contacts: readonly Contact[], early: boolean, earlyLabel: string, t: number,
): void {
  const R = d.r * SCREEN;
  const beam = (((t * Math.PI) % TAU) + TAU) % TAU - Math.PI / 2; // 2 s per turn, clockwise from 12 o'clock
  ctx.save();
  ctx.beginPath();
  ctx.arc(d.cx, d.cy, R, 0, TAU);
  ctx.clip();
  const g = ctx.createConicGradient(beam - TRAIL, d.cx, d.cy);
  g.addColorStop(0, `rgba(${GREEN},0)`);
  g.addColorStop(TRAIL / TAU, `rgba(${GREEN},0.3)`);
  g.addColorStop(TRAIL / TAU + 0.002, `rgba(${GREEN},0)`);
  g.addColorStop(1, `rgba(${GREEN},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(d.cx - R, d.cy - R, R * 2, R * 2);
  ctx.strokeStyle = `rgba(${GREEN},0.9)`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(d.cx, d.cy);
  ctx.lineTo(d.cx + Math.cos(beam) * R, d.cy + Math.sin(beam) * R);
  ctx.stroke();
  for (const c of contacts) {
    const since = (((beam - Math.atan2(c.y, c.x)) % TAU) + TAU) % TAU;
    const fade = 1 - since / TAU;
    blip(ctx, c, d.cx + c.x * R * 0.96, d.cy + c.y * R * 0.96, fade * fade, t);
  }
  if (early) earlyTag(ctx, d, R, earlyLabel, t);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; // glass reflection
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(d.cx, d.cy, R * 0.82, Math.PI * 1.1, Math.PI * 1.45);
  ctx.stroke();
}
