import { gunTurret, HL, missileRack, rect, ring, SH, type UnitFn } from '../draw-ground-units';
import { circle, ellipse, fillPair, fillPoly, fillSym } from '../shapes';
import { screwBlur } from './sea';

// Map 5's deep machines (doc 70), bows down (+y): the hunter sub, the torpedo boat on the surface (seen from below), the
// giant crab, the sea lab and the missile-sub mini-boss. Generic shapes in code, no insignia.

type DeepKind = 'hunter' | 'torpboat' | 'crab' | 'sealab' | 'boomer';

/** A bigger dark sub: a tall swept sail, cross tail, twin screws. */
const hunter: UnitFn = (ctx, p, t) => {
  for (const sx of [-4, 4]) {
    ctx.save();
    ctx.translate(sx, 0);
    screwBlur(ctx, -27, 5, t + sx, p);
    ctx.restore();
  }
  fillPair(ctx, [3, -18, 12, -24, 12, -26, 3, -23], p.dark, p.line);
  fillSym(ctx, [0, 28, 5, 25, 9, 17, 10.5, 4, 10, -12, 7, -21, 0, -25], p.body, p.line);
  fillPair(ctx, [3, 6, 11, 4, 11, 2, 3, 2], p.dark, p.line);
  fillSym(ctx, [0, 12, 3, 9, 3.4, -1, 2, -5, 0, -6], p.dark, p.line);
  if (p.mono) return;
  fillSym(ctx, [0, 24, 4, 19, 5, 3, 4, -15, 0, -19], HL);
  for (const y of [14, -8]) rect(ctx, -9, y, 18, 1.2, SH);
  if (p.live) circle(ctx, 0, 26, 1.4, p.trim);
};

/** On the surface, seen from below: a dark hull against the bright skin of the water, foam at the bow, props churning. */
const torpboat: UnitFn = (ctx, p, t) => {
  if (!p.mono) {
    ellipse(ctx, 0, 0, 22, 34, 'rgba(220,245,255,0.18)');
    for (let i = 0; i < 6; i++) circle(ctx, Math.sin(t * 6 + i) * 6, 30 + i * 2, 2 + (i % 3), 'rgba(240,250,255,0.35)');
  }
  fillSym(ctx, [0, 30, 6, 24, 10, 12, 11, -18, 9, -26, 0, -27], p.body, p.line);
  if (p.mono) return;
  fillSym(ctx, [0, 26, 4, 21, 6, 10, 6, -16, 0, -18], p.dark);
  for (const sx of [-5, 5]) {
    ellipse(ctx, sx, -27, 3 + Math.abs(Math.sin(t * 20 + sx)) * 2, 1.4, 'rgba(240,250,255,0.5)');
  }
  for (const y of [8, -6]) {
    rect(ctx, -10, y, 4, 8, p.trim);
    rect(ctx, 6, y, 4, 8, p.trim);
  }
};

/** A red-brown shell, legs stepping, two big claws held forward. */
const crab: UnitFn = (ctx, p, t) => {
  const step = Math.sin(t * 8);
  ctx.strokeStyle = p.dark;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    for (const sx of [-1, 1]) {
      const y = -6 + i * 6;
      const k = (i % 2 === 0 ? step : -step) * 3;
      ctx.beginPath();
      ctx.moveTo(sx * 10, y);
      ctx.lineTo(sx * 20, y - 4 + k);
      ctx.lineTo(sx * 24, y + 4 + k);
      ctx.stroke();
    }
  }
  for (const sx of [-1, 1]) {
    fillPoly(ctx, [sx * 8, 10, sx * 14, 18, sx * 12, 26, sx * 6, 26, sx * 4, 18], p.dark, p.line);
    fillPoly(ctx, [sx * 12, 26, sx * 16, 30, sx * 9, 31], p.light, p.line);
  }
  ellipse(ctx, 0, 0, 13, 11, p.body);
  if (p.mono) return;
  ellipse(ctx, -3, -3, 6, 4, HL);
  for (const sx of [-3, 3]) circle(ctx, sx, 10, 1.6, '#1a1210');
};

/** A domed habitat on legs: lit portholes round the rim, a pipe running off, a launcher on top. */
const sealab: UnitFn = (ctx, p, t, aim) => {
  for (const [x, y] of [[-20, -16], [20, -16], [-20, 16], [20, 16]] as const) rect(ctx, x - 2, y - 2, 4, 4, p.dark);
  rect(ctx, 18, -3, 14, 6, p.dark);
  ring(ctx, 0, 0, 20, p.body, p.line);
  ring(ctx, 0, 0, 13, p.light, p.line);
  if (!p.mono) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      circle(ctx, Math.cos(a) * 17, Math.sin(a) * 17, 1.6, p.live && Math.sin(t * 2 + i) > -0.6 ? p.glass : '#2a3036');
    }
    ellipse(ctx, -4, -5, 6, 4, HL);
  }
  ctx.save();
  ctx.rotate(aim);
  missileRack(ctx, 2, 7, 0, p);
  ctx.restore();
};

/** The missile sub: long and broad, a hump of missile hatches behind the sail, a gun forward. */
const boomer: UnitFn = (ctx, p, t, aim) => {
  screwBlur(ctx, -62, 10, t, p);
  fillPair(ctx, [6, -46, 24, -56, 24, -60, 6, -54], p.dark, p.line);
  fillSym(ctx, [0, 62, 10, 56, 18, 40, 22, 14, 22, -34, 18, -48, 10, -56, 0, -60], p.body, p.line);
  fillSym(ctx, [0, 30, 4, 26, 5, 14, 4, 8, 0, 7], p.dark, p.line);
  fillPair(ctx, [4, 22, 18, 20, 18, 17, 4, 17], p.dark, p.line);
  fillSym(ctx, [0, 4, 10, 2, 11, -36, 0, -38], p.light, p.line);
  if (!p.mono) {
    for (let i = 0; i < 6; i++) for (const sx of [-5, 5]) ring(ctx, sx, -2 - i * 6, 2.2, p.dark, p.line);
    fillSym(ctx, [0, 56, 6, 50, 9, 30, 8, 10, 0, 8], HL);
  }
  ctx.save();
  ctx.translate(0, 44);
  ctx.rotate(aim);
  gunTurret(ctx, 7, 2, 0, p, 1.8);
  ctx.restore();
};

export const SEA_UNITS_2: Readonly<Record<DeepKind, UnitFn>> = { hunter, torpboat, crab, sealab, boomer };
