import { TAU } from '../../core/math';

// Hub / offer card icon for Air Refuelling (doc 15), in the game's own view: looking into the drogue basket
// (ring, canvas panels, coupling) on its hose, the probe sliding in from the lower right, the pod light
// switching amber → green once plugged. Within ±40 px.

const BX = -2;
const BY = -6;

function drawBasketFront(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  for (let i = 0; i < 12; i++) {
    const a0 = (i / 12) * TAU;
    const a1 = ((i + 1) / 12) * TAU;
    ctx.beginPath();
    ctx.arc(x, y, 22, a0, a1);
    ctx.arc(x + 1, y + 1, 6.5, a1, a0, true);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? '#c9d0d7' : '#e8ecef';
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(70,78,88,0.7)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    ctx.moveTo(x + Math.cos(a) * 22, y + Math.sin(a) * 22);
    ctx.lineTo(x + 1 + Math.cos(a) * 6.5, y + 1 + Math.sin(a) * 6.5);
  }
  ctx.stroke();
  ctx.fillStyle = '#5a626b';
  ctx.beginPath();
  ctx.arc(x + 1, y + 1, 6.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#101215';
  ctx.beginPath();
  ctx.arc(x + 1, y + 1, 3.4, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#23282d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, TAU);
  ctx.stroke();
}

export function drawRefuelIcon(ctx: CanvasRenderingContext2D, t: number): void {
  const k = (t * 0.45) % 1;
  const plug = Math.min(1, k / 0.5);
  const lit = k > 0.55;
  const bob = Math.sin(t * 2.1) * 1.6 * (1 - plug);
  const x = BX + bob;
  const y = BY + bob * 0.6;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#59616a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-24, -40);
  ctx.quadraticCurveTo(-16, -18, x + 1, y + 1);
  ctx.stroke();
  for (const [i, on] of [[0, '#ffb020'], [1, '#3dff6e']] as const) {
    const active = (i === 1) === lit;
    ctx.fillStyle = active ? on : '#2c2f33';
    ctx.shadowColor = active ? on : 'transparent';
    ctx.shadowBlur = active ? 9 : 0;
    ctx.beginPath();
    ctx.arc(-36 + i * 8, -36, 3, 0, TAU);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  drawBasketFront(ctx, x, y);
  // probe: from the lower right into the coupling
  const tipX = x + 1 + (1 - plug) * 16;
  const tipY = y + 1 + (1 - plug) * 18;
  ctx.strokeStyle = '#3f464e';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(44, 44);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  ctx.strokeStyle = '#d3d8dd';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = '#7d858d';
  ctx.beginPath();
  ctx.arc(tipX, tipY, 3.5, 0, TAU);
  ctx.fill();
  ctx.restore();
}
