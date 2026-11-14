import type { UnitFn } from '../draw-ground-units';
import { shade } from '../detail/color';
import { plateShell, shell } from '../detail/organic';
import { bolts, grille, hatch, path } from '../detail/parts';
import { detailUnit } from '../detail/unit';
import { turret } from './sea-arms';
import { CRAB, SEALAB } from './sea-deep';
import { art, bubbles, fin, finPair, hull, lamp, rivets, sail, screw } from './sea-kit';
import { darkInk, rgba, type SeaPal } from './sea-pal';

// The deep's machines in detail (docs 70, 120), bows down (+y): the hunter sub — an anechoic-tiled hull with frames,
// launch hatches forward of a tall sail with its masts, sail planes and an X-tail, twin bronze screws turning, its red
// bow light blinking; the torpedo boat on the surface seen from below — its dark hull against the bright skin of the
// water, strakes and a keel, bilge keels, rust-red torpedo sponsons, shafts on their brackets, twin screws churning
// foam; the missile sub — map 4's mini-boss: a long tiled hull with limber holes, the turtleback of twelve missile
// hatches behind the sail, a twin gun forward tracking the player, its great seven-bladed screw. The crab and the sea
// lab are in sea-deep.ts.

type Ctx = CanvasRenderingContext2D;

/** Limber holes: rows of small dark slots along both sides of a casing. */
function limbers(ctx: Ctx, x: number, y0: number, y1: number, step: number, w: number): void {
  for (let y = y0; y <= y1; y += step) for (const s of [-1, 1]) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(s * x - w / 2, y, w, step * 0.42);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(s * x - w / 2, y + step * 0.42, w, step * 0.12);
  }
}

const HUNTER_HULL = [0, 28, 5, 25, 9, 17, 10.5, 4, 10, -12, 7, -21, 0, -25];

function hunterBody(ctx: Ctx, p: SeaPal): void {
  finPair(ctx, [3, -18, 12, -24, 12, -26, 3, -23], p);
  hull(ctx, HUNTER_HULL, p, { frames: [19, 9, -5, -15], tile: 1.7 });
  limbers(ctx, 8.4, -10, 6, 2, 0.5);
  shell(ctx, 0, 24.5, 3, 2.6, { base: shade(p.hull, 0.15), dark: p.dark, light: shade(p.light, 0.3), ink: 'rgba(0,0,0,0.3)' }, 0); // sonar dome
  for (const y of [14.4, 17.6]) for (const x of [-1.9, 1.9]) { // launch hatches
    plateShell(ctx, [x - 1.3, y - 1.2, x + 1.3, y - 1.2, x + 1.3, y + 1.2, x - 1.3, y + 1.2], darkInk(p), 0.3);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x - 1.1, y - 0.2, 2.2, 0.3);
  }
  hatch(ctx, 0, -12, 1.5, p.hull);
  rivets(ctx, 6.4, -18, 16, 2.6, 0.26);
  finPair(ctx, [3, 6, 11, 4, 11, 2, 3, 2], p);
  sail(ctx, [0, 12, 3, 9, 3.4, -1, 2, -5, 0, -6], p, [5, 2, -1, -3.4]);
}

const HUNTER = art('hunter', {
  under: (ctx, p, t) => {
    for (const x of [-4, 4]) {
      bubbles(ctx, p, x, -29, t + x, 4, 16, 0.7);
      screw(ctx, p, x, -27, 5, t + x * 0.1, 5);
    }
  },
  body: hunterBody,
  over: (ctx, p, t) => lamp(ctx, p, 0, 26.4, 0.8, p.trim, Math.sin(t * 3) > 0 ? 1 : 0.3),
});

const BOAT_HULL = [0, 30, 6, 24, 10, 12, 11, -18, 9, -26, 0, -27];

function boatBody(ctx: Ctx, p: SeaPal): void {
  const outline = hull(ctx, BOAT_HULL, p, { frames: [16, 4, -8, -20] });
  ctx.save();
  ctx.clip(outline);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; // strakes along the bottom
  ctx.lineWidth = 0.4;
  for (const x of [-8, -6.5, 6.5, 8]) ctx.stroke(path([x * 0.5, 27, x, 12, x, -20], false));
  ctx.restore();
  plateShell(ctx, [0, 26, 4, 21, 6, 10, 6, -16, 0, -18, -6, -16, -6, 10, -4, 21], darkInk(p), 0.5); // the flat of the bottom
  plate3(ctx, -0.5, -18, 1, 44, shade(p.light, 0.1), p.ink); // the keel
  for (const s of [-1, 1]) {
    plate3(ctx, s * 8.6 - 0.4, -6, 0.8, 18, p.dark, p.ink); // bilge keels
    for (const y of [8, -6]) { // torpedo sponsons
      plateShell(ctx, [s * 6, y, s * 10, y, s * 10, y + 8, s * 6, y + 8], { base: p.trim, dark: shade(p.trim, -0.5), light: shade(p.trim, 0.45), ink: p.ink }, 0.4);
      ctx.fillStyle = '#06080a';
      ctx.beginPath();
      ctx.arc(s * 8, y + 7, 1.2, 0, Math.PI * 2);
      ctx.fill();
      bolts(ctx, [s * 6.8, y + 1, s * 9.2, y + 1], 0.3);
    }
    plateShell(ctx, [s * 4.6, -12, s * 5.4, -12, s * 5.4, -25, s * 4.6, -25], { base: '#5a5248', dark: '#2a2420', light: '#9a8e7c', ink: p.ink }, 0.3); // shaft
    fin(ctx, [s * 3.4, -18, s * 4.8, -18, s * 4.8, -16.6, s * 3.4, -17.4], p, 0.3); // its bracket
    fin(ctx, [s * 4.4, -28, s * 5.6, -28, s * 5.6, -31, s * 4.4, -31], p, 0.3); // rudder
  }
  shell(ctx, 0, 25, 2, 2.4, { base: shade(p.hull, 0.2), dark: p.dark, light: p.light, ink: p.ink }, 0); // sonar
  grille(ctx, -2.4, -3, 4.8, 3, 3);
}

/** A thin plate (rectangle) lit along its left edge. */
function plate3(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string, ink: string): void {
  ctx.fillStyle = ink;
  ctx.fillRect(x - 0.3, y - 0.3, w + 0.6, h + 0.6);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(x, y, w * 0.35, h);
}

/** The bright skin of the water round the hull, the bow wave and the churn behind the screws. */
function surface(ctx: Ctx, p: SeaPal, t: number): void {
  if (p.mono) return;
  const g = ctx.createRadialGradient(0, 0, 8, 0, 0, 34);
  g.addColorStop(0, 'rgba(220,245,255,0.24)');
  g.addColorStop(0.75, 'rgba(220,245,255,0.14)');
  g.addColorStop(1, 'rgba(220,245,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 7; i++) { // foam at the bow
    ctx.fillStyle = rgba('#f0faff', 0.3 + (i % 3) * 0.08);
    ctx.beginPath();
    ctx.arc(Math.sin(t * 6 + i) * 6, 29 + i * 1.8, 1.8 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
}

const TORPBOAT = art('torpboat', {
  under: (ctx, p, t) => {
    surface(ctx, p, t);
    for (const x of [-5, 5]) screw(ctx, p, x, -26.4, 3.4, t + x * 0.1, 3);
  },
  body: boatBody,
  over: (ctx, p, t) => {
    if (p.mono) return;
    for (const x of [-5, 5]) {
      ctx.fillStyle = 'rgba(240,250,255,0.5)';
      ctx.beginPath();
      ctx.ellipse(x, -29, 3 + Math.abs(Math.sin(t * 20 + x)) * 2, 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  },
});

const BOOMER_HULL = [0, 62, 10, 56, 18, 40, 22, 14, 22, -34, 18, -48, 10, -56, 0, -60];

function boomerBody(ctx: Ctx, p: SeaPal): void {
  finPair(ctx, [6, -46, 24, -56, 24, -60, 6, -54], p, 0.7);
  hull(ctx, BOOMER_HULL, p, { frames: [46, 28, 8, -20, -42], tile: 2.6, seam: 0.6 });
  limbers(ctx, 19.2, -30, 34, 3.2, 0.9);
  shell(ctx, 0, 55, 6, 4.6, { base: shade(p.hull, 0.15), dark: p.dark, light: shade(p.light, 0.3), ink: 'rgba(0,0,0,0.3)' }, 0);
  plateShell(ctx, [0, 4, 10, 2, 11, -36, 0, -38, -11, -36, -10, 2], { base: p.light, dark: p.hull, light: shade(p.light, 0.35), ink: p.ink }, 0.6); // the turtleback
  for (let i = 0; i < 6; i++) for (const x of [-5, 5]) hatch(ctx, x, -2 - i * 6, 2.2, shade(p.hull, 0.1));
  for (const y of [36, -44]) hatch(ctx, 0, y, 1.8, p.hull);
  rivets(ctx, 15, -40, 40, 4, 0.4);
  shell(ctx, 0, 44, 5.6, 5.6, darkInk(p), 0); // the turret ring
  finPair(ctx, [4, 22, 18, 20, 18, 17, 4, 17], p, 0.5);
  sail(ctx, [0, 30, 4, 26, 5, 14, 4, 8, 0, 7], p, [22, 18.4, 15, 11.6]);
  fin(ctx, [-0.8, -50, 0.8, -50, 0.8, -61, -0.8, -61], p, 0.4); // the upper rudder seen edge-on
}

const BOOMER = art('boomer', {
  under: (ctx, p, t) => {
    bubbles(ctx, p, 0, -66, t, 8, 34, 1.4);
    screw(ctx, p, 0, -62, 10, t, 7);
  },
  body: boomerBody,
  over: (ctx, p, t, aim) => {
    ctx.save();
    ctx.translate(0, 44);
    ctx.rotate(aim - Math.PI);
    turret(ctx, p, 7, 2, 1.8);
    ctx.restore();
    lamp(ctx, p, 0, 29, 0.8, p.trim, Math.sin(t * 2.4) > 0.2 ? 1 : 0);
    for (const s of [-1, 1]) lamp(ctx, p, s * 23.4, -58, 0.7, s < 0 ? '#ff4a3a' : '#5aff7a', 0.8);
  },
});

export const SEA_UNITS_2: Readonly<Record<'hunter' | 'torpboat' | 'crab' | 'sealab' | 'boomer', UnitFn>> = {
  hunter: detailUnit('hunter', HUNTER),
  torpboat: detailUnit('torpboat', TORPBOAT),
  crab: detailUnit('crab', CRAB),
  sealab: detailUnit('sealab', SEALAB),
  boomer: detailUnit('boomer', BOOMER),
};
