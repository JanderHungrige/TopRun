import { TAU } from '../../core/math';

// Hub / offer card icon for Carrier Landing (doc 18), in the game's own view: a night sky, the landing area as
// converging rows of deck lights with the drop line below the ramp, and the lens on the left — green datum arms
// with the amber ball settling onto them. Within ±40 px.

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, glow = 6): void {
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

export function drawLandingIcon(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(-38, -38, 76, 76, 12);
  const sky = ctx.createLinearGradient(0, -38, 0, 38);
  sky.addColorStop(0, '#030712');
  sky.addColorStop(0.55, '#0c1a30');
  sky.addColorStop(0.56, '#07101c');
  sky.addColorStop(1, '#020408');
  ctx.fillStyle = sky;
  ctx.fill();
  ctx.clip();
  for (const [x, y, r] of [[-26, -28, 0.9], [-8, -31, 0.7], [14, -24, 1], [29, -30, 0.7], [-18, -16, 0.6], [22, -12, 0.6]] as const) {
    dot(ctx, x, y, r, '#dbe6ff', 2);
  }
  // landing area: two rows of edge lights and the centreline, converging towards the horizon
  for (let k = 0; k < 6; k++) {
    const u = k / 5;
    const y = 18 - u * 14;
    const half = 22 - u * 15;
    dot(ctx, -half + 4, y, 1.6 - u * 0.8, '#ffd9a0', 4);
    dot(ctx, half + 4, y, 1.6 - u * 0.8, '#ffd9a0', 4);
    dot(ctx, 4, y - 1, 1.7 - u * 0.8, '#eef4ff', 4);
  }
  for (let k = 0; k < 4; k++) dot(ctx, 4, 23 + k * 4, 1.5, '#ff7b3a', 5);
  // the lens: datum arms and the ball bobbing onto them
  const lx = -24;
  const ly = 6;
  for (let k = 0; k < 3; k++) for (const side of [-1, 1]) dot(ctx, lx + side * (4 + k * 3.5), ly, 1.4, '#46ff78', 4);
  const ball = Math.sin(t * 1.6) * 5 * Math.max(0.15, Math.abs(Math.sin(t * 0.4)));
  dot(ctx, lx, ly - ball, 2.6, '#ffb020', 9);
  ctx.restore();
}
