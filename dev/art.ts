// Dev-only art preview: http://localhost:5173/dev/art.html (not part of the production build).
import { drawPlaneTop } from '../src/render/draw-planes';
import { drawPlaneSide } from '../src/render/draw-planes-side';
import { PLANE_IDS } from '../src/data/types';

const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
let t = 0;
function frame(): void {
  t += 1 / 60;
  ctx.fillStyle = '#1d6596';
  ctx.fillRect(0, 0, 1280, 720);
  PLANE_IDS.forEach((id, i) => {
    const x = 140 + i * 200;
    drawPlaneTop(ctx, id, x + 14, 190, 2.4, { shadow: true });
    drawPlaneTop(ctx, id, x, 170, 2.4, { t, throttle: 0.6, sweep: (Math.sin(t) + 1) / 2 });
    drawPlaneTop(ctx, id, x, 330, 1.2, { t, bank: Math.sin(t * 2) });
    drawPlaneSide(ctx, id, 140 + i * 380, 600, 2, { t, throttle: (Math.sin(t) + 1) / 2, gear: 1 });
  });
  requestAnimationFrame(frame);
}
frame();
