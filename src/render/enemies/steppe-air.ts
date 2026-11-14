import type { Pal, UnitFn } from '../draw-ground-units';
import { eyes, limb, membrane, plateShell, shell } from '../detail/organic';
import { antenna, cylinder, glow, path } from '../detail/parts';
import { detailUnit } from '../detail/unit';
import { art } from './steppe-kit';
import { ink, metalInk, type AlienPal } from './steppe-pal';

// The invasion's fliers in detail (docs 105, 115), fronts down (+y): the scout disc — a small saucer of radial panels
// round a dark glass dome, its rim lights running; the disc fighter — a saucer with two forward prongs carrying cannons,
// a cockpit dome, panel seams, rim lights and the engine glow behind; the bomber manta — a bio-machine ray whose wing
// membranes and their ribs beat slowly round a plated body with bomb sacs, glowing eyes and a long tail.

type Ctx = CanvasRenderingContext2D;

/** Lights running round a rim. */
function rimLights(ctx: Ctx, p: AlienPal, r: number, n: number, t: number, rgb: string): void {
  if (p.mono) return;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + t * 2.5;
    const on = 0.35 + 0.65 * Math.max(0, Math.sin(t * 6 + i * 1.7));
    ctx.fillStyle = `rgba(${rgb},${on.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r, Math.sin(a) * r * 0.9, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A saucer: rim band, radial panels, a dark glass dome with its glint. */
function saucer(ctx: Ctx, p: AlienPal, rx: number, ry: number, dome: number): void {
  shell(ctx, 0, 0, rx, ry, { ...metalInk(p), base: p.light, light: '#f0f0fa' }, 0);
  ctx.strokeStyle = p.dark;
  ctx.lineWidth = 0.4;
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * dome * 1.2, Math.sin(a) * dome * 1.1);
    ctx.lineTo(Math.cos(a) * rx * 0.86, Math.sin(a) * ry * 0.86);
    ctx.stroke();
  }
  ctx.strokeStyle = p.trim;
  ctx.lineWidth = Math.max(0.8, rx * 0.07);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * 0.72, ry * 0.72, 0, 0, Math.PI * 2);
  ctx.stroke();
  shell(ctx, 0, 0, dome, dome * 0.92, { base: '#2a2440', dark: '#120e1c', light: '#8a6aaa', ink: p.ink }, 0);
}

const SCOUTDISC = art('scoutdisc', {
  body: (ctx, p) => {
    saucer(ctx, p, 12, 11, 3.8);
    antenna(ctx, 3, -3, 3, -0.6);
  },
  over: (ctx, p, t) => {
    rimLights(ctx, p, 10.5, 8, t, '90,230,220');
    if (!p.mono) eyes(ctx, [0, 0], 1.2, p.glow, p.core);
  },
});

const DISCFIGHTER = art('discfighter', {
  under: (ctx, p, t) => {
    if (p.mono) return;
    const h = 0.6 + 0.4 * Math.sin(t * 20);
    glow(ctx, 0, -14, 8, '255,120,230', 0.5 * h);
  },
  body: (ctx, p) => {
    for (const s of [-1, 1]) { // the forward prongs and their cannons
      plateShell(ctx, [s * 6, 7, s * 12.5, 21, s * 9, 23.5, s * 3.6, 10], ink(p), 0.6);
      cylinder(ctx, s * 10.6 - 0.8, 18, 1.6, 6.5, p.metal, 'y');
    }
    saucer(ctx, p, 16, 14, 4.6);
    plateShell(ctx, [-5, -14, 5, -14, 4, -10, -4, -10], ink(p), 0.4); // the engine block
  },
  over: (ctx, p, t) => {
    rimLights(ctx, p, 14, 10, t, '255,90,216');
    if (!p.mono) for (const s of [-1, 1]) eyes(ctx, [s * 10.6, 24.2], 0.7, p.glow, p.core);
  },
});

/** One wing: membrane over ribs, beating by `beat`; plain in one colour. */
function wing(ctx: Ctx, p: AlienPal, s: number, beat: number): void {
  const pts = [0, 16, 12, 10, 30, beat, 34, -4 + beat, 22, -8, 6, -14, 0, -14].map((v, i) => (i % 2 ? v : v * s));
  if (p.mono) {
    ctx.fillStyle = p.shell;
    ctx.fill(path(pts));
    return;
  }
  membrane(ctx, pts, s * 5, 2, [s * 30, beat, s * 33, -3 + beat, s * 22, -7, s * 12, 9], ink(p), '#3a4c5c');
  ctx.strokeStyle = 'rgba(58,216,200,0.75)';
  ctx.lineWidth = 0.7;
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.moveTo(s * 7, 4 - k * 5);
    ctx.lineTo(s * (22 + k * 3), -1 - k * 2 + beat);
    ctx.stroke();
  }
}

const MANTA = art('manta', {
  under: (ctx, p, t) => {
    const beat = Math.sin(t * 1.6) * 5;
    limb(ctx, [0, -12, Math.sin(t * 1.3) * 5, -26, Math.sin(t * 1.3 + 1) * 4, -38], 1.6, ink(p)); // the tail
    for (const s of [-1, 1]) wing(ctx, p, s, beat);
  },
  body: (ctx, p) => {
    shell(ctx, 0, 1, 9, 14, { ...ink(p), base: p.under }, 5);
    for (const s of [-1, 1]) shell(ctx, s * 5, 0, 3, 4, { base: '#4a2a3e', dark: '#24121e', light: '#8a5a7a', ink: p.ink }, 0); // bomb sacs
    plateShell(ctx, [-5, 8, 5, 8, 3.6, 13, -3.6, 13], metalInk(p), 0.4);
    eyes(ctx, [-3, 13, 3, 13], 1, '#ffb03a', '#fff0c0', true);
  },
  over: (ctx, p) => {
    if (!p.mono) for (const s of [-1, 1]) eyes(ctx, [s * 5, 1], 0.9, p.glow, p.core);
  },
});

export const STEPPE_AIR: Readonly<Record<'scoutdisc' | 'discfighter' | 'manta', UnitFn>> = {
  scoutdisc: detailUnit('scoutdisc', SCOUTDISC),
  discfighter: detailUnit('discfighter', DISCFIGHTER),
  manta: detailUnit('manta', MANTA),
};

export const steppeAirPals = (pal: (body: string, dark: string, light: string, trim: string, glass?: string) => Pal): Readonly<Record<keyof typeof STEPPE_AIR, Pal>> => ({
  scoutdisc: pal('#8a8aa0', '#3a3a4e', '#c8c8dc', '#3ad8c8', '#ff4ad8'),
  discfighter: pal('#6a6a86', '#2c2c40', '#a8a8c4', '#3ad8c8', '#ff4ad8'),
  manta: pal('#4a5a6a', '#22303a', '#8aa0b0', '#3ad8c8', '#ff7ae0'),
});
