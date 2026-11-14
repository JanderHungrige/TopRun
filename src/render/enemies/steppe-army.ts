import type { Pal, UnitFn } from '../draw-ground-units';
import { circle, ellipse, fillPoly } from '../shapes';

// The alien steppe's invasion army on foot (doc 105), heads down (+y): the crawler scuttling on six legs, the trooper with
// its domed helmet and plasma rifle, the beast rider galloping, the landing pod split open in its crater, the shield
// bearer behind its curved shield with the shimmer of its cover, the bloated brood carrier with crawlers moving under its
// skin. One faction look: violet-grey bio-armour, teal trim, magenta glow. Flashed or as a shadow they keep the outline.

type SteppeArmy = 'crawler' | 'trooper' | 'rider' | 'landingpod' | 'shieldbearer' | 'broodcarrier';

/** Six legs in two tripods that swing in turn: a scuttle. */
function legs6(ctx: CanvasRenderingContext2D, p: Pal, t: number, w: number, len: number, speed: number): void {
  ctx.strokeStyle = p.mono ? p.body : p.dark;
  ctx.lineCap = 'round';
  ctx.lineWidth = 2;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const swing = Math.sin(t * speed + i * 2.1 + (side > 0 ? Math.PI : 0)) * 3;
      const y0 = (i - 1) * w * 0.6;
      ctx.beginPath();
      ctx.moveTo(side * w * 0.5, y0);
      ctx.lineTo(side * (w * 0.5 + len * 0.6), y0 - 2 + swing * 0.4);
      ctx.lineTo(side * (w * 0.5 + len), y0 + (i - 1) * 3 + swing);
      ctx.stroke();
    }
  }
}

const crawler: UnitFn = (ctx, p, t) => {
  legs6(ctx, p, t, 9, 9, 14);
  ellipse(ctx, 0, -2, 7.5, 10, p.mono ? p.body : p.line);
  ellipse(ctx, 0, -2, 6.5, 9, p.body);
  ellipse(ctx, 0, 8, 5, 4.5, p.mono ? p.body : p.dark); // the head
  const bite = Math.sin(t * 9) * 1.2;
  fillPoly(ctx, [-3, 11, -5 - bite, 15, -1.5, 12.5], p.mono ? p.body : p.light); // mandibles
  fillPoly(ctx, [3, 11, 5 + bite, 15, 1.5, 12.5], p.mono ? p.body : p.light);
  if (p.mono) return;
  ctx.fillStyle = p.trim; // a teal stripe down the back
  ctx.fillRect(-1, -10, 2, 13);
  ellipse(ctx, -2, 6, 3, 2, 'rgba(255,255,255,0.18)');
  circle(ctx, -2, 9.5, 1, p.glass);
  circle(ctx, 2, 9.5, 1, p.glass);
};

const trooper: UnitFn = (ctx, p, t, aim) => {
  const step = Math.sin(t * 8) * 3;
  ellipse(ctx, -4, step, 2.6, 4, p.mono ? p.body : p.dark); // the feet stepping
  ellipse(ctx, 4, -step, 2.6, 4, p.mono ? p.body : p.dark);
  ellipse(ctx, 0, 0, 10, 6.5, p.mono ? p.body : p.line); // the shoulders
  ellipse(ctx, 0, 0, 9, 5.5, p.body);
  ctx.save();
  ctx.rotate(aim - Math.PI);
  ctx.fillStyle = p.mono ? p.body : p.dark; // the plasma rifle
  ctx.fillRect(4, 0, 3, 13);
  if (!p.mono) {
    ctx.fillStyle = p.trim;
    ctx.fillRect(4.6, 3, 1.8, 5);
    circle(ctx, 5.5, 13.5, 1.4, p.glass);
  }
  ctx.restore();
  ellipse(ctx, 0, 1, 5.2, 5.2, p.mono ? p.body : p.line); // the domed helmet
  ellipse(ctx, 0, 1, 4.4, 4.4, p.mono ? p.body : p.light);
  if (p.mono) return;
  fillPoly(ctx, [-3.4, 3, 3.4, 3, 2.4, 5.2, -2.4, 5.2], p.glass); // the visor
  ellipse(ctx, -1.5, -0.5, 1.6, 1.1, 'rgba(255,255,255,0.35)');
  ellipse(ctx, -7, 0, 2, 1.6, p.trim); // pauldrons
  ellipse(ctx, 7, 0, 2, 1.6, p.trim);
};

const rider: UnitFn = (ctx, p, t, aim) => {
  const run = t * 11;
  ctx.strokeStyle = p.mono ? p.body : p.dark;
  ctx.lineCap = 'round';
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) for (const side of [-1, 1]) { // six galloping legs
    const g = Math.sin(run + i * 1.4 + (side > 0 ? 0.7 : 0)) * 5;
    const y = -8 + i * 8;
    ctx.beginPath();
    ctx.moveTo(side * 6, y);
    ctx.lineTo(side * 12, y + g);
    ctx.stroke();
  }
  ctx.beginPath(); // the tail
  ctx.moveTo(0, -14);
  ctx.quadraticCurveTo(Math.sin(run) * 4, -20, Math.sin(run + 1) * 3, -25);
  ctx.lineWidth = 2;
  ctx.stroke();
  ellipse(ctx, 0, 0, 9, 16, p.mono ? p.body : p.line); // the beast
  ellipse(ctx, 0, 0, 8, 15, p.mono ? p.body : '#7a6a58');
  ellipse(ctx, 0, 16, 6, 6, p.mono ? p.body : '#5a4c3e'); // its head
  fillPoly(ctx, [-4, 18, -9, 24, -5, 19.5], p.mono ? p.body : '#e8dcc0'); // horns
  fillPoly(ctx, [4, 18, 9, 24, 5, 19.5], p.mono ? p.body : '#e8dcc0');
  if (!p.mono) {
    for (let k = 0; k < 3; k++) ctx.fillRect(-5, -9 + k * 5, 10, 1.2); // its hide's bands
    circle(ctx, -2.5, 19, 0.9, '#ffb03a');
    circle(ctx, 2.5, 19, 0.9, '#ffb03a');
  }
  trooperOnTop(ctx, p, aim);
};

/** The rider sitting on its beast: shoulders, helmet, a lance-rifle pointed at the aim. */
function trooperOnTop(ctx: CanvasRenderingContext2D, p: Pal, aim: number): void {
  ctx.save();
  ctx.rotate(aim - Math.PI);
  ctx.fillStyle = p.mono ? p.body : p.dark;
  ctx.fillRect(3, -2, 2.4, 16);
  if (!p.mono) circle(ctx, 4.2, 14.5, 1.3, p.glass);
  ctx.restore();
  ellipse(ctx, 0, 2, 7, 4.6, p.mono ? p.body : p.line);
  ellipse(ctx, 0, 2, 6, 3.8, p.body);
  ellipse(ctx, 0, 3, 3.8, 3.8, p.mono ? p.body : p.light);
  if (!p.mono) fillPoly(ctx, [-2.4, 4.6, 2.4, 4.6, 1.6, 6.4, -1.6, 6.4], p.glass);
}

const landingpod: UnitFn = (ctx, p, t) => {
  ellipse(ctx, 0, 2, 22, 19, p.mono ? p.body : 'rgba(30,20,14,0.55)'); // the scorched crater
  const open = 0.35 + Math.max(0, Math.sin(t * 0.9)) * 0.2;
  for (let i = 0; i < 4; i++) { // four petals of the shell, split open
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    ctx.save();
    ctx.rotate(a);
    fillPoly(ctx, [-6, 0, 6, 0, 4, 12 + open * 8, -4, 12 + open * 8], p.mono ? p.body : p.line);
    fillPoly(ctx, [-5, 1, 5, 1, 3.2, 11 + open * 8, -3.2, 11 + open * 8], p.body);
    if (!p.mono) ctx.fillRect(-0.6, 3, 1.2, 8 + open * 6);
    ctx.restore();
  }
  ellipse(ctx, 0, 0, 8, 8, p.mono ? p.body : p.dark);
  if (p.mono) return;
  const glow = 0.5 + 0.5 * Math.sin(t * 3);
  ellipse(ctx, 0, 0, 5.5, 5.5, `rgba(255,90,216,${(0.45 + glow * 0.5).toFixed(2)})`);
  circle(ctx, 0, 0, 2.2, '#ffe0f8');
  ctx.strokeStyle = p.trim;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.stroke();
};

const shieldbearer: UnitFn = (ctx, p, t) => {
  if (p.live && !p.mono) { // the shimmer of the cover it throws over the others
    const a = 0.08 + 0.05 * Math.sin(t * 3);
    ctx.strokeStyle = `rgba(90,230,220,${(a * 2).toFixed(3)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 90, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(90,230,220,${a.toFixed(3)})`;
    ctx.fill();
  }
  const step = Math.sin(t * 6) * 2.5;
  ellipse(ctx, -4, -3 + step, 2.6, 3.6, p.mono ? p.body : p.dark);
  ellipse(ctx, 4, -3 - step, 2.6, 3.6, p.mono ? p.body : p.dark);
  ellipse(ctx, 0, -2, 9, 6, p.mono ? p.body : p.line);
  ellipse(ctx, 0, -2, 8, 5, p.body);
  ellipse(ctx, 0, -1, 4.2, 4.2, p.mono ? p.body : p.light);
  ctx.lineWidth = 4; // the curved shield in front
  ctx.strokeStyle = p.mono ? p.body : p.line;
  ctx.beginPath();
  ctx.arc(0, -4, 14, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();
  if (p.mono) return;
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = p.trim;
  ctx.stroke();
  circle(ctx, 0, 10, 1.6, p.glass);
};

const broodcarrier: UnitFn = (ctx, p, t) => {
  legs6(ctx, p, t, 14, 10, 5);
  const swell = 1 + Math.sin(t * 1.8) * 0.05;
  ellipse(ctx, 0, -3, 15 * swell, 18 * swell, p.mono ? p.body : p.line); // the brood sac
  ellipse(ctx, 0, -3, 14 * swell, 17 * swell, p.mono ? p.body : '#8a6a8a');
  ellipse(ctx, 0, 15, 7, 6, p.mono ? p.body : p.dark); // the head
  if (p.mono) return;
  for (let i = 0; i < 5; i++) { // crawlers moving under the skin
    const a = t * 0.8 + i * 1.3;
    ellipse(ctx, Math.cos(a) * 7, -3 + Math.sin(a * 1.3) * 9, 3, 4, 'rgba(60,30,60,0.55)');
  }
  ctx.strokeStyle = 'rgba(255,170,230,0.45)'; // veins
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.quadraticCurveTo((i - 1.5) * 8, 0, (i - 1.5) * 9, -16);
    ctx.stroke();
  }
  circle(ctx, -3, 18, 1.1, p.glass);
  circle(ctx, 3, 18, 1.1, p.glass);
};

export const STEPPE_ARMY: Readonly<Record<SteppeArmy, UnitFn>> = { crawler, trooper, rider, landingpod, shieldbearer, broodcarrier };

/** Their palettes: body, dark, light, trim (teal), glass (the magenta glow). */
export const steppeArmyPals = (pal: (body: string, dark: string, light: string, trim: string, glass?: string) => Pal): Readonly<Record<SteppeArmy, Pal>> => ({
  crawler: pal('#6a5a7a', '#33283e', '#a898b8', '#3ad8c8', '#ff4ad8'),
  trooper: pal('#5a4a6a', '#2a2234', '#9a88b0', '#3ad8c8', '#ff4ad8'),
  rider: pal('#5a4a6a', '#2a2234', '#9a88b0', '#3ad8c8', '#ff4ad8'),
  landingpod: pal('#7a6a8a', '#3a2e46', '#b0a0c0', '#3ad8c8', '#ff4ad8'),
  shieldbearer: pal('#4a5a6a', '#22303a', '#8aa0b0', '#5ae6dc', '#ff4ad8'),
  broodcarrier: pal('#6a4a6a', '#341f34', '#a880a8', '#3ad8c8', '#ff7ae0'),
});
