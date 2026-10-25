import { TAU } from '../../core/math';
import { DECK_Y } from './geometry';

/**
 * Flight-deck crew in coloured jerseys and matching cranial helmets (yellow: catapult officer / directors,
 * green: catapult crew, red: ordnance, blue: handlers, purple: fuel, brown: plane captains, white: safety).
 * Arm angles follow the original deck-officer convention: 0 points to the bow, PI/2 straight up.
 */

const TROUSERS = '#2c3238';
const GLOVE = '#ece8dc';
const SKIN = '#d8a883';

function arm(ctx: CanvasRenderingContext2D, angle: number, color: string): void {
  const ex = 9 * Math.cos(-angle);
  const ey = -13.5 + 9 * Math.sin(-angle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(0, -13.5);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.fillStyle = GLOVE;
  ctx.beginPath();
  ctx.arc(ex, ey, 1.25, 0, TAU);
  ctx.fill();
}

function body(ctx: CanvasRenderingContext2D, jersey: string): void {
  ctx.strokeStyle = TROUSERS;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-1.2, -8);
  ctx.lineTo(-2.2, -1);
  ctx.moveTo(1.2, -8);
  ctx.lineTo(2.3, -1);
  ctx.stroke();
  ctx.fillStyle = '#16191d';
  ctx.fillRect(-3.8, -1.5, 3.2, 1.5);
  ctx.fillRect(1, -1.5, 3.6, 1.5);
  ctx.fillStyle = jersey;
  ctx.beginPath();
  ctx.roundRect(-3.4, -15.8, 6.8, 8.8, 1.8);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(-3.4, -8.6, 6.8, 1.6);
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.fillRect(-3.4, -12.2, 6.8, 1);
}

function head(ctx: CanvasRenderingContext2D, jersey: string): void {
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.arc(0.4, -18.4, 2.8, 0, TAU);
  ctx.fill();
  ctx.fillStyle = jersey;
  ctx.beginPath();
  ctx.arc(0, -18.9, 3.2, Math.PI * 0.95, Math.PI * 2.05);
  ctx.fill();
  ctx.fillStyle = '#1b2026';
  ctx.fillRect(0.6, -19.6, 2.9, 1.3);
  ctx.beginPath();
  ctx.arc(-0.9, -18, 1.3, 0, TAU);
  ctx.fill();
}

/** One crew member standing on `footY` (x, y in world units). `lean` tilts the body towards the bow. */
export function drawCrewman(
  ctx: CanvasRenderingContext2D, x: number, footY: number, jersey: string, arms: readonly [number, number], scale = 1, lean = 0,
): void {
  ctx.save();
  ctx.translate(x, footY);
  ctx.rotate(lean);
  ctx.scale(scale, scale);
  ctx.lineCap = 'round';
  arm(ctx, arms[1], jersey);
  body(ctx, jersey);
  head(ctx, jersey);
  arm(ctx, arms[0], jersey);
  ctx.restore();
}

/** [world x, jersey, signalling arm, other arm, far side, idle sway]. */
const CREW: readonly (readonly [number, string, number, number, boolean, number])[] = [
  [-150, '#49c76a', 0.4, -1.6, false, 0.14],
  [-175, '#49c76a', 2.6, -1.5, false, 0.1],
  [-250, '#d9483f', 1.2, -1.7, false, 0.12],
  [-316, '#3f78d8', -1.25, -1.85, false, 0.06],
  [-445, '#f1f1ec', -1.3, -1.95, false, 0.05],
  [-540, '#8a55c9', 0.7, -1.6, true, 0.1],
  [-735, '#f2c230', 1.3, 1.9, true, 0.35],
  [-958, '#8a5a32', -1.4, -1.8, true, 0.05],
];

/** Deck crew plus the catapult officer ("shooter") whose arm signals follow the launch phase. */
export function drawCrew(ctx: CanvasRenderingContext2D, t: number, shooterPose: number, launched: boolean): void {
  CREW.forEach(([x, jersey, a, b, far, sway], i) => {
    const wave = Math.sin(t * 1.7 + i * 1.3) * sway;
    drawCrewman(ctx, x, far ? DECK_Y - 5.5 : DECK_Y, jersey, [a + wave, b - wave * 0.5], far ? 0.8 : 1);
  });
  drawCrewman(ctx, 120, DECK_Y, '#ffd23f', [shooterPose, launched ? -2.3 : -1.9], 1, launched ? 0.2 : 0);
}
