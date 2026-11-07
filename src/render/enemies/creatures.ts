import type { Pal, UnitFn } from '../draw-ground-units';
import { circle, ellipse } from '../shapes';

// Map 5's sea creatures (docs 68, 70), heads down (+y): the jellyfish, the electric eel, the squid and the anglerfish.
// They pulse and wriggle with time; flashed or as a shadow they keep the same outline.

type CreatureKind = 'jelly' | 'eel' | 'squid' | 'angler';

/** A translucent bell that pulses, a frilled rim and tentacles trailing behind (up). */
const jelly: UnitFn = (ctx, p, t) => {
  const pulse = Math.sin(t * 3.2);
  const ry = 9 + pulse * 1.6;
  const rx = 13 - pulse * 1.4;
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = p.mono ? p.body : 'rgba(255,170,215,0.55)';
  for (let i = 0; i < 6; i++) {
    const x0 = -9 + i * 3.6;
    ctx.beginPath();
    ctx.moveTo(x0, 0);
    for (let k = 1; k <= 6; k++) ctx.lineTo(x0 + Math.sin(t * 4 + i + k * 0.9) * 1.8, -k * 4);
    ctx.stroke();
  }
  ellipse(ctx, 0, 4, rx, ry, p.mono ? p.body : 'rgba(255,140,200,0.55)');
  if (p.mono) return;
  ellipse(ctx, 0, 6, rx * 0.6, ry * 0.55, 'rgba(255,215,240,0.6)');
  ellipse(ctx, -4, 8, 3, 2, 'rgba(255,255,255,0.45)');
  for (let i = -2; i <= 2; i++) circle(ctx, i * 4.4, 4 - ry * 0.15, 1.1, 'rgba(255,90,170,0.7)');
};

/** A long green-brown body that wriggles, a pale belly line, and blue sparks crackling at the head when it charges. */
const eel: UnitFn = (ctx, p, t) => {
  const pts: Array<[number, number]> = [];
  for (let k = 0; k <= 10; k++) {
    const y = 16 - k * 4.4;
    pts.push([Math.sin(t * 7 - k * 0.8) * (1 + k * 0.5), y]);
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [w, color] of [[9, p.mono ? p.body : p.line], [7, p.body], [2, p.mono ? p.body : p.light]] as const) {
    for (let k = 0; k < pts.length - 1; k++) {
      const a = pts[k];
      const b = pts[k + 1];
      if (!a || !b) continue;
      ctx.lineWidth = w * (1 - k * 0.07);
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    }
  }
  const head = pts[0] ?? [0, 16];
  ellipse(ctx, head[0], head[1] + 2, 4.6, 5.4, p.body);
  if (p.mono) return;
  circle(ctx, head[0] - 2, head[1] + 4, 0.9, '#ffe27a');
  circle(ctx, head[0] + 2, head[1] + 4, 0.9, '#ffe27a');
  if (p.live && Math.sin(t * 11) > 0.4) sparks(ctx, p, head[0], head[1] + 4, t);
};

function sparks(ctx: CanvasRenderingContext2D, p: Pal, x: number, y: number, t: number): void {
  ctx.strokeStyle = p.glass;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = t * 13 + i * 2.1;
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * 5, y + Math.sin(a) * 5);
    ctx.lineTo(x + Math.cos(a + 0.6) * 9, y + Math.sin(a + 0.6) * 9);
  }
  ctx.stroke();
}

/** A pale torpedo body with side fins at the tail end (up), tentacles trailing forward-down, ink at the back. */
const squid: UnitFn = (ctx, p, t) => {
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = p.mono ? p.body : p.dark;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 1.4, 8);
    ctx.lineTo(i * 2.2 + Math.sin(t * 9 + i) * 1.6, 15);
    ctx.lineTo(i * 2.6 + Math.sin(t * 9 + i + 1) * 2.4, 21);
    ctx.stroke();
  }
  const flap = Math.sin(t * 7) * 2;
  ctx.fillStyle = p.mono ? p.body : p.dark;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(9 + flap, -10);
  ctx.lineTo(0, -4);
  ctx.lineTo(-9 - flap, -10);
  ctx.closePath();
  ctx.fill();
  ellipse(ctx, 0, -2, 5.5, 13, p.body);
  if (p.mono) return;
  ellipse(ctx, -1.5, -6, 2, 6, 'rgba(255,255,255,0.3)');
  for (const sx of [-3, 3]) circle(ctx, sx, 7, 1.3, '#1a1a22');
};

/** A dark gaping fish: a big head, needle teeth, a stalk with a glowing lure swinging ahead of it. */
const angler: UnitFn = (ctx, p, t) => {
  const sway = Math.sin(t * 2.4) * 4;
  ctx.strokeStyle = p.mono ? p.body : p.light;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.quadraticCurveTo(sway, 18, sway * 1.5, 24);
  ctx.stroke();
  ctx.fillStyle = p.mono ? p.body : p.dark;
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(7, -26);
  ctx.lineTo(4, -14);
  ctx.lineTo(-4, -14);
  ctx.lineTo(-7, -26);
  ctx.closePath();
  ctx.fill();
  ellipse(ctx, 0, 0, 14, 16, p.body);
  if (p.mono) return;
  ellipse(ctx, 0, 9, 10, 5, '#0a0a10');
  ctx.fillStyle = '#e8e8f0';
  for (let i = -4; i <= 4; i++) ctx.fillRect(i * 2.2 - 0.4, 6, 0.8, 3);
  for (const sx of [-6, 6]) circle(ctx, sx, 1, 1.6, '#c8e8ff');
  if (p.live) {
    circle(ctx, sway * 1.5, 25, 6, 'rgba(95,240,224,0.25)');
    circle(ctx, sway * 1.5, 25, 2.4, p.glass);
  }
};

export const CREATURES: Readonly<Record<CreatureKind, UnitFn>> = { jelly, eel, squid, angler };
