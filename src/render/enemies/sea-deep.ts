import { shade } from '../detail/color';
import { limb, plateShell, shell, spines } from '../detail/organic';
import { bolts, cable, cylinder, glow, path } from '../detail/parts';
import { blob, launcher, tone } from './sea-arms';
import { art, bubbles, port } from './sea-kit';
import { hullInk, metalInk, rgb, type SeaPal } from './sea-pal';

// The seabed's crab and the sea lab in detail (docs 70, 120), fronts down (+y): the giant crab — a granular red-brown
// carapace with its grooves and a toothed front rim, stalked eyes and mouthparts, two heavy claws held forward whose
// fingers snap, six jointed legs stepping; the sea lab — a domed habitat on four braced legs, a bolted ring of plates
// round a geodesic glass dome, lit portholes, a pipeline with flanges and a valve running off, bubbles from its vent,
// the missile launcher on top turning to the player.

type Ctx = CanvasRenderingContext2D;

const crabLegs = (ctx: Ctx, p: SeaPal, t: number): void => {
  const step = Math.sin(t * 8);
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
    const y = -6 + i * 6, k = (i % 2 === 0 ? step : -step) * 3;
    limb(ctx, [s * 10, y, s * 17, y - 5 + k * 0.6, s * 21, y - 3 + k, s * 24, y + 4 + k], 2.2, hullInk(p));
    limb(ctx, [s * 24, y + 4 + k, s * 24.6, y + 6.4 + k], 1.1, tone(p, p.metal));
  }
};

/** One claw (s = ±1): the arm, the swollen palm with its granules, the fixed finger with teeth. */
function claw(ctx: Ctx, p: SeaPal, s: number): void {
  limb(ctx, [s * 6, 6, s * 10, 11, s * 10.5, 14], 3, hullInk(p));
  shell(ctx, s * 10, 19.5, 4.4, 6.6, { base: p.hull, dark: p.dark, light: p.light, ink: p.ink }, 0, -s * 0.18);
  ctx.fillStyle = 'rgba(255,230,200,0.35)';
  for (let k = 0; k < 6; k++) {
    ctx.beginPath();
    ctx.arc(s * (8.6 + (k % 3) * 1.4), 16 + Math.floor(k / 3) * 3 + (k % 2), 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  const finger = [s * 11.4, 24.4, s * 13.6, 26.6, s * 14.6, 30.6, s * 12.6, 28.4, s * 9.8, 26.6];
  plateShell(ctx, finger, { base: p.light, dark: p.hull, light: shade(p.light, 0.5), ink: p.ink }, 0.45);
  spines(ctx, [s * 12.4, 27.2, s > 0 ? Math.PI * 0.85 : Math.PI * 0.15, 1, 0.3, s * 13.4, 28.8, s > 0 ? Math.PI * 0.85 : Math.PI * 0.15, 0.9, 0.3], tone(p, p.metal));
  plateShell(ctx, [s * 14.6, 30.6, s * 13.8, 29.2, s * 14.2, 28.8], tone(p, '#2a1a14'), 0.2);
}

function crabBody(ctx: Ctx, p: SeaPal): void {
  for (const s of [-1, 1]) claw(ctx, p, s);
  const rim: number[] = [];
  for (let k = 0; k < 5; k++) for (const s of [-1, 1]) { // the toothed front rim
    const a = Math.PI / 2 + s * (0.55 + k * 0.22);
    rim.push(Math.cos(a) * 12.6, Math.sin(a) * 10.6, a, 2.4, 0.9);
  }
  spines(ctx, rim, hullInk(p));
  shell(ctx, 0, 0, 13, 11, hullInk(p), 0);
  ctx.strokeStyle = 'rgba(60,16,10,0.55)'; // the grooves of the carapace
  ctx.lineWidth = 0.55;
  ctx.stroke(path([-6, -7, -3, -2, -4, 3, -1.5, 6], false));
  ctx.stroke(path([6, -7, 3, -2, 4, 3, 1.5, 6], false));
  ctx.stroke(path([-3, -2, 0, -3.4, 3, -2], false));
  ctx.fillStyle = 'rgba(255,220,190,0.3)'; // granules
  for (let k = 0; k < 22; k++) {
    const a = k * 2.4, r = 3 + ((k * 7) % 9);
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.78 - 1, 0.42, 0, Math.PI * 2);
    ctx.fill();
  }
  plateShell(ctx, [-2.6, 9.4, 2.6, 9.4, 1.8, 11.6, -1.8, 11.6], tone(p, p.dark), 0.3); // mouthparts
  for (const s of [-1, 1]) {
    limb(ctx, [s * 2.2, 9.4, s * 3.4, 11.4], 1, hullInk(p)); // eye stalks
    shell(ctx, s * 3.5, 11.8, 1.1, 1.1, { base: '#2a1a14', dark: '#0a0604', light: '#8a6a5a', ink: p.ink }, 0);
  }
}

/** The movable fingers, snapping. */
function dactyls(ctx: Ctx, p: SeaPal, t: number): void {
  const open = (0.5 + 0.5 * Math.sin(t * 3)) * 0.55;
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(s * 8.6, 25.4);
    ctx.rotate(s * open);
    plateShell(ctx, [s * -0.9, -0.6, s * 1.2, -0.4, s * 1.6, 3.4, s * 0.8, 6.2, s * -0.4, 3], tone(p, p.light), 0.45);
    ctx.restore();
  }
}

export const CRAB = art('crab', { under: (ctx, p, t) => crabLegs(ctx, p, t), body: crabBody, over: (ctx, p, t) => dactyls(ctx, p, t) });

const FEET = [[-20, -16], [20, -16], [-20, 16], [20, 16]] as const;

/** The habitat's legs and pipeline: struts to bolted foot pads, braces between them, the pipe with flanges and a valve. */
function labFrame(ctx: Ctx, p: SeaPal): void {
  cable(ctx, [-20, -16, -20, 16], 0.6, p.dark);
  cable(ctx, [20, -16, 20, 16], 0.6, p.dark);
  for (const [x, y] of FEET) {
    plateShell(ctx, [x * 0.55 - 1.4, y * 0.55, x * 0.55 + 1.4, y * 0.55, x + 1.2, y, x - 1.2, y], metalInk(p), 0.4);
    plateShell(ctx, [x - 2.6, y - 2.6, x + 2.6, y - 2.6, x + 2.6, y + 2.6, x - 2.6, y + 2.6], hullInk(p), 0.4);
    bolts(ctx, [x - 1.7, y - 1.7, x + 1.7, y - 1.7, x - 1.7, y + 1.7, x + 1.7, y + 1.7], 0.32);
  }
  cylinder(ctx, 17, -2.4, 15, 4.8, p.dark, 'x');
  for (const x of [21, 27, 31.4]) plateShell(ctx, [x, -3.1, x + 1.2, -3.1, x + 1.2, 3.1, x, 3.1], metalInk(p), 0.3);
  ctx.strokeStyle = p.ink;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(24.6, -4.4, 1.6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#c8312a'; // the valve wheel
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

function labBody(ctx: Ctx, p: SeaPal): void {
  labFrame(ctx, p);
  shell(ctx, 0, 0, 20, 20, hullInk(p), 0);
  for (let i = 0; i < 16; i++) { // the ring of plates
    const a0 = (i / 16) * Math.PI * 2 + 0.03, a1 = a0 + Math.PI / 8 - 0.06;
    plateShell(ctx, [Math.cos(a0) * 19.6, Math.sin(a0) * 19.6, Math.cos(a1) * 19.6, Math.sin(a1) * 19.6, Math.cos(a1) * 14.4, Math.sin(a1) * 14.4, Math.cos(a0) * 14.4, Math.sin(a0) * 14.4],
      i % 2 ? hullInk(p) : { ...hullInk(p), base: shade(p.hull, 0.08) }, 0.3);
  }
  for (let i = 0; i < 8; i++) port(ctx, Math.cos((i / 8) * Math.PI * 2) * 17, Math.sin((i / 8) * Math.PI * 2) * 17, 1.5, p, '#1e2a30');
  shell(ctx, 0, 0, 13, 13, { base: '#7a9aa8', dark: '#2a3e48', light: '#e0f2f8', ink: p.ink }, 0); // the glass dome
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = 'rgba(40,56,64,0.7)'; // its geodesic frame
  ctx.lineWidth = 0.45;
  for (const r of [4.5, 9]) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let i = 0; i < 10; i++) ctx.stroke(path([Math.cos(i * 0.628) * 4.5, Math.sin(i * 0.628) * 4.5, Math.cos(i * 0.628 + 0.31) * 13, Math.sin(i * 0.628 + 0.31) * 13], false));
  ctx.restore();
  blob(ctx, p, 0, 0, 5.4, 5.4, tone(p, p.dark));
}

export const SEALAB = art('sealab', {
  under: (ctx, p, t) => bubbles(ctx, p, -12, -15, t, 5, 16, 0.8),
  body: labBody,
  over: (ctx, p, t, aim) => {
    if (!p.mono) for (let i = 0; i < 8; i++) {
      if (Math.sin(t * 2 + i) <= -0.6) continue;
      const a = (i / 8) * Math.PI * 2;
      glow(ctx, Math.cos(a) * 17, Math.sin(a) * 17, 4, rgb(p.glow), 0.55);
      port(ctx, Math.cos(a) * 17, Math.sin(a) * 17, 1.5, p, p.glass);
    }
    ctx.save();
    ctx.rotate(aim - Math.PI);
    launcher(ctx, p, 4.6, 2);
    ctx.restore();
  },
});
