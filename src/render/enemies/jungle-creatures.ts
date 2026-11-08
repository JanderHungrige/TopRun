import type { Pal, UnitFn } from '../draw-ground-units';
import { circle, ellipse } from '../shapes';

// The jungle planet's creatures (doc 81), heads down (+y): the raptor running on two legs with its tail behind, the
// armoured beetle, the spitter plant opening its jaws and the giant wasp with buzzing wings. Flashed or as a shadow they
// keep the same outline.

type JungleCreature = 'raptor' | 'beetle' | 'spitter' | 'wasp';

const raptor: UnitFn = (ctx, p, t) => {
  const run = Math.sin(t * 14) * 4;
  ctx.lineCap = 'round';
  ctx.strokeStyle = p.mono ? p.body : p.dark;
  ctx.lineWidth = 4;
  ctx.beginPath(); // the tail sways behind
  ctx.moveTo(0, -4);
  ctx.quadraticCurveTo(Math.sin(t * 6) * 6, -14, Math.sin(t * 6 + 1) * 4, -22);
  ctx.stroke();
  for (const side of [-1, 1]) {
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(side * 4, 0);
    ctx.lineTo(side * 6, 6 + (side < 0 ? run : -run));
    ctx.stroke();
  }
  ellipse(ctx, 0, 2, 6, 10, p.body);
  ellipse(ctx, 0, 13, 4, 6, p.body);
  if (p.mono) return;
  for (let i = 0; i < 3; i++) ellipse(ctx, 0, -2 + i * 4, 4, 1.2, p.trim); // the stripes
  circle(ctx, -2, 15, 1, '#ffd23a');
  circle(ctx, 2, 15, 1, '#ffd23a');
};

const beetle: UnitFn = (ctx, p, t) => {
  ctx.strokeStyle = p.mono ? p.body : p.line;
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    for (const side of [-1, 1]) {
      const wave = Math.sin(t * 8 + i * 2 + side) * 2;
      ctx.beginPath();
      ctx.moveTo(side * 12, -6 + i * 7);
      ctx.lineTo(side * 20, -9 + i * 7 + wave);
      ctx.stroke();
    }
  }
  ellipse(ctx, 0, 0, 15, 19, p.mono ? p.body : p.line);
  ellipse(ctx, 0, 0, 14, 18, p.body);
  ellipse(ctx, 0, 14, 8, 6, p.dark);
  if (p.mono) return;
  ctx.strokeStyle = p.dark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(0, 9);
  ctx.stroke();
  ellipse(ctx, -5, -6, 4, 7, p.light);
  ellipse(ctx, 5, -6, 4, 7, p.light);
  for (const side of [-1, 1]) {
    ctx.strokeStyle = p.trim;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); // the mandibles
    ctx.moveTo(side * 4, 18);
    ctx.lineTo(side * 2, 24);
    ctx.stroke();
  }
};

const spitter: UnitFn = (ctx, p, t, aim) => {
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.sin(t + i) * 0.1;
    ellipse(ctx, Math.cos(a) * 11, Math.sin(a) * 11, 7, 4, p.mono ? p.body : p.dark); // leaves round the stem
  }
  ctx.save();
  ctx.rotate(aim - Math.PI);
  const open = 0.3 + Math.max(0, Math.sin(t * 3)) * 0.5;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.rotate(side * open);
    ellipse(ctx, side * 3, 7, 6, 9, p.body);
    if (!p.mono) for (let k = 0; k < 3; k++) circle(ctx, side * 3 - side * 4, 2 + k * 4, 0.9, '#fff4d0'); // teeth
    ctx.restore();
  }
  if (!p.mono) circle(ctx, 0, 6, 2.5, p.red);
  ctx.restore();
};

const wasp: UnitFn = (ctx, p, t) => {
  const buzz = Math.sin(t * 60) * 0.25;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.rotate(side * (0.5 + buzz));
    ellipse(ctx, side * 8, -2, 8, 4, p.mono ? p.body : 'rgba(220,240,255,0.45)');
    ctx.restore();
  }
  ellipse(ctx, 0, -8, 4, 7, p.body);
  ellipse(ctx, 0, 2, 3.5, 4, p.dark);
  ellipse(ctx, 0, 8, 3, 3, p.body);
  if (p.mono) return;
  for (let i = 0; i < 3; i++) ellipse(ctx, 0, -12 + i * 3, 4, 1, '#1a1a1a');
  circle(ctx, -1.5, 9, 0.8, p.red);
  circle(ctx, 1.5, 9, 0.8, p.red);
};

export const JUNGLE_CREATURES: Readonly<Record<JungleCreature, UnitFn>> = { raptor, beetle, spitter, wasp };

/** The palettes of the jungle's enemies (doc 81): olive machines with red lamps, the creatures in their own colours. */
export const junglePals = (pal: (body: string, dark: string, light: string, trim: string, glass?: string) => Pal): Readonly<Record<JungleCreature | 'walker' | 'hovertank' | 'artillery' | 'gundrone' | 'dropship' | 'brute', Pal>> => ({
  walker: pal('#6a6a48', '#3a3a26', '#8e8e66', '#4a4a32', '#ff6a3a'),
  hovertank: pal('#7a6a48', '#4a3e28', '#a0906a', '#2c2a20', '#ffb84a'),
  artillery: pal('#6a6e52', '#3e4232', '#8e9270', '#2c2f24'),
  gundrone: pal('#8a8e82', '#4a4e46', '#b4b8ac', '#5a5e56'),
  dropship: pal('#6e7468', '#3c4038', '#9aa094', '#c84a3a', '#7fd0ff'),
  brute: pal('#5a5a3c', '#30301e', '#7e7e58', '#3a3a26', '#ff6a3a'),
  raptor: pal('#7a8a3a', '#4a5a22', '#a8b860', '#3a4a1a'),
  beetle: pal('#3a4a5a', '#1e2a36', '#6a8aa0', '#c8a040'),
  spitter: pal('#c84a7a', '#4a7a2a', '#ff8ab0', '#2e5a1e'),
  wasp: pal('#d8b030', '#5a4a10', '#f0d870', '#2a2a10'),
});
