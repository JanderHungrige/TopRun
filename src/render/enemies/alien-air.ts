import type { Pal, UnitFn } from '../draw-ground-units';
import { circle, ellipse, fillPoly } from '../shapes';

// The jungle planet's flying aliens (doc 96), heads down (+y): the glider ray beating its wide wings, the leatherwing
// with its crest and beak, the giant dragonfly's four buzzing wings, the spore balloon's veined gas bag and dangling
// sacs, the sky jelly's glowing bell and trailing tentacles. Flashed or as a shadow they keep the outline.

type AlienAir = 'glider' | 'leatherwing' | 'dragonfly' | 'balloon' | 'skyjelly';

const glider: UnitFn = (ctx, p, t) => {
  const beat = Math.sin(t * 3.2) * 4;
  ctx.strokeStyle = p.mono ? p.body : p.dark;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath(); // the whip tail
  ctx.moveTo(0, -10);
  ctx.quadraticCurveTo(Math.sin(t * 2.5) * 5, -22, Math.sin(t * 2.5 + 1) * 3, -32);
  ctx.stroke();
  const wing = [0, 12, 10, 6, 26, -2 + beat, 22, -6 + beat * 0.6, 8, -10, 0, -12];
  fillPoly(ctx, wing, p.mono ? p.body : p.line);
  fillPoly(ctx, wing.map((v, i) => (i % 2 ? v : -v)), p.mono ? p.body : p.line);
  const inner = [0, 10, 9, 5, 23, -2 + beat, 19, -5 + beat * 0.6, 7, -8, 0, -10];
  fillPoly(ctx, inner, p.body);
  fillPoly(ctx, inner.map((v, i) => (i % 2 ? v : -v)), p.body);
  ellipse(ctx, 0, 2, 6, 10, p.mono ? p.body : p.dark);
  if (p.mono) return;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) circle(ctx, side * (9 + i * 4), 2 - i * 1.5 + beat * (i / 4), 1.1, p.glass); // the glowing spots
    ellipse(ctx, side * 4, 10, 1.6, 2.4, p.trim); // the cephalic fins
  }
  ellipse(ctx, 0, 0, 2.5, 6, p.light);
};

const leatherwing: UnitFn = (ctx, p, t) => {
  const flap = Math.sin(t * 7);
  const tipY = -6 + flap * 6;
  for (const side of [-1, 1]) {
    fillPoly(ctx, [side * 3, -2, side * 22, tipY - 2, side * 18, tipY + 4, side * 10, tipY + 6, side * 3, 6], p.mono ? p.body : p.dark);
    if (p.mono) continue;
    fillPoly(ctx, [side * 4, -1, side * 19, tipY, side * 16, tipY + 4, side * 9, tipY + 5, side * 4, 5], p.body);
    ctx.strokeStyle = p.dark;
    ctx.lineWidth = 1;
    ctx.beginPath(); // the wing fingers
    ctx.moveTo(side * 4, 0);
    ctx.lineTo(side * 22, tipY - 2);
    ctx.moveTo(side * 6, 1);
    ctx.lineTo(side * 14, tipY + 5);
    ctx.stroke();
  }
  ellipse(ctx, 0, 0, 4, 9, p.mono ? p.body : p.light);
  fillPoly(ctx, [-2, 7, 2, 7, 0, 18], p.mono ? p.body : p.trim); // the beak
  fillPoly(ctx, [-1.5, -5, 1.5, -5, 0, -16], p.mono ? p.body : p.trim); // the crest
  if (!p.mono) for (const side of [-1, 1]) circle(ctx, side * 1.8, 6, 0.9, p.glass);
};

const dragonfly: UnitFn = (ctx, p, t) => {
  const buzz = Math.sin(t * 70) * 0.2;
  for (const [y, len, off] of [[3, 13, 0.15], [-2, 12, -0.25]] as const) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(0, y);
      ctx.rotate(side * (Math.PI / 2 + off + buzz));
      ellipse(ctx, 0, len * 0.55, 2.6, len * 0.55, p.mono ? p.body : 'rgba(200,240,255,0.5)');
      if (!p.mono) ellipse(ctx, 0, len * 0.8, 1, 2, 'rgba(60,90,110,0.6)'); // the wing spot
      ctx.restore();
    }
  }
  for (let i = 0; i < 6; i++) ellipse(ctx, 0, -4 - i * 3, 1.8 - i * 0.12, 1.8, p.mono ? p.body : i % 2 ? p.body : p.dark); // the abdomen
  ellipse(ctx, 0, 3, 3, 4, p.mono ? p.body : p.body);
  if (p.mono) return;
  ellipse(ctx, 0, 3, 1.2, 3, p.light);
  for (const side of [-1, 1]) circle(ctx, side * 2.2, 7, 2.2, p.glass); // the compound eyes
  circle(ctx, 0, -20, 1, p.trim);
};

const balloon: UnitFn = (ctx, p, t) => {
  ctx.strokeStyle = p.mono ? p.body : p.dark;
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) { // tendrils and spore sacs dangling behind
    const x = -8 + i * 4;
    const sway = Math.sin(t * 1.6 + i) * 3;
    ctx.beginPath();
    ctx.moveTo(x, -8);
    ctx.quadraticCurveTo(x + sway, -16, x + sway * 1.5, -22 - (i % 2) * 4);
    ctx.stroke();
    circle(ctx, x + sway * 1.5, -22 - (i % 2) * 4, 2.2, p.mono ? p.body : p.trim);
  }
  const swell = 1 + Math.sin(t * 1.8) * 0.05;
  ellipse(ctx, 0, 2, 17 * swell + 1, 16 * swell + 1, p.mono ? p.body : p.line);
  ellipse(ctx, 0, 2, 17 * swell, 16 * swell, p.body);
  if (p.mono) return;
  ellipse(ctx, 0, 2, 12 * swell, 11 * swell, p.light);
  ctx.strokeStyle = p.dark;
  for (let i = 0; i < 6; i++) { // veins over the bag
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.quadraticCurveTo(Math.cos(a + 0.5) * 9, 2 + Math.sin(a + 0.5) * 9, Math.cos(a) * 16 * swell, 2 + Math.sin(a) * 15 * swell);
    ctx.stroke();
  }
  for (const [x, y] of [[-6, -3], [5, -5], [6, 7], [-5, 8], [0, 1]] as const) circle(ctx, x, y, 1.6, p.glass); // the spores inside
  ellipse(ctx, -5, -6, 4, 2.5, 'rgba(255,255,255,0.35)');
};

const skyjelly: UnitFn = (ctx, p, t) => {
  const pulse = 1 + Math.sin(t * 2.6) * 0.08;
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) { // the tentacles trailing behind
    const x = -12 + i * 4;
    ctx.strokeStyle = p.mono ? p.body : i % 2 ? p.trim : 'rgba(255,200,240,0.6)';
    ctx.lineWidth = i % 2 ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(x, -4);
    ctx.bezierCurveTo(x + Math.sin(t * 2 + i) * 5, -16, x - Math.sin(t * 2.3 + i) * 5, -26, x + Math.sin(t * 1.7 + i) * 4, -34 - (i % 3) * 3);
    ctx.stroke();
  }
  ellipse(ctx, 0, 4, 19 * pulse + 1, 15 * pulse + 1, p.mono ? p.body : p.line);
  ellipse(ctx, 0, 4, 19 * pulse, 15 * pulse, p.mono ? p.body : 'rgba(232,120,200,0.75)');
  if (p.mono) return;
  ellipse(ctx, 0, 6, 12 * pulse, 9 * pulse, p.body);
  ellipse(ctx, 0, 7, 5, 4, p.dark);
  for (let i = 0; i < 10; i++) { // the rim lights
    const a = (i / 10) * Math.PI * 2 + t * 0.5;
    const on = 0.4 + 0.6 * Math.max(0, Math.sin(t * 4 + i));
    circle(ctx, Math.cos(a) * 16 * pulse, 4 + Math.sin(a) * 12 * pulse, 1.1, `rgba(170,255,250,${on.toFixed(2)})`);
  }
  ellipse(ctx, -6, -1, 5, 3, 'rgba(255,255,255,0.3)');
};

export const ALIEN_AIR: Readonly<Record<AlienAir, UnitFn>> = { glider, leatherwing, dragonfly, balloon, skyjelly };

/** Their palettes: body, dark, light, trim, glass (the glow — spots, eyes, spores). */
export const alienAirPals = (pal: (body: string, dark: string, light: string, trim: string, glass?: string) => Pal): Readonly<Record<AlienAir, Pal>> => ({
  glider: pal('#3a6a7a', '#1e3a44', '#7ab0c0', '#2a4a54', '#7affe8'),
  leatherwing: pal('#8a5a3a', '#4a2e1c', '#c8a080', '#e8d0a0', '#ffd23a'),
  dragonfly: pal('#2a8a6a', '#145040', '#7ae0b8', '#e8c040', '#ff5a3a'),
  balloon: pal('#b8a060', '#6a5a30', '#e8d8a0', '#8a6a3a', '#c8ff5a'),
  skyjelly: pal('#f0a8d8', '#a85090', '#ffe0f4', '#ff7ad2', '#aafffa'),
});
