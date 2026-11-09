import type { Pal, UnitFn } from '../draw-ground-units';
import { circle, ellipse, fillPoly } from '../shapes';

// The jungle planet's rooted and heavy aliens (doc 96), heads down (+y): the spore pod breathing on its roots, the lasher
// vine whipping its tendrils round a toothed maw, the armoured rhino crawler at a run, the acid toad with its glowing
// throat, the brood spire's vents and larvae, the crystal totem on its carved stone, the swamp lurker's eyes over the
// water. Flashed or as a shadow they keep the outline (`p.mono` skips the details).

type AlienGround = 'sporepod' | 'lasher' | 'rhino' | 'toad' | 'spire' | 'totem' | 'lurker';

function roots(ctx: CanvasRenderingContext2D, p: Pal, n: number, len: number, t: number): void {
  ctx.strokeStyle = p.mono ? p.body : p.dark;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.3;
    const w = Math.sin(t * 0.8 + i) * 0.08;
    ctx.lineWidth = 3 - (i % 2);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6);
    ctx.quadraticCurveTo(Math.cos(a + 0.4) * len * 0.6, Math.sin(a + 0.4) * len * 0.6, Math.cos(a + w) * len, Math.sin(a + w) * len);
    ctx.stroke();
  }
}

const sporepod: UnitFn = (ctx, p, t) => {
  roots(ctx, p, 7, 19, t);
  const breathe = 1 + Math.sin(t * 2.4) * 0.07;
  for (const [x, y, r] of [[-8, -4, 6], [8, -5, 5.5], [-6, 8, 5], [7, 7, 5.5]] as const) {
    ellipse(ctx, x, y, r * breathe + 1, r * breathe + 1, p.mono ? p.body : p.line);
    ellipse(ctx, x, y, r * breathe, r * breathe, p.dark);
    if (!p.mono) ellipse(ctx, x - 1.5, y - 1.5, r * 0.45, r * 0.35, p.light);
  }
  ellipse(ctx, 0, 0, 10 * breathe + 1, 11 * breathe + 1, p.mono ? p.body : p.line);
  ellipse(ctx, 0, 0, 10 * breathe, 11 * breathe, p.body);
  if (p.mono) return;
  ctx.strokeStyle = p.trim;
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) { // veins
    const a = (i / 5) * Math.PI * 2 + 0.6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 3, Math.sin(a) * 3);
    ctx.lineTo(Math.cos(a + 0.2) * 9 * breathe, Math.sin(a + 0.2) * 10 * breathe);
    ctx.stroke();
  }
  const glow = 0.5 + 0.5 * Math.sin(t * 2.4 + 1);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    circle(ctx, Math.cos(a) * 5.5, Math.sin(a) * 6, 1.3, `rgba(220,255,120,${(0.4 + glow * 0.6).toFixed(2)})`);
  }
  circle(ctx, 0, 0, 2.6, p.glass);
};

const lasher: UnitFn = (ctx, p, t, aim) => {
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.sin(t * 2.2 + i * 1.7) * 0.5;
    const tip = 22 + Math.sin(t * 3.1 + i) * 4;
    ctx.strokeStyle = p.mono ? p.body : p.dark;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.cos(a + 0.7) * tip * 0.7, Math.sin(a + 0.7) * tip * 0.7, Math.cos(a) * tip, Math.sin(a) * tip);
    ctx.stroke();
    if (p.mono) continue;
    ctx.strokeStyle = p.body;
    ctx.lineWidth = 2;
    ctx.stroke();
    for (let k = 1; k <= 3; k++) circle(ctx, Math.cos(a + 0.3) * tip * k * 0.28, Math.sin(a + 0.3) * tip * k * 0.28, 0.9, p.light); // thorns
  }
  ellipse(ctx, 0, 0, 11, 11, p.mono ? p.body : p.line);
  ellipse(ctx, 0, 0, 10, 10, p.body);
  ctx.save();
  ctx.rotate(aim - Math.PI);
  const open = 2.5 + Math.max(0, Math.sin(t * 3)) * 3;
  ellipse(ctx, 0, 4, 6, open, p.mono ? p.body : '#2a0c14');
  if (!p.mono) for (let k = -2; k <= 2; k++) fillPoly(ctx, [k * 2.2 - 0.8, 4 - open, k * 2.2 + 0.8, 4 - open, k * 2.2, 4 - open + 2.2], '#f4ead0');
  ctx.restore();
  if (!p.mono) ellipse(ctx, -3, -5, 3, 2, p.light);
};

const rhino: UnitFn = (ctx, p, t) => {
  const run = Math.sin(t * 12) * 3;
  ctx.fillStyle = p.mono ? p.body : p.dark;
  for (const [x, y, s] of [[-12, -8, 1], [12, -8, -1], [-12, 9, -1], [12, 9, 1]] as const) ellipse(ctx, x, y + run * s, 4, 6, p.mono ? p.body : p.dark);
  ellipse(ctx, 0, 0, 15, 22, p.mono ? p.body : p.line);
  ellipse(ctx, 0, 0, 14, 21, p.body);
  ellipse(ctx, 0, 18, 8, 7, p.mono ? p.body : p.dark); // the head
  fillPoly(ctx, [-3, 22, 3, 22, 0, 33], p.mono ? p.body : '#e8dcc0'); // the horn
  if (p.mono) return;
  for (let i = 0; i < 4; i++) { // armour plates
    const y = -16 + i * 8;
    ellipse(ctx, 0, y, 13 - Math.abs(i - 1.5) * 1.5, 4.5, i % 2 ? p.light : p.trim);
    ctx.strokeStyle = p.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, y, 13 - Math.abs(i - 1.5) * 1.5, 4.5, 0, 0, Math.PI);
    ctx.stroke();
  }
  for (const side of [-1, 1]) {
    fillPoly(ctx, [side * 13, -4, side * 18, -9, side * 14, 2], p.trim); // spikes
    circle(ctx, side * 4, 21, 1.4, p.glass);
  }
  ctx.strokeStyle = '#c8b898';
  ctx.lineWidth = 1;
  ctx.beginPath(); // scratches
  ctx.moveTo(-6, -2);
  ctx.lineTo(4, 3);
  ctx.stroke();
};

const toad: UnitFn = (ctx, p, t) => {
  const hop = Math.abs(Math.sin(t * 2.2));
  const s = 1 + hop * 0.12;
  for (const side of [-1, 1]) {
    ellipse(ctx, side * 13, -8 - hop * 3, 6, 9, p.mono ? p.body : p.dark, side * 0.5); // the hind legs
    ellipse(ctx, side * 11, 9, 3, 5, p.mono ? p.body : p.dark, -side * 0.4);
  }
  ellipse(ctx, 0, 0, 15 * s, 13 * s, p.mono ? p.body : p.line);
  ellipse(ctx, 0, 0, 14 * s, 12 * s, p.body);
  if (p.mono) return;
  for (const [x, y, r] of [[-6, -4, 2], [5, -6, 1.6], [8, 2, 1.4], [-9, 3, 1.5], [1, -9, 1.2], [-2, 4, 1]] as const) circle(ctx, x, y, r, p.light); // warts
  const sac = 3 + (0.5 + 0.5 * Math.sin(t * 5)) * 3;
  ellipse(ctx, 0, 10, sac + 1, sac * 0.8 + 1, p.line);
  ellipse(ctx, 0, 10, sac, sac * 0.8, p.glass);
  ellipse(ctx, -1, 9, sac * 0.4, sac * 0.3, 'rgba(240,255,200,0.6)');
  for (const side of [-1, 1]) {
    circle(ctx, side * 6, 7, 2.6, p.trim);
    circle(ctx, side * 6, 7.5, 1.3, '#101008');
  }
};

const spire: UnitFn = (ctx, p, t) => {
  for (let i = 0; i < 6; i++) { // larvae crawling round the foot
    const a = t * 0.7 + (i / 6) * Math.PI * 2;
    ellipse(ctx, Math.cos(a) * 20, Math.sin(a) * 20, 2.6, 1.6, p.mono ? p.body : p.light, a + Math.PI / 2);
  }
  for (const [r, c] of [[19, p.line], [18, p.dark], [14, p.body], [10, p.trim], [6, p.dark]] as const) ellipse(ctx, 0, 0, r, r, p.mono ? p.body : c);
  if (p.mono) return;
  ctx.strokeStyle = p.line;
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) { // the chitin ribs
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6);
    ctx.lineTo(Math.cos(a) * 18, Math.sin(a) * 18);
    ctx.stroke();
  }
  for (let i = 0; i < 4; i++) { // vents breathing
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const g = 0.4 + 0.6 * Math.max(0, Math.sin(t * 2 + i * 1.6));
    circle(ctx, Math.cos(a) * 12, Math.sin(a) * 12, 2.4, '#1a0812');
    circle(ctx, Math.cos(a) * 12, Math.sin(a) * 12, 1.4, `rgba(255,120,210,${g.toFixed(2)})`);
  }
  circle(ctx, 0, 0, 3, p.glass);
};

const totem: UnitFn = (ctx, p, t) => {
  fillPoly(ctx, [-17, -17, 17, -17, 17, 17, -17, 17], p.mono ? p.body : p.line);
  fillPoly(ctx, [-16, -16, 16, -16, 16, 16, -16, 16], p.mono ? p.body : p.dark);
  fillPoly(ctx, [-12, -12, 12, -12, 12, 12, -12, 12], p.mono ? p.body : p.body);
  if (!p.mono) {
    for (let i = -1; i <= 1; i++) for (const s of [-1, 1]) { // carved glyph notches
      fillPoly(ctx, [i * 7 - 2, s * 14, i * 7 + 2, s * 14, i * 7, s * 12], p.light);
      fillPoly(ctx, [s * 14, i * 7 - 2, s * 14, i * 7 + 2, s * 12, i * 7], p.light);
    }
    ellipse(ctx, 6, 9, 4, 2, 'rgba(70,110,40,0.7)'); // moss
  }
  ctx.save();
  ctx.rotate(t * 0.9);
  fillPoly(ctx, [0, -11, 7, 0, 0, 11, -7, 0], p.mono ? p.body : p.trim);
  if (!p.mono) {
    fillPoly(ctx, [0, -11, 7, 0, 0, 0], p.glass);
    fillPoly(ctx, [0, 11, -7, 0, 0, 0], 'rgba(255,255,255,0.35)');
  }
  ctx.restore();
  if (!p.mono) circle(ctx, 0, 0, 2 + Math.sin(t * 4) * 0.6, '#ffffff');
};

const lurker: UnitFn = (ctx, p, t) => {
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
  ellipse(ctx, 0, -2, 15, 18, p.mono ? p.body : p.dark); // the back under the water
  if (!p.mono) for (let i = 0; i < 4; i++) fillPoly(ctx, [-3, -14 + i * 6, 3, -14 + i * 6, 0, -19 + i * 6 - rise * 2], p.trim); // the ridge
  ctx.restore();
  for (const side of [-1, 1]) {
    ellipse(ctx, side * 6, 12, 5.5, 4.5, p.mono ? p.body : p.body);
    if (p.mono) continue;
    const blink = (t * 0.7 + side * 0.13) % 3 < 0.12 ? 0.3 : 1;
    ellipse(ctx, side * 6, 12, 4, 3.2 * blink, p.glass);
    ellipse(ctx, side * 6, 12, 0.9, 2.6 * blink, '#120a04'); // the slit pupils
  }
};

export const ALIEN_GROUND: Readonly<Record<AlienGround, UnitFn>> = { sporepod, lasher, rhino, toad, spire, totem, lurker };

/** Their palettes: body, dark, light, trim, glass (the glow — spores, eyes, crystal, acid). */
export const alienGroundPals = (pal: (body: string, dark: string, light: string, trim: string, glass?: string) => Pal): Readonly<Record<AlienGround, Pal>> => ({
  sporepod: pal('#8a6a9a', '#4a3456', '#c8a8d8', '#d8b0e8', '#e8ff7a'),
  lasher: pal('#5a8a3a', '#2a4a1a', '#a8d080', '#c8312a'),
  rhino: pal('#6a6058', '#3a332e', '#9a9088', '#4a443e', '#ff5a3a'),
  toad: pal('#5a7a3a', '#33461e', '#a8c070', '#d8c040', '#9aff3a'),
  spire: pal('#7a4a6a', '#3e2234', '#c890b0', '#5a3048', '#ff8ad8'),
  totem: pal('#8a8670', '#4e4c3e', '#c8c4a8', '#4ad8ff', '#a8f4ff'),
  lurker: pal('#4a5a48', '#26302a', '#7a8a72', '#5a6a40', '#e8d040'),
});
