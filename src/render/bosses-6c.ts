import { eyes, limb, plateShell, shell } from './detail/organic';
import { cable } from './detail/parts';
import { ravager, sentinel } from './bosses-6a';
import { mantis, queen } from './bosses-6b';
import { cachedHull, liveOf, type HullFn, type Map6Boss } from './bosses-6';
import { fang, quadAt, scaleRows, taper, warts } from './enemies/jungle-kit';
import { bone, darkHide, hide, type JunglePal } from './enemies/jungle-pal';

// BASILISK — the swamp beast: a scaled, mottled hide with rows of bony knobs and golden dorsal spines, weed hanging
// from its back, the long head with nostrils, teeth along its jaws, brow ridges and glowing yellow eyes; its four clawed
// legs paddle and its banded tail sweeps behind (docs 81, 118). The registry of map 6's hulls.

type Ctx = CanvasRenderingContext2D;

function basiliskHull(g: Ctx, a: JunglePal): void {
  const back = new Path2D();
  back.ellipse(0, 30, 54, 64, 0, 0, Math.PI * 2);
  back.ellipse(0, -50, 42, 46, 0, 0, Math.PI * 2);
  shell(g, 0, -50, 42, 46, hide(a), 0);
  shell(g, 0, 30, 54, 64, hide(a), 0);
  scaleRows(g, back, -56, -98, 56, 96, 7, 'rgba(10,16,6,0.28)');
  g.save();
  g.clip(back);
  g.fillStyle = 'rgba(20,30,10,0.35)';
  for (const [x, y, rx, ry] of [[-30, 10, 12, 18], [28, 50, 14, 10], [-20, 70, 10, 8], [24, -40, 10, 14], [-22, -70, 8, 10]] as const) {
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0.3, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
  for (const s of [-1, 1]) warts(g, Array.from({ length: 7 }, (_, k) => [s * (17 + (k % 2) * 3), 78 - k * 22, 3.2]).flat(), a.light, '#c8d8a0');
  for (let i = 0; i < 6; i++) fang(g, 0, 70 - i * 22, -Math.PI / 2, 18, 6, { base: a.trim, dark: '#6a4a10', light: '#fff0b0', ink: a.ink });
  cable(g, [30, -20, 36, -6, 32, 10], 2.4, '#3a5a20'); // weed hanging from its back
  cable(g, [-36, 40, -40, 54, -34, 66], 2, '#3a5a20');
  plateShell(g, [0, 160, 22, 140, 34, 100, 18, 84, 0, 80, -18, 84, -34, 100, -22, 140], { ...hide(a), base: a.light }, 1.4); // the head
  for (let k = 0; k < 6; k++) for (const s of [-1, 1]) fang(g, s * (30 - k * 3.4), 106 + k * 7, s > 0 ? 0.2 : Math.PI - 0.2, 5, 1.4, bone(a)); // teeth
  for (const s of [-1, 1]) {
    plateShell(g, [s * 6, 118, s * 22, 116, s * 24, 124, s * 8, 124], darkHide(a), 0.8); // brow ridges
    warts(g, [s * 5, 152, 1.6], '#0a0e06', '#2a3420', 'rgba(0,0,0,0)'); // nostrils
  }
  eyes(g, [-12, 128, 12, 128], 4, a.glow, '#fffbe0', true);
}

export const basilisk: HullFn = (ctx, p, s) => {
  const q = liveOf('basilisk', p);
  const wag = Math.sin(s.t * 1.4) * 10;
  const tail = [0, -40, wag, -100, -wag * 0.6, -150];
  taper(ctx, tail, 30, 12, hide(q)); // the banded tail sweeping behind
  ctx.strokeStyle = q.dark;
  for (const u of [0.25, 0.45, 0.65, 0.85]) {
    const [x, y, d] = quadAt(tail, u);
    const w = 14 - u * 8;
    ctx.lineWidth = 3 - u * 1.6;
    ctx.beginPath();
    ctx.moveTo(x - Math.sin(d) * w, y + Math.cos(d) * w);
    ctx.lineTo(x + Math.sin(d) * w, y - Math.cos(d) * w);
    ctx.stroke();
  }
  for (const [y, side] of [[60, -1], [60, 1], [-20, -1], [-20, 1]] as const) { // four clawed legs paddling
    const fy = y + 14 + Math.sin(s.t * 3 + y) * 6;
    limb(ctx, [side * 38, y, side * 62, y - 4, side * 72, fy], 12, { base: q.dark, dark: q.mono ? q.dark : '#3a4a2a', light: q.light, ink: q.ink });
    for (const k of [-1, 0, 1]) fang(ctx, side * 72 + k * 4, fy + 4, Math.PI / 2 - side * (0.4 + k * 0.3), 9, 2, bone(q));
  }
  cachedHull(ctx, 'basilisk', p, basiliskHull);
};

export const HULLS_6: Readonly<Record<Map6Boss, HullFn>> = { ravager, mantis, basilisk, sentinel, queen };
