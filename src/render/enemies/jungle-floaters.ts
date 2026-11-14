import { shell, veins } from '../detail/organic';
import { lens } from '../detail/parts';
import { glowOf, orb, taper } from './jungle-kit';
import { art, hide, trimInk, type JunglePal } from './jungle-pal';

// The jungle planet's floaters in detail (docs 96, 117), fronts down (+y): the spore balloon — a ribbed, veined gas bag
// with a pale inner chamber that swells and sinks, its spores glowing inside, tendrils with glossy spore sacs swaying
// behind; the sky jelly — a translucent pink bell with radial canals, a scalloped rim and a glossy body round its dark
// core, pulsing, the lights round its rim running, its tentacles trailing.

type Ctx = CanvasRenderingContext2D;

function balloonBag(g: Ctx, a: JunglePal): void {
  shell(g, 0, 2, 16.1, 15.2, hide(a), 0);
  g.save();
  g.beginPath();
  g.ellipse(0, 2, 16.1, 15.2, 0, 0, Math.PI * 2);
  g.clip();
  g.strokeStyle = 'rgba(70,56,24,0.45)';
  g.lineWidth = 0.6;
  for (const rx of [5, 10, 14]) { // the ribs, pole to pole
    g.beginPath();
    g.ellipse(0, 2, rx, 15.2, 0, 0, Math.PI * 2);
    g.stroke();
  }
  g.restore();
  g.globalAlpha = 0.55;
  shell(g, 0, 2, 11.4, 10.4, { base: a.light, dark: a.skin, light: '#fffbe8', ink: 'rgba(0,0,0,0)' }, 0); // the inner chamber
  g.globalAlpha = 1;
  veins(g, 0, 2, Array.from({ length: 6 }, (_, i) => {
    const b = (i / 6) * Math.PI * 2;
    return [Math.cos(b + 0.5) * 9, 2 + Math.sin(b + 0.5) * 9, Math.cos(b) * 15.4, 2 + Math.sin(b) * 14.6];
  }).flat(), a.dark, 0.55);
  g.fillStyle = 'rgba(255,255,255,0.35)';
  g.beginPath();
  g.ellipse(-5, -6, 4, 2.5, -0.3, 0, Math.PI * 2);
  g.fill();
}

export const BALLOON = art('balloon', {
  under: (ctx, p, t) => {
    for (let i = 0; i < 5; i++) { // tendrils and spore sacs dangling behind
      const x = -8 + i * 4;
      const sway = Math.sin(t * 1.6 + i) * 3;
      const ex = x + sway * 1.5, ey = -22 - (i % 2) * 4;
      taper(ctx, [x, -8, x + sway, -16, ex, ey], 1.6, 0.7, { ...hide(p), base: p.dark });
      orb(ctx, p, ex, ey, 2.2, 2.4, trimInk(p), 1);
    }
    const swell = 1 + Math.sin(t * 1.8) * 0.05;
    ctx.fillStyle = p.mono ? p.body : p.dark; // the outer skin breathing round the bag
    ctx.beginPath();
    ctx.ellipse(0, 2, 17 * swell + 0.6, 16 * swell + 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.body;
    ctx.beginPath();
    ctx.ellipse(0, 2, 17 * swell, 16 * swell, 0, 0, Math.PI * 2);
    ctx.fill();
  },
  body: balloonBag,
  over: (ctx, p, t) => {
    if (p.mono) return;
    for (const [x, y, k] of [[-6, -3, 0], [5, -5, 1], [6, 7, 2], [-5, 8, 3], [0, 1, 4]] as const) { // the spores inside
      const on = 0.5 + 0.5 * Math.sin(t * 2.6 + k * 1.3);
      glowOf(ctx, p, x, y, 4, 0.25 + on * 0.35);
      lens(ctx, x, y, 1.5, p.glow);
    }
  },
});

function jellyBell(g: Ctx, a: JunglePal): void {
  const bell = new Path2D();
  bell.ellipse(0, 4, 17.5, 13.8, 0, 0, Math.PI * 2);
  const gr = g.createRadialGradient(-5, -1, 1, 0, 4, 18);
  gr.addColorStop(0, 'rgba(255,224,244,0.85)');
  gr.addColorStop(0.6, 'rgba(232,120,200,0.72)');
  gr.addColorStop(1, 'rgba(168,80,144,0.8)');
  g.fillStyle = gr;
  g.fill(bell);
  g.strokeStyle = 'rgba(120,40,100,0.45)';
  g.lineWidth = 0.5;
  for (let i = 0; i < 10; i++) { // the radial canals
    const b = (i / 10) * Math.PI * 2;
    g.beginPath();
    g.moveTo(Math.cos(b) * 5, 6 + Math.sin(b) * 4);
    g.quadraticCurveTo(Math.cos(b + 0.15) * 11, 5 + Math.sin(b + 0.15) * 8.6, Math.cos(b) * 16.4, 4 + Math.sin(b) * 12.8);
    g.stroke();
  }
  g.fillStyle = 'rgba(255,240,250,0.6)';
  for (let i = 0; i < 24; i++) { // the scalloped rim
    const b = (i / 24) * Math.PI * 2;
    g.beginPath();
    g.arc(Math.cos(b) * 16.6, 4 + Math.sin(b) * 13, 0.9, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = 'rgba(120,30,90,0.7)';
  g.lineWidth = 0.7;
  g.stroke(bell);
  shell(g, 0, 6, 11, 8.3, hide(a), 0);
  shell(g, 0, 7, 5, 4, { base: a.dark, dark: '#4a1440', light: a.trim, ink: 'rgba(60,10,50,0.8)' }, 0);
  g.fillStyle = 'rgba(255,255,255,0.3)';
  g.beginPath();
  g.ellipse(-6, -1, 5, 3, -0.2, 0, Math.PI * 2);
  g.fill();
}

export const SKYJELLY = art('skyjelly', {
  under: (ctx, p, t) => {
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
    ctx.fillStyle = p.mono ? p.body : 'rgba(232,120,200,0.5)'; // the bell's skirt, pulsing
    ctx.beginPath();
    ctx.ellipse(0, 4, 19 * pulse, 15 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();
    if (p.mono) return;
    ctx.strokeStyle = 'rgba(120,30,90,0.6)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
  },
  body: jellyBell,
  over: (ctx, p, t) => {
    if (p.mono) return;
    const pulse = 1 + Math.sin(t * 2.6) * 0.08;
    for (let i = 0; i < 10; i++) { // the rim lights running
      const b = (i / 10) * Math.PI * 2 + t * 0.5;
      const on = 0.4 + 0.6 * Math.max(0, Math.sin(t * 4 + i));
      const x = Math.cos(b) * 16 * pulse, y = 4 + Math.sin(b) * 12 * pulse;
      glowOf(ctx, p, x, y, 3.4, on * 0.6);
      ctx.fillStyle = `rgba(170,255,250,${on.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  },
});
