import { eyes, limb, plateShell, shell, spines, veins } from '../detail/organic';
import { plate } from '../detail/parts';
import { art, helmet, legs6, rifle } from './steppe-kit';
import { hideInk, ink, metalInk, type AlienPal } from './steppe-pal';

// The alien steppe's beasts in detail (docs 105, 115), heads down (+y): the beast rider — a six-legged horned steppe
// beast with a banded hide, a saddle cloth in the army's colours, an armoured brow and amber eyes, galloping with its
// tail whipping, an armoured rider aiming a lance-rifle; the brood carrier — a bloated translucent sac with veins and
// crawlers shifting inside, a plated head with glowing eyes, on six legs.

type Ctx = CanvasRenderingContext2D;

function gallop(ctx: Ctx, p: AlienPal, t: number): void {
  const run = t * 11;
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
    const g = Math.sin(run + i * 1.4 + (s > 0 ? 0.7 : 0)) * 5;
    const y = -8 + i * 8;
    limb(ctx, [s * 6, y, s * 10, y + g * 0.5 - 1, s * 12.5, y + g], 2.2, hideInk(p));
  }
  ctx.lineCap = 'round';
  ctx.strokeStyle = p.ink;
  ctx.lineWidth = 2.4;
  ctx.beginPath(); // the tail
  ctx.moveTo(0, -13);
  ctx.quadraticCurveTo(Math.sin(run) * 4, -19, Math.sin(run + 1) * 3, -25);
  ctx.stroke();
  ctx.strokeStyle = p.hide;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export const RIDER = art('rider', {
  under: gallop,
  body: (ctx, p) => {
    shell(ctx, 0, -1, 8.2, 14.5, hideInk(p), 5);
    ctx.fillStyle = 'rgba(30,20,12,0.35)'; // the hide's stripes
    for (let k = 0; k < 4; k++) ctx.fillRect(-6.5, -10 + k * 4.6, 13, 1.1);
    plateShell(ctx, [-6.2, -6, 6.2, -6, 7, 5, -7, 5], ink(p), 0.5); // saddle cloth
    plate(ctx, -6.6, 4, 13.2, 0.9, p.trim, p.ink, 0.2);
    shell(ctx, 0, 15.2, 5.2, 5.6, { ...hideInk(p), base: '#5e4e3e' }, 1);
    plateShell(ctx, [-4, 12.2, 4, 12.2, 3, 15.4, -3, 15.4], metalInk(p), 0.4); // armoured brow
    spines(ctx, [-3.6, 16.2, Math.PI * 0.72, 7.5, 1, 3.6, 16.2, Math.PI * 0.28, 7.5, 1], { base: '#e8dcc0', dark: '#8a7a5a', light: '#fff6e0', ink: p.ink });
    eyes(ctx, [-2.4, 18.4, 2.4, 18.4], 0.8, '#ffb03a', '#fff0c0');
  },
  over: (ctx, p, _t, aim) => {
    ctx.save();
    ctx.rotate(aim - Math.PI);
    rifle(ctx, p, 3.6, 16);
    ctx.restore();
    plateShell(ctx, [-6.6, 0, -4.4, -2.4, 4.4, -2.4, 6.6, 0, 5.4, 4, -5.4, 4], ink(p), 0.5);
    helmet(ctx, p, 0, 2.6, 3.6);
  },
});

export const BROODCARRIER = art('broodcarrier', {
  under: (ctx, p, t) => legs6(ctx, p, t, [-6, 3, 12], 9, 10, 5, 2),
  body: (ctx, p) => {
    spines(ctx, [-8, -14, Math.PI * 1.25, 4, 1.2, 8, -14, Math.PI * 1.75, 4, 1.2, 0, -20, -Math.PI / 2, 4.5, 1.3], ink(p));
    shell(ctx, 0, -3, 14.5, 17.5, { base: p.under, dark: p.dark, light: '#e0bce0', ink: p.ink }, 0);
    veins(ctx, 0, 12, [-10, 0, -11, -16, -4, -2, -5, -19, 4, -2, 5, -19, 10, 0, 11, -16, -14, 6, -13, -6, 14, 6, 13, -6], 'rgba(255,170,230,0.5)', 0.7);
    ctx.fillStyle = 'rgba(70,30,70,0.35)';
    for (const [x, y, r] of [[-6, -8, 3], [5, -12, 2.4], [-2, 2, 2.8], [7, 0, 2]] as const) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    shell(ctx, 0, 15.6, 7, 6, { ...ink(p), base: p.dark }, 1);
    plateShell(ctx, [-5.4, 13, 5.4, 13, 4.2, 16.6, -4.2, 16.6], metalInk(p), 0.4);
    eyes(ctx, [-3, 18.2, 3, 18.2, 0, 19.6], 0.9, p.glow, p.core, true);
  },
  over: (ctx, p, t) => {
    if (p.mono) return;
    for (let i = 0; i < 5; i++) { // crawlers moving inside the sac
      const a = t * 0.8 + i * 1.3;
      ctx.fillStyle = 'rgba(50,20,50,0.4)';
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 7, -3 + Math.sin(a * 1.3) * 9, 3, 4, a, 0, Math.PI * 2);
      ctx.fill();
    }
  },
});
