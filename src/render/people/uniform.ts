import type { FrontTorso } from './front-body';
import { LINE } from './palette';
import type { PersonLook } from './types';

// People kit (doc 17, uniforms for the medal ceremony doc 25): details of the long-sleeved uniforms on the
// three-quarter torso, drawn after the neck (hip-joint centre at the origin, shoulders at y −94). Dress whites:
// standing collar, gold buttons, shoulder boards in `trim`; flight suit: open collar, zip, chest pockets and a
// blank name tape. `ft.centre(x)` slides front-surface points for the body turn.

const GOLD = '#e8b440';
const GOLD_DARK = '#9a6a1c';
const TAPE = '#5a3a24';

function fillPoly(ctx: CanvasRenderingContext2D, pts: readonly number[], fill: string, line = true): void {
  ctx.beginPath();
  for (let i = 0; i + 1 < pts.length; i += 2) ctx.lineTo(pts[i] ?? 0, pts[i + 1] ?? 0);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (!line) return;
  ctx.lineWidth = 1.1;
  ctx.strokeStyle = LINE;
  ctx.stroke();
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Shoulder boards from the collar out to the shoulder caps. */
function boards(ctx: CanvasRenderingContext2D, ft: FrontTorso, look: PersonLook): void {
  const c = ft.centre;
  for (const s of [-1, 1]) {
    fillPoly(ctx, [c(s * 15), -106, c(s * 36), -101.5, c(s * 37.5), -96.5, c(s * 15.5), -101], look.trim);
    ctx.fillStyle = GOLD;
    ctx.fillRect(Math.min(c(s * 31), c(s * 33.5)), -101.5, Math.abs(c(s * 33.5) - c(s * 31)), 4.6);
  }
}

function dressWhites(ctx: CanvasRenderingContext2D, ft: FrontTorso, look: PersonLook, shift: number): void {
  const c = ft.centre;
  ctx.fillStyle = look.top.shadow;
  ctx.fillRect(c(0) - 0.6, -104, 1.2, 88);
  for (let i = 0; i < 5; i++) {
    dot(ctx, c(0), -96 + i * 14, 2.3, GOLD_DARK);
    dot(ctx, c(0) - 0.5, -96.6 + i * 14, 1.5, GOLD);
  }
  for (const s of [-1, 1]) {
    ctx.fillStyle = look.top.shadow;
    ctx.fillRect(Math.min(c(s * 10), c(s * 27)), -30, Math.abs(c(s * 27) - c(s * 10)), 1.6);
  }
  boards(ctx, ft, look);
  const b = shift * 0.6;
  const t = shift * 0.8;
  fillPoly(ctx, [-9.6 + b, -103, 9.6 + b, -103, 8.4 + t, -113, -8.4 + t, -113], look.top.base);
  ctx.fillStyle = look.top.shadow;
  ctx.fillRect(2 + b, -112, 6.4, 8.6);
  for (const s of [-1, 1]) dot(ctx, s * 5.4 + b, -108, 1.4, GOLD);
}

function flightSuit(ctx: CanvasRenderingContext2D, ft: FrontTorso, look: PersonLook): void {
  const c = ft.centre;
  for (const s of [-1, 1]) {
    fillPoly(ctx, [c(s * 11), -107.5, c(s * 4.6), -97.5, c(s * 0.8), -92.5, c(s * 9), -95, c(s * 21), -104], look.top.light);
    fillPoly(ctx, [c(s * 10), -86, c(s * 26), -87, c(s * 26), -73, c(s * 10), -72], look.top.base);
    ctx.fillStyle = look.top.shadow;
    ctx.fillRect(Math.min(c(s * 11), c(s * 25)), -84.5, Math.abs(c(s * 25) - c(s * 11)), 1.3);
  }
  ctx.fillStyle = look.top.shadow;
  ctx.fillRect(c(0) - 0.7, -93, 1.4, 99);
  fillPoly(ctx, [c(-27), -98, c(-13), -99, c(-13), -93.5, c(-27), -92.5], TAPE, false);
}

/** Uniform details over the torso (after the neck); other torso wear has none. */
export function frontUniform(ctx: CanvasRenderingContext2D, ft: FrontTorso, look: PersonLook, shift: number): void {
  switch (look.torso) {
    case 'dressWhites': return dressWhites(ctx, ft, look, shift);
    case 'flightSuit': return flightSuit(ctx, ft, look);
    case 'shirtless': case 'tank': case 'sportsTop': case 'tshirt': return;
    default: throw new Error(`unhandled: ${look.torso satisfies never}`);
  }
}

/** Cuff stripes near the wrist, drawn in the forearm's bone frame (elbow at x = 0, wrist at x = 50). */
export function cuff(ctx: CanvasRenderingContext2D, look: PersonLook): void {
  ctx.fillStyle = look.torso === 'dressWhites' ? GOLD : look.trim;
  ctx.fillRect(41, -20, 2.4, 40);
  if (look.torso === 'dressWhites') ctx.fillRect(45, -20, 1.6, 40);
}
