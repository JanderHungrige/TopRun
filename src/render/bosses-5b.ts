import { shade } from './detail/color';
import { membrane, plateShell, shell } from './detail/organic';
import { glow, path, sym } from './detail/parts';
import { barracuda, bastion } from './bosses-5a';
import { BOSS_BOX_5, cachedHull, liveOf, type HullFn, type Map5Boss } from './bosses-5';
import { flesh, ribbon, smooth, suckers } from './enemies/sea-flesh';
import { bellDome, bellMargin, serpentBody, serpentHead } from './enemies/sea-monster';
import { hullInk, rgb, rgba, type SeaPal } from './enemies/sea-pal';

// MEDUSA — a huge jellyfish: the glassy dome with its canals, gonads and gloss, the frilled margin pulsing round it,
// frilly oral arms and stinging tentacles streaming up behind, its rim lights breathing; GOLIATH — a giant squid from
// above: the freckled mantle with its pen and gloss, fins of membrane and ribs, eight arms writhing toward the sub with
// suckers along them, chromatophores flushing; JORMUNGAND — a vast sea serpent coiled in an S: a scaled body with a
// dorsal fin and glowing spots, the horned head with brow plates and a toothed maw, the whole coil swaying, its eyes
// glowing (docs 70, 120).

type Ctx = CanvasRenderingContext2D;

function medusaTentacles(ctx: Ctx, q: SeaPal, t: number): void {
  ctx.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    const x0 = -70 + i * 10.8;
    const pts = [x0, -10];
    for (let k = 1; k <= 9; k++) pts.push(x0 + Math.sin(t * 2 + i + k * 0.7) * (4 + k), -10 - k * 20);
    if (i % 3 === 0) { // an oral arm: a frilled ribbon
      const arm = ribbon(pts, 14, 5);
      ctx.fillStyle = q.mono ? q.hull : rgba(q.hull, 0.5);
      ctx.fill(arm);
      if (q.mono) continue;
      ctx.strokeStyle = rgba(q.trim, 0.6);
      ctx.lineWidth = 1.1;
      ctx.setLineDash([2.4, 1.8]);
      ctx.stroke(arm);
      ctx.setLineDash([]);
      continue;
    }
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = q.mono ? q.hull : i % 2 ? 'rgba(242,192,234,0.55)' : 'rgba(200,122,184,0.65)';
    ctx.stroke(smooth(pts));
    if (q.mono) continue;
    ctx.fillStyle = 'rgba(255,236,250,0.7)'; // stinging cells
    for (let k = 1; k <= 9; k += 2) {
      ctx.beginPath();
      ctx.arc(pts[k * 2] ?? 0, pts[k * 2 + 1] ?? 0, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export const medusa: HullFn = (ctx, p, s) => {
  const q = liveOf('medusa', p);
  const pulse = Math.sin(s.t * 2.2), rx = 84 - pulse * 4, ry = 70 + pulse * 6;
  medusaTentacles(ctx, q, s.t);
  bellMargin(ctx, q, 0, 30, rx, ry);
  cachedHull(ctx, 'medusa', p, (g, a) => bellDome(g, a, 0, 30, 78, 62));
  if (q.mono) return;
  glow(ctx, 0, 30, 34, rgb(q.glow), 0.25 + 0.15 * pulse);
  for (let i = 0; i < 16; i++) {
    const b = (i / 16) * Math.PI * 2, on = 0.45 + 0.55 * Math.max(0, Math.sin(s.t * 3 + i * 0.9));
    const x = Math.cos(b) * (rx - 4), y = 30 + Math.sin(b) * (ry - 4);
    glow(ctx, x, y, 9, rgb(q.trim), 0.5 * on);
    ctx.fillStyle = rgba('#fff0fa', on);
    ctx.beginPath();
    ctx.arc(x, y, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
};

const MANTLE = sym([0, -170, 18, -150, 36, -100, 44, -40, 42, 10, 30, 44, 0, 52]);

function goliathArms(ctx: Ctx, q: SeaPal, t: number): void {
  for (let i = 0; i < 8; i++) {
    const x0 = -42 + i * 12;
    const pts = [x0 * 0.6, 40];
    for (let k = 1; k <= 7; k++) pts.push(x0 + Math.sin(t * 2.6 + i * 0.9 + k * 0.6) * (3 + k * 2.2), 40 + k * 20);
    const w = 9 - Math.abs(i - 3.5);
    flesh(ctx, pts, w * 1.8, w * 0.35, i % 2 ? hullInk(q) : { ...hullInk(q), base: q.mono ? q.hull : shade(q.hull, -0.15) }, q.mono);
    if (!q.mono) suckers(ctx, pts, i < 4 ? 1 : -1, w * 0.2, w * 0.07, rgba(q.light, 0.9), rgba(q.dark, 0.75));
  }
}

function goliathHull(g: Ctx, a: SeaPal): void {
  for (const s of [-1, 1]) {
    const fin = [s * 10, -140, s * 56, -120, s * 60, -100, s * 26, -96];
    membrane(g, fin, s * 14, -118, [s * 56, -120, s * 58, -108, s * 50, -100, s * 38, -98], hullInk(a), rgba(a.dark, 0.85));
  }
  const mantle = path(MANTLE);
  g.fillStyle = a.hull;
  g.fill(mantle);
  g.save();
  g.clip(mantle);
  const light = g.createLinearGradient(-44, 0, 44, 0);
  light.addColorStop(0, 'rgba(0,0,0,0.3)');
  light.addColorStop(0.3, 'rgba(255,255,255,0.3)');
  light.addColorStop(0.55, 'rgba(255,255,255,0)');
  light.addColorStop(1, 'rgba(0,0,0,0.5)');
  g.fillStyle = light;
  g.fillRect(-44, -170, 88, 222);
  const round = g.createRadialGradient(-14, -110, 4, 0, -60, 150);
  round.addColorStop(0, 'rgba(255,240,230,0.3)');
  round.addColorStop(0.5, 'rgba(255,255,255,0)');
  round.addColorStop(1, 'rgba(20,0,0,0.4)');
  g.fillStyle = round;
  g.fillRect(-44, -170, 88, 222);
  for (let k = 0; k < 70; k++) { // chromatophores
    const x = (((k * 37) % 100) / 100 - 0.5) * 80, y = -160 + (((k * 53) % 100) / 100) * 200;
    g.fillStyle = rgba(k % 3 ? a.dark : shade(a.dark, -0.4), 0.5);
    g.beginPath();
    g.arc(x, y, 1.2 + (k % 4) * 0.6, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = rgba(a.light, 0.7); // the pen down the back
  g.lineWidth = 2;
  g.stroke(path([-2, -160, -3, -60, -2, 0], false));
  g.strokeStyle = rgba(a.dark, 0.6); // the mantle's edge over the head
  g.lineWidth = 2.4;
  g.stroke(path([-42, 8, -20, 0, 0, -2, 20, 0, 42, 8], false));
  g.restore();
  g.strokeStyle = rgba(a.light, 0.6);
  g.lineWidth = 1.5;
  g.stroke(path([-16, -150, -34, -100, -42, -40], false));
  g.strokeStyle = a.ink;
  g.lineWidth = 2;
  g.stroke(mantle);
  plateShell(g, sym([0, 2, 24, 3, 40, 12, 36, 32, 24, 46, 0, 51]), { base: shade(a.hull, 0.08), dark: a.dark, light: a.light, ink: a.ink }, 1.6); // the head
  for (const s of [-1, 1]) shell(g, s * 30, 20, 17, 17, { base: a.hull, dark: a.dark, light: a.light, ink: a.ink }, 1); // eye sockets
}

export const goliath: HullFn = (ctx, p, s) => {
  const q = liveOf('goliath', p);
  goliathArms(ctx, q, s.t);
  cachedHull(ctx, 'goliath', p, goliathHull);
  if (q.mono) return;
  for (let k = 0; k < 12; k++) { // chromatophores flushing
    const on = Math.max(0, Math.sin(s.t * 2.4 + k * 1.7));
    if (on < 0.3) continue;
    ctx.fillStyle = rgba(shade(q.dark, -0.2), on * 0.5);
    ctx.beginPath();
    ctx.arc(Math.sin(k * 2.9) * 24, -150 + k * 15, 2 + on * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
};

const SPINE = [0, 150, -60, 80, 40, 20, -40, -40, 50, -100, 0, -170];

function jormungandHull(g: Ctx, a: SeaPal): void {
  serpentBody(g, a, SPINE, 66, 22);
  g.save();
  g.translate(0, 150);
  serpentHead(g, a);
  g.restore();
}

/** The coil swaying: the cached serpent drawn in strips, each shifted along the wave that runs down its body. */
const sway = (t: number, y: number): number => Math.sin(t * 1.4 + (150 - y) / 64) * 6;

export const jormungand: HullFn = (ctx, p, s) => {
  const q = liveOf('jormungand', p);
  const [bx, by] = BOSS_BOX_5.jormungand;
  for (let y = -by; y < by; y += 12) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-bx - 10, y, bx * 2 + 20, 12.6);
    ctx.clip();
    ctx.translate(sway(s.t, y + 6), 0);
    cachedHull(ctx, 'jormungand', p, jormungandHull);
    ctx.restore();
  }
  if (q.mono) return;
  const hx = sway(s.t, 165);
  for (const side of [-1, 1]) glow(ctx, hx + side * 19, 165, 16, rgb(q.glass), 0.5 + 0.2 * Math.sin(s.t * 3));
};

export const HULLS_5: Readonly<Record<Map5Boss, HullFn>> = { barracuda, medusa, bastion, goliath, jormungand };
