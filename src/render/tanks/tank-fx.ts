import type { Sentry } from '../../scenes/mission/tank-mission';
import type { Mine } from '../../scenes/mission/tank-weapons';

// The tanks' leftovers in the mission (docs 104, 108): the Lynx's sentry gun on its tripod, turning to its target and
// blinking as its life runs out; the mine layer's mines, their light blinking green while they arm, red once armed.

export function drawTankFx(ctx: CanvasRenderingContext2D, sentry: Sentry | null, mines: readonly Mine[], t: number): void {
  for (const m of mines) drawMine(ctx, m, t);
  drawSentry(ctx, sentry, t);
}

function drawMine(ctx: CanvasRenderingContext2D, m: Mine, t: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(m.x + 2, m.y + 2, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a2a24';
  ctx.beginPath();
  ctx.arc(m.x, m.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5a5a4e';
  ctx.beginPath();
  ctx.arc(m.x, m.y, 5, 0, Math.PI * 2);
  ctx.fill();
  const on = Math.floor(t * (m.armT > 0 ? 8 : 2)) % 2 === 0;
  ctx.fillStyle = m.armT > 0 ? (on ? '#7aff6a' : '#2a5a22') : on ? '#ff4a3a' : '#5a2a22';
  ctx.fillRect(m.x - 1, m.y - 1, 2, 2);
}

function drawSentry(ctx: CanvasRenderingContext2D, s: Sentry | null, t: number): void {
  if (!s) return;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(4, 5, 11, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2a241a';
  ctx.lineWidth = 2;
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10);
    ctx.stroke();
  }
  ctx.rotate(s.aim);
  ctx.fillStyle = '#1a140a';
  ctx.fillRect(-1.6, -15, 3.2, 12);
  ctx.fillStyle = '#7a7a70';
  ctx.fillRect(-1, -14.4, 2, 11);
  ctx.fillStyle = '#1a140a';
  ctx.fillRect(-5, -5, 10, 9);
  ctx.fillStyle = '#a8935c';
  ctx.fillRect(-4.2, -4.2, 8.4, 7.4);
  const blink = s.t < 3 && Math.floor(t * 8) % 2 === 0;
  ctx.fillStyle = blink ? '#ff4a3a' : '#7aff6a';
  ctx.fillRect(-1, 0, 2, 2);
  ctx.restore();
}
