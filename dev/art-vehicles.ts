// Dev-only preview of the motor pool's vehicles in detail (doc 114): http://localhost:5173/dev/art-vehicles.html — each
// vehicle large from above and from the side, in the standard paint and three paint jobs, and at mission size on
// steppe grass. ?still freezes the animation (for screenshots).
import type { LiveryId } from '../src/data/liveries';
import { TANK_IDS } from '../src/data/types';
import { drawPlaneTop } from '../src/render/draw-planes';
import { drawPlaneSide } from '../src/render/draw-planes-side';

const W = 1280;
const H = 960;
const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
canvas.width = W * 2;
canvas.height = H * 2;
canvas.style.width = '100vw';
ctx.scale(2, 2);
const still = new URLSearchParams(location.search).has('still');
const PAINT: readonly LiveryId[] = ['standard', 'grassfire', 'saltcrust', 'barrowmoss'];

function frame(now: number): void {
  const t = still ? 1.2 : now / 1000;
  ctx.fillStyle = '#c9a24e';
  ctx.fillRect(0, 0, W, H);
  TANK_IDS.forEach((id, i) => {
    const x = 160 + i * 310;
    const livery = PAINT[i] ?? 'standard';
    const turret = still ? -0.5 : Math.sin(t * 0.7) * 0.8;
    drawPlaneTop(ctx, id, x + 12, 196, 5, { shadow: true });
    drawPlaneTop(ctx, id, x, 180, 5, { t, turret, driven: t * 40, livery });
    drawPlaneSide(ctx, id, x, 470, 3.6, { t, livery });
    for (let k = 0; k < PAINT.length; k++) {
      const lx = x - 105 + k * 70;
      drawPlaneTop(ctx, id, lx + 3, 604, 1, { shadow: true });
      drawPlaneTop(ctx, id, lx, 600, 1, { t, turret: 0.4, driven: t * 40, livery: PAINT[k] });
      drawPlaneTop(ctx, id, lx, 700, 2, { t, turret: -0.3, driven: t * 40, livery: PAINT[k] });
    }
    drawPlaneSide(ctx, id, x, 880, 1.6, { t, livery: PAINT[(i + 1) % 4] });
  });
  if (!still) if (still) frame(0); // a hidden tab runs no animation frames
else requestAnimationFrame(frame);
}
if (still) frame(0); // a hidden tab runs no animation frames
else requestAnimationFrame(frame);
