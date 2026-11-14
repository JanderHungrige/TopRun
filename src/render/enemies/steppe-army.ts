import type { Pal, UnitFn } from '../draw-ground-units';
import { eyes, limb, plateShell, shell, spines } from '../detail/organic';
import { glow, plate } from '../detail/parts';
import { detailUnit } from '../detail/unit';
import { BROODCARRIER, RIDER } from './steppe-beasts';
import { art, helmet, legs6, rifle } from './steppe-kit';
import { ink, metalInk } from './steppe-pal';

// The alien steppe's invasion army on foot in detail (docs 105, 115), heads down (+y): the crawler — a segmented
// soldier-bug with dorsal spines, a teal stripe and three pairs of glowing eyes, scuttling on six jointed legs, its
// mandibles biting; the trooper in its plated shoulders and power-cell pack, its plasma rifle turning to its aim, the
// domed helmet's visor glowing; the landing pod in its scorched crater, four armoured petals opening on its pulsing core;
// the shield bearer behind its curved shield with emitter studs, the shimmer of its cover around it. The beasts (rider,
// brood carrier) are in steppe-beasts.ts.

const CRAWLER = art('crawler', {
  under: (ctx, p, t) => legs6(ctx, p, t, [-1, 3, 7], 3.6, 8.5, 14, 1.4),
  body: (ctx, p) => {
    shell(ctx, 0, -5.5, 6.8, 9, ink(p), 4);
    spines(ctx, [0, -12, -Math.PI / 2, 3.2, 0.9, -2.6, -9, -Math.PI * 0.62, 2.6, 0.8, 2.6, -9, -Math.PI * 0.38, 2.6, 0.8,
      -3.4, -4, -Math.PI * 0.75, 2.2, 0.7, 3.4, -4, -Math.PI * 0.25, 2.2, 0.7], ink(p));
    plate(ctx, -0.55, -13.5, 1.1, 12, p.trim, p.ink, 0.25); // the teal stripe down the back
    shell(ctx, 0, 4, 5, 3.4, ink(p), 1);
    shell(ctx, 0, 9.4, 4.6, 3.6, { ...ink(p), base: p.dark }, 0);
    eyes(ctx, [-2.1, 10.6, 2.1, 10.6, -1.2, 11.9, 1.2, 11.9, -2.8, 9.2, 2.8, 9.2], 0.62, p.glow, p.core, true);
  },
  over: (ctx, p, t) => {
    const bite = Math.sin(t * 9) * 0.35;
    for (const s of [-1, 1]) limb(ctx, [s * 2.2, 12, s * (3.6 + bite * 2), 14.4, s * (1.4 - bite), 16.2], 0.9, { ...ink(p), base: p.light });
  },
});

const TROOPER = art('trooper', {
  under: (ctx, p, t) => {
    const step = Math.sin(t * 8) * 3;
    for (const s of [-1, 1]) shell(ctx, s * 4, s * step, 2.4, 3.6, { ...ink(p), base: p.dark }, 1);
  },
  body: (ctx, p) => {
    plateShell(ctx, [-2.6, -7.2, 2.6, -7.2, 3.4, -3.4, -3.4, -3.4], metalInk(p)); // power-cell pack
    plate(ctx, -1.5, -6.6, 3, 2.4, p.trim, p.ink, 0.25);
    plateShell(ctx, [-9, -1.5, -6, -4.5, 6, -4.5, 9, -1.5, 8, 4, 3, 5.5, -3, 5.5, -8, 4], ink(p));
    for (const s of [-1, 1]) shell(ctx, s * 7.2, 0, 2.6, 2.4, ink(p), 1); // pauldrons
    plate(ctx, -0.4, -4.2, 0.8, 8.6, p.dark, p.ink, 0.2);
  },
  over: (ctx, p, _t, aim) => {
    ctx.save();
    ctx.rotate(aim - Math.PI);
    rifle(ctx, p, 4.6, 13);
    ctx.restore();
    helmet(ctx, p, 0, 1, 4.3);
  },
});

const LANDINGPOD = art('landingpod', {
  body: (ctx, p) => {
    const g = ctx.createRadialGradient(0, 2, 2, 0, 2, 22);
    g.addColorStop(0, p.mono ? p.shell : '#2a1a12');
    g.addColorStop(0.7, p.mono ? p.shell : 'rgba(60,40,24,0.75)');
    g.addColorStop(1, p.mono ? p.shell : 'rgba(80,60,36,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 2, 22, 19, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 9; i++) { // rocks thrown up round the rim
      const a = i * 0.7 + 0.3;
      const r = 16 + (i % 3) * 2;
      plateShell(ctx, [Math.cos(a) * r - 1.4, Math.sin(a) * r * 0.86 + 2, Math.cos(a) * r + 1.6, Math.sin(a) * r * 0.86 + 1.2, Math.cos(a) * r + 0.6, Math.sin(a) * r * 0.86 + 3.4],
        { base: '#6a5a46', dark: '#2e261c', light: '#a89478', ink: p.ink }, 0.3);
    }
    shell(ctx, 0, 0, 7.6, 7.6, { ...ink(p), base: p.dark }, 2);
  },
  over: (ctx, p, t) => {
    const open = 0.35 + Math.max(0, Math.sin(t * 0.9)) * 0.2;
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate((i / 4) * Math.PI * 2 + Math.PI / 4);
      plateShell(ctx, [-5.6, 1, 5.6, 1, 3.8, 12 + open * 8, 0, 14 + open * 8, -3.8, 12 + open * 8], ink(p), 0.6);
      plate(ctx, -0.5, 3, 1, 8 + open * 6, p.trim, p.ink, 0.2);
      ctx.restore();
    }
    if (p.mono) return;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3);
    glow(ctx, 0, 0, 9, '255,74,216', 0.45 + pulse * 0.4);
    eyes(ctx, [0, 0], 2, p.glow, p.core);
  },
});

const SHIELDBEARER = art('shieldbearer', {
  under: (ctx, p, t) => {
    if (!p.mono) { // the shimmer of the cover it throws over the others
      const a = 0.08 + 0.05 * Math.sin(t * 3);
      ctx.strokeStyle = `rgba(90,230,220,${(a * 2).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 90, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(90,230,220,${a.toFixed(3)})`;
      ctx.fill();
    }
    const step = Math.sin(t * 6) * 2.5;
    for (const s of [-1, 1]) shell(ctx, s * 4, -3 + s * step, 2.5, 3.4, { ...ink(p), base: p.dark }, 1);
  },
  body: (ctx, p) => {
    plateShell(ctx, [-2.8, -8.6, 2.8, -8.6, 3.6, -4.6, -3.6, -4.6], metalInk(p));
    plateShell(ctx, [-9, -3, -6, -6.4, 6, -6.4, 9, -3, 8, 2.4, -8, 2.4], ink(p));
    for (const s of [-1, 1]) shell(ctx, s * 7.4, -2, 2.6, 2.4, ink(p), 1);
    helmet(ctx, p, 0, -1.2, 4.2);
    ctx.lineCap = 'round';
    ctx.strokeStyle = p.ink; // the curved shield in front
    ctx.lineWidth = 5.6;
    ctx.beginPath();
    ctx.arc(0, -4, 14, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
    ctx.strokeStyle = p.metal;
    ctx.lineWidth = 4.2;
    ctx.stroke();
    ctx.strokeStyle = p.trim;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(0, -4, 15.6, Math.PI * 0.22, Math.PI * 0.78);
    ctx.stroke();
    for (let k = 0; k < 5; k++) {
      const a = Math.PI * (0.28 + k * 0.11);
      eyes(ctx, [Math.cos(a) * 14, -4 + Math.sin(a) * 14], 0.6, p.trim, '#e8fffc');
    }
  },
});

export const STEPPE_ARMY: Readonly<Record<'crawler' | 'trooper' | 'rider' | 'landingpod' | 'shieldbearer' | 'broodcarrier', UnitFn>> = {
  crawler: detailUnit('crawler', CRAWLER),
  trooper: detailUnit('trooper', TROOPER),
  rider: detailUnit('rider', RIDER),
  landingpod: detailUnit('landingpod', LANDINGPOD),
  shieldbearer: detailUnit('shieldbearer', SHIELDBEARER),
  broodcarrier: detailUnit('broodcarrier', BROODCARRIER),
};

/** The unit palettes drawEnemy passes; the detailed art reads only their mono / live flags. */
export const steppeArmyPals = (pal: (body: string, dark: string, light: string, trim: string, glass?: string) => Pal): Readonly<Record<keyof typeof STEPPE_ARMY, Pal>> => ({
  crawler: pal('#6a5a7a', '#33283e', '#a898b8', '#3ad8c8', '#ff4ad8'),
  trooper: pal('#5a4a6a', '#2a2234', '#9a88b0', '#3ad8c8', '#ff4ad8'),
  rider: pal('#5a4a6a', '#2a2234', '#9a88b0', '#3ad8c8', '#ff4ad8'),
  landingpod: pal('#7a6a8a', '#3a2e46', '#b0a0c0', '#3ad8c8', '#ff4ad8'),
  shieldbearer: pal('#4a5a6a', '#22303a', '#8aa0b0', '#5ae6dc', '#ff4ad8'),
  broodcarrier: pal('#6a4a6a', '#341f34', '#a880a8', '#3ad8c8', '#ff7ae0'),
});

