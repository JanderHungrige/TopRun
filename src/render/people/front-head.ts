import { moodOf, type Mood } from './face-profile';
import { INK, LINE, MOUTH, SCLERA, TEETH } from './palette';
import { memo, smoothClosed, taper } from './paths';
import type { FaceState, PersonLook } from './types';

// People kit (doc 17): a three-quarter head, neck pivot at the origin, crown at y = −40, chin at y ≈ 6.
// Drawn for a turn ≥ 0 (face towards +x); the caller mirrors the frame for a negative turn. `shadeSide`
// says on which local side (+1 / −1) the shadow falls, so the light stays put when mirrored.

export interface HeadMap {
  s: number;
  c: number;
  /** Projects a face point at width x and depth z (towards the viewer) for the turn. */
  fx: (x: number, z: number) => number;
}

export function headMap(turn: number): HeadMap {
  const s = Math.sin(Math.abs(turn));
  const c = Math.cos(turn);
  return { s, c, fx: (x, z) => x * c + z * s };
}

function outline(s: number, drop: number): number[] {
  const d = drop * 3.4;
  return [
    3 * s, -40.5, 11 + 3 * s, -38, 16 + s, -29, 16.2 + 0.5 * s, -20, 15.4 - 0.5 * s, -12, 13.6, -4 + d * 0.2,
    10.5 + s, 1.5 + d * 0.6, 5.5 + 5 * s, 5 + d, 6 * s, 6.2 + d, -5.5 + 6 * s, 5 + d, -11 - 2 * s, 0.5 + d * 0.5,
    -13.6 - 3 * s, -4, -15.4 - 2 * s, -12, -16.2 - 1.5 * s, -20, -16 - s, -29, -11, -38,
  ];
}

const HEADS = new Map<string, Path2D>();

export function frontHeadPath(m: HeadMap, drop: number): Path2D {
  return memo(() => {
    const p = new Path2D();
    smoothClosed(p, outline(m.s, drop));
    return p;
  }, HEADS, `${m.s.toFixed(3)}|${drop}`);
}

function ear(ctx: CanvasRenderingContext2D, look: PersonLook, x: number, side: number): void {
  ctx.beginPath();
  ctx.ellipse(x, -14.5, 3.4, 6.2, side * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = look.skin.base;
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x + side * 0.6, -14, 1.5, 3.8, side * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = look.skin.shadow;
  ctx.fill();
}

/** Near ear (and the far one when nearly frontal), drawn under or over the hair by the caller. */
export function frontEars(ctx: CanvasRenderingContext2D, look: PersonLook, m: HeadMap): void {
  ear(ctx, look, m.fx(-15.6, -4) - 0.6, -1);
  if (m.s < 0.2) ear(ctx, look, m.fx(15.6, -4) + 0.6, 1);
}

/** Skin, soft shading from the light, cheekbones, nose and the eye sockets. */
export function frontHeadSkin(ctx: CanvasRenderingContext2D, look: PersonLook, m: HeadMap, path: Path2D, shadeSide: number): void {
  const k = look.skin;
  ctx.fillStyle = k.base;
  ctx.fill(path);
  ctx.save();
  ctx.clip(path);
  ctx.fillStyle = k.shadow;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.ellipse(shadeSide * 22, -12, 14, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  for (const x of [-6.6, 6.6]) ctx.ellipse(m.fx(x, 12), -16.4, 5.4, 3.6, 0, 0, Math.PI * 2); // sockets
  ctx.fill();
  ctx.beginPath();
  smoothClosed(ctx, taper([m.fx(-13, 8), -9, m.fx(-9, 12), -7, m.fx(-6, 13), -8], 2.6)); // under the cheekbones
  smoothClosed(ctx, taper([m.fx(13, 8), -9, m.fx(9, 12), -7, m.fx(6, 13), -8], 2.6));
  smoothClosed(ctx, taper([m.fx(1.6, 16), -18, m.fx(2.6, 18), -12, m.fx(3, 18), -8.5], 2.4)); // side of the nose
  smoothClosed(ctx, taper([m.fx(-3, 15), 1, m.fx(0, 16), 1.8, m.fx(3, 15), 1], 1.8)); // under the lip
  ctx.fill();
  ctx.fillStyle = k.light;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.ellipse(-shadeSide * 5 + m.fx(0, 12) * 0.5, -30, 7, 4.5, 0, 0, Math.PI * 2);
  ctx.ellipse(m.fx(0, 19.5), -9.2, 2, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.beginPath(); // nostrils
  ctx.moveTo(m.fx(-3.6, 14), -7.4);
  ctx.quadraticCurveTo(m.fx(0, 18), -5.4, m.fx(3.6, 14), -7.4);
  ctx.strokeStyle = k.deep;
  ctx.lineWidth = 0.9;
  ctx.stroke();
}

function eye(ctx: CanvasRenderingContext2D, look: PersonLook, x: number, w: number, md: Mood, f: FaceState, gaze: number): void {
  const open = md.open * (1 - f.blink);
  const y = -16.2;
  ctx.lineCap = 'round';
  if (open < 0.12) {
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.quadraticCurveTo(x, y + (md.knit > 1 ? -1 : 1.2), x + w / 2, y);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    return;
  }
  const top = y - 3.4 * open;
  const bottom = y + 2.2 * (1 - md.lower);
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.quadraticCurveTo(x, top, x + w / 2, y - 0.3);
  ctx.quadraticCurveTo(x, bottom, x - w / 2, y);
  ctx.fillStyle = SCLERA;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.beginPath();
  ctx.arc(x + gaze, y - 0.5, 1.9, 0, Math.PI * 2);
  ctx.fillStyle = look.eyes;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + gaze, y - 0.5, 0.9, 0, Math.PI * 2);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillRect(x + gaze - 0.9, y - 1.6, 0.7, 0.7);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(x - w / 2 - 0.3, y + 0.2);
  ctx.quadraticCurveTo(x, top - 0.2, x + w / 2 + 0.3, y - 0.4);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - w / 2 + 0.6, top - 0.6);
  ctx.quadraticCurveTo(x, top - 2.4, x + w / 2 - 0.4, top - 0.4);
  ctx.strokeStyle = look.skin.shadow;
  ctx.lineWidth = 0.7;
  ctx.stroke();
}

function brows(ctx: CanvasRenderingContext2D, look: PersonLook, m: HeadMap, md: Mood): void {
  const y = -21.2 - md.lift;
  ctx.beginPath();
  for (const sd of [-1, 1]) {
    ctx.moveTo(m.fx(sd * 2.4, 15), y + 0.6 + md.knit * 1.1);
    ctx.quadraticCurveTo(m.fx(sd * 7, 14), y - 1.6 + md.knit * 0.3, m.fx(sd * 11.5, 10), y + 0.4);
  }
  ctx.strokeStyle = look.hair.brow;
  ctx.lineWidth = 1.9;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function mouth(ctx: CanvasRenderingContext2D, look: PersonLook, m: HeadMap, md: Mood): void {
  const d = md.drop * 3.4;
  const l = m.fx(-5.4, 12.5);
  const r = m.fx(5.4, 12.5);
  const cx = m.fx(0, 16);
  const smile = md.mouth === 'grin' ? 1.4 : md.mouth === 'closed' ? 0.6 : 0;
  ctx.lineCap = 'round';
  if (md.mouth === 'closed' || md.mouth === 'press') {
    ctx.beginPath();
    ctx.moveTo(l, -2.4 - smile);
    ctx.quadraticCurveTo(cx, -1.6 + smile * 0.6, r, -2.4 - smile);
    ctx.strokeStyle = look.skin.deep;
    ctx.lineWidth = md.mouth === 'press' ? 1.3 : 1.1;
    ctx.stroke();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(l, -2.6 - smile);
  ctx.quadraticCurveTo(cx, -3.2, r, -2.6 - smile);
  ctx.quadraticCurveTo(cx, -1 + d * 1.1, l, -2.6 - smile);
  ctx.fillStyle = MOUTH;
  ctx.fill();
  if (md.mouth === 'open') return;
  ctx.save();
  ctx.clip();
  ctx.fillStyle = TEETH;
  ctx.fillRect(l, -3.6, r - l, md.mouth === 'grit' ? 4 : 1.6);
  ctx.restore();
}

/** Eyes, brows, mouth and flush for the expression. */
export function frontFace(ctx: CanvasRenderingContext2D, look: PersonLook, m: HeadMap, f: FaceState): void {
  const md = moodOf(f.expression);
  if (f.strain > 0.05) {
    ctx.fillStyle = `rgba(214,72,52,${(f.strain * 0.3).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(m.fx(-8, 11), -8, 4, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(m.fx(8, 11), -8, 3.4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const gaze = m.s * 1.2;
  eye(ctx, look, m.fx(-6.6, 13), 7.4 * (1 - 0.12 * m.s), md, f, gaze);
  eye(ctx, look, m.fx(6.6, 13), 7.4 * (1 - 1.1 * m.s), md, f, gaze);
  brows(ctx, look, m, md);
  mouth(ctx, look, m, md);
}
