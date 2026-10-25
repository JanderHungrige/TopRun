import { lerp, type Vec } from '../../core/math';
import { BODY, drawFrontFigure, LINE, SKIN, solveLimb, tone, type Expression, type FrontTorso, type HeadMap, type PersonLook } from '../people';
import { text } from '../text';
import { INK, stroke, wrapWritten, write } from './tactics-marker';

// Dogfight Tactics (doc 19): Commander Hal "Inkwell" Okafor (original character) beside the whiteboard — a
// three-quarter people-kit figure (doc 17) in a khaki uniform shirt with reading glasses and a marker — and
// his handwritten debrief box.

export type InstructorMood = 'calm' | 'nod' | 'wince';

const LOOK: PersonLook = {
  skin: SKIN.brown,
  hair: { style: 'crew', base: '#b4b0a8', light: '#dedad2', shadow: '#87837b', brow: '#a19c93' },
  eyes: '#2e1d12',
  torso: 'tshirt',
  top: tone('#c7b388', '#e0cfa8', '#9b8760'),
  legs: 'trousers',
  bottom: tone('#b5a077', '#cfbd97', '#8a7651'),
  trim: '#a28f68',
  feet: 'sneakers',
  shoe: tone('#2a2520', '#4a433c', '#15120f'),
  sole: '#141210',
};

export const INSTRUCTOR = { x: 1104, y: 714, scale: 1.52, turn: -0.3 } as const;
const HIP_Y = -(BODY.ankle + BODY.shin + BODY.thigh);

function glasses(ctx: CanvasRenderingContext2D, m: HeadMap): void {
  ctx.strokeStyle = '#2a2420';
  ctx.lineWidth = 1.1;
  ctx.fillStyle = 'rgba(200,225,240,0.18)';
  for (const [x, k] of [[-6.6, 1], [6.6, 1 - m.s * 0.9]] as const) {
    ctx.beginPath();
    ctx.ellipse(m.fx(x, 14), -16.3, 4.6 * k, 3.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(m.fx(-2, 16), -16.8);
  ctx.quadraticCurveTo(m.fx(0, 17), -18.2, m.fx(2, 16), -16.8);
  ctx.moveTo(m.fx(-11.2, 13), -16.6);
  ctx.lineTo(m.fx(-15, 0), -15.4);
  ctx.stroke();
}

function shirt(ctx: CanvasRenderingContext2D, t: FrontTorso): void {
  const c = t.centre(0);
  ctx.fillStyle = '#b29e74';
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(c + s * 3, -100);
    ctx.lineTo(t.centre(s * 12), -107);
    ctx.lineTo(t.centre(s * 17), -98);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#e8dfc8';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(c, -88 + i * 18, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  const px = t.centre(17);
  ctx.strokeStyle = 'rgba(70,52,30,0.55)';
  ctx.strokeRect(px - 7, -84, 14, 16);
  ctx.fillStyle = '#b8a47a';
  ctx.fillRect(px - 7.5, -85, 15, 5);
  ctx.fillStyle = INK.blue;
  ctx.fillRect(px + 2, -90, 2.4, 8);
  ctx.fillStyle = '#20242a';
  ctx.fillRect(t.centre(-22) - 8, -84, 16, 5);
  ctx.fillStyle = '#3b2c1c';
  ctx.fillRect(-31, -21, 62, 5);
  ctx.fillStyle = '#c9b06a';
  ctx.fillRect(c - 4, -22, 8, 7);
}

/** Wrist and forearm direction of the screen-left arm, as front-figure.ts places it. */
function leftHand(raise: number): { wrist: Vec; dir: Vec } {
  const k = Math.cos(INSTRUCTOR.turn);
  const sh = { x: -37 * k, y: -94 };
  const wx = lerp(43, 42, raise) + Math.sin(Math.PI * raise) * 36;
  const wr = { x: -wx * k, y: lerp(14, -190, raise) };
  const mid = { x: (sh.x + wr.x) / 2, y: (sh.y + wr.y) / 2 };
  const score = (e: Vec): number => -(e.x - mid.x) + (e.y - mid.y) * 0.8;
  const a = solveLimb(sh, wr, BODY.upperArm, BODY.forearm, 1);
  const b = solveLimb(sh, wr, BODY.upperArm, BODY.forearm, -1);
  const el = score(a) >= score(b) ? a : b;
  const d = Math.max(1e-6, Math.hypot(wr.x - el.x, wr.y - el.y));
  return { wrist: { x: wr.x, y: wr.y + HIP_Y }, dir: { x: (wr.x - el.x) / d, y: (wr.y - el.y) / d } };
}

function heldMarker(ctx: CanvasRenderingContext2D, raise: number): void {
  const { wrist, dir } = leftHand(raise);
  const c = { x: wrist.x + dir.x * 13, y: wrist.y + dir.y * 13 };
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(Math.atan2(dir.y, dir.x) - 1.2);
  ctx.fillStyle = '#f2f2ee';
  ctx.fillRect(-3.2, -16, 6.4, 22);
  ctx.fillStyle = INK.blue;
  ctx.fillRect(-3.2, -20, 6.4, 6);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-3.2, -20, 6.4, 26);
  ctx.restore();
}

export interface InstructorView {
  mood: InstructorMood;
  /** 0 = arm down … 1 = over the head; the screen-left arm points at the board. */
  point: number;
  /** Seconds since the mood started (nod bob). */
  moodAge: number;
  /** Head turned to the class (true) or to the board. */
  facing: boolean;
  t: number;
}

const EXPRESSION: Readonly<Record<InstructorMood, Expression>> = { calm: 'calm', nod: 'grin', wince: 'strain' };

function blinkAt(t: number): number {
  const ph = t % 3.7;
  return ph < 0.14 ? 1 - Math.abs(ph / 0.07 - 1) : 0;
}

export function drawInstructor(ctx: CanvasRenderingContext2D, v: InstructorView): void {
  const bob = v.mood === 'nod' && v.moodAge < 0.9 ? -Math.abs(Math.sin(v.moodAge * 10.5)) * 5 : 0;
  const lean = v.mood === 'wince' ? Math.min(1, v.moodAge * 5) * 4 : 0;
  ctx.save();
  ctx.translate(INSTRUCTOR.x + lean, INSTRUCTOR.y);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 70, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(0, bob);
  ctx.scale(INSTRUCTOR.scale, INSTRUCTOR.scale);
  const raise = [v.point, 0.04] as const;
  const headTurn = v.facing ? 0.26 : -0.18;
  drawFrontFigure(ctx, LOOK, { turn: INSTRUCTOR.turn, headTurn, raise, hands: 'fist' }, {
    expression: EXPRESSION[v.mood], strain: v.mood === 'wince' ? 0.25 : 0, blink: blinkAt(v.t), t: v.t,
  }, { head: glasses, chest: shirt });
  heldMarker(ctx, v.point);
  ctx.restore();
}

export const SPEECH = { x: 944, y: 60, w: 324, h: 124 } as const;

/** The handwritten debrief box above the instructor; `shown` characters of `full` are written so far. */
export function drawSpeech(ctx: CanvasRenderingContext2D, label: string, full: string, shown: number, alpha: number): void {
  if (alpha <= 0 || !full) return;
  const b = SPEECH;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(b.x + 5, b.y + 6, b.w, b.h);
  ctx.fillStyle = '#fdfbf3';
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x + b.w, b.y);
  ctx.lineTo(b.x + b.w, b.y + b.h);
  ctx.lineTo(1124, b.y + b.h);
  ctx.lineTo(1112, b.y + b.h + 18);
  ctx.lineTo(1100, b.y + b.h);
  ctx.lineTo(b.x, b.y + b.h);
  ctx.closePath();
  ctx.fill();
  const edge = [
    { x: b.x + 2, y: b.y + 2 }, { x: b.x + b.w - 2, y: b.y + 1 }, { x: b.x + b.w - 1, y: b.y + b.h - 2 },
    { x: 1124, y: b.y + b.h - 1 }, { x: 1112, y: b.y + b.h + 16 }, { x: 1100, y: b.y + b.h - 1 }, { x: b.x + 1, y: b.y + b.h - 1 }, { x: b.x + 2, y: b.y + 2 },
  ];
  stroke(ctx, edge, INK.black, 2.4, 19);
  text(ctx, label, b.x + 14, b.y + 20, { size: 11, color: '#6b7380', letterSpacing: 1.5, weight: 700 });
  let left = shown;
  wrapWritten(ctx, full, b.w - 28, 18).slice(0, 5).forEach((ln, i) => {
    const part = ln.slice(0, Math.max(0, left));
    left -= ln.length + 1;
    if (part) write(ctx, part, b.x + 14, b.y + 44 + i * 21, { size: 18, color: '#20242b' });
  });
  ctx.restore();
}
