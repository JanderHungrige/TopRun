import { drawFrontFigure, LINE, SKIN, tone, type Expression, type FrontExtras, type FrontTorso, type HeadMap, type PersonLook } from '../people';
import { ellipse } from '../shapes';
import type { PushupSetting } from './pushups-set';

// Three spectators behind the duel (doc 12): the coach (tank top, cap, whistle) and two crewmen, drawn as
// three-quarter people-kit figures (doc 17), shirtless or in tank tops, cheering with raised arms.

type Extra = 'coach' | 'towel' | 'shades';

interface Fan {
  x: number;
  look: PersonLook;
  turn: number;
  extra: Extra;
  phase: number;
}

const SCALE = 0.5;
const SNEAKER = tone('#e8eaec', '#ffffff', '#b2b8be');

function fan(base: Omit<PersonLook, 'top' | 'bottom' | 'feet' | 'shoe' | 'sole' | 'legs' | 'trim'>, top: string, shorts: string, beach: boolean): PersonLook {
  return {
    ...base,
    top: tone(top, '#ffffff', 'rgba(0,0,0,0.35)'),
    legs: 'shorts',
    bottom: tone(shorts, 'rgba(255,255,255,0.35)', 'rgba(0,0,0,0.35)'),
    trim: '#f2f2ee',
    feet: beach ? 'barefoot' : 'sneakers',
    shoe: SNEAKER,
    sole: '#5d646c',
  };
}

const COACH = { skin: SKIN.olive, hair: { style: 'crew', ...tone('#2a1d16', '#4a3528', '#16100b'), brow: '#22170f' }, eyes: '#3a2416' } as const;
const TOWEL = { skin: SKIN.light, hair: { style: 'messy', ...tone('#b5652f', '#d68a50', '#844520'), brow: '#8f4f25' }, eyes: '#4d6f8c' } as const;
const SHADES = { skin: SKIN.brown, hair: { style: 'buzz', ...tone('#17110d', '#3a2c22', '#0c0806'), brow: '#140e0a' }, eyes: '#2a1a10' } as const;

const GYM: readonly Fan[] = [
  { x: 548, look: fan({ ...COACH, torso: 'tank' }, '#7d8794', '#2c323b', false), turn: -0.35, extra: 'coach', phase: 0 },
  { x: 640, look: fan({ ...TOWEL, torso: 'shirtless' }, '#e8c43a', '#3b4a33', false), turn: -0.15, extra: 'towel', phase: 1.7 },
  { x: 732, look: fan({ ...SHADES, torso: 'tank' }, '#b8322c', '#2f3d5c', false), turn: 0.35, extra: 'shades', phase: 3.1 },
];
const BEACH: readonly Fan[] = [
  { x: 548, look: fan({ ...COACH, torso: 'tank' }, '#e86d4d', '#2f63ad', true), turn: -0.35, extra: 'coach', phase: 0 },
  { x: 640, look: fan({ ...TOWEL, torso: 'shirtless' }, '#4fb3a8', '#f2c94c', true), turn: -0.15, extra: 'towel', phase: 1.7 },
  { x: 732, look: fan({ ...SHADES, torso: 'shirtless' }, '#f4ede0', '#c2342c', true), turn: 0.35, extra: 'shades', phase: 3.1 },
];

function cap(ctx: CanvasRenderingContext2D, m: HeadMap): void {
  ctx.beginPath();
  ctx.moveTo(-18 - m.s, -25);
  ctx.quadraticCurveTo(-18, -47, 2 + 3 * m.s, -47);
  ctx.quadraticCurveTo(18 + m.s, -46, 18 + m.s, -25);
  ctx.quadraticCurveTo(0, -29, -18 - m.s, -25);
  ctx.fillStyle = '#1d2c4d';
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ellipse(ctx, m.fx(1, 19), -25.5, 15, 3.6, '#16223c');
  ellipse(ctx, m.fx(0, 17), -36, 3.4, 3.4, '#c9a23a');
}

function shades(ctx: CanvasRenderingContext2D, m: HeadMap): void {
  ctx.fillStyle = '#121418';
  ctx.beginPath();
  ctx.ellipse(m.fx(-6.6, 14), -16.5, 4.4, 2.8, 0, 0, Math.PI * 2);
  ctx.ellipse(m.fx(6.6, 14), -16.5, 4.4 * (1 - m.s), 2.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(m.fx(-2.4, 16), -17.4, m.fx(2.4, 16) - m.fx(-2.4, 16), 1.2);
  ctx.fillRect(m.fx(-15, 0), -17.6, m.fx(-10, 12) - m.fx(-15, 0), 1.2);
  ellipse(ctx, m.fx(-7.6, 14), -17.4, 1.6, 0.7, 'rgba(255,255,255,0.4)');
}

function whistle(ctx: CanvasRenderingContext2D, t: FrontTorso, cheer: number): void {
  const cx = t.centre(0);
  ctx.beginPath();
  ctx.moveTo(-8, -105);
  ctx.quadraticCurveTo(cx - 6, -88, cx, -80);
  ctx.quadraticCurveTo(cx + 6, -88, 8 + cx * 0.5, -105);
  ctx.strokeStyle = '#e8e8e8';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(cx - 4, -81, 10, 6, 2);
  ctx.fillStyle = cheer > 0.5 ? '#ffd84a' : '#c8ccd0';
  ctx.fill();
}

function towel(ctx: CanvasRenderingContext2D, t: FrontTorso): void {
  const cx = t.centre(0);
  ctx.fillStyle = '#f4f1ea';
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.2;
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sd * 9 + cx * 0.3, -108);
    ctx.quadraticCurveTo(sd * 18 + cx * 0.6, -104, sd * 17 + cx, -62);
    ctx.lineTo(sd * 7 + cx, -62);
    ctx.quadraticCurveTo(sd * 8 + cx, -96, sd * 4 + cx * 0.3, -108);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c2342c';
    ctx.fillRect(Math.min(sd * 17, sd * 7) + cx, -70, 10, 3);
    ctx.fillStyle = '#f4f1ea';
  }
}

function extrasFor(f: Fan, cheer: number): FrontExtras {
  switch (f.extra) {
    case 'coach': return { head: cap, chest: (ctx, t) => whistle(ctx, t, cheer), key: `coach${cheer > 0.5 ? 1 : 0}` };
    case 'towel': return { chest: towel, key: 'towel' };
    case 'shades': return { head: shades, key: 'shades' };
    default: throw new Error(`unhandled: ${f.extra satisfies never}`);
  }
}

function blink(t: number, phase: number): number {
  const ph = (t + phase * 1.3) % 4.1;
  return ph < 0.14 ? 1 - Math.abs(ph / 0.07 - 1) : 0;
}

function drawFan(ctx: CanvasRenderingContext2D, f: Fan, footY: number, cheer: number, t: number): void {
  const wave = cheer * (0.75 + 0.25 * Math.sin(t * 9 + f.phase));
  const bounce = -Math.abs(Math.sin(t * (cheer > 0.3 ? 8 : 1.6) + f.phase)) * (2 + cheer * 8);
  ellipse(ctx, f.x, footY, 30, 5, 'rgba(0,0,0,0.25)');
  ctx.save();
  ctx.translate(f.x, footY + bounce);
  ctx.scale(SCALE, SCALE);
  const expression: Expression = cheer > 0.3 ? 'grin' : 'calm';
  const raise = [wave, f.extra === 'coach' ? wave * 0.6 : wave] as const;
  drawFrontFigure(ctx, f.look, { turn: f.turn, raise, hands: f.extra === 'coach' ? 'fist' : 'open' }, {
    expression, strain: 0, blink: blink(t, f.phase), t,
  }, extrasFor(f, cheer));
  ctx.restore();
}

/** `cheer` 0 … 1 raises arms and bounces. */
export function drawPushupCrowd(ctx: CanvasRenderingContext2D, setting: PushupSetting, cheer: number, t: number): void {
  const fans = setting === 'gym' ? GYM : BEACH;
  const footY = setting === 'gym' ? 500 : 516;
  for (const f of fans) drawFan(ctx, f, footY, cheer, t);
}
