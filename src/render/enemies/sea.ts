import type { Pal, UnitFn } from '../draw-ground-units';
import { shade } from '../detail/color';
import { plateShell, shell } from '../detail/organic';
import { bolts, hatch, path, sym } from '../detail/parts';
import { detailUnit } from '../detail/unit';
import { art, beam, bubbles, finPair, hull, lamp, port, rivets, sail, screw } from './sea-kit';
import { hullInk, metalInk, rgba, SEA_PAL, type SeaPal } from './sea-pal';
import { kelp, rockFacets } from './sea-reef';

// The sea's machines in detail (docs 68, 120), bows down (+y), light from the upper left: the midget sub — a riveted
// pressure hull with ballast seams, a little sail with its masts, X-fins with yellow tips, its bronze screw turning and
// the bow lamp throwing its beam ahead; the sea drone — a yellow torpedo with a sensor nose, a red band, hazard stripes
// and a ducted screw, its nav light blinking; the sea mine — a pitted black sphere with lead-capped horns, a welded
// belt, rust and barnacles, its broken mooring chain, the red lamp blinking; the seabed turret — an armoured collar
// bolted to a faceted rock grown with coral, kelp swaying, twin barrels that track the sub, its lamp flaring.

type Ctx = CanvasRenderingContext2D;

const MINISUB_HULL = [0, 22, 4.5, 19, 7.5, 12, 8.5, 2, 8, -10, 5, -17, 0, -20];
const trimInk = (p: SeaPal) => ({ base: p.trim, dark: shade(p.trim, -0.4), light: shade(p.trim, 0.5), ink: p.ink });

function minisubBody(ctx: Ctx, p: SeaPal): void {
  finPair(ctx, [2, -14, 9, -20, 9, -22, 3, -19], p);
  for (const s of [-1, 1]) plateShell(ctx, [s * 7.6, -19.4, s * 9, -20, s * 9, -22, s * 7.6, -21.2], trimInk(p), 0.3);
  const outline = hull(ctx, MINISUB_HULL, p, { frames: [14, 5, -5, -13] });
  ctx.save();
  ctx.clip(outline);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; // ballast tank seams along the sides
  ctx.lineWidth = 0.35;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 5.6, 15);
    ctx.quadraticCurveTo(s * 6.6, 2, s * 4.4, -15);
    ctx.stroke();
  }
  ctx.restore();
  rivets(ctx, 6.6, -9, 11, 2.5, 0.28);
  hatch(ctx, 0, -10, 1.7, p.hull);
  ctx.strokeStyle = shade(p.light, 0.2); // grab rail
  ctx.lineWidth = 0.3;
  ctx.stroke(path([-1.6, 16, -2.2, 10, -2.2, 8.5], false));
  sail(ctx, [0, 8, 2.4, 6, 2.6, -1, 1.6, -4, 0, -4.5], p, [1.4, -1.6]);
  plateShell(ctx, [-2.4, 18.2, 2.4, 18.2, 1.8, 20.6, -1.8, 20.6], trimInk(p), 0.3);
  port(ctx, 0, 20.4, 1.3, p, p.glass);
}

const MINISUB = art('minisub', {
  under: (ctx, p, t) => {
    beam(ctx, p, 0, 21, 18, 7);
    bubbles(ctx, p, 0, -24, t, 6, 18, 0.8);
    screw(ctx, p, 0, -21.5, 6, t, 4);
  },
  body: minisubBody,
  over: (ctx, p, t) => lamp(ctx, p, 0, 20.4, 1, p.glass, 0.75 + 0.25 * Math.sin(t * 4)),
});

const DRONE_HULL = [0, 13, 2.6, 10.5, 3.6, 5, 3.6, -8, 2.6, -11.5, 0, -12];

function droneBody(ctx: Ctx, p: SeaPal): void {
  finPair(ctx, [2, -8, 6, -12, 6, -13, 2, -11], p);
  const outline = hull(ctx, DRONE_HULL, p, { frames: [4.5, -2, -7.6] });
  ctx.save();
  ctx.clip(outline);
  ctx.fillStyle = p.trim; // the red nose band
  ctx.fillRect(-3.6, 6.4, 7.2, 2);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(-3.6, 6.4, 7.2, 0.4);
  ctx.fillStyle = '#1a1a18'; // hazard stripes round the tail ring
  for (let x = -6; x < 4; x += 2.2) ctx.fill(path([x, -11.6, x + 1.1, -11.6, x + 2.6, -8, x + 1.5, -8]));
  ctx.restore();
  shell(ctx, 0, 11.2, 1.7, 1.5, { base: '#2a5a7a', dark: '#0e2232', light: p.glass, ink: p.ink }, 0); // sensor nose
  bolts(ctx, [-2.4, 3.2, 2.4, 3.2, -2.4, -5.5, 2.4, -5.5], 0.25);
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; // fill port
  ctx.fillRect(-0.5, 0, 1, 1.8);
  for (const s of [-1, 1]) plateShell(ctx, [s * 4.2, -11, s * 5.3, -11, s * 5.3, -15, s * 4.2, -15], metalInk(p), 0.3); // the duct
}

const SEADRONE = art('seadrone', {
  under: (ctx, p, t) => {
    bubbles(ctx, p, 0, -15, t, 4, 12, 0.55);
    screw(ctx, p, 0, -13, 4, t, 3);
  },
  body: droneBody,
  over: (ctx, p, t) => lamp(ctx, p, 0, -3.4, 0.6, '#6aff8a', Math.sin(t * 6) > 0.4 ? 1 : 0),
});

/** The mine's horns round its rim: tapered stalks with lead caps. */
function horns(ctx: Ctx, p: SeaPal): void {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    ctx.save();
    ctx.rotate(a);
    plateShell(ctx, [-1.6, 9, 1.6, 9, 1.1, 13.2, -1.1, 13.2], metalInk(p), 0.4);
    ctx.restore();
    const x = -Math.sin(a) * 13.4, y = Math.cos(a) * 13.4;
    shell(ctx, x, y, 1.25, 1.25, { base: '#8a8e92', dark: '#3a3e42', light: '#e0e4e8', ink: p.ink }, 0);
  }
}

function chain(ctx: Ctx, p: SeaPal): void {
  for (let i = 0; i < 4; i++) { // the broken mooring chain
    const y = -12.6 - i * 3;
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (i % 2) ctx.rect(-0.3, y - 1.6, 0.6, 3.2);
    else ctx.ellipse(0, y, 1.1, 1.7, 0, i === 2 ? 0.9 : 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = shade(p.metal, i % 2 ? -0.1 : 0.2);
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  plateShell(ctx, [-1.6, -10, 1.6, -10, 1, -12.4, -1, -12.4], metalInk(p), 0.4); // mooring eye
}

function mineBody(ctx: Ctx, p: SeaPal): void {
  chain(ctx, p);
  horns(ctx, p);
  shell(ctx, 0, 0, 10.5, 10.5, hullInk(p), 0);
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, 10.5, 0, Math.PI * 2);
  ctx.clip();
  for (const [x, l] of [[-6, 4], [-2.5, 6], [3.5, 3.5], [7, 5]] as const) { // rust running down from the belt
    const g = ctx.createLinearGradient(0, 0.6, 0, 0.6 + l);
    g.addColorStop(0, rgba(p.trim, 0.7));
    g.addColorStop(1, rgba(p.trim, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x, 0.6, 0.5, l);
  }
  plateShell(ctx, [-11, -0.9, 11, -0.9, 11, 0.9, -11, 0.9], { base: p.dark, dark: '#000000', light: p.light, ink: p.ink }, 0.3);
  ctx.restore();
  bolts(ctx, [-8, 0, -4, 0, 0, 0, 4, 0, 8, 0], 0.4);
  for (const [x, y] of [[-5.2, -3.6], [5.2, -3.6], [-4.2, 5.4], [4.2, 5.4]] as const) { // horns seen end-on
    shell(ctx, x, y, 1.3, 1.3, { base: '#7a7e82', dark: '#2a2e32', light: '#d0d4d8', ink: p.ink }, 0);
  }
  ctx.fillStyle = 'rgba(220,214,190,0.75)'; // barnacles
  for (const [x, y, r] of [[-7.5, 4.5, 0.7], [-6.6, 5.6, 0.5], [6.8, -5.6, 0.6], [1.5, 8.6, 0.55]] as const) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  port(ctx, 0, 3, 1.2, p, '#5a1410');
}

const SEAMINE = art('seamine', {
  body: mineBody,
  over: (ctx, p, t) => lamp(ctx, p, 0, 3, 1.1, p.glass, Math.sin(t * 5) > 0.3 ? 1 : 0),
});

const ROCK = [-17, 4, -13, -10, -4, -15, 9, -13, 16, -4, 15, 9, 6, 15, -9, 14];

function turretBody(ctx: Ctx, p: SeaPal): void {
  rockFacets(ctx, ROCK, -2, -3, p.trim, p.ink);
  for (const [x, y, c] of [[-12, 8, '#ff8a78'], [11, -9, '#c87ae8'], [13, 6, '#ffb84a']] as const) {
    for (let k = 0; k < 5; k++) { // coral polyps and sponges
      const a = k * 1.3;
      shell(ctx, x + Math.cos(a) * 1.5, y + Math.sin(a) * 1.3, 1.2, 1.2, { base: c, dark: shade(c, -0.5), light: shade(c, 0.6), ink: p.ink }, 0);
    }
  }
  shell(ctx, 0, 0, 9.4, 9.4, hullInk(p), 0); // the armoured collar
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * Math.PI * 2 + 0.06, a1 = a0 + Math.PI / 4 - 0.12;
    const pts = [Math.cos(a0) * 9, Math.sin(a0) * 9, Math.cos(a1) * 9, Math.sin(a1) * 9, Math.cos(a1) * 6.6, Math.sin(a1) * 6.6, Math.cos(a0) * 6.6, Math.sin(a0) * 6.6];
    plateShell(ctx, pts, hullInk(p), 0.3);
  }
  bolts(ctx, Array.from({ length: 8 }, (_, i) => [Math.cos(i * 0.785 + 0.39) * 7.8, Math.sin(i * 0.785 + 0.39) * 7.8]).flat(), 0.35);
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; // the turret ring's well
  ctx.beginPath();
  ctx.arc(0, 0, 6.6, 0, Math.PI * 2);
  ctx.fill();
}

/** The turret: twin barrels along +y (turned by the caller), the housing with its sight and hatch. */
function twinBarrels(ctx: Ctx, p: SeaPal): void {
  for (const x of [-1.15, 1.15]) {
    plateShell(ctx, [x - 0.6, 2, x + 0.6, 2, x + 0.5, 12, x - 0.5, 12], metalInk(p), 0.3);
    plateShell(ctx, [x - 0.8, 10.6, x + 0.8, 10.6, x + 0.8, 12.4, x - 0.8, 12.4], metalInk(p), 0.3);
  }
  plateShell(ctx, sym([0, 6.2, 3.6, 5.6, 5.6, 2, 5.8, -2.4, 4, -5.4, 0, -6]), hullInk(p), 0.5);
  if (p.mono) return;
  plateShell(ctx, sym([0, 4.2, 2.4, 3.6, 3.4, 0, 2.6, -3.6, 0, -4]), { base: p.light, dark: p.hull, light: '#e8f0f2', ink: p.ink }, 0.3);
  port(ctx, 3.4, 3.2, 0.7, p, p.glass);
  hatch(ctx, -1.6, -2, 1.3, p.hull);
}

const SEATURRET = art('seaturret', {
  under: (ctx, p, t) => {
    kelp(ctx, p, -14, -6, -2.6, 11, t);
    kelp(ctx, p, 15, 3, 0.3, 9, t + 1.7);
  },
  body: turretBody,
  over: (ctx, p, t, aim) => {
    ctx.save();
    ctx.rotate(aim - Math.PI);
    twinBarrels(ctx, p);
    ctx.restore();
    lamp(ctx, p, 0, 0, 1.1, p.glass, Math.sin(t * 3) > 0.7 ? 1 : 0);
  },
});

export const SEA_UNITS: Readonly<Record<'minisub' | 'seadrone' | 'seamine' | 'seaturret', UnitFn>> = {
  minisub: detailUnit('minisub', MINISUB),
  seadrone: detailUnit('seadrone', SEADRONE),
  seamine: detailUnit('seamine', SEAMINE),
  seaturret: detailUnit('seaturret', SEATURRET),
};

/** The old screw blur's signature for callers outside the detailed art: the detailed screw in a sub's colours. */
export function screwBlur(ctx: Ctx, y: number, w: number, t: number, p: Pal): void {
  if (p.mono) return;
  screw(ctx, SEA_PAL.hunter, 0, y, w, t, 5);
}
