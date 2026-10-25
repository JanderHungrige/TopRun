import { TAU } from '../../core/math';
import { horizon, projectDir, v3, VIEW, type Cam } from './landing-view';

// Carrier Landing night (doc 18): dark sky with seeded twinkling stars, a crescent moon and its glitter path on
// a black sea, a faint horizon haze. Everything here sits at infinity, so only the camera's rotation matters.

const RAD = Math.PI / 180;
const hash = (n: number): number => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

const dirOf = (az: number, el: number): { x: number; y: number; z: number } =>
  v3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));

const STARS = Array.from({ length: 260 }, (_, i) => {
  const el = (1.5 + 70 * hash(i * 3 + 1) ** 1.6) * RAD;
  const az = (hash(i * 3 + 2) - 0.5) * 150 * RAD;
  const mag = hash(i * 3 + 3);
  return { d: dirOf(az, el), r: 0.5 + mag ** 3 * 1.5, a: 0.25 + 0.75 * mag, tw: 1.5 + hash(i * 7) * 4, ph: hash(i * 11) * TAU, warm: hash(i * 13) > 0.85 };
});
const MOON = dirOf(-34 * RAD, 21 * RAD);

/** Rotates the canvas so the horizon is level at (x, y): callers draw with the horizon at y. */
function levelled(ctx: CanvasRenderingContext2D, cam: Cam, draw: (hy: number, hx: number) => void): void {
  const h = horizon(cam);
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.rotate(h.angle);
  ctx.translate(-h.x, -h.y);
  draw(h.y, h.x);
  ctx.restore();
}

function drawSkyAndSea(ctx: CanvasRenderingContext2D, hy: number): void {
  const sky = ctx.createLinearGradient(0, hy - 520, 0, hy);
  sky.addColorStop(0, '#010309');
  sky.addColorStop(0.7, '#050c1a');
  sky.addColorStop(1, '#0f1d33');
  ctx.fillStyle = sky;
  ctx.fillRect(-500, hy - 1500, 2280, 1500);
  const sea = ctx.createLinearGradient(0, hy, 0, hy + 420);
  sea.addColorStop(0, '#0b1626');
  sea.addColorStop(0.12, '#060d18');
  sea.addColorStop(1, '#010205');
  ctx.fillStyle = sea;
  ctx.fillRect(-500, hy, 2280, 1500);
  const haze = ctx.createLinearGradient(0, hy - 26, 0, hy + 10);
  haze.addColorStop(0, 'rgba(70,96,130,0)');
  haze.addColorStop(0.75, 'rgba(70,96,130,0.32)');
  haze.addColorStop(1, 'rgba(70,96,130,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(-500, hy - 26, 2280, 36);
}

function drawStars(ctx: CanvasRenderingContext2D, cam: Cam, t: number): void {
  for (const s of STARS) {
    const p = projectDir(cam, s.d);
    if (!p || p.x < -10 || p.x > 1290 || p.y < -10 || p.y > 730) continue;
    const tw = 0.7 + 0.3 * Math.sin(t * s.tw + s.ph);
    ctx.globalAlpha = s.a * tw;
    ctx.fillStyle = s.warm ? '#ffe2c0' : '#dbe6ff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, s.r, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawMoon(ctx: CanvasRenderingContext2D, cam: Cam, roll: number): boolean {
  const p = projectDir(cam, MOON);
  if (!p) return false;
  const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 120);
  glow.addColorStop(0, 'rgba(210,222,240,0.22)');
  glow.addColorStop(1, 'rgba(210,222,240,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(p.x - 120, p.y - 120, 240, 240);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(-roll - 0.5);
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, TAU);
  ctx.arc(5.5, -2, 11.5, 0, TAU, true);
  ctx.fillStyle = '#eef2f8';
  ctx.fill('evenodd');
  ctx.restore();
  return true;
}

/** The moon's reflection: a shimmering column of glints from the horizon towards the jet. */
function drawGlitter(ctx: CanvasRenderingContext2D, hy: number, mx: number, t: number): void {
  const band = ctx.createLinearGradient(0, hy, 0, hy + 260);
  band.addColorStop(0, 'rgba(160,180,210,0.08)');
  band.addColorStop(1, 'rgba(160,180,210,0)');
  ctx.fillStyle = band;
  ctx.beginPath();
  ctx.moveTo(mx - 12, hy);
  ctx.lineTo(mx + 12, hy);
  ctx.lineTo(mx + 90, hy + 260);
  ctx.lineTo(mx - 90, hy + 260);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c9d6ea';
  for (let i = 0; i < 70; i++) {
    const u = hash(i * 5 + 1) ** 1.7;
    const y = hy + 2 + u * 250;
    const x = mx + (hash(i * 5 + 2) - 0.5) * (30 + u * 240);
    const a = Math.max(0, Math.sin(t * (2 + hash(i) * 5) + hash(i * 9) * TAU)) * (0.7 - u * 0.5);
    if (a <= 0.02) continue;
    ctx.globalAlpha = a;
    ctx.fillRect(x - 1 - u * 3, y, 2 + u * 6, 1 + u);
  }
  ctx.globalAlpha = 1;
}

/** Sky, stars, moon, sea and the moon's glitter for this camera. */
export function drawNight(ctx: CanvasRenderingContext2D, cam: Cam, t: number): void {
  ctx.fillStyle = '#010205';
  ctx.fillRect(0, 0, 1280, 720);
  levelled(ctx, cam, (hy) => drawSkyAndSea(ctx, hy));
  drawStars(ctx, cam, t);
  if (!drawMoon(ctx, cam, cam.roll)) return;
  // in the levelled frame a point sits where the un-rolled camera sees it, shifted with the horizon
  const flat = projectDir({ ...cam, roll: 0 }, MOON);
  if (flat) levelled(ctx, cam, (hy, hx) => drawGlitter(ctx, hy, flat.x + hx - VIEW.cx, t));
}
