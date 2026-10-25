import { TAU } from '../../core/math';
import type { Vec3 } from '../../game/minigames/refuel-air';

// Air Refuelling camera (doc 15): the pilot's eye sits behind, left of and above the probe tip and looks
// straight ahead, so every tanker-frame point projects with a plain pinhole. Sky and cloud deck below.

export const VIEW = Object.freeze({ f: 900, cx: 640, cy: 360, eyeX: -0.7, eyeY: 0.75, eyeZ: -4 });

/** Eye position in the tanker frame. */
export interface Cam {
  x: number;
  y: number;
  z: number;
}

/** A projected point and the scale there (px per metre). */
export interface Pt {
  x: number;
  y: number;
  s: number;
}

export const camFor = (probe: Vec3): Cam => ({ x: probe.x + VIEW.eyeX, y: probe.y + VIEW.eyeY, z: probe.z + VIEW.eyeZ });

export function project(cam: Cam, p: Vec3): Pt {
  const s = VIEW.f / Math.max(0.2, p.z - cam.z);
  return { x: VIEW.cx + (p.x - cam.x) * s, y: VIEW.cy - (p.y - cam.y) * s, s };
}

export const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

/** The probe tip is fixed in the view. */
export const PROBE_TIP: Pt = Object.freeze({
  x: VIEW.cx - (VIEW.eyeX * VIEW.f) / -VIEW.eyeZ,
  y: VIEW.cy + (VIEW.eyeY * VIEW.f) / -VIEW.eyeZ,
  s: VIEW.f / -VIEW.eyeZ,
});

/** Cloud deck: puffs on a layer 900 m below, streaming towards us at 130 m/s. */
const DECK = { below: 900, speed: 130, near: 1500, depth: 9000 };
const PUFFS = Array.from({ length: 64 }, (_, i) => {
  const h = (n: number): number => {
    const v = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  return { x: (h(1) - 0.5) * 9000, z: h(2) * DECK.depth, r: 110 + h(3) * 140, lobes: 2 + Math.floor(h(4) * 3) };
});

function drawPuff(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, lobes: number, a: number): void {
  ctx.globalAlpha = a * 0.55;
  ctx.fillStyle = '#9fb3c6';
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.16, r * 1.05, r * 0.2, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = a;
  ctx.fillStyle = '#f7fafc';
  for (let k = 0; k < lobes; k++) {
    const dx = (k - (lobes - 1) / 2) * r * 0.55;
    ctx.beginPath();
    ctx.ellipse(x + dx, y - r * 0.05 * (k % 2), r * 0.6, r * 0.22, 0, 0, TAU);
    ctx.fill();
  }
}

function drawDeck(ctx: CanvasRenderingContext2D, t: number): void {
  const g = ctx.createLinearGradient(0, VIEW.cy, 0, 760);
  g.addColorStop(0, '#e4ebf2');
  g.addColorStop(0.18, '#d3dee8');
  g.addColorStop(1, '#a9bccd');
  ctx.fillStyle = g;
  ctx.fillRect(-300, VIEW.cy, 1880, 700);
  const puffs = PUFFS.map((p) => ({ ...p, z: DECK.near + ((((p.z - DECK.speed * t) % DECK.depth) + DECK.depth) % DECK.depth) }))
    .sort((a, b) => b.z - a.z);
  ctx.save();
  for (const p of puffs) {
    const s = VIEW.f / p.z;
    const fade = Math.min(1, (DECK.near + DECK.depth - p.z) / 1800) * Math.min(1, (p.z - DECK.near) / 300);
    drawPuff(ctx, VIEW.cx + p.x * s, VIEW.cy + DECK.below * s, p.r * s, p.lobes, 0.85 * fade);
  }
  ctx.restore();
}

/** Sky, sun glare, horizon haze and the cloud deck, tilted by the jet's bank. */
export function drawSky(ctx: CanvasRenderingContext2D, t: number, tilt: number): void {
  ctx.save();
  ctx.translate(VIEW.cx, VIEW.cy);
  ctx.rotate(tilt);
  ctx.translate(-VIEW.cx, -VIEW.cy);
  const g = ctx.createLinearGradient(0, -100, 0, VIEW.cy);
  g.addColorStop(0, '#123b72');
  g.addColorStop(0.55, '#2f6cae');
  g.addColorStop(1, '#a7cbe9');
  ctx.fillStyle = g;
  ctx.fillRect(-300, -300, 1880, VIEW.cy + 300);
  drawDeck(ctx, t);
  const haze = ctx.createLinearGradient(0, VIEW.cy - 40, 0, VIEW.cy + 30);
  haze.addColorStop(0, 'rgba(230,240,250,0)');
  haze.addColorStop(0.6, 'rgba(236,243,250,0.85)');
  haze.addColorStop(1, 'rgba(236,243,250,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(-300, VIEW.cy - 40, 1880, 70);
  ctx.restore();
  const sun = ctx.createRadialGradient(170, 70, 0, 170, 70, 420);
  sun.addColorStop(0, 'rgba(255,250,232,0.55)');
  sun.addColorStop(0.15, 'rgba(255,248,225,0.18)');
  sun.addColorStop(1, 'rgba(255,248,225,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, 1280, 720);
}
