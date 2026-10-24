import { TAU } from '../core/math';
import { drawPlaneSide } from './draw-planes-side';
import { fillPoly } from './shapes';
import { FONT_DISPLAY, text } from './text';

/** Retro sunset over the sea — used behind the title screen. */
export function drawSunset(ctx: CanvasRenderingContext2D, t: number): void {
  const horizon = 470;
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#120a2b');
  sky.addColorStop(0.45, '#4a1a4f');
  sky.addColorStop(0.8, '#c2456b');
  sky.addColorStop(1, '#ffb36b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1280, horizon);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 70; i++) {
    const x = (i * 263) % 1280;
    const y = (i * 97) % 240;
    ctx.globalAlpha = 0.3 + 0.3 * Math.sin(t * 2 + i);
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  ctx.globalAlpha = 1;
  drawSun(ctx, 640, horizon, t);
  const sea = ctx.createLinearGradient(0, horizon, 0, 720);
  sea.addColorStop(0, '#3a1f45');
  sea.addColorStop(1, '#0b0a1a');
  ctx.fillStyle = sea;
  ctx.fillRect(0, horizon, 1280, 720 - horizon);
  for (let i = 0; i < 26; i++) {
    const y = horizon + 6 + i * i * 0.4 + i * 3;
    const w = 220 - i * 6 + Math.sin(t * 2 + i) * 14;
    ctx.fillStyle = `rgba(255,170,110,${0.5 - i * 0.017})`;
    ctx.fillRect(640 - w / 2 + Math.sin(t * 1.5 + i * 0.7) * 8, y, w, 2);
  }
  // Carrier silhouette on the horizon.
  fillPoly(ctx, [880, horizon, 1180, horizon, 1168, horizon + 10, 900, horizon + 10], '#1a1026');
  fillPoly(ctx, [1060, horizon, 1070, horizon - 22, 1100, horizon - 22, 1106, horizon], '#1a1026');
}

function drawSun(ctx: CanvasRenderingContext2D, x: number, horizon: number, t: number): void {
  const r = 150;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 1280, horizon);
  ctx.clip();
  const g = ctx.createLinearGradient(0, horizon - r, 0, horizon);
  g.addColorStop(0, '#ffe46b');
  g.addColorStop(1, '#ff5f7a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, horizon, r, 0, TAU);
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = '#7a2350';
  for (let i = 0; i < 7; i++) {
    const y = horizon - 70 + i * 11 + ((t * 8) % 11);
    ctx.fillRect(x - r, y, r * 2, 2 + i * 0.9);
  }
  ctx.restore();
}

/** Three jets crossing the sunset in formation, looping. */
export function drawFlyby(ctx: CanvasRenderingContext2D, t: number): void {
  const cycle = 9;
  const f = (t % cycle) / cycle;
  const x = -300 + f * 1900;
  const y = 330 - Math.sin(f * Math.PI) * 60;
  const planes = [
    { id: 'f14' as const, dx: 0, dy: 0 },
    { id: 'f16' as const, dx: -120, dy: 34 },
    { id: 'sr71' as const, dx: -150, dy: -40 },
  ];
  for (const p of planes) {
    ctx.strokeStyle = 'rgba(255,230,230,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + p.dx - 60, y + p.dy - 14);
    ctx.lineTo(x + p.dx - 420, y + p.dy - 6);
    ctx.stroke();
    drawPlaneSide(ctx, p.id, x + p.dx, y + p.dy, 0.75, { gear: 0, throttle: 0.8, t, pitch: 0.06 });
  }
}

export function drawLogo(ctx: CanvasRenderingContext2D, cx: number, y: number, t: number): void {
  ctx.save();
  ctx.font = `italic 900 132px ${FONT_DISPLAY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const g = ctx.createLinearGradient(0, y - 110, 0, y + 10);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.45, '#d9e3ee');
  g.addColorStop(0.5, '#8ea3b8');
  g.addColorStop(0.75, '#ffd36b');
  g.addColorStop(1, '#ff8a3d');
  ctx.lineJoin = 'round';
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#3a0d1f';
  ctx.strokeText('TOPGUN', cx, y);
  ctx.fillStyle = g;
  ctx.fillText('TOPGUN', cx, y);
  // Moving glint: a narrow bright gradient band clipped by drawing the text again.
  const shine = cx - 520 + (((t * 0.35) % 1.6) / 1.6) * 1040;
  const glint = ctx.createLinearGradient(shine - 60, 0, shine + 60, 0);
  glint.addColorStop(0, 'rgba(255,255,255,0)');
  glint.addColorStop(0.5, 'rgba(255,255,255,0.55)');
  glint.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glint;
  ctx.fillText('TOPGUN', cx, y);
  ctx.restore();
  text(ctx, 'C A R R I E R   S T R I K E', cx, y + 42, { size: 24, display: true, align: 'center', color: '#ffd36b', stroke: '#3a0d1f', strokeWidth: 5 });
}
