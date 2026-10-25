import { ellipse } from '../shapes';

// Push-up figure head (doc 12) in an upright profile frame: centre (0, 0), face towards +x, crown -y.

export type HairStyle = 'crew' | 'bob' | 'long' | 'messy';

export interface HeadLook {
  skin: string;
  skinDark: string;
  hair: string;
  hairDark: string;
  style: HairStyle;
}

export interface HeadState {
  strain: number;
  /** 0 … 1 knocked out (burnout). */
  out: number;
  t: number;
  /** Rotation of this frame in the world, so hair and sweat can fall downwards. */
  down: number;
}

const LINE = 'rgba(28,16,10,0.6)';
const FACE = [6, -14, 14.5, -10, 16.5, -4, 15.8, -1, 21, 4, 16.5, 6, 16, 9.5, 15, 12.5, 14.5, 15, 11, 18.5, 3, 18, -5, 12] as const;
const MESSY = [
  17, -4, 14, -10, 19.5, -14, 12, -18, 13, -24.5, 5, -21, 1, -27.5, -4, -21.5, -12, -25.5, -13, -18,
  -21.5, -16, -18, -9, -21.5, -2, -16.5, 1, -15, 7,
] as const;

function skullPath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.ellipse(0, -2, 16.5, 18, 0, 0, Math.PI * 2);
  ctx.moveTo(FACE[0], FACE[1]);
  for (let i = 2; i < FACE.length; i += 2) ctx.lineTo(FACE[i] ?? 0, FACE[i + 1] ?? 0);
  ctx.closePath();
}

/** Outline the union of skull and face: stroke wide, then fill over the inner half. */
function skull(ctx: CanvasRenderingContext2D, look: HeadLook, strain: number): void {
  skullPath(ctx);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2.6;
  ctx.stroke();
  ctx.fillStyle = look.skin;
  ctx.fill('nonzero');
  ellipse(ctx, 9, 7, 5, 4, `rgba(220,60,40,${strain * 0.4})`);
  ctx.beginPath();
  ctx.ellipse(-3, 1, 3.8, 5.2, 0, 0, Math.PI * 2);
  ctx.fillStyle = look.skin;
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-2.6, 1, 2, -1.2, 1.4);
  ctx.strokeStyle = look.skinDark;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ellipse(ctx, 17.4, 5, 1.2, 0.8, look.skinDark);
}

function fillHair(ctx: CanvasRenderingContext2D, look: HeadLook): void {
  ctx.fillStyle = look.hair;
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function hairCap(ctx: CanvasRenderingContext2D, look: HeadLook): void {
  ctx.beginPath();
  switch (look.style) {
    case 'crew':
      ctx.moveTo(14, -11);
      ctx.quadraticCurveTo(10, -21.5, -1, -21);
      ctx.quadraticCurveTo(-17.5, -19, -17.5, -4);
      ctx.lineTo(-15, 6);
      ctx.quadraticCurveTo(-11, 2, -9, -6);
      ctx.quadraticCurveTo(-1, -9, 8, -12);
      break;
    case 'bob':
      ctx.moveTo(18.5, -4);
      ctx.quadraticCurveTo(19.5, -23, 0, -24);
      ctx.quadraticCurveTo(-20.5, -23, -20.5, -4);
      ctx.quadraticCurveTo(-20.5, 10, -14, 15.5);
      ctx.quadraticCurveTo(-8, 15.5, -5, 11);
      ctx.quadraticCurveTo(-4, 0, 2, -9);
      ctx.quadraticCurveTo(10, -10, 18.5, -4);
      break;
    case 'long':
      ctx.moveTo(16, -9);
      ctx.quadraticCurveTo(14, -23, -1, -23);
      ctx.quadraticCurveTo(-19, -22, -19, -5);
      ctx.quadraticCurveTo(-18, 6, -14, 9);
      ctx.quadraticCurveTo(-9, 2, -7, -6);
      ctx.quadraticCurveTo(2, -12, 16, -9);
      break;
    case 'messy':
      for (let i = 0; i < MESSY.length; i += 2) ctx.lineTo(MESSY[i] ?? 0, MESSY[i + 1] ?? 0);
      ctx.quadraticCurveTo(-10, 2, -8, -6);
      ctx.quadraticCurveTo(0, -9, 6, -9);
      ctx.lineTo(10, -6);
      break;
    default: throw new Error(`unhandled: ${look.style satisfies never}`);
  }
  ctx.closePath();
  fillHair(ctx, look);
  ctx.beginPath(); // a few strands
  ctx.moveTo(8, -17);
  ctx.quadraticCurveTo(-2, -19, -12, -12);
  ctx.moveTo(4, -13);
  ctx.quadraticCurveTo(-6, -14, -14, -4);
  ctx.strokeStyle = look.hairDark;
  ctx.lineWidth = 1.1;
  ctx.stroke();
}

/** Ponytail tied at the back of the head, draped over the side and hanging with gravity. */
function ponytail(ctx: CanvasRenderingContext2D, look: HeadLook, s: HeadState): void {
  const gx = Math.sin(s.down);
  const gy = Math.cos(s.down);
  const sway = Math.sin(s.t * 3) * 3;
  const bx = -16;
  const by = -8;
  const len = 40;
  ctx.beginPath();
  ctx.moveTo(bx - gy * 5, by + gx * 5);
  ctx.quadraticCurveTo(bx + gx * len * 0.5 - gy * (sway + 8), by + gy * len * 0.5 + gx * (sway + 8), bx + gx * len - gy * sway, by + gy * len + gx * sway);
  ctx.quadraticCurveTo(bx + gx * len * 0.5 + gy * (4 - sway), by + gy * len * 0.5 - gx * (4 - sway), bx + gy * 5, by - gx * 5);
  ctx.closePath();
  ctx.fillStyle = look.hair;
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(bx, by, 3.4, 4.4, s.down, 0, Math.PI * 2);
  ctx.fillStyle = '#c2342c'; // hair tie
  ctx.fill();
}

function face(ctx: CanvasRenderingContext2D, look: HeadLook, s: HeadState): void {
  ctx.strokeStyle = '#2a1a12';
  ctx.lineWidth = 1.4;
  if (s.out > 0.5) {
    ctx.beginPath();
    ctx.moveTo(8, -5);
    ctx.lineTo(12, -1);
    ctx.moveTo(12, -5);
    ctx.lineTo(8, -1);
    ctx.stroke();
  } else if (s.strain > 0.6) {
    ctx.beginPath();
    ctx.moveTo(8, -2.6);
    ctx.lineTo(12.4, -3.4);
    ctx.stroke();
  } else {
    ellipse(ctx, 10.4, -3, 1.6, 2, '#2a1a12');
    ellipse(ctx, 10.9, -3.6, 0.6, 0.6, 'rgba(255,255,255,0.8)');
  }
  ctx.beginPath();
  ctx.moveTo(6.5, -8);
  ctx.lineTo(13.5, -8.4 + s.strain * 1.8);
  ctx.strokeStyle = look.hairDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  if (s.strain > 0.5 || s.out > 0.5) {
    ctx.beginPath();
    ctx.roundRect(11.6, 9.2, 4.2, 3, 0.8);
    ctx.fillStyle = '#f8f4ec';
    ctx.fill();
    ctx.strokeStyle = '#5a2a20';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(12.4, 11);
    ctx.lineTo(15.6, 10.4);
    ctx.strokeStyle = '#7a3b30';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
}

/** Sweat drops leaving the forehead and falling. */
function sweat(ctx: CanvasRenderingContext2D, s: HeadState): void {
  const gx = Math.sin(s.down);
  const gy = Math.cos(s.down);
  for (let i = 0; i < 2; i++) {
    const ph = (s.t * 1.6 + i * 0.5) % 1;
    const x = 14 + i * 3 + gx * ph * 30;
    const y = -12 + gy * ph * 30;
    ctx.globalAlpha = (s.strain - 0.35) * 1.6 * (1 - ph);
    ellipse(ctx, x, y, 1.7, 2.5, '#bfe6ff', -s.down);
    ctx.globalAlpha = 1;
  }
}

export function drawHead(ctx: CanvasRenderingContext2D, look: HeadLook, s: HeadState): void {
  skull(ctx, look, s.strain);
  hairCap(ctx, look);
  if (look.style === 'long') ponytail(ctx, look, s);
  face(ctx, look, s);
  if (s.strain > 0.35) sweat(ctx, s);
}
