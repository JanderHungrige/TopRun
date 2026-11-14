import { shell, spines, veins, type ShellInk } from '../detail/organic';
import { lens } from '../detail/parts';
import { cachedPart, glowOf, quadAt, taper, warts } from './jungle-kit';
import { art, JUNGLE_PAL, hide, type JunglePal } from './jungle-pal';

// The jungle planet's carnivorous plants in detail (docs 81, 96, 117), fronts down (+y): the spitter — a rosette of
// short leaves round a thorny stem, six big veined leaves swaying over it, two glossy pink jaw halves with white teeth
// opening and turning to the aim round a glowing throat; the spore pod — a fleshy root crown on seven creeping roots,
// its cluster of glossy pods breathing, veined, its spores and its heart glowing in time; the lasher vine — a bulb with
// ridges on a ring of broad leaves, five thorned tendrils whipping round it, its toothed maw gaping toward the aim.

type Ctx = CanvasRenderingContext2D;

/** A pointed leaf along +x from its stem (0, 0): a gradient across it, the outline, the midrib and side veins. */
function leaf(g: Ctx, len: number, w: number, c: ShellInk, vein: string): void {
  const outline = new Path2D();
  outline.moveTo(0, 0);
  outline.quadraticCurveTo(len * 0.42, -w * 1.3, len, 0);
  outline.quadraticCurveTo(len * 0.42, w * 1.3, 0, 0);
  const gr = g.createLinearGradient(0, -w, 0, w);
  gr.addColorStop(0, c.light);
  gr.addColorStop(0.45, c.base);
  gr.addColorStop(1, c.dark);
  g.fillStyle = gr;
  g.fill(outline);
  g.strokeStyle = c.ink;
  g.lineWidth = 0.5;
  g.stroke(outline);
  g.strokeStyle = vein;
  g.lineWidth = 0.35;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(len * 0.92, 0);
  for (let k = 1; k < 5; k++) {
    const x = len * k * 0.18, h = w * 0.62 * (1 - k * 0.15);
    g.moveTo(x, 0);
    g.lineTo(x + len * 0.12, -h);
    g.moveTo(x, 0);
    g.lineTo(x + len * 0.12, h);
  }
  g.stroke();
}

const leafInk = (a: JunglePal): ShellInk => ({ base: a.skin, dark: a.trim, light: '#9ac860', ink: a.ink });

function spitterJaw(g: Ctx, a: JunglePal, side: number): void {
  shell(g, side * 3, 7, 6, 9, hide(a), 0);
  g.save();
  g.beginPath();
  g.ellipse(side * 3, 7, 6, 9, 0, 0, Math.PI * 2);
  g.clip();
  g.fillStyle = a.dark; // the red lining along the inner edge
  g.beginPath();
  g.ellipse(-side * 2.2, 7, 2.6, 8.4, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
  warts(g, [side * 5, 3, 0.9, side * 6.4, 7.6, 0.7, side * 4.4, 11.4, 0.8], a.light, '#ffd0e0');
  const inward = side > 0 ? Math.PI : 0; // white teeth along the inner edge
  spines(g, [-side * 1.9, 2.6, inward, 2, 0.5, -side * 2.7, 6.4, inward, 2.2, 0.55, -side * 2.4, 10.2, inward, 2, 0.5,
    -side * 1, 13.4, inward, 1.6, 0.42], { base: a.bone, dark: '#a89a7a', light: '#ffffff', ink: a.ink });
}

export const SPITTER = art('spitter', {
  body: (ctx, p) => {
    for (let i = 0; i < 8; i++) { // the rosette of short leaves
      ctx.save();
      ctx.rotate((i / 8) * Math.PI * 2 + 0.4);
      leaf(ctx, 13.6, 2.6, { ...leafInk(p), base: p.trim, light: p.skin }, 'rgba(200,240,160,0.3)');
      ctx.restore();
    }
    shell(ctx, 0, 0, 5.6, 5.6, { base: p.skin, dark: p.trim, light: '#9ac860', ink: p.ink }, 0); // the stem
    spines(ctx, Array.from({ length: 8 }, (_, k) => [Math.cos(k * 0.785) * 5, Math.sin(k * 0.785) * 5, k * 0.785, 2, 0.5]).flat(), { base: p.bone, dark: '#8a7a5a', light: '#fffaf0', ink: p.ink });
  },
  over: (ctx, p, t, aim) => {
    for (let i = 0; i < 6; i++) { // six big leaves swaying round the stem
      const b = (i / 6) * Math.PI * 2 + Math.sin(t + i) * 0.1;
      ctx.save();
      ctx.rotate(b);
      ctx.translate(4.5, 0);
      cachedPart(ctx, 'spitter-leaf', [14.5, 5], p, JUNGLE_PAL.spitter, (g, a) => leaf(g, 14, 3.4, leafInk(a), 'rgba(220,255,180,0.4)'));
      ctx.restore();
    }
    ctx.save();
    ctx.rotate(aim - Math.PI);
    const open = 0.3 + Math.max(0, Math.sin(t * 3)) * 0.5;
    if (!p.mono) glowOf(ctx, p, 0, 6, 9, 0.5 + open * 0.4);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.rotate(-side * open); // the halves part outward
      cachedPart(ctx, `spitter-jaw${side}`, [10, 17], p, JUNGLE_PAL.spitter, (g, a) => spitterJaw(g, a, side));
      ctx.restore();
    }
    if (!p.mono) lens(ctx, 0, 6, 2.4, p.glow);
    ctx.restore();
  },
});

function sporeRoots(ctx: Ctx, p: JunglePal, t: number): void {
  for (let i = 0; i < 7; i++) {
    const b = (i / 7) * Math.PI * 2 + 0.3;
    const w = Math.sin(t * 0.8 + i) * 0.08;
    taper(ctx, [Math.cos(b) * 6, Math.sin(b) * 6, Math.cos(b + 0.4) * 11.4, Math.sin(b + 0.4) * 11.4, Math.cos(b + w) * 19, Math.sin(b + w) * 19],
      i % 2 ? 2.6 : 3.4, 0.6, { base: p.skin, dark: p.dark, light: p.body, ink: p.ink });
  }
}

/** The spore pod's cluster: four glossy side pods round the veined heart pod, studded with spore bumps. */
function sporePods(g: Ctx, a: JunglePal): void {
  for (const [x, y, r] of [[-8, -4, 6], [8, -5, 5.5], [-6, 8, 5], [7, 7, 5.5]] as const) {
    shell(g, x, y, r, r, { base: a.skin, dark: '#1e1226', light: a.light, ink: a.ink }, 1);
    warts(g, [x + r * 0.2, y + r * 0.3, r * 0.16, x - r * 0.3, y + r * 0.4, r * 0.12], a.trim, '#ffffff');
  }
  shell(g, 0, 0, 10, 11, hide(a), 0);
  veins(g, 0, 0, Array.from({ length: 7 }, (_, i) => {
    const b = (i / 7) * Math.PI * 2 + 0.6;
    return [Math.cos(b + 0.3) * 5, Math.sin(b + 0.3) * 5.5, Math.cos(b + 0.2) * 9.4, Math.sin(b + 0.2) * 10.4];
  }).flat(), a.trim, 0.55);
  g.fillStyle = a.dark;
  g.beginPath();
  g.arc(0, 0, 3.4, 0, Math.PI * 2);
  g.fill();
}

export const SPOREPOD = art('sporepod', {
  under: sporeRoots,
  body: (ctx, p) => {
    shell(ctx, 0, 0, 11, 11, { base: p.skin, dark: '#1e1226', light: p.body, ink: p.ink }, 2); // the root crown
    warts(ctx, [-7, 5, 1.4, 6, 6.5, 1.2, 8, -4, 1.3, -5, -7.5, 1.2], p.dark, p.body);
  },
  over: (ctx, p, t) => {
    const breathe = 1 + Math.sin(t * 2.4) * 0.07;
    ctx.save();
    ctx.scale(breathe, breathe);
    cachedPart(ctx, 'sporepod-pods', [15, 14], p, JUNGLE_PAL.sporepod, sporePods);
    ctx.restore();
    if (p.mono) return;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.4 + 1);
    for (let i = 0; i < 6; i++) { // the spores glowing in time
      const b = (i / 6) * Math.PI * 2;
      const x = Math.cos(b) * 5.5 * breathe, y = Math.sin(b) * 6 * breathe;
      glowOf(ctx, p, x, y, 3, 0.3 + pulse * 0.4);
      ctx.fillStyle = `rgba(220,255,120,${(0.4 + pulse * 0.6).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    glowOf(ctx, p, 0, 0, 6, 0.4 + pulse * 0.3);
    lens(ctx, 0, 0, 2.6, p.glow);
  },
});

function lasherTendrils(ctx: Ctx, p: JunglePal, t: number): void {
  for (let i = 0; i < 5; i++) {
    const b = (i / 5) * Math.PI * 2 + Math.sin(t * 2.2 + i * 1.7) * 0.5;
    const tip = 22 + Math.sin(t * 3.1 + i) * 4;
    const q = [0, 0, Math.cos(b + 0.7) * tip * 0.7, Math.sin(b + 0.7) * tip * 0.7, Math.cos(b) * tip, Math.sin(b) * tip];
    taper(ctx, q, 4.4, 1.1, hide(p));
    const thorns: number[] = [];
    for (const u of [0.35, 0.55, 0.75, 0.92]) {
      const [x, y, d] = quadAt(q, u);
      thorns.push(x, y, d + Math.PI / 2, 2.2 - u, 0.45, x, y, d - Math.PI / 2, 1.8 - u, 0.4);
    }
    spines(ctx, thorns, { base: p.light, dark: p.dark, light: '#f0ffd8', ink: p.ink });
  }
}

export const LASHER = art('lasher', {
  under: lasherTendrils,
  body: (ctx, p) => {
    for (let i = 0; i < 7; i++) { // a ring of broad leaves
      ctx.save();
      ctx.rotate((i / 7) * Math.PI * 2 + 0.2);
      leaf(ctx, 13.4, 3.4, { base: p.dark, dark: '#122408', light: p.body, ink: p.ink }, 'rgba(200,240,160,0.3)');
      ctx.restore();
    }
    shell(ctx, 0, 0, 10, 10, hide(p), 0);
    ctx.strokeStyle = 'rgba(20,40,10,0.45)';
    ctx.lineWidth = 0.6;
    for (let k = -2; k <= 2; k++) { // ridges down the bulb
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.abs(k) * 2.6 + 0.4, 9.6, 0, k < 0 ? Math.PI * 0.5 : -Math.PI * 0.5, k < 0 ? Math.PI * 1.5 : Math.PI * 0.5);
      ctx.stroke();
    }
    warts(ctx, [-5, -4, 0.9, 4, -6, 0.8, 6, 3, 0.7, -6, 4, 0.8], p.light, '#f0ffd8');
  },
  over: (ctx, p, t, aim) => {
    ctx.save();
    ctx.rotate(aim - Math.PI);
    const open = 2.5 + Math.max(0, Math.sin(t * 3)) * 3;
    ctx.fillStyle = p.mono ? p.body : p.trim; // the lips
    ctx.beginPath();
    ctx.ellipse(0, 4, 7, open + 1, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!p.mono) {
      const g = ctx.createRadialGradient(0, 4, 0, 0, 4, 6);
      g.addColorStop(0, '#ff5a3a');
      g.addColorStop(0.5, '#6a1420');
      g.addColorStop(1, p.skin);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 4, 6, open, 0, 0, Math.PI * 2);
      ctx.fill();
      const teeth: number[] = [];
      for (let k = -2; k <= 2; k++) teeth.push(k * 2.2, 4 - open, Math.PI / 2, 2.2, 0.75, k * 2.2 + 1.1, 4 + open, -Math.PI / 2, 1.8, 0.6);
      spines(ctx, teeth, { base: p.bone, dark: '#a89a7a', light: p.bone, ink: 'rgba(40,10,10,0.8)' });
    }
    ctx.restore();
  },
});
