import { eyes, limb, shell, spines } from '../detail/organic';
import { cachedPart, fang, glowOf, orb, scaleRows, warts } from './jungle-kit';
import { art, bone, darkHide, hide, JUNGLE_PAL, type JunglePal } from './jungle-pal';

// The jungle planet's heavy beasts in detail (docs 96, 117), heads down (+y): the rhino crawler — a scaled hide under
// four bands of knobbed armour, spikes on its flanks, scars, a dark head with a great horn and a lesser one and glowing
// red eyes, its four clawed feet pounding at a run; the acid toad — a warty, mottled body with glandular ridges that
// swells as it hops, webbed feet, its throat sac glowing acid green, bulging yellow eyes; the swamp lurker — a scaled
// back with a spiked ridge rising and sinking under the water among the ripples, its bulging eyes and nostrils above
// the surface, the slit pupils blinking.

type Ctx = CanvasRenderingContext2D;

function rhinoBody(ctx: Ctx, p: JunglePal): void {
  for (const s of [-1, 1]) { // the flank spikes
    fang(ctx, s * 12.4, -4, s > 0 ? -0.75 : Math.PI + 0.75, 7, 2.2, { ...bone(p), base: p.trim, light: p.light, dark: '#24201a' });
    fang(ctx, s * 13.4, 4, s > 0 ? -0.5 : Math.PI + 0.5, 4.6, 1.6, { ...bone(p), base: p.trim, light: p.light, dark: '#24201a' });
  }
  const hull = new Path2D();
  hull.ellipse(0, 0, 14.4, 21.4, 0, 0, Math.PI * 2);
  shell(ctx, 0, 0, 14.4, 21.4, hide(p), 0);
  scaleRows(ctx, hull, -15, -22, 15, 22, 2.6, 'rgba(20,16,12,0.18)');
  for (let i = 0; i < 4; i++) { // the bands of knobbed armour
    const y = -16 + i * 8;
    const w = 13 - Math.abs(i - 1.5) * 1.5;
    shell(ctx, 0, y, w, 4.6, { ...hide(p), base: i % 2 ? p.light : p.trim }, 0);
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.ellipse(0, y, w, 4.6, 0, 0, Math.PI);
    ctx.stroke();
    warts(ctx, [-w * 0.55, y + 1.4, 0.8, 0, y + 2, 0.9, w * 0.55, y + 1.4, 0.8], i % 2 ? p.body : p.light, '#ffffff');
  }
  ctx.strokeStyle = 'rgba(220,206,180,0.7)';
  ctx.lineWidth = 0.6;
  ctx.beginPath(); // scars
  ctx.moveTo(-6, -2);
  ctx.lineTo(4, 3);
  ctx.moveTo(5, -11);
  ctx.lineTo(9, -8);
  ctx.stroke();
  const head = { base: p.trim, dark: p.dark, light: p.light, ink: p.ink };
  for (const s of [-1, 1]) shell(ctx, s * 6.4, 14.6, 1.6, 2.2, head, 0); // ears
  shell(ctx, 0, 18, 8, 7, head, 1); // the head
  fang(ctx, 0, 21.4, Math.PI / 2, 12, 3.2, bone(p)); // the great horn and the lesser one
  fang(ctx, 0, 17.4, Math.PI / 2, 4.4, 1.8, bone(p));
  eyes(ctx, [-4.2, 20.6, 4.2, 20.6], 1.3, p.glow, p.core, true);
}

const RHINO = art('rhino', {
  under: (ctx, p, t) => {
    const run = Math.sin(t * 12) * 3;
    for (const [x, y, s] of [[-12, -8, 1], [12, -8, -1], [-12, 9, -1], [12, 9, 1]] as const) {
      const fy = y + run * s;
      orb(ctx, p, x, fy, 4.4, 6.4, darkHide(p), 1);
      spines(ctx, [x - 2, fy + 5, Math.PI / 2, 1.8, 0.7, x, fy + 5.6, Math.PI / 2, 2, 0.8, x + 2, fy + 5, Math.PI / 2, 1.8, 0.7], bone(p));
    }
  },
  body: rhinoBody,
});

/** The toad's body at rest (the caller swells it as it hops): mottled, warty, two glandular ridges. */
function toadBody(g: Ctx, a: JunglePal): void {
  const back = new Path2D();
  back.ellipse(0, 0, 14, 12, 0, 0, Math.PI * 2);
  shell(g, 0, 0, 14, 12, hide(a), 0);
  g.save();
  g.clip(back);
  g.fillStyle = 'rgba(30,50,14,0.45)';
  for (const [x, y, rx, ry] of [[-7, -5, 3.4, 2.4], [6, -7, 2.6, 2], [9, 1, 2.2, 3], [-10, 3, 2, 2.6], [1, -2, 2.4, 1.8], [-3, 6, 2, 1.4]] as const) {
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0.4, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
  for (const s of [-1, 1]) { // the glandular ridges
    g.fillStyle = a.light;
    g.beginPath();
    g.ellipse(s * 5, -3, 1.4, 6, s * 0.15, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(20,30,8,0.5)';
    g.lineWidth = 0.4;
    g.stroke();
  }
  warts(g, [-6, -4, 1.6, 5, -6, 1.3, 8, 2, 1.2, -9, 3, 1.3, 1, -9, 1, -2, 4, 0.9, 10, -4, 0.9, -11, -3, 0.8, 3, 1, 0.8], a.light, '#e8ffb8');
}

const TOAD = art('toad', {
  under: (ctx, p, t) => {
    const hop = Math.abs(Math.sin(t * 2.2));
    for (const side of [-1, 1]) { // the hind legs, folded, kicking back as it hops
      const y = -8 - hop * 3;
      const leg = { ...hide(p), base: p.dark, dark: p.mono ? p.dark : '#16220c' };
      const fx = side * 14.6, fy = y - 5;
      const toes = [-0.1, 0.35, 0.8].map((a) => [fx + Math.sin(side * a) * 6.4, fy - Math.cos(a) * 6.4]);
      ctx.fillStyle = p.mono ? p.body : p.skin; // the web between the toes
      ctx.strokeStyle = p.mono ? p.body : p.ink;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      for (const [x, yy] of toes) ctx.lineTo(x ?? 0, yy ?? 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      for (const [x, yy] of toes) limb(ctx, [fx, fy, x ?? 0, yy ?? 0], 0.8, leg);
      orb(ctx, p, side * 12.4, y + 1, 4.6, 7.6, leg, 1, side * 0.5); // the thigh
    }
  },
  body: (ctx, p) => {
    for (const side of [-1, 1]) { // the front legs, webbed toes forward
      spines(ctx, [side * 12.4, 12.6, Math.PI / 2 - side * 0.6, 2, 0.6, side * 11, 13.4, Math.PI / 2 - side * 0.2, 2, 0.6], { ...hide(p), base: p.skin });
      shell(ctx, side * 11, 9, 3, 5, { ...hide(p), base: p.dark }, 1, -side * 0.4);
    }
  },
  over: (ctx, p, t) => {
    const s = 1 + Math.abs(Math.sin(t * 2.2)) * 0.12;
    ctx.save();
    ctx.scale(s, s);
    cachedPart(ctx, 'toad-body', [15, 13], p, JUNGLE_PAL.toad, toadBody);
    ctx.restore();
    if (p.mono) return;
    const sac = 3 + (0.5 + 0.5 * Math.sin(t * 5)) * 3;
    glowOf(ctx, p, 0, 10, sac * 2.2, 0.45);
    shell(ctx, 0, 10, sac, sac * 0.8, { base: p.glow, dark: '#3a7a10', light: p.core, ink: p.ink }, 0); // the throat sac
    for (const side of [-1, 1]) {
      shell(ctx, side * 6, 7, 3, 3, { ...hide(p), base: p.body }, 0);
      eyes(ctx, [side * 6, 7.2], 2.1, p.trim, '#fffbe0');
      ctx.fillStyle = '#101008';
      ctx.beginPath();
      ctx.ellipse(side * 6, 7.4, 1.4, 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  },
});

/** The lurker's back under the water: crocodilian scutes in rows down a dark hide. */
function lurkerBack(g: Ctx, a: JunglePal): void {
  const back = new Path2D();
  back.ellipse(0, -2, 15, 18, 0, 0, Math.PI * 2);
  shell(g, 0, -2, 15, 18, darkHide(a), 0);
  g.save();
  g.clip(back);
  for (let r = 0; r < 7; r++) for (const x of [-9, -4.5, 4.5, 9]) { // the scutes
    const y = -16 + r * 4.6 + (Math.abs(x) > 6 ? 1.4 : 0);
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.fillRect(x - 1.8, y - 1.2, 3.6, 3.4);
    g.fillStyle = a.body;
    g.fillRect(x - 1.6, y - 1.4, 3.2, 3);
    g.fillStyle = 'rgba(255,255,255,0.18)';
    g.fillRect(x - 1.6, y - 1.4, 3.2, 0.6);
  }
  g.restore();
}

const LURKER = art('lurker', {
  under: (ctx, p, t) => {
    const rise = Math.max(0, Math.sin(t * 0.9));
    if (!p.mono) for (let k = 0; k < 3; k++) {
      const r = 10 + ((t * 8 + k * 6) % 18);
      ctx.strokeStyle = `rgba(190,230,210,${(0.5 * (1 - (r - 10) / 18)).toFixed(2)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.8, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.save();
    ctx.globalAlpha *= p.mono ? 1 : 0.55 + rise * 0.45;
    cachedPart(ctx, 'lurker-back', [16, 21], p, JUNGLE_PAL.lurker, lurkerBack);
    const ridge: number[] = [];
    for (let i = 0; i < 4; i++) ridge.push(0, -11 + i * 6, -Math.PI / 2, 5 + rise * 2, 2.6);
    spines(ctx, ridge, { ...hide(p), base: p.trim });
    ctx.restore();
  },
  body: (ctx, p) => {
    shell(ctx, 0, 16, 3.4, 2.4, hide(p), 0); // the snout and its nostrils
    warts(ctx, [-1.2, 16.4, 0.5, 1.2, 16.4, 0.5], '#101410', '#3a4038', 'rgba(0,0,0,0)');
    for (const side of [-1, 1]) shell(ctx, side * 6, 12, 5.5, 4.5, hide(p), 0); // the eye bulges
  },
  over: (ctx, p, t) => {
    if (p.mono) return;
    for (const side of [-1, 1]) {
      const blink = (t * 0.7 + side * 0.13) % 3 < 0.12 ? 0.3 : 1;
      shell(ctx, side * 6, 12, 4, 3.2 * blink, { base: p.glow, dark: '#7a5a10', light: '#fff6c0', ink: p.ink }, 0);
      ctx.fillStyle = '#120a04';
      ctx.beginPath(); // the slit pupils
      ctx.ellipse(side * 6, 12, 0.9, 2.6 * blink, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  },
});

export { LURKER, RHINO, TOAD };
