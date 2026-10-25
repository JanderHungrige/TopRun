import { clamp, TAU } from '../../core/math';
import { DECK } from '../../game/minigames/landing-deck';
import { ship, type Frame } from './landing-carrier';
import { project, v3, type Cam, type Pt, type Vec3 } from './landing-view';

// Carrier Landing lights (doc 18): what the pilot actually sees at night — landing-area edge and centreline
// lights, the drop line down the stern, ramp lights, the island's mast and windows, blue taxi lights forward,
// plus an escort's running lights off to starboard. Drawn additively with a soft glow.

interface Light {
  p: Vec3;
  color: string;
  /** Lamp radius (m) and brightness 0 … 1. */
  r: number;
  a: number;
}

const L = (p: Vec3, color: string, r: number, a = 1): Light => ({ p, color, r, a });

function deckLights(): Light[] {
  const out: Light[] = [];
  for (let z = 0; z <= DECK.length; z += 15) {
    for (const side of [-1, 1]) out.push(L(v3(side * (DECK.lane + 0.5), 0.15, z), '#ffd9a0', 0.32, 0.85));
  }
  for (let z = 6; z <= DECK.length; z += 12) out.push(L(v3(0, 0.12, z), '#eef4ff', 0.38));
  for (let k = 0; k < 8; k++) out.push(L(v3(0, -1.6 - k * 1.5, -0.8), '#ff7b3a', 0.42));
  for (let x = -10; x <= 10; x += 2.5) out.push(L(v3(x, 0.3, 0.2), '#ff3b30', 0.22, 0.6));
  return out;
}

function shipLights(): Light[] {
  const out: Light[] = [L(ship(0, 0, -5), '#ffffff', 0.45, 0.9), L(ship(334, 0, 2), '#ffffff', 0.4, 0.7)];
  out.push(L(ship(189, 30, 43.5), '#ff3030', 0.6), L(ship(189, 30, 36), '#ffffff', 0.5, 0.9), L(ship(186, 30, 30), '#ff3030', 0.4, 0.8));
  for (let b = 27; b <= 33; b += 1.5) out.push(L(ship(177.8, b, 23.5), '#ffb15a', 0.22, 0.55));
  for (let k = 0; k < 9; k++) {
    const a = 245 + k * 9;
    out.push(L(ship(a, -6 + (k % 3) * 9, 0.1), '#4f8dff', 0.26, 0.75));
  }
  return out;
}

const SHIP_LIGHTS: readonly Light[] = [...deckLights(), ...shipLights()];
const ESCORT: readonly Light[] = [
  L(v3(720, -1, -700), '#ffffff', 0.7, 0.9),
  L(v3(722, -12, -716), '#ffffff', 0.6, 0.7),
  L(v3(712, -8, -688), '#ff3a2a', 0.6, 0.85),
];

/** One lamp with its glow, already projected. */
export function drawLamp(ctx: CanvasRenderingContext2D, p: Pt, color: string, r: number, a: number): void {
  const fade = clamp(1.3 - p.d / 3200, 0.45, 1) * a;
  const core = clamp(r * p.s * 0.6, 0.8, 3.6);
  const glow = Math.max(3.2, core * 3.2);
  ctx.globalAlpha = fade * 0.22;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, glow, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = fade * 0.35;
  ctx.beginPath();
  ctx.arc(p.x, p.y, glow * 0.45, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = fade;
  ctx.beginPath();
  ctx.arc(p.x, p.y, core, 0, TAU);
  ctx.fill();
  if (core > 1.6) {
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = fade * 0.55;
    ctx.beginPath();
    ctx.arc(p.x, p.y, core * 0.45, 0, TAU);
    ctx.fill();
  }
}

function drawSet(ctx: CanvasRenderingContext2D, cam: Cam, lights: readonly Light[], f: Frame | null): void {
  for (const l of lights) {
    const p = project(cam, f ? f(l.p) : l.p);
    if (!p || p.x < -40 || p.x > 1320 || p.y < -40 || p.y > 760) continue;
    drawLamp(ctx, p, l.color, l.r, l.a);
  }
}

/** Every light on the ship and the escort. */
export function drawShipLights(ctx: CanvasRenderingContext2D, cam: Cam, f: Frame, t: number): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  drawSet(ctx, cam, ESCORT, null);
  drawSet(ctx, cam, SHIP_LIGHTS, f);
  // the mast-top obstruction light blinks
  const top = project(cam, f(ship(189, 30, 45)));
  if (top && Math.sin(t * 3.4) > 0.2) drawLamp(ctx, top, '#ff2a2a', 0.55, 0.9);
  ctx.restore();
}
