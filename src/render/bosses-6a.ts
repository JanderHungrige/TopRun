import { limb, shell } from './detail/organic';
import { bolts, cable, cylinder, grille, hatch, lens, plate, rectPts, sym } from './detail/parts';
import { cachedHull, JUNGLE_6, liveOf, type HullFn } from './bosses-6';
import { armour, cachedPart, glowOf, wear } from './enemies/jungle-kit';
import { metal, type JunglePal } from './enemies/jungle-pal';

// RAVAGER — the assault walker: a worn armoured body with a light top plate, side skirts, engine grilles, exhaust
// stacks, a hatch, the cockpit's glowing visor and the rack's red lamps, two gun pods on hydraulic hoses; its legs
// stride on pistons, the splayed feet bolted. SENTINEL — the temple guardian: carved stone blocks with masonry joints,
// a glyph ring round its core, cracks with crystal veins, moss and hanging vines, a carved head with three glowing eyes;
// its stone fists hover and bob, its core glows (docs 81, 118).

type Ctx = CanvasRenderingContext2D;

function ravagerFoot(g: Ctx, a: JunglePal): void {
  armour(g, [-14, -18, 14, -18, 18, 8, 10, 20, -10, 20, -18, 8], a.dark, a.ink, 1);
  for (const x of [-9, 0, 9]) armour(g, rectPts(x - 3, 12, 6, 11), a.metal, a.ink, 0.6); // toes
  shell(g, 0, -4, 7, 7, metal(a), 0); // the ankle
  bolts(g, [-11, -14, 11, -14, -13, 6, 13, 6], 1.1);
}

function ravagerPods(g: Ctx, a: JunglePal): void {
  for (const s of [-1, 1]) {
    cable(g, [s * 50, -14, s * 60, -10, s * 64, -2], 2.6, '#22221a'); // hydraulic hoses
    cable(g, [s * 52, 20, s * 60, 18, s * 62, 26], 2.2, '#22221a');
    cylinder(g, s * 78 - 6, 40, 12, 22, a.metal, 'y'); // the arm cannon
    plate(g, s * 78 - 7.5, 60, 15, 5, '#1a1a12', a.ink, 0.6);
    armour(g, [s * 58, -14, s * 98, -14, s * 100, 36, s * 78, 42, s * 56, 36], a.body, a.ink, 1.2);
    grille(g, s * 78 - 10, -8, 20, 10, 5, 'y');
    bolts(g, [s * 62, -10, s * 94, -10, s * 62, 30, s * 96, 30], 1.2);
  }
}

function ravagerHull(g: Ctx, a: JunglePal): void {
  ravagerPods(g, a);
  armour(g, rectPts(-24, -80, 48, 26), a.dark, a.ink, 1); // the rack's base
  armour(g, sym([0, -60, 40, -52, 56, -20, 56, 30, 36, 52, 0, 58]), a.body, a.ink, 1.6);
  armour(g, sym([0, -52, 32, -46, 44, -20, 0, -24]), a.light, a.ink, 0.8); // the light top plate
  for (const s of [-1, 1]) {
    armour(g, [s * 46, -12, s * 55, -12, s * 55, 28, s * 36, 48, s * 31, 42, s * 46, 22], a.dark, a.ink, 0.8); // skirts
    grille(g, s > 0 ? 10 : -30, -46, 20, 12, 5, 'y'); // engine grilles
    shell(g, s * 46, -34, 5, 5, { base: '#2a2a20', dark: '#0a0a06', light: a.light, ink: a.ink }, 0); // exhaust stacks
    g.fillStyle = '#0a0a06';
    g.beginPath();
    g.arc(s * 46, -34, 2.6, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = 'rgba(0,0,0,0.35)';
  g.lineWidth = 0.8;
  g.beginPath(); // panel seams
  for (const y of [-6, 14]) {
    g.moveTo(-44, y);
    g.lineTo(44, y);
  }
  g.stroke();
  bolts(g, [-40, -2, -20, -2, 20, -2, 40, -2, -40, 18, 40, 18, -26, -48, 26, -48], 1.1);
  hatch(g, -16, 4, 6, a.body);
  plate(g, 8, 0, 14, 8, a.metal, a.ink, 0.6);
  armour(g, [-22, 24, 22, 24, 26, 48, -26, 48], a.dark, a.ink, 0.8); // the cockpit
  plate(g, -14, 32, 28, 12, a.glow, a.ink, 0.8);
  g.fillStyle = 'rgba(255,240,200,0.5)';
  g.fillRect(-12, 33.5, 24, 2);
  for (const x of [-5, 5]) plate(g, x - 0.8, 32, 1.6, 12, '#2a2a1a', a.ink, 0.3);
  for (let i = -2; i <= 2; i++) lens(g, i * 9, -67, 3, a.trim);
  wear(g, [-50, 0, -46, 6, 40, -30, 46, -26, -20, 50, -14, 53, 30, 40, 34, 36, -8, -40, -2, -42], 0.8);
}

export const ravager: HullFn = (ctx, p, s) => {
  const q = liveOf('ravager', p);
  const step = Math.sin(s.t * 1.6) * 14;
  for (const side of [-1, 1]) {
    const fy = 30 + (side < 0 ? step : -step);
    ctx.save();
    ctx.translate(side * 40, fy);
    cachedPart(ctx, 'ravager-foot', [19, 24], q, JUNGLE_6.ravager, ravagerFoot);
    ctx.restore();
    limb(ctx, [side * 26, 10, side * 48, fy * 0.5 + 2, side * 40, fy - 6], 12, metal(q));
    limb(ctx, [side * 30, 2, side * 46, fy * 0.5 - 4], 4, { ...metal(q), base: q.light }); // the piston
  }
  cachedHull(ctx, 'ravager', p, ravagerHull);
  if (q.mono) return;
  glowOf(ctx, q, 0, 38, 26, 0.3 + 0.12 * Math.sin(s.t * 3));
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) { // the stacks' smoke
    const k = (s.t * 0.7 + i * 0.33 + (side > 0 ? 0.15 : 0)) % 1;
    ctx.fillStyle = `rgba(70,66,56,${(0.45 * (1 - k)).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(side * 46 - k * 6, -38 - k * 40, 4 + k * 9, 0, Math.PI * 2);
    ctx.fill();
  }
};

/** A stone fist: four knuckle blocks over the back of the hand. */
function fist(g: Ctx, a: JunglePal): void {
  armour(g, sym([0, -26, 26, -22, 30, 18, 18, 30, 0, 32]), a.dark, a.ink, 1);
  for (let k = 0; k < 4; k++) armour(g, rectPts(-22 + k * 11, 14, 10, 14), a.body, a.ink, 0.7);
  g.strokeStyle = 'rgba(20,20,14,0.5)';
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(-18, -12);
  g.lineTo(-8, -4);
  g.lineTo(-10, 6);
  g.stroke();
  g.fillStyle = 'rgba(60,100,40,0.8)';
  g.beginPath();
  g.ellipse(10, -14, 8, 4, 0.2, 0, Math.PI * 2);
  g.fill();
}

function masonry(g: Ctx): void {
  g.lineWidth = 1.4;
  for (const y of [-40, 0, 40]) { // the courses
    g.strokeStyle = 'rgba(20,20,14,0.55)';
    g.beginPath();
    g.moveTo(-64, y);
    g.lineTo(64, y);
    g.stroke();
    g.strokeStyle = 'rgba(255,255,240,0.18)';
    g.beginPath();
    g.moveTo(-64, y + 1.4);
    g.lineTo(64, y + 1.4);
    g.stroke();
  }
  g.strokeStyle = 'rgba(20,20,14,0.5)';
  g.beginPath(); // joints between the blocks
  for (const [x, y0, y1] of [[-30, -66, -40], [24, -66, -40], [-48, -40, 0], [4, -40, 0], [44, -40, 0], [-22, 0, 40], [30, 0, 40], [-40, 40, 66], [12, 40, 72]] as const) {
    g.moveTo(x, y0);
    g.lineTo(x, y1);
  }
  g.stroke();
}

function sentinelHull(g: Ctx, a: JunglePal): void {
  for (const s of [-1, 1]) armour(g, rectPts(s * 60 - 12, -10, 24, 40), a.dark, a.ink, 1); // the arms
  armour(g, sym([0, -70, 56, -66, 70, -20, 66, 50, 40, 70, 0, 74]), a.body, a.ink, 1.6);
  armour(g, sym([0, -60, 46, -56, 56, -24, 0, -28]), a.light, a.ink, 0.6);
  masonry(g);
  g.strokeStyle = 'rgba(20,20,14,0.6)';
  g.lineWidth = 2;
  g.beginPath(); // the glyph ring round the core
  g.arc(0, 24, 27, 0, Math.PI * 2);
  g.stroke();
  for (let k = 0; k < 12; k++) {
    const b = (k / 12) * Math.PI * 2;
    plate(g, Math.cos(b) * 27 - 2, 24 + Math.sin(b) * 27 - 2, 4, 4, a.light, 'rgba(20,20,14,0.6)', 0.5);
  }
  g.strokeStyle = 'rgba(90,255,208,0.7)'; // crystal veins in the cracks
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(40, -20);
  g.lineTo(48, -6);
  g.lineTo(44, 10);
  g.moveTo(-54, 20);
  g.lineTo(-44, 28);
  g.lineTo(-48, 36);
  g.stroke();
  for (const [x, y, rx, ry] of [[-50, 50, 13, 6], [44, -30, 12, 6], [-30, -60, 11, 5]] as const) { // moss
    g.fillStyle = '#3a6a22';
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0.2, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(150,210,100,0.5)';
    for (let k = 0; k < 4; k++) g.fillRect(x - rx * 0.6 + k * rx * 0.4, y - 1.5 + (k % 2) * 2, 1.6, 1.6);
  }
  cable(g, [-50, 56, -52, 66, -48, 76], 1.6, '#2e5a1e'); // a hanging vine
  armour(g, sym([0, -120, 28, -110, 34, -76, 0, -70]), a.body, a.ink, 1.2); // the carved head
  plate(g, -24, -104, 48, 4, a.dark, 'rgba(20,20,14,0.6)', 0.5);
  for (const gx of [-14, 0, 14]) lens(g, gx, -96, 3.4, '#1a3a30');
}

export const sentinel: HullFn = (ctx, p, s) => {
  const q = liveOf('sentinel', p);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 96, 30 + Math.sin(s.t * 0.8 + side) * 6);
    cachedPart(ctx, 'sentinel-fist', [32, 34], q, JUNGLE_6.sentinel, fist);
    ctx.restore();
  }
  cachedHull(ctx, 'sentinel', p, sentinelHull);
  if (q.mono) return;
  const pulse = 0.5 + Math.sin(s.t * 4) * 0.3;
  glowOf(ctx, q, 0, 24, 34, pulse * 0.6);
  for (const gx of [-14, 0, 14]) {
    glowOf(ctx, q, gx, -96, 8, 0.5 + pulse * 0.3);
    lens(ctx, gx, -96, 2.6, q.glow);
  }
};
