import { shell, spines } from '../detail/organic';
import { bevel, lens, path, sheen } from '../detail/parts';
import { cachedPart, glowOf, orb, warts } from './jungle-kit';
import { art, darkHide, hide, JUNGLE_PAL, type JunglePal } from './jungle-pal';

// The jungle planet's rooted strongholds in detail (docs 96, 117), fronts down (+y): the brood spire — a stepped
// chitin mound with radial ribs, a ring of thorns and four fleshy vents breathing a pink glow round its glowing mouth,
// larvae crawling round its foot; the crystal totem — a carved stone block with a raised centre, notched glyph borders,
// cracks and moss, the faceted crystal turning in its socket and its white core pulsing.

type Ctx = CanvasRenderingContext2D;

function spireMound(g: Ctx, a: JunglePal): void {
  spines(g, Array.from({ length: 12 }, (_, k) => {
    const b = (k / 12) * Math.PI * 2 + 0.26;
    return [Math.cos(b) * 17.6, Math.sin(b) * 17.6, b, 2.6, 1];
  }).flat(), { ...hide(a), base: a.dark });
  shell(g, 0, 0, 18.4, 18.4, darkHide(a), 0);
  for (let i = 0; i < 8; i++) { // the chitin ribs
    const b0 = (i / 8) * Math.PI * 2 + 0.06, b1 = b0 + Math.PI / 4 - 0.12;
    const pts: number[] = [];
    for (let s = 0; s <= 4; s++) pts.push(Math.cos(b0 + ((b1 - b0) * s) / 4) * 17.4, Math.sin(b0 + ((b1 - b0) * s) / 4) * 17.4);
    for (let s = 4; s >= 0; s--) pts.push(Math.cos(b0 + ((b1 - b0) * s) / 4) * 13, Math.sin(b0 + ((b1 - b0) * s) / 4) * 13);
    bevel(g, pts, a.body, a.ink, 0.5);
  }
  shell(g, 0, 0, 13.6, 13.6, hide(a), 0);
  g.strokeStyle = a.trim;
  g.lineWidth = 2.6;
  g.beginPath();
  g.arc(0, 0, 9.6, 0, Math.PI * 2);
  g.stroke();
  for (let i = 0; i < 4; i++) { // the vents, fleshy lips round dark holes
    const b = (i / 4) * Math.PI * 2 + Math.PI / 4;
    shell(g, Math.cos(b) * 12, Math.sin(b) * 12, 3.2, 3.2, { base: a.skin, dark: a.trim, light: '#fff0e0', ink: a.ink }, 0);
    g.fillStyle = '#1a0812';
    g.beginPath();
    g.arc(Math.cos(b) * 12, Math.sin(b) * 12, 1.8, 0, Math.PI * 2);
    g.fill();
  }
  shell(g, 0, 0, 6.4, 6.4, darkHide(a), 0);
  g.fillStyle = '#12060e';
  g.beginPath();
  g.arc(0, 0, 3.6, 0, Math.PI * 2);
  g.fill();
}

export const SPIRE = art('spire', {
  under: (ctx, p, t) => {
    for (let i = 0; i < 6; i++) { // larvae crawling round the foot
      const b = t * 0.7 + (i / 6) * Math.PI * 2;
      ctx.save();
      ctx.translate(Math.cos(b) * 20, Math.sin(b) * 20);
      ctx.rotate(b + Math.PI / 2);
      orb(ctx, p, 0, 0, 1.7, 2.8, { base: p.skin, dark: p.trim, light: '#ffffff', ink: p.ink }, 2);
      if (!p.mono) warts(ctx, [0, 2.4, 0.6], '#3a1428', '#7a4a60', 'rgba(0,0,0,0)');
      ctx.restore();
    }
  },
  body: spireMound,
  over: (ctx, p, t) => {
    if (p.mono) return;
    for (let i = 0; i < 4; i++) { // vents breathing
      const b = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const g = 0.4 + 0.6 * Math.max(0, Math.sin(t * 2 + i * 1.6));
      glowOf(ctx, p, Math.cos(b) * 12, Math.sin(b) * 12, 5, g * 0.6);
      ctx.fillStyle = `rgba(255,120,210,${g.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(Math.cos(b) * 12, Math.sin(b) * 12, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    glowOf(ctx, p, 0, 0, 7, 0.5 + 0.2 * Math.sin(t * 3));
    lens(ctx, 0, 0, 3, p.glow);
  },
});

function totemStone(g: Ctx, a: JunglePal): void {
  const outer = [-17, -17, 17, -17, 17, 17, -17, 17];
  bevel(g, outer, a.dark, a.ink, 1);
  sheen(g, path(outer), -17, -17, 17, 17);
  const inner = [-12, -12, 12, -12, 12, 12, -12, 12];
  bevel(g, inner, a.body, a.ink, 0.6);
  sheen(g, path(inner), -12, -12, 12, 12);
  for (let i = -1; i <= 1; i++) for (const s of [-1, 1]) { // carved glyph notches
    for (const pts of [[i * 7 - 2, s * 14.6, i * 7 + 2, s * 14.6, i * 7, s * 12.6], [s * 14.6, i * 7 - 2, s * 14.6, i * 7 + 2, s * 12.6, i * 7]]) {
      bevel(g, pts, a.light, 'rgba(20,18,12,0.7)', 0.35);
    }
  }
  for (const [x, y] of [[-14.6, -14.6], [14.6, -14.6], [-14.6, 14.6], [14.6, 14.6]] as const) bevel(g, [x - 1.2, y, x, y - 1.2, x + 1.2, y, x, y + 1.2], a.light, 'rgba(20,18,12,0.7)', 0.3);
  g.strokeStyle = 'rgba(20,18,12,0.6)';
  g.lineWidth = 0.45;
  g.beginPath(); // cracks
  g.moveTo(-17, 4);
  g.lineTo(-13, 6);
  g.lineTo(-12.4, 10);
  g.moveTo(9, -12);
  g.lineTo(11, -8);
  g.lineTo(15, -7);
  g.stroke();
  shell(g, 0, 0, 8.4, 8.4, { base: '#1a1c1a', dark: '#060806', light: '#4a4e48', ink: a.ink }, 0); // the crystal's socket
  for (const [x, y, rx, ry] of [[6, 13, 4.4, 2], [-13, -9, 2.4, 3.6], [13, -13, 2.6, 1.8]] as const) { // moss
    g.fillStyle = 'rgba(50,80,30,0.85)';
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0.3, 0, Math.PI * 2);
    g.fill();
    warts(g, [x - rx * 0.4, y - ry * 0.2, 0.7, x + rx * 0.3, y + ry * 0.2, 0.6], a.skin, '#9ad070', 'rgba(0,0,0,0)');
  }
}

function crystal(g: Ctx, a: JunglePal): void {
  bevel(g, [0, -11, 7, 0, 0, 11, -7, 0], a.trim, 'rgba(10,40,60,0.9)', 0.6);
  bevel(g, [0, -11, 7, 0, 0, 0], a.glow, 'rgba(10,40,60,0.5)', 0.3); // facets
  bevel(g, [0, 11, -7, 0, 0, 0], 'rgba(255,255,255,0.4)', 'rgba(10,40,60,0.5)', 0.3);
  bevel(g, [0, -11, -7, 0, -2.4, -1, 0, -6], 'rgba(255,255,255,0.25)', 'rgba(10,40,60,0.4)', 0.25);
  g.fillStyle = 'rgba(255,255,255,0.85)';
  g.beginPath();
  g.ellipse(-2, -5, 0.8, 2.2, 0.5, 0, Math.PI * 2);
  g.fill();
}

export const TOTEM = art('totem', {
  body: totemStone,
  over: (ctx, p, t) => {
    glowOf(ctx, p, 0, 0, 15, 0.35 + 0.15 * Math.sin(t * 4));
    ctx.save();
    ctx.rotate(t * 0.9);
    cachedPart(ctx, 'totem-crystal', [8, 12], p, JUNGLE_PAL.totem, crystal);
    ctx.restore();
    if (p.mono) return;
    ctx.fillStyle = p.core;
    ctx.beginPath();
    ctx.arc(0, 0, 2 + Math.sin(t * 4) * 0.6, 0, Math.PI * 2);
    ctx.fill();
  },
});
