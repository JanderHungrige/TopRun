import type { Pal, UnitFn } from '../draw-ground-units';
import { eyes, limb, membrane, plateShell, shell, spines } from '../detail/organic';
import { path, type Pts } from '../detail/parts';
import { detailUnit } from '../detail/unit';
import { BALLOON, SKYJELLY } from './jungle-floaters';
import { fang, glowOf, insectWing, taper } from './jungle-kit';
import { art, bone, darkHide, hide, trimInk, type JunglePal } from './jungle-pal';

// The jungle planet's flying aliens in detail (docs 96, 117), heads down (+y): the glider ray — wide ribbed wings
// beating round a dark plated body with gill slits, horn-like cephalic fins and teal eyes, glowing spots riding the
// wings, its whip tail swaying; the leatherwing — a furred body with a long beak and a crest, leathery wings on finger
// bones with a wrist claw, flapping; the giant dragonfly — a banded abdomen with claspers, a striped thorax, huge red
// compound eyes, four veined wings buzzing. The spore balloon and the sky jelly are in jungle-floaters.ts.

type Ctx = CanvasRenderingContext2D;

/** A wing membrane over its ribs; a plain shape in a one-colour pass. */
function skinWing(ctx: Ctx, p: JunglePal, outline: Pts, rootX: number, rootY: number, ribs: Pts, c = hide(p)): void {
  if (p.mono) {
    ctx.fillStyle = p.body;
    ctx.fill(path(outline));
    return;
  }
  membrane(ctx, outline, rootX, rootY, ribs, c, p.skin);
}

function gliderWings(ctx: Ctx, p: JunglePal, t: number): void {
  const beat = Math.sin(t * 3.2) * 4;
  taper(ctx, [0, -10, Math.sin(t * 2.5) * 5, -22, Math.sin(t * 2.5 + 1) * 3, -32], 2.8, 0.5, darkHide(p)); // the whip tail
  for (const s of [-1, 1]) {
    const wing = [0, 12, 10, 6, 26, -2 + beat, 22, -6 + beat * 0.6, 8, -10, 0, -12].map((v, i) => (i % 2 ? v : v * s));
    skinWing(ctx, p, wing, s * 4, 0, [s * 25, -2 + beat, s * 22, -5.4 + beat * 0.6, s * 16, -6 + beat * 0.4, s * 18, 1.6 + beat * 0.5], { ...hide(p), base: p.light });
    if (p.mono) continue;
    for (let i = 0; i < 3; i++) { // the glowing spots
      const x = s * (9 + i * 4), y = 2 - i * 1.5 + beat * (i / 4);
      glowOf(ctx, p, x, y, 3, 0.5);
      ctx.fillStyle = p.glow;
      ctx.beginPath();
      ctx.arc(x, y, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function gliderBody(ctx: Ctx, p: JunglePal): void {
  for (const s of [-1, 1]) plateShell(ctx, [0, 10.6, s * 9.4, 5.6, s * 10.4, 0, s * 8, -9.6, 0, -11.4], hide(p), 0.5); // wing roots
  for (const s of [-1, 1]) spines(ctx, [s * 3.4, 10, Math.PI / 2 - s * 0.25, 4.6, 1.2], trimInk(p)); // the cephalic fins
  shell(ctx, 0, 2, 6, 10, darkHide(p), 4);
  shell(ctx, 0, 0, 2.5, 6, { ...hide(p), base: p.light, light: '#d8f4fa' }, 2); // the light stripe
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 0.4;
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { // gill slits
    ctx.beginPath();
    ctx.moveTo(s * 3.6, 4 + k * 1.6);
    ctx.lineTo(s * 5, 3.6 + k * 1.6);
    ctx.stroke();
  }
  eyes(ctx, [-3.4, 9.4, 3.4, 9.4], 0.75, p.glow, p.core, true);
}

const GLIDER = art('glider', { under: gliderWings, body: gliderBody });

function leatherWings(ctx: Ctx, p: JunglePal, t: number): void {
  const tipY = -6 + Math.sin(t * 7) * 6;
  for (const s of [-1, 1]) { // the arm along the leading edge, the membrane trailing behind on its finger bones
    const wx = s * 10.5, wy = tipY * 0.4 + 3.6;
    const wing = [s * 3, 4, wx, wy, s * 22, tipY + 1, s * 19, tipY - 5, s * 15, tipY - 3.4, s * 11, tipY - 8, s * 6, -6, s * 3, -5];
    skinWing(ctx, p, wing, wx, wy, [s * 19, tipY - 5, s * 15, tipY - 3.4, s * 11, tipY - 8], { ...hide(p), base: p.dark });
    limb(ctx, [s * 3, 3, wx, wy, s * 22, tipY + 1], 1.3, hide(p));
    fang(ctx, wx, wy, Math.PI / 2 + s * 0.4, 2.6, 0.6, bone(p)); // the wrist claw
  }
}

function leatherBody(ctx: Ctx, p: JunglePal): void {
  fang(ctx, 0, -4.6, -Math.PI / 2, 11.4, 1.6, { ...bone(p), base: p.trim }); // the crest
  fang(ctx, 0, 7.4, Math.PI / 2, 11, 2, { ...bone(p), base: p.trim }); // the beak
  ctx.strokeStyle = 'rgba(40,24,12,0.6)';
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  ctx.moveTo(0, 9);
  ctx.lineTo(0, 17.6);
  ctx.stroke();
  shell(ctx, 0, 0, 4, 9, { ...hide(p), base: p.light, light: '#f4e0c8' }, 3);
  ctx.strokeStyle = 'rgba(90,60,40,0.5)';
  for (let k = 0; k < 12; k++) { // fur
    const y = -7 + k * 1.2, x = (k % 2 ? 1 : -1) * (1 + (k % 3));
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x * 1.2, y - 1.4);
    ctx.stroke();
  }
  shell(ctx, 0, 5.6, 3, 3.4, hide(p), 0); // the head
  eyes(ctx, [-1.8, 6.2, 1.8, 6.2], 0.75, p.glow, p.core, true);
}

const LEATHERWING = art('leatherwing', { under: leatherWings, body: leatherBody });

function dragonWings(ctx: Ctx, p: JunglePal, t: number): void {
  const buzz = Math.sin(t * 70) * 0.2;
  for (const [y, len, off] of [[3, 13, 0.15], [-2, 12, -0.25]] as const) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(0, y);
      ctx.rotate(side * (Math.PI / 2 + off + buzz) + Math.PI / 2);
      if (side < 0) ctx.scale(1, -1);
      insectWing(ctx, p, len * 1.1, 4.6, 0.45);
      ctx.restore();
    }
  }
}

function dragonBody(ctx: Ctx, p: JunglePal): void {
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) limb(ctx, [s * 1.6, 1.6 + i * 1.6, s * 3.6, 2.6 + i * 2, s * 4.2, 4.4 + i * 2.2], 0.4, darkHide(p)); // legs
  spines(ctx, [-0.5, -19.4, -Math.PI / 2 - 0.3, 1.6, 0.35, 0.5, -19.4, -Math.PI / 2 + 0.3, 1.6, 0.35], trimInk(p)); // claspers
  for (let i = 5; i >= 0; i--) { // the abdomen, banded
    shell(ctx, 0, -4 - i * 3, 1.9 - i * 0.12, 1.9, i % 2 ? hide(p) : darkHide(p), 0);
    ctx.fillStyle = p.trim;
    ctx.fillRect(-0.9 + i * 0.06, -5.4 - i * 3, 1.8 - i * 0.12, 0.45);
  }
  shell(ctx, 0, -20, 1, 1, trimInk(p), 0);
  shell(ctx, 0, 3, 3, 4, hide(p), 0); // the thorax
  shell(ctx, 0, 3, 1.2, 3, { ...hide(p), base: p.light }, 0);
  for (const s of [-1, 1]) { // the compound eyes
    shell(ctx, s * 2.2, 7, 2.3, 2.3, { base: p.glow, dark: '#6a1408', light: '#ffc0a8', ink: p.ink }, 0);
    ctx.fillStyle = 'rgba(80,10,0,0.35)';
    for (let k = 0; k < 4; k++) ctx.fillRect(s * 2.2 - 1.2 + k * 0.7, 6.2, 0.3, 1.8);
  }
}

const DRAGONFLY = art('dragonfly', { under: dragonWings, body: dragonBody });

export const ALIEN_AIR: Readonly<Record<'glider' | 'leatherwing' | 'dragonfly' | 'balloon' | 'skyjelly', UnitFn>> = {
  glider: detailUnit('glider', GLIDER),
  leatherwing: detailUnit('leatherwing', LEATHERWING),
  dragonfly: detailUnit('dragonfly', DRAGONFLY),
  balloon: detailUnit('balloon', BALLOON),
  skyjelly: detailUnit('skyjelly', SKYJELLY),
};

/** Their palettes: body, dark, light, trim, glass (the glow — spots, eyes, spores); the art reads mono / live. */
export const alienAirPals = (pal: (body: string, dark: string, light: string, trim: string, glass?: string) => Pal): Readonly<Record<keyof typeof ALIEN_AIR, Pal>> => ({
  glider: pal('#3a6a7a', '#1e3a44', '#7ab0c0', '#2a4a54', '#7affe8'),
  leatherwing: pal('#8a5a3a', '#4a2e1c', '#c8a080', '#e8d0a0', '#ffd23a'),
  dragonfly: pal('#2a8a6a', '#145040', '#7ae0b8', '#e8c040', '#ff5a3a'),
  balloon: pal('#b8a060', '#6a5a30', '#e8d8a0', '#8a6a3a', '#c8ff5a'),
  skyjelly: pal('#f0a8d8', '#a85090', '#ffe0f4', '#ff7ad2', '#aafffa'),
});
