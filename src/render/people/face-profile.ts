import { INK, MOUTH, SCLERA, TEETH } from './palette';
import type { Expression, FaceState, PersonLook } from './types';

// People kit (doc 17): profile features in the head frame (see head-profile.ts) — a lidded eye with iris,
// brow, mouth — and the expressions calm / effort / strain / grin / exhausted / out.

export type MouthShape = 'closed' | 'press' | 'grit' | 'grin' | 'open';

export interface Mood {
  /** Eye opening 0 … 1. */
  open: number;
  /** Lower lid raised (smile, squint) 0 … 1. */
  lower: number;
  /** Inner (front) end of the brow pulled down; negative lifts it (worry). */
  knit: number;
  /** Whole brow raised. */
  lift: number;
  mouth: MouthShape;
  /** Jaw drop 0 … 1. */
  drop: number;
}

const MOODS: Readonly<Record<Expression, Mood>> = {
  calm: { open: 1, lower: 0.1, knit: 0, lift: 0, mouth: 'closed', drop: 0 },
  effort: { open: 0.7, lower: 0.3, knit: 1, lift: -0.2, mouth: 'press', drop: 0 },
  strain: { open: 0, lower: 0.5, knit: 1.7, lift: -0.6, mouth: 'grit', drop: 0.3 },
  grin: { open: 0.7, lower: 0.6, knit: -0.2, lift: 0.5, mouth: 'grin', drop: 0.15 },
  exhausted: { open: 0.4, lower: 0.05, knit: -1, lift: 0.5, mouth: 'open', drop: 0.85 },
  out: { open: 0, lower: 0, knit: -0.6, lift: 0.4, mouth: 'open', drop: 0.65 },
};

export const jawDrop = (e: Expression): number => MOODS[e].drop;
export const moodOf = (e: Expression): Mood => MOODS[e];

const EX = 13.6;
const EY = -17.2;
const BACK = { x: EX - 2.7, y: EY - 0.1 };
const FRONT = { x: EX + 2.5, y: EY + 0.3 };

/** Shut: a lid line, squeezed with crow's feet when straining. */
function shutEye(ctx: CanvasRenderingContext2D, look: PersonLook, m: Mood): void {
  ctx.beginPath();
  ctx.moveTo(BACK.x, BACK.y);
  ctx.quadraticCurveTo(EX, EY + (m.knit > 1 ? -0.8 : 1), FRONT.x, FRONT.y);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.1;
  ctx.stroke();
  if (m.knit <= 1) return;
  ctx.beginPath();
  for (const dy of [-1.6, 0.4, 2.2]) {
    ctx.moveTo(BACK.x - 0.6, BACK.y + dy * 0.5);
    ctx.lineTo(BACK.x - 2.8, BACK.y + dy);
  }
  ctx.strokeStyle = look.skin.deep;
  ctx.lineWidth = 0.6;
  ctx.stroke();
}

/** Iris, pupil and catchlight inside the current (clipped) eye opening. */
function iris(ctx: CanvasRenderingContext2D, look: PersonLook, t: number): void {
  const g = Math.sin(t * 0.7) * 0.25;
  ctx.beginPath();
  ctx.ellipse(EX + 1.4 + g, EY - 0.3, 1.1, 1.8, 0, 0, Math.PI * 2);
  ctx.fillStyle = look.eyes;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(EX + 1.9 + g, EY - 0.3, 0.45, 1, 0, 0, Math.PI * 2);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillRect(EX + 1.2 + g, EY - 1.4, 0.6, 0.6);
}

function eye(ctx: CanvasRenderingContext2D, look: PersonLook, m: Mood, blink: number, t: number): void {
  const open = m.open * (1 - blink);
  const back = BACK;
  const front = FRONT;
  ctx.lineCap = 'round';
  if (open < 0.12) return shutEye(ctx, look, m);
  const top = EY - 3 * open;
  const bottom = EY + 1.8 * (1 - m.lower);
  ctx.beginPath();
  ctx.moveTo(back.x, back.y);
  ctx.quadraticCurveTo(EX + 0.6, top, front.x, front.y);
  ctx.quadraticCurveTo(EX + 0.2, bottom, back.x, back.y);
  ctx.fillStyle = SCLERA;
  ctx.fill();
  ctx.save();
  ctx.clip();
  iris(ctx, look, t);
  ctx.restore();
  ctx.beginPath(); // upper lid + lashes
  ctx.moveTo(back.x - 0.2, back.y);
  ctx.quadraticCurveTo(EX + 0.4, top, front.x + 0.5, front.y + 0.2);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.beginPath(); // lid crease
  ctx.moveTo(back.x + 0.2, top - 0.6);
  ctx.quadraticCurveTo(EX + 0.4, top - 2.4, front.x - 0.4, EY - 2.6);
  ctx.strokeStyle = look.skin.shadow;
  ctx.lineWidth = 0.7;
  ctx.stroke();
}

function brow(ctx: CanvasRenderingContext2D, look: PersonLook, m: Mood): void {
  const y = -21.6 - m.lift;
  ctx.beginPath();
  ctx.moveTo(9.6, y + 0.6);
  ctx.quadraticCurveTo(13, y - 1.4 + m.knit * 0.3, 16.8, y + 0.5 + m.knit * 1.2);
  ctx.strokeStyle = look.hair.brow;
  ctx.lineWidth = 1.9;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function mouth(ctx: CanvasRenderingContext2D, look: PersonLook, m: Mood): void {
  const d = m.drop * 3.4;
  const deep = look.skin.deep;
  ctx.lineCap = 'round';
  switch (m.mouth) {
    case 'closed':
    case 'press':
      ctx.beginPath();
      ctx.moveTo(18.1, -2.4);
      ctx.quadraticCurveTo(16.6, -2.3, m.mouth === 'press' ? 14.8 : 15.4, m.mouth === 'press' ? -1.8 : -2.6);
      ctx.strokeStyle = deep;
      ctx.lineWidth = m.mouth === 'press' ? 1.1 : 0.9;
      ctx.stroke();
      return;
    case 'grin':
    case 'grit':
    case 'open': {
      const cx = m.mouth === 'grin' ? 14.4 : 14.8;
      const cy = m.mouth === 'grin' ? -3.7 : -2.3 + d * 0.3;
      ctx.beginPath();
      ctx.moveTo(18.5, -2.5);
      ctx.quadraticCurveTo(16.4, -2.7, cx, cy);
      ctx.quadraticCurveTo(16.4, -1.5 + d * 0.8, 18.3 - d * 0.2, -1.1 + d);
      ctx.closePath();
      ctx.fillStyle = MOUTH;
      ctx.fill();
      if (m.mouth !== 'open') {
        ctx.fillStyle = TEETH;
        ctx.fillRect(15.6, -2.7, 2.8, m.mouth === 'grit' ? 1.9 : 1.2);
        if (m.mouth === 'grit') {
          ctx.fillStyle = deep;
          ctx.fillRect(15.6, -1.85, 2.8, 0.35);
        }
      }
      return;
    }
    default: throw new Error(`unhandled: ${m.mouth satisfies never}`);
  }
}

/** Sweat drops leaving the forehead and falling along gravity (gx, gy in the head frame). */
function sweat(ctx: CanvasRenderingContext2D, f: FaceState, gx: number, gy: number): void {
  for (let i = 0; i < 2; i++) {
    const ph = (f.t * 1.6 + i * 0.5) % 1;
    ctx.globalAlpha = Math.min(1, (f.strain - 0.35) * 1.6) * (1 - ph);
    ctx.beginPath();
    ctx.ellipse(12 + i * 4 + gx * ph * 30, -27 + i * 3 + gy * ph * 30, 1.5, 2.3, Math.atan2(-gx, gy), 0, Math.PI * 2);
    ctx.fillStyle = '#cdeeff';
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Eye, brow, mouth, flush and sweat for the face state; (gx, gy) = gravity in the head frame. */
export function profileFace(ctx: CanvasRenderingContext2D, look: PersonLook, f: FaceState, gx: number, gy: number): void {
  const m = MOODS[f.expression];
  if (f.strain > 0.05) {
    ctx.beginPath();
    ctx.ellipse(9.5, -9.5, 5.5, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(214,72,52,${(f.strain * 0.38).toFixed(3)})`;
    ctx.fill();
  }
  if (m.mouth === 'grin') {
    ctx.beginPath(); // raised cheek
    ctx.moveTo(15.2, -7.2);
    ctx.quadraticCurveTo(12.6, -5.6, 13.2, -2.7);
    ctx.strokeStyle = look.skin.shadow;
    ctx.lineWidth = 0.9;
    ctx.stroke();
  }
  eye(ctx, look, m, f.blink, f.t);
  brow(ctx, look, m);
  mouth(ctx, look, m);
  if (f.strain > 0.35) sweat(ctx, f, gx, gy);
}
