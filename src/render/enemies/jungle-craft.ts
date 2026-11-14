import { limb, shell } from '../detail/organic';
import { antenna, bolts, cylinder, grille, lens, path, plate, rectPts, sheen } from '../detail/parts';
import { armour, glowOf, wear } from './jungle-kit';
import { art, metal, type JunglePal } from './jungle-pal';

// The jungle planet's flying machines in detail (docs 81, 117), fronts down (+y): the gun drone — four ducted fans on
// struts round an armoured pod with a chin gun and an antenna, the rotors spinning in their wells, its red eye pulsing;
// the dropship — a plated lifting body with a raised spine and troop-bay doors, a framed canopy, engine nacelles with
// intakes, missile pods under the wings, the red tail band, its engines burning and the wingtip lights blinking.

type Ctx = CanvasRenderingContext2D;

const DUCTS = [-9, -9, 9, -9, -9, 9, 9, 9] as const;

function droneBody(g: Ctx, a: JunglePal): void {
  for (let i = 0; i < DUCTS.length; i += 2) limb(g, [0, 0, DUCTS[i] ?? 0, DUCTS[i + 1] ?? 0], 2.2, metal(a)); // the struts
  for (let i = 0; i < DUCTS.length; i += 2) {
    const x = DUCTS[i] ?? 0, y = DUCTS[i + 1] ?? 0;
    shell(g, x, y, 5.6, 5.6, { base: a.dark, dark: '#1a1c18', light: a.light, ink: a.ink }, 0); // the duct ring
    g.fillStyle = '#121410';
    g.beginPath();
    g.arc(x, y, 4.3, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.12)';
    g.lineWidth = 0.4;
    for (let k = 0; k < 3; k++) { // the motor's mounting spokes
      const b = (k / 3) * Math.PI * 2 + 0.5;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(b) * 4.2, y + Math.sin(b) * 4.2);
      g.stroke();
    }
    shell(g, x, y, 1.4, 1.4, metal(a), 0);
    bolts(g, [x - 3.9, y - 3.9 * 0.2, x + 3.9 * 0.2, y - 3.9], 0.3);
  }
  cylinder(g, -0.7, 4, 1.4, 5, a.metal, 'y'); // the chin gun
  shell(g, 0, 0, 6.2, 6.2, { base: a.body, dark: a.dark, light: a.light, ink: a.ink }, 0);
  g.strokeStyle = a.dark;
  g.lineWidth = 0.4;
  g.beginPath(); // panel seams
  g.moveTo(-6, -1);
  g.lineTo(6, -1);
  g.moveTo(0, -6);
  g.lineTo(0, -1);
  g.stroke();
  plate(g, -2.6, 1.2, 5.2, 3.2, a.dark, a.ink, 0.35); // the sensor housing
  bolts(g, [-4, -3.4, 4, -3.4, -4.6, 1, 4.6, 1], 0.3);
  antenna(g, -3, -3.6, 4, -0.4);
  wear(g, [3, -4.4, 4.6, -3.2, -5, 2.6, -4, 4], 0.3);
}

export const GUNDRONE = art('gundrone', {
  body: droneBody,
  over: (ctx, p, t) => {
    if (!p.mono) for (let i = 0; i < DUCTS.length; i += 2) {
      const x = DUCTS[i] ?? 0, y = DUCTS[i + 1] ?? 0;
      const b = t * 40 + i;
      ctx.fillStyle = 'rgba(210,220,210,0.16)'; // the blur of the blades
      ctx.beginPath();
      ctx.arc(x, y, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(200,206,196,0.85)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(b) * 4, y + Math.sin(b) * 4);
      ctx.lineTo(x - Math.cos(b) * 4, y - Math.sin(b) * 4);
      ctx.stroke();
      ctx.fillStyle = p.metal;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
    if (p.mono) return;
    glowOf(ctx, p, 0, 2.8, 4.5, 0.4 + 0.3 * Math.sin(t * 6));
    lens(ctx, 0, 2.8, 1.3, p.glow);
  },
});

const DROP = [0, 30, 16, 12, 30, 4, 30, -12, 14, -16, 10, -30, -10, -30, -14, -16, -30, -12, -30, 4, -16, 12];

function dropshipBody(g: Ctx, a: JunglePal): void {
  for (const s of [-1, 1]) armour(g, [s * 8, -27, s * 13, -33, s * 15, -31, s * 12, -24], a.dark, a.ink, 0.5); // tail fins
  armour(g, DROP, a.body, a.ink, 0.9);
  g.strokeStyle = 'rgba(0,0,0,0.3)';
  g.lineWidth = 0.5;
  for (const s of [-1, 1]) { // wing panel seams
    g.beginPath();
    g.moveTo(s * 9, 8);
    g.lineTo(s * 28, -1);
    g.moveTo(s * 9, -4);
    g.lineTo(s * 29, -8);
    g.moveTo(s * 18, -12);
    g.lineTo(s * 16, 9);
    g.stroke();
  }
  const spine = [0, 27, 8, 12, 9.5, -26, -9.5, -26, -8, 12];
  armour(g, spine, a.light, a.ink, 0.6);
  sheen(g, path(spine), -9, 0, 9, 0, 0.8);
  armour(g, [-5.6, -21, 5.6, -21, 5.6, 2, -5.6, 2], a.body, a.ink, 0.45); // the troop-bay doors
  g.strokeStyle = 'rgba(0,0,0,0.4)';
  g.beginPath();
  g.moveTo(0, -21);
  g.lineTo(0, 2);
  g.stroke();
  bolts(g, [-4.6, -20, 4.6, -20, -4.6, 1, 4.6, 1, -7, 8, 7, 8, -8, -24, 8, -24], 0.4);
  for (const s of [-1, 1]) {
    armour(g, [s * 18, -13, s * 26, -13, s * 26, 2, s * 18, 2], a.dark, a.ink, 0.6); // nacelles
    grille(g, s * 22 - 3, -1.4, 6, 3, 4, 'y'); // intakes
    plate(g, s * 22 - 3.4, -16, 6.8, 3, '#22241e', a.ink, 0.4); // nozzles
    armour(g, rectPts(s * 13 - 1.6, -3, 3.2, 9), a.metal, a.ink, 0.4); // missile pods
    for (const y of [3, 5]) plate(g, s * 13 - 1, y, 2, 1.2, '#c8312a', a.ink, 0.2);
  }
  plate(g, -8, -28, 16, 4, a.trim, a.ink, 0.4); // the red tail band
  const canopy = [0, 21, 5, 17.6, 6, 9, -6, 9, -5, 17.6];
  armour(g, canopy, a.glass, a.ink, 0.6);
  g.strokeStyle = 'rgba(20,30,40,0.7)';
  g.lineWidth = 0.6;
  g.beginPath(); // the canopy frame
  g.moveTo(-5.6, 13.5);
  g.lineTo(5.6, 13.5);
  g.moveTo(0, 9);
  g.lineTo(0, 21);
  g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.45)';
  g.fillRect(-4.4, 10, 3, 1.2);
  wear(g, [-24, -6, -21, -5, 20, 2, 23, 1.2, -3, 22, -1, 24, 26, -9, 28.6, -10]);
}

export const DROPSHIP = art('dropship', {
  under: (ctx, p, t) => {
    if (p.mono) return;
    for (const s of [-1, 1]) { // the engines' exhaust
      const f = 0.8 + 0.2 * Math.sin(t * 30 + s);
      glowOf(ctx, p, s * 22, -18, 9 * f, 0.45);
      ctx.fillStyle = 'rgba(255,200,120,0.55)';
      ctx.beginPath();
      ctx.moveTo(s * 22 - 2.8, -16);
      ctx.lineTo(s * 22, -16 - 9 * f);
      ctx.lineTo(s * 22 + 2.8, -16);
      ctx.fill();
    }
  },
  body: dropshipBody,
  over: (ctx, p, t) => {
    if (p.mono) return;
    for (const s of [-1, 1]) {
      ctx.fillStyle = p.glow;
      ctx.beginPath();
      ctx.arc(s * 22, -14, 3 + Math.sin(t * 30) * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.core;
      ctx.beginPath();
      ctx.arc(s * 22, -14, 1.4, 0, Math.PI * 2);
      ctx.fill();
      if (Math.sin(t * 5 + s) > 0.4) glowOf(ctx, p, s * 29.4, -4, 3.4, 0.9, '#ff3a2a'); // wingtip lights
    }
  },
});
