import { shade } from '../detail/color';
import { plateShell, shell, spines } from '../detail/organic';
import { glow, path } from '../detail/parts';
import { art } from './sea-kit';
import { finRays, flesh, suckers } from './sea-flesh';
import { hullInk, rgb, rgba, type SeaPal } from './sea-pal';

// The squid and the anglerfish in detail (docs 70, 120), heads down (+y): the squid — a pale mantle freckled with
// chromatophores that flicker, its pen down the back and a glassy rim, big silver-ringed eyes, eight arms with suckers
// and two long feeding tentacles with clubs waving ahead, its fins beating at the tail end; the anglerfish — a dark,
// warty fish with a lateral line and dorsal spines, a cavernous mouth of needle teeth, small pale eyes, fins and tail
// fluttering, the glowing lure on its stalk swinging ahead of the jaws.

type Ctx = CanvasRenderingContext2D;

/** An arm's spine from its root to its tip, curling with t. */
function armSpine(x0: number, x1: number, len: number, t: number, phase: number, amp: number): number[] {
  const pts: number[] = [];
  for (let k = 0; k <= 5; k++) {
    const f = k / 5;
    pts.push(x0 + (x1 - x0) * f + Math.sin(t * 9 + phase + f * 1.8) * amp * f, 8 + len * f);
  }
  return pts;
}

function squidArms(ctx: Ctx, p: SeaPal, t: number): void {
  for (const s of [-1, 1]) { // the two feeding tentacles, longer, with clubs
    const pts = armSpine(s * 0.8, s * 2, 17, t * 0.55, s, 2.4);
    flesh(ctx, pts, 0.9, 0.7, hullInk(p), p.mono);
    const cx = pts[10] ?? 0, cy = pts[11] ?? 0;
    flesh(ctx, [cx, cy - 2, cx + 0.2, cy + 0.4, cx, cy + 2.4], 2.2, 0.9, hullInk(p), p.mono);
  }
  for (let i = -3; i <= 3; i++) {
    const pts = armSpine(i * 1.4, i * 2.6, 13, t, i, 2.2);
    flesh(ctx, pts, 1.9, 0.5, hullInk(p), p.mono);
    if (!p.mono) suckers(ctx, pts, i < 0 ? 1 : -1, 0.3, 0.14, rgba(p.light, 0.9), rgba(p.trim, 0.6));
  }
}

function squidFins(ctx: Ctx, p: SeaPal, t: number): void {
  const flap = Math.sin(t * 7) * 2;
  for (const s of [-1, 1]) {
    const pts = [0, -18, s * (5 + flap * 0.5), -16, s * (9 + flap), -10.5, s * 4, -6, 0, -4];
    finRays(ctx, pts, 0, -10, p.mono ? p.hull : rgba(p.dark, 0.78), rgba(p.light, 0.5), rgba(p.trim, 0.8), p.mono);
  }
}

function squidMantle(ctx: Ctx, p: SeaPal): void {
  shell(ctx, 0, -2, 5.5, 13, hullInk(p), 0);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, -2, 5.5, 13, 0, 0, Math.PI * 2);
  ctx.clip();
  for (let k = 0; k < 30; k++) { // chromatophores
    const x = (((k * 37) % 100) / 100 - 0.5) * 9, y = -14 + ((k * 53) % 100) / 100 * 24;
    ctx.fillStyle = rgba(k % 3 ? p.trim : shade(p.trim, -0.35), 0.55);
    ctx.beginPath();
    ctx.arc(x, y, 0.3 + (k % 4) * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = rgba(p.light, 0.8); // the pen
  ctx.lineWidth = 0.5;
  ctx.stroke(path([-0.4, -14, -0.6, -2, -0.4, 9], false));
  ctx.restore();
  ctx.strokeStyle = rgba(p.light, 0.7); // the glassy rim
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.ellipse(0, -2, 5.1, 12.6, 0, Math.PI * 0.6, Math.PI * 1.45);
  ctx.stroke();
  shell(ctx, 0, 8, 4.4, 2.8, hullInk(p), 1); // the head
  for (const s of [-1, 1]) {
    shell(ctx, s * 3, 7, 1.5, 1.6, { base: '#8a96a4', dark: '#2a323c', light: '#e8eef4', ink: p.ink }, 0);
    ctx.fillStyle = p.glass;
    ctx.beginPath();
    ctx.arc(s * 3.05, 7.15, 1.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(s * 3.1 - 0.55, 6.6, 0.35, 0.35);
  }
}

/** Chromatophores flushing and fading across the mantle. */
function flicker(ctx: Ctx, p: SeaPal, t: number): void {
  if (p.mono) return;
  for (let k = 0; k < 8; k++) {
    const a = Math.max(0, Math.sin(t * 4 + k * 1.9));
    if (a < 0.2) continue;
    ctx.fillStyle = rgba(shade(p.trim, -0.2), a * 0.6);
    ctx.beginPath();
    ctx.arc(Math.sin(k * 2.7) * 3.2, -12 + k * 2.6, 0.7 + a * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const SQUID = art('squid', {
  under: (ctx, p, t) => {
    squidFins(ctx, p, t);
    squidArms(ctx, p, t);
  },
  body: squidMantle,
  over: flicker,
});

function anglerFins(ctx: Ctx, p: SeaPal, t: number): void {
  const wag = Math.sin(t * 3) * 2.2;
  const skin = p.mono ? p.hull : rgba(p.dark, 0.9);
  finRays(ctx, [0, -12, 6 + wag, -26, 3 + wag * 0.6, -22.4, wag * 0.4, -24, -3 + wag * 0.6, -22.4, -6 + wag, -26], 0, -12, skin, rgba(p.light, 0.45), p.ink, p.mono);
  const flutter = Math.sin(t * 6) * 1.4;
  for (const s of [-1, 1]) {
    finRays(ctx, [s * 12, 3, s * (18 + flutter), -1, s * (17.6 + flutter), -4, s * (15.6 + flutter * 0.5), -6.6, s * 11.4, -2], s * 12, 0,
      p.mono ? p.hull : rgba(p.hull, 0.75), rgba(p.light, 0.5), rgba(p.ink, 0.7), p.mono);
  }
}

/** The mouth: a dark gape with a lip, needle teeth of many lengths above and below. */
function jaws(ctx: Ctx, p: SeaPal): void {
  ctx.fillStyle = shade(p.light, -0.2); // the lower jaw's lip
  ctx.beginPath();
  ctx.ellipse(0, 9.6, 10.6, 5.8, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(0, 8, 1, 0, 9, 10);
  g.addColorStop(0, '#3a0e18');
  g.addColorStop(1, '#06060a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 9.2, 9.6, 4.8, 0, 0, Math.PI * 2);
  ctx.fill();
  const fang = (x: number, y: number, len: number, dir: number): void => {
    plateShell(ctx, [x - 0.45, y, x + 0.45, y, x, y + len * dir], { base: p.metal, dark: shade(p.metal, -0.4), light: '#ffffff', ink: 'rgba(0,0,0,0.5)' }, 0.15);
  };
  for (let i = -4; i <= 4; i++) {
    const x = i * 2.1, edge = Math.sqrt(Math.max(0, 1 - (x / 9.6) ** 2)) * 4.8;
    fang(x, 9.2 - edge + 0.3, 1.6 + ((i * 7 + 20) % 4) * 0.6, 1);
    if (i % 2 === 0) fang(x + 1, 9.2 + edge - 0.3, 1.4 + ((i * 5 + 20) % 3) * 0.7, -1);
  }
}

function anglerBody(ctx: Ctx, p: SeaPal): void {
  spines(ctx, [0, -13, -Math.PI / 2, 3.2, 0.6, 0, -9, -Math.PI * 0.55, 3, 0.55, 0, -5, -Math.PI * 0.45, 2.6, 0.5], { base: p.dark, dark: p.dark, light: p.light, ink: p.ink });
  shell(ctx, 0, 0, 14, 16, hullInk(p), 0);
  ctx.fillStyle = 'rgba(10,8,16,0.35)'; // mottles
  for (let k = 0; k < 9; k++) {
    ctx.beginPath();
    ctx.ellipse(Math.sin(k * 2.3) * 8, -11 + k * 2.4, 1.6, 1.1, k, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = rgba(p.light, 0.5); // warts
  for (let k = 0; k < 16; k++) {
    ctx.beginPath();
    ctx.arc(Math.cos(k * 2.4) * (4 + (k % 4) * 2.2), Math.sin(k * 2.4) * (5 + (k % 3) * 2.6) - 4, 0.42, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = rgba(p.light, 0.45); // the lateral lines
  ctx.lineWidth = 0.4;
  ctx.setLineDash([0.9, 0.7]);
  for (const s of [-1, 1]) ctx.stroke(path([s * 9.4, 4, s * 10.8, -4, s * 8, -12], false));
  ctx.setLineDash([]);
  jaws(ctx, p);
  for (const s of [-1, 1]) {
    shell(ctx, s * 6, 1, 1.7, 1.7, { base: p.glass, dark: '#4a6a80', light: '#ffffff', ink: p.ink }, 0);
    ctx.fillStyle = '#06080c';
    ctx.beginPath();
    ctx.arc(s * 6.1, 1.2, 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
  shell(ctx, 0, 2.6, 1.2, 1.2, hullInk(p), 0); // the stalk's root
}

/** The lure on its stalk, swinging ahead of the jaws and glowing. */
function lure(ctx: Ctx, p: SeaPal, t: number): void {
  const sway = Math.sin(t * 2.4) * 4;
  const x = sway * 1.5, y = 25;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 2.6);
  ctx.bezierCurveTo(4, 8, sway * 0.6 + 3, 18, x, y - 1.6);
  if (!p.mono) { // its shadow on the jaws below
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.2;
    ctx.save();
    ctx.translate(1.2, 1.4);
    ctx.stroke();
    ctx.restore();
  }
  ctx.strokeStyle = p.ink;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.strokeStyle = p.mono ? p.hull : p.light;
  ctx.lineWidth = 0.9;
  ctx.stroke();
  if (p.mono) {
    ctx.fillStyle = p.hull;
    ctx.beginPath();
    ctx.arc(x, y, 2.6, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const pulse = 0.75 + 0.25 * Math.sin(t * 5);
  glow(ctx, x, y, 7.5, rgb(p.glow), 0.4 * pulse);
  shell(ctx, x, y, 2.4, 2.4, { base: rgba(p.glow, 0.85), dark: '#1a6a64', light: '#eafffc', ink: p.ink }, 0);
  ctx.fillStyle = rgba(p.glow, 0.8); // its filaments
  for (const a of [-0.5, 0.5]) ctx.fillRect(x + Math.sin(a) * 2.6, y + Math.cos(a) * 2.6, 0.4, 1.4);
}

export const ANGLER = art('angler', { under: anglerFins, body: anglerBody, over: lure });
