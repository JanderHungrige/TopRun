import type { Pal, UnitFn } from '../draw-ground-units';
import { eyes, limb, shell, spines } from '../detail/organic';
import { detailUnit } from '../detail/unit';
import { insectWing, quadAt, scaleRows, taper, warts } from './jungle-kit';
import { art, bone, darkHide, hide, trimInk, type JunglePal } from './jungle-pal';
import { SPITTER } from './jungle-plants';

// The jungle planet's creatures in detail (docs 81, 117), heads down (+y): the raptor — a scaled hunter with dark
// chevrons and a crest of quills down its back, small clawed arms, a long snout with yellow eyes, running on two clawed
// legs, its banded tail swaying; the armoured beetle — glossy steel-blue wing cases with gold seams and rows of pits, a
// shield over the thorax, a dark head with compound eyes and antennae, six legs rowing, the gold mandibles biting; the
// giant wasp — a banded abdomen with its sting, a furred thorax, red compound eyes, two pairs of veined wings buzzing.
// The spitter plant is in jungle-plants.ts.

type Ctx = CanvasRenderingContext2D;

function raptorBody(ctx: Ctx, p: JunglePal): void {
  for (const s of [-1, 1]) limb(ctx, [s * 4, 5, s * 6.4, 7.6, s * 5.4, 9.8], 1.2, hide(p)); // the small arms
  const torso = new Path2D();
  torso.ellipse(0, 2, 6, 10, 0, 0, Math.PI * 2);
  shell(ctx, 0, 2, 6, 10, hide(p), 0);
  scaleRows(ctx, torso, -6, -8, 6, 12, 1.6, 'rgba(30,40,10,0.35)');
  ctx.save();
  ctx.clip(torso);
  for (let i = 0; i < 3; i++) { // the dark chevrons across the back
    const y = -3 + i * 4;
    ctx.fillStyle = p.trim;
    ctx.beginPath();
    ctx.moveTo(-6, y + 2.4);
    ctx.quadraticCurveTo(0, y - 2.2, 6, y + 2.4);
    ctx.lineTo(6, y + 3.6);
    ctx.quadraticCurveTo(0, y - 0.4, -6, y + 3.6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(220,240,150,0.3)';
    ctx.lineWidth = 0.35;
    ctx.stroke();
  }
  ctx.restore();
  spines(ctx, [0, -6, -Math.PI / 2, 2.4, 0.6, 0, -2, -Math.PI / 2, 2.2, 0.6, 0, 2, -Math.PI / 2, 2, 0.55, 0, 6, -Math.PI / 2, 1.8, 0.5], hide(p));
  shell(ctx, 0, 13, 4, 6, hide(p), 0); // the head
  shell(ctx, 0, 16.4, 2.5, 3, { ...hide(p), base: p.skin }, 0); // the snout
  ctx.strokeStyle = 'rgba(20,24,8,0.7)';
  ctx.lineWidth = 0.4;
  ctx.beginPath(); // the mouth line
  ctx.moveTo(-2.6, 14.6);
  ctx.quadraticCurveTo(-1.6, 18.6, 0, 19.2);
  ctx.quadraticCurveTo(1.6, 18.6, 2.6, 14.6);
  ctx.stroke();
  warts(ctx, [-0.9, 18.2, 0.35, 0.9, 18.2, 0.35], '#1a1e08', '#3a3e18', 'rgba(0,0,0,0)');
  eyes(ctx, [-2.1, 14.6, 2.1, 14.6], 0.85, p.glow, p.core, true);
}

const RAPTOR = art('raptor', {
  under: (ctx, p, t) => {
    const tail = [0, -4, Math.sin(t * 6) * 6, -14, Math.sin(t * 6 + 1) * 4, -22];
    taper(ctx, tail, 5.6, 0.9, hide(p)); // the tail sways behind, banded
    ctx.strokeStyle = p.trim;
    for (const u of [0.3, 0.5, 0.68, 0.84]) {
      const [x, y, d] = quadAt(tail, u);
      const w = 2.5 * (1 - u * 0.8);
      ctx.lineWidth = 1.1 - u * 0.5;
      ctx.beginPath();
      ctx.moveTo(x - Math.sin(d) * w, y + Math.cos(d) * w);
      ctx.lineTo(x + Math.sin(d) * w, y - Math.cos(d) * w);
      ctx.stroke();
    }
    const run = Math.sin(t * 14) * 4;
    for (const side of [-1, 1]) {
      const fy = 6 + (side < 0 ? run : -run);
      limb(ctx, [side * 4, 0, side * 7.4, fy * 0.4, side * 6, fy], 2.4, { ...hide(p), dark: p.trim });
      spines(ctx, [side * 6, fy, Math.PI / 2, 2, 0.4, side * 6, fy, Math.PI / 2 - side * 0.6, 1.6, 0.35], { ...bone(p), base: p.skin });
    }
  },
  body: raptorBody,
});

function beetleBody(ctx: Ctx, p: JunglePal): void {
  for (const s of [-1, 1]) limb(ctx, [s * 2.6, 18, s * 6.4, 21.4, s * 9, 20.6], 0.5, darkHide(p)); // antennae
  shell(ctx, 0, -1, 14.4, 18.4, hide(p), 0);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, -1, 14.4, 18.4, 0, 0, Math.PI * 2);
  ctx.clip();
  for (const s of [-1, 1]) { // the wing cases: a long gloss each, rows of pits, the gold seam
    ctx.fillStyle = 'rgba(200,230,255,0.22)';
    ctx.beginPath();
    ctx.ellipse(s * 5.2, -6, 3.2, 9, s * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(8,14,20,0.45)';
    for (let r = 0; r < 3; r++) for (let k = 0; k < 7; k++) {
      ctx.beginPath();
      ctx.arc(s * (2.6 + r * 3.4), -14 + k * 3.6 + r * 0.8, 0.42, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  ctx.strokeStyle = p.trim;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(0, -19);
  ctx.lineTo(0, 9);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 0.4;
  ctx.stroke();
  shell(ctx, 0, 9.6, 11, 5.6, hide(p), 0); // the shield over the thorax
  ctx.strokeStyle = p.trim;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.ellipse(0, 9.6, 10.4, 5, 0, Math.PI * 0.05, Math.PI * 0.95);
  ctx.stroke();
  shell(ctx, 0, 14.6, 7.6, 5.6, darkHide(p), 0); // the head
  eyes(ctx, [-5.2, 15.6, 5.2, 15.6], 1.2, '#2a3440', '#9ab8d0');
  eyes(ctx, [-2, 17.4, 2, 17.4], 0.45, p.glow, p.core);
}

const BEETLE = art('beetle', {
  under: (ctx, p, t) => {
    for (let i = 0; i < 3; i++) for (const side of [-1, 1]) {
      const wave = Math.sin(t * 8 + i * 2 + side) * 2;
      const y = -6 + i * 7;
      limb(ctx, [side * 11, y, side * 17, y - 3 + wave * 0.5, side * 21, y - 1 + wave], 1.9, darkHide(p));
      spines(ctx, [side * 21, y - 1 + wave, side > 0 ? 0.3 : Math.PI - 0.3, 1.6, 0.4], darkHide(p));
    }
  },
  body: beetleBody,
  over: (ctx, p, t) => {
    const bite = Math.sin(t * 6) * 0.8;
    for (const side of [-1, 1]) taper(ctx, [side * 3.6, 18, side * (5.6 + bite), 22, side * (1.6 - bite * 0.6), 24.6], 2.2, 0.5, trimInk(p)); // mandibles
  },
});

function waspBody(ctx: Ctx, p: JunglePal): void {
  spines(ctx, [0, -14.6, -Math.PI / 2, 3, 0.55], { ...darkHide(p), base: '#1a1608', light: '#6a6040' }); // the sting
  const abdomen = new Path2D();
  abdomen.ellipse(0, -8, 4.2, 7.4, 0, 0, Math.PI * 2);
  shell(ctx, 0, -8, 4.2, 7.4, hide(p), 0);
  ctx.save();
  ctx.clip(abdomen);
  ctx.fillStyle = p.trim;
  for (let i = 0; i < 3; i++) { // the black bands
    ctx.beginPath();
    ctx.ellipse(0, -12.6 + i * 3.2, 5, 1.1, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.ellipse(-1.6, -10, 1, 3.4, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  shell(ctx, 0, -0.6, 1.2, 1.5, darkHide(p), 0); // the waist
  shell(ctx, 0, 2.2, 3.6, 4, { ...darkHide(p), base: '#3a2e0c' }, 0); // the furred thorax
  ctx.strokeStyle = 'rgba(240,210,120,0.4)';
  ctx.lineWidth = 0.25;
  for (let k = 0; k < 14; k++) {
    const b = (k / 14) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(b) * 3.2, 2.2 + Math.sin(b) * 3.6);
    ctx.lineTo(Math.cos(b) * 4.1, 2.2 + Math.sin(b) * 4.5);
    ctx.stroke();
  }
  for (const s of [-1, 1]) limb(ctx, [s * 1, 10.4, s * 2.6, 12.4, s * 3.6, 12.8], 0.35, darkHide(p)); // antennae
  shell(ctx, 0, 8, 3.1, 3, hide(p), 0);
  for (const s of [-1, 1]) shell(ctx, s * 1.8, 8.5, 1.3, 1.9, { base: p.glow, dark: '#6a0a0a', light: '#ffb0a0', ink: p.ink }, 0);
  spines(ctx, [-0.8, 10.6, Math.PI * 0.4, 1.2, 0.3, 0.8, 10.6, Math.PI * 0.6, 1.2, 0.3], trimInk(p)); // mandibles
}

const WASP = art('wasp', {
  under: (ctx, p, t) => {
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) { // legs held under, twitching
      const k = Math.sin(t * 9 + i + s) * 0.6;
      limb(ctx, [s * 2, 1 + i * 1.6, s * 4.6, i * 2.6 - 1 + k, s * 5.4, i * 3.4 - 2.4 + k], 0.5, darkHide(p));
    }
    const buzz = Math.sin(t * 60) * 0.25;
    for (const side of [-1, 1]) for (const [lift, len, w] of [[0.35, 16, 7.4], [0.75, 12, 5.4]] as const) {
      ctx.save();
      ctx.rotate(-side * (lift + buzz));
      ctx.translate(0, -1);
      ctx.scale(side, 1);
      insectWing(ctx, p, len, w, 0.42);
      ctx.restore();
    }
  },
  body: waspBody,
});

export const JUNGLE_CREATURES: Readonly<Record<'raptor' | 'beetle' | 'spitter' | 'wasp', UnitFn>> = {
  raptor: detailUnit('raptor', RAPTOR),
  beetle: detailUnit('beetle', BEETLE),
  spitter: detailUnit('spitter', SPITTER),
  wasp: detailUnit('wasp', WASP),
};

/** The palettes of the jungle's enemies (doc 81): olive machines with red lamps, the creatures in their own colours. */
export const junglePals = (pal: (body: string, dark: string, light: string, trim: string, glass?: string) => Pal): Readonly<Record<keyof typeof JUNGLE_CREATURES | 'walker' | 'hovertank' | 'artillery' | 'gundrone' | 'dropship' | 'brute', Pal>> => ({
  walker: pal('#6a6a48', '#3a3a26', '#8e8e66', '#4a4a32', '#ff6a3a'),
  hovertank: pal('#7a6a48', '#4a3e28', '#a0906a', '#2c2a20', '#ffb84a'),
  artillery: pal('#6a6e52', '#3e4232', '#8e9270', '#2c2f24'),
  gundrone: pal('#8a8e82', '#4a4e46', '#b4b8ac', '#5a5e56'),
  dropship: pal('#6e7468', '#3c4038', '#9aa094', '#c84a3a', '#7fd0ff'),
  brute: pal('#5a5a3c', '#30301e', '#7e7e58', '#3a3a26', '#ff6a3a'),
  raptor: pal('#7a8a3a', '#4a5a22', '#a8b860', '#3a4a1a'),
  beetle: pal('#3a4a5a', '#1e2a36', '#6a8aa0', '#c8a040'),
  spitter: pal('#c84a7a', '#4a7a2a', '#ff8ab0', '#2e5a1e'),
  wasp: pal('#d8b030', '#5a4a10', '#f0d870', '#2a2a10'),
});
