import { eyes, limb, plateShell, shell, veins } from './detail/organic';
import { bolts, cable, grille } from './detail/parts';
import { cachedHull, JUNGLE_6, liveOf, type HullFn } from './bosses-6';
import { cachedPart, fang, glowOf, insectWing } from './enemies/jungle-kit';
import { bone, darkHide, hide, type JunglePal } from './enemies/jungle-pal';

// MANTIS — the bio-machine: a banded green abdomen with bolted plates, a thorax laced with cables and vents, the
// triangular head with its yellow compound eyes; six jointed legs stepping, veined wings quivering, the two serrated
// scythes swaying before it. The HIVE QUEEN — a glossy banded abdomen with egg sacs glowing in it and an ovipositor,
// the plated thorax, the head with mandibles, the golden crown and pink eyes; two pairs of veined wings beating
// (docs 81, 118).

type Ctx = CanvasRenderingContext2D;

const LEGS = [[-10, 0.9], [-40, 1.1], [-70, 1.3]] as const;

function mantisHull(g: Ctx, a: JunglePal): void {
  shell(g, 0, -110, 34, 46, hide(a), 0); // the abdomen, banded and plated
  for (let i = 0; i < 4; i++) {
    const y = -130 + i * 14;
    g.fillStyle = a.dark;
    g.beginPath();
    g.ellipse(0, y, 27 - i * 2.5, 3.2, 0, 0, Math.PI * 2);
    g.fill();
    bolts(g, [-18 + i * 2, y + 5, 18 - i * 2, y + 5], 1.2);
  }
  g.fillStyle = 'rgba(255,255,255,0.18)';
  g.beginPath();
  g.ellipse(-12, -124, 7, 16, 0.2, 0, Math.PI * 2);
  g.fill();
  shell(g, 0, -30, 26, 44, hide(a), 3); // the thorax with its cables and vents
  for (const s of [-1, 1]) {
    cable(g, [s * 8, -64, s * 16, -40, s * 10, -6, s * 14, 10], 2.2, '#22301a');
    grille(g, s > 0 ? 6 : -18, -50, 12, 8, 4, 'y');
  }
  shell(g, 0, -30, 6, 16, { base: a.light, dark: a.body, light: '#e8ffd0', ink: a.ink }, 2); // the dorsal plate
  shell(g, 0, 10, 12, 10, darkHide(a), 0); // the neck
  shell(g, 0, 14, 16, 8, hide(a), 1);
  plateShell(g, [0, 82, 24, 40, 30, 20, 0, 14, -30, 20, -24, 40], hide(a), 1.2); // the triangular head
  plateShell(g, [0, 66, 12, 40, 0, 24, -12, 40], { ...hide(a), base: a.light }, 0.6);
  for (const sx of [-14, 14]) eyes(g, [sx, 40], 6, a.trim, '#fffbd0');
  fang(g, -6, 72, Math.PI / 2 + 0.4, 12, 3, bone(a)); // mouthparts
  fang(g, 6, 72, Math.PI / 2 - 0.4, 12, 3, bone(a));
}

/** One raptorial scythe in its own frame: the thick femur, the knee and the sickle blade serrated on its inner edge. */
function scythe(g: Ctx, a: JunglePal, side: number): void {
  shell(g, side * 7, -24, 8, 20, hide(a), 2, -side * 0.4); // the femur
  const blade = [side * 10, -12, side * 24, -4, side * 31, 16, side * 27, 38, side * 17, 26, side * 11, 8];
  plateShell(g, blade, { ...hide(a), base: a.light, light: '#f0ffd8' }, 1.2);
  g.strokeStyle = 'rgba(30,60,10,0.5)';
  g.lineWidth = 0.8;
  g.beginPath(); // the blade's ridge
  g.moveTo(side * 16, -6);
  g.quadraticCurveTo(side * 27, 10, side * 26, 34);
  g.stroke();
  for (let k = 0; k < 5; k++) fang(g, side * (12.4 + k * 1.2), 0 + k * 6, side > 0 ? Math.PI * 0.9 : Math.PI * 0.1, 6, 1.4, bone(a));
  shell(g, side * 13, -8, 5, 5, hide(a), 0); // the knee
}

export const mantis: HullFn = (ctx, p, s) => {
  const q = liveOf('mantis', p);
  for (const [y, a] of LEGS) for (const side of [-1, 1]) { // six jointed legs, stepping
    limb(ctx, [side * 20, y, side * 60, y - 30 * a + Math.sin(s.t * 3 + y) * 4, side * 74, y + 10], 6, { ...hide(q), dark: q.dark });
  }
  for (const side of [-1, 1]) { // the wings, quivering
    ctx.save();
    ctx.translate(side * 14, -60);
    ctx.rotate(side > 0 ? -0.35 + Math.sin(s.t * 20) * 0.03 : Math.PI + 0.35 - Math.sin(s.t * 20) * 0.03);
    if (side < 0) ctx.scale(1, -1);
    insectWing(ctx, q, 86, 34, 0.3);
    ctx.restore();
  }
  cachedHull(ctx, 'mantis', p, mantisHull);
  const sway = Math.sin(s.t * 1.2) * 4;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 50 + sway * side, 70);
    cachedPart(ctx, `mantis-scythe${side}`, [34, 44], q, JUNGLE_6.mantis, (g, a) => scythe(g, a, side));
    ctx.restore();
  }
};

function queenHull(g: Ctx, a: JunglePal): void {
  fang(g, 0, -158, -Math.PI / 2, 22, 7, { ...darkHide(a), base: a.dark }); // the ovipositor
  shell(g, 0, -100, 48, 66, hide(a), 0);
  for (let i = 0; i < 5; i++) { // the abdomen's bands
    g.fillStyle = a.dark;
    g.beginPath();
    g.ellipse(0, -140 + i * 18, 44 - i * 4, 4.4, 0, 0, Math.PI * 2);
    g.fill();
  }
  veins(g, 0, -60, [-30, -80, -36, -130, 30, -80, 36, -130, -10, -100, -14, -150, 10, -100, 14, -150], 'rgba(255,140,220,0.4)', 1.2);
  for (const [x, y] of [[-24, -96], [24, -96], [0, -70]] as const) shell(g, x, y, 11, 11, { base: '#5a1a48', dark: '#2a0820', light: a.trim, ink: a.ink }, 0);
  shell(g, 0, 20, 52, 50, hide(a), 3); // the plated thorax
  for (const s of [-1, 1]) plateShell(g, [s * 8, -14, s * 38, -8, s * 44, 26, s * 30, 44, s * 10, 40], hide(a), 0.9); // its plates
  shell(g, 0, 70, 22, 14, darkHide(a), 0);
  for (const sx of [-1, 1]) fang(g, sx * 16, 132, Math.PI / 2 - sx * 0.5, 24, 5, { ...darkHide(a), light: a.light }); // mandibles
  plateShell(g, [0, 140, 30, 110, 38, 84, 0, 76, -38, 84, -30, 110], { ...hide(a), base: a.light }, 1.2); // the head
  plateShell(g, [0, 86, 10, 70, 22, 74, 30, 60, 0, 64, -30, 60, -22, 74, -10, 70], { base: '#ffd23a', dark: '#8a6a10', light: '#fff4b0', ink: a.ink }, 0.8); // the crown
  for (const sx of [-14, 14]) eyes(g, [sx, 112], 5, a.glow, '#ffffff');
}

export const queen: HullFn = (ctx, p, s) => {
  const q = liveOf('queen', p);
  const flap = Math.sin(s.t * 5) * 0.12;
  for (const side of [-1, 1]) for (const [y, len, w, tilt] of [[-10, 150, 52, -0.12], [10, 116, 40, 0.18]] as const) {
    ctx.save();
    ctx.rotate(side * flap);
    ctx.translate(side * 26, y);
    ctx.rotate(side > 0 ? tilt : Math.PI - tilt);
    if (side < 0) ctx.scale(1, -1);
    insectWing(ctx, { ...q, skin: q.mono ? q.skin : '#ffc8f0' }, len, w, 0.32);
    ctx.restore();
  }
  cachedHull(ctx, 'queen', p, queenHull);
  if (q.mono) return;
  for (const [x, y] of [[-24, -96], [24, -96], [0, -70]] as const) { // the egg sacs, glowing
    const a = 0.5 + Math.sin(s.t * 3 + x) * 0.3;
    glowOf(ctx, q, x, y, 16, a * 0.7, '#ff7ad2');
    ctx.fillStyle = `rgba(255,122,210,${(a * 0.8).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
  }
};

