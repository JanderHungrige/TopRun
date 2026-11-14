import type { UnitFn } from '../draw-ground-units';
import { plateShell, shell } from '../detail/organic';
import { glow, path, sym } from '../detail/parts';
import { detailUnit } from '../detail/unit';
import { art } from './sea-kit';
import { flesh, ribbon, smooth } from './sea-flesh';
import { ANGLER, SQUID } from './sea-fish';
import { hullInk, rgb, rgba, type SeaPal } from './sea-pal';

// The sea's creatures in detail (docs 68, 70, 120), heads down (+y), light from the upper left: the jellyfish — a glassy
// dome with its four gonads, radial canals and a gloss, the frilled margin pulsing round it, frilly oral arms and
// stinging tentacles trailing behind, bioluminescent spots breathing; the electric eel — a long olive body rounded by
// the light and mottled, a fin ribbon along it, swimming in waves behind its flat head with yellow eyes, its electric
// organ glowing along the flanks and sparks crackling at its snout when it charges. The squid and the anglerfish are in
// sea-fish.ts.

type Ctx = CanvasRenderingContext2D;

const bell = (t: number): { rx: number; ry: number } => {
  const pulse = Math.sin(t * 3.2);
  return { rx: 13 - pulse * 1.4, ry: 9 + pulse * 1.6 };
};

/** Tentacles and frilly oral arms trailing behind (up), waving; one colour in silhouettes. */
function jellyTentacles(ctx: Ctx, p: SeaPal, t: number): void {
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) { // stinging tentacles from the margin, fine and long
    const x0 = -10.5 + i * 3;
    const pts: number[] = [x0, 2];
    for (let k = 1; k <= 7; k++) pts.push(x0 * (1 - k * 0.04) + Math.sin(t * 4 + i * 1.3 + k * 0.9) * (0.8 + k * 0.22), 2 - k * 3.6);
    ctx.lineWidth = i % 3 === 1 ? 1.1 : 0.6;
    ctx.strokeStyle = p.mono ? p.hull : 'rgba(255,190,225,0.6)';
    ctx.stroke(smooth(pts));
  }
  for (let i = 0; i < 4; i++) { // the oral arms: frilled translucent ribbons
    const x0 = -3.6 + i * 2.4;
    const pts: number[] = [];
    for (let k = 0; k <= 5; k++) pts.push(x0 + Math.sin(t * 2.6 + i * 1.7 + k * 0.8) * (0.5 + k * 0.4), 3 - k * 3.4);
    const arm = ribbon(pts, 2.6, 1.2);
    ctx.fillStyle = p.mono ? p.hull : rgba(p.hull, 0.42);
    ctx.fill(arm);
    if (p.mono) continue;
    ctx.strokeStyle = rgba(p.trim, 0.55);
    ctx.lineWidth = 0.35;
    ctx.setLineDash([0.6, 0.5]);
    ctx.stroke(arm);
    ctx.setLineDash([]);
  }
}

/** The frilled margin of the bell at its pulsing size: scallops round the edge. */
function margin(ctx: Ctx, p: SeaPal, t: number): void {
  const { rx, ry } = bell(t);
  const pts: number[] = [];
  for (let k = 0; k < 48; k++) {
    const a = (k / 48) * Math.PI * 2, f = 1 + 0.045 * Math.abs(Math.sin(a * 8));
    pts.push(Math.cos(a) * rx * f, 4 + Math.sin(a) * ry * f);
  }
  const edge = path(pts);
  if (p.mono) {
    ctx.fillStyle = p.hull;
    ctx.fill(edge);
    return;
  }
  const g = ctx.createRadialGradient(0, 4, 4, 0, 4, rx);
  g.addColorStop(0, rgba(p.hull, 0.2));
  g.addColorStop(1, rgba(p.hull, 0.6));
  ctx.fillStyle = g;
  ctx.fill(edge);
  ctx.strokeStyle = rgba(p.light, 0.75);
  ctx.lineWidth = 0.5;
  ctx.stroke(edge);
}

function jellyDome(ctx: Ctx, p: SeaPal): void {
  const g = ctx.createRadialGradient(-3.4, 1.6, 0.5, 0, 4, 11.5);
  g.addColorStop(0, rgba('#fff4fa', 0.95));
  g.addColorStop(0.3, rgba(p.light, 0.8));
  g.addColorStop(0.7, rgba(p.hull, 0.66));
  g.addColorStop(1, rgba(p.dark, 0.85));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 4, 11.2, 7.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = rgba(p.dark, 0.55); // the shaded far rim
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(0, 4, 10.8, 6.8, 0, -0.3, Math.PI * 0.9);
  ctx.stroke();
  ctx.strokeStyle = rgba(p.dark, 0.5); // the radial canals and the ring canal
  ctx.lineWidth = 0.3;
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    ctx.stroke(path([Math.cos(a) * 3, 4 + Math.sin(a) * 2, Math.cos(a) * 10.4, 4 + Math.sin(a) * 6.6], false));
  }
  ctx.beginPath();
  ctx.ellipse(0, 4, 10.2, 6.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (let k = 0; k < 4; k++) { // the four gonads, horseshoes round the centre
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    const x = Math.cos(a) * 3.6, y = 4 + Math.sin(a) * 2.4;
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = rgba(p.trim, 0.8);
    ctx.beginPath();
    ctx.ellipse(x, y, 1.9, 1.3, a, Math.PI * 0.2, Math.PI * 1.8);
    ctx.stroke();
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = 'rgba(255,230,245,0.8)';
    ctx.stroke();
  }
  plateShell(ctx, [0, 2.6, 1, 4, 0, 5.4, -1, 4], { base: p.dark, dark: p.dark, light: p.light, ink: rgba(p.dark, 0.8) }, 0.3);
  jellyGloss(ctx);
}

/** The dome's gloss: a soft highlight, a lit rim arc and a glint. */
function jellyGloss(ctx: Ctx): void {
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(-4.4, 1.2, 4.2, 1.9, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.ellipse(0, 4, 10.4, 6.6, 0, Math.PI * 1.05, Math.PI * 1.55);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.ellipse(-5.6, 0.9, 1.2, 0.5, -0.35, 0, Math.PI * 2);
  ctx.fill();
}

/** A cheap round light: a faint halo and a bright core (no gradient — jellies come in swarms). */
function dot(ctx: Ctx, x: number, y: number, r: number, colour: string, a: number): void {
  ctx.fillStyle = rgba(colour, a * 0.3);
  ctx.beginPath();
  ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba(colour, a);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Bioluminescent spots on the rim and across the dome, breathing in turn. */
function jellyLights(ctx: Ctx, p: SeaPal, t: number): void {
  if (p.mono) return;
  const { rx, ry } = bell(t);
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2 + 0.26, on = 0.4 + 0.6 * Math.max(0, Math.sin(t * 3 + k * 1.1));
    dot(ctx, Math.cos(a) * rx * 0.97, 4 + Math.sin(a) * ry * 0.97, 0.55, '#ffe6f4', on);
  }
  for (let i = -2; i <= 2; i++) dot(ctx, i * 4.4, 4 - ry * 0.15, 0.7, p.trim, 0.55 + 0.25 * Math.sin(t * 2 + i));
}

const JELLY = art('jelly', {
  under: (ctx, p, t) => {
    jellyTentacles(ctx, p, t);
    margin(ctx, p, t);
  },
  body: jellyDome,
  over: jellyLights,
});

/** The eel's spine: the head held still, waves growing toward the tail. */
function eelSpine(t: number): number[] {
  const pts: number[] = [];
  for (let k = 0; k <= 10; k++) pts.push(Math.sin(t * 7 - k * 0.8) * k * 0.55, 15 - k * 4.3);
  return pts;
}

function eelBody(ctx: Ctx, p: SeaPal, t: number): void {
  const pts = eelSpine(t);
  if (!p.mono) { // the fin ribbon along the body
    const fin = ribbon(pts, 11, 4.4);
    ctx.fillStyle = rgba(p.light, 0.2);
    ctx.fill(fin);
    ctx.strokeStyle = rgba(p.dark, 0.55);
    ctx.lineWidth = 0.35;
    ctx.stroke(fin);
  }
  flesh(ctx, pts, 7.2, 2, hullInk(p), p.mono);
  if (p.mono) return;
  const charge = Math.max(0, Math.sin(t * 11));
  if (charge > 0.3) { // the electric organ lighting the flanks
    ctx.strokeStyle = rgba(p.glow, charge * 0.45);
    ctx.lineWidth = 1.4;
    ctx.stroke(ribbon(pts, 7.6, 2.4));
  }
  for (let k = 1; k < 10; k++) {
    const x = pts[k * 2] ?? 0, y = pts[k * 2 + 1] ?? 0, w = (7.2 - k * 0.5) / 2;
    ctx.fillStyle = 'rgba(20,28,10,0.45)'; // mottles
    ctx.beginPath();
    ctx.ellipse(x + (k % 2 ? 1 : -1) * w * 0.35, y, w * 0.32, 1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(p.glow, 0.3 + charge * 0.6); // the organ's cells along the flanks
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(x + s * w * 0.72, y + 1, 0.32, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function eelHead(ctx: Ctx, p: SeaPal): void {
  for (const s of [-1, 1]) { // pectoral fins
    ctx.fillStyle = rgba(p.light, 0.45);
    ctx.beginPath();
    ctx.ellipse(s * 5.2, 13.6, 2.2, 1.1, s * -0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  plateShell(ctx, sym([0, 24.4, 1.6, 24, 3.2, 22.6, 4.4, 20.4, 4.9, 17.6, 4.7, 15, 4, 13.2, 2.8, 12.2, 0, 11.8]), hullInk(p), 0.6);
  shell(ctx, -0.6, 17.6, 3.2, 4.4, { base: p.hull, dark: p.dark, light: p.light, ink: 'rgba(0,0,0,0)' }, 0);
  ctx.fillStyle = 'rgba(20,28,10,0.4)';
  for (const [x, y] of [[-1.8, 15], [1.6, 16.4], [-0.4, 19.6], [2.6, 13.4]] as const) ctx.fillRect(x, y, 0.9, 0.7);
  ctx.strokeStyle = 'rgba(10,14,6,0.8)'; // gill slits and the mouth
  ctx.lineWidth = 0.4;
  for (const s of [-1, 1]) ctx.stroke(path([s * 3.4, 13.4, s * 4.2, 14.6, s * 3.6, 15.8], false));
  ctx.stroke(path([-2, 23, 0, 23.8, 2, 23], false));
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#0a0c06';
    ctx.beginPath();
    ctx.arc(s * 2.3, 20.4, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.glass;
    ctx.beginPath();
    ctx.arc(s * 2.3, 20.4, 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0c06';
    ctx.fillRect(s * 2.3 - 0.15, 19.8, 0.3, 1.2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(s * 2.3 - 0.5, 19.9, 0.3, 0.3);
  }
}

function sparks(ctx: Ctx, p: SeaPal, t: number): void {
  if (p.mono || Math.sin(t * 11) <= 0.4) return;
  glow(ctx, 0, 24, 7, rgb(p.glow), 0.4);
  ctx.strokeStyle = p.glow;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = t * 13 + i * 2.1;
    ctx.moveTo(0, 24);
    ctx.lineTo(Math.cos(a) * 5, 24 + Math.sin(a) * 5);
    ctx.lineTo(Math.cos(a + 0.6) * 9, 24 + Math.sin(a + 0.6) * 9);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 0.3;
  ctx.stroke();
}

const EEL = art('eel', { under: eelBody, body: eelHead, over: sparks });

export const CREATURES: Readonly<Record<'jelly' | 'eel' | 'squid' | 'angler', UnitFn>> = {
  jelly: detailUnit('jelly', JELLY),
  eel: detailUnit('eel', EEL),
  squid: detailUnit('squid', SQUID),
  angler: detailUnit('angler', ANGLER),
};
