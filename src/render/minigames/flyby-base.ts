import { TAU } from '../../core/math';
import { cachedGradient } from '../carrier/pen';

// Tower Flyby backdrop (doc 13): the home air base in side view. Everything scrolls with the camera x.

/** Screen y of the runway centreline = altitude 0. */
export const GROUND_Y = 640;
const HORIZON = 560;
/** Camera: follows the jet at screen x 300, then eases to a stop so the tower stays in view as the jet streaks past. */
const JET_SCREEN_X = 300;
const CAM_EASE_FROM = -700;
const CAM_HOLD_AT = 300;
const RUNWAY_TOP = 626;
const RUNWAY_BOTTOM = 656;

const wrap = (v: number, p: number): number => ((v % p) + p) % p;
const hash = (i: number): number => {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

function sky(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = cachedGradient(ctx, 'flyby-sky', () => {
    const g = ctx.createLinearGradient(0, 0, 0, HORIZON);
    g.addColorStop(0, '#3a78bf');
    g.addColorStop(0.55, '#8cbfe6');
    g.addColorStop(1, '#f2dfbe');
    return g;
  });
  ctx.fillRect(0, 0, 1280, HORIZON);
  ctx.fillStyle = cachedGradient(ctx, 'flyby-sun', () => {
    const g = ctx.createRadialGradient(1010, 150, 8, 1010, 150, 240);
    g.addColorStop(0, 'rgba(255,250,222,0.95)');
    g.addColorStop(0.14, 'rgba(255,238,184,0.55)');
    g.addColorStop(1, 'rgba(255,238,184,0)');
    return g;
  });
  ctx.fillRect(760, 0, 520, 420);
}

function cloudLayer(ctx: CanvasRenderingContext2D, camX: number, t: number, dx: number, dy: number, grow: number): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const x = wrap(i * 360 - camX * 0.04 - t * 8, 1900) - 260;
    const y = 120 + (i % 3) * 64 + (i % 2) * 22;
    for (let k = 0; k < 5; k++) {
      const r = 22 + ((k + i) % 3) * 9 + grow;
      const cx = x + k * 32 + dx;
      const cy = y + Math.sin(k * 2.1 + i) * 9 + dy;
      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, TAU);
    }
  }
}

function clouds(ctx: CanvasRenderingContext2D, camX: number, t: number): void {
  const layers: [number, number, number, string][] = [
    [5, 8, -3, 'rgba(150,172,196,0.45)'], [0, 0, 0, 'rgba(255,255,255,0.78)'], [-6, -7, -11, 'rgba(255,255,255,0.7)'],
  ];
  for (const [dx, dy, grow, color] of layers) {
    cloudLayer(ctx, camX, t, dx, dy, grow);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

/** A hill silhouette from summed sines; `par` is the parallax factor. */
function ridge(ctx: CanvasRenderingContext2D, camX: number, par: number, base: number, amp: number, freq: number, color: string): void {
  ctx.beginPath();
  ctx.moveTo(-10, base + 40);
  for (let sx = -10; sx <= 1290; sx += 16) {
    const w = sx + camX * par;
    const h = amp * (0.5 + 0.28 * Math.sin(w * freq) + 0.14 * Math.sin(w * freq * 2.3 + 1.3) + 0.08 * Math.sin(w * freq * 5.1 + 0.4));
    ctx.lineTo(sx, base - h);
  }
  ctx.lineTo(1290, base + 40);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function trees(ctx: CanvasRenderingContext2D, camX: number): void {
  ctx.beginPath();
  const off = camX * 0.3;
  const first = Math.floor((off - 20) / 14);
  for (let i = first; i < first + 96; i++) {
    const x = i * 14 - off + hash(i) * 6;
    const r = 6 + hash(i + 7) * 7;
    ctx.moveTo(x + r, 590);
    ctx.arc(x, 590 - r * 0.6, r, 0, TAU);
  }
  ctx.fillStyle = '#4f6f45';
  ctx.fill();
}

function ground(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = cachedGradient(ctx, 'flyby-grass', () => {
    const g = ctx.createLinearGradient(0, HORIZON, 0, 720);
    g.addColorStop(0, '#93a866');
    g.addColorStop(0.45, '#7b9a4f');
    g.addColorStop(1, '#5a7a38');
    return g;
  });
  ctx.fillRect(0, 586, 1280, 134);
}

/** An arched hangar with sliding doors; x is its left edge, y the ground. */
function hangar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = '#9ba5ab';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - h * 0.55);
  ctx.quadraticCurveTo(x + w / 2, y - h * 1.25, x + w, y - h * 0.55);
  ctx.lineTo(x + w, y);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.moveTo(x, y - h * 0.55);
  ctx.quadraticCurveTo(x + w / 2, y - h * 1.25, x + w, y - h * 0.55);
  ctx.quadraticCurveTo(x + w / 2, y - h * 1.12, x, y - h * 0.48);
  ctx.fill();
  ctx.fillStyle = '#6f7a82';
  ctx.fillRect(x + w * 0.1, y - h * 0.52, w * 0.8, h * 0.52);
  ctx.strokeStyle = 'rgba(30,38,44,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < 6; i++) {
    const dx = x + w * 0.1 + (w * 0.8 * i) / 6;
    ctx.moveTo(dx, y - h * 0.52);
    ctx.lineTo(dx, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#e3c04a';
  ctx.fillRect(x + w * 0.1, y - h * 0.56, w * 0.8, 2);
}

function block(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = '#b9b2a2';
  ctx.fillRect(x, y - h, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(x, y - h, w, 3);
  ctx.fillStyle = '#5d7486';
  for (let wx = x + 8; wx < x + w - 10; wx += 16) ctx.fillRect(wx, y - h + 9, 9, 7);
}

function tanks(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  for (const [dx, r] of [[0, 18], [44, 14]] as const) {
    ctx.fillStyle = '#d9dcd8';
    ctx.fillRect(x + dx - r, y - r * 1.4, r * 2, r * 1.4);
    ctx.beginPath();
    ctx.ellipse(x + dx, y - r * 1.4, r, r * 0.3, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(x + dx + r * 0.3, y - r * 1.4, r * 0.7, r * 1.4);
  }
}

/** Hangars, offices and fuel tanks behind the taxiway (parallax 0.5, period 1700). */
function buildings(ctx: CanvasRenderingContext2D, camX: number): void {
  const par = camX * 0.5;
  const P = 1700;
  const y = 604;
  for (let k = Math.floor((par - 400) / P); k * P - par < 1300; k++) {
    const x = k * P - par;
    hangar(ctx, x, y, 230, 60);
    hangar(ctx, x + 250, y, 190, 50);
    block(ctx, x + 520, y, 150, 34);
    tanks(ctx, x + 760, y);
    hangar(ctx, x + 900, y, 260, 66);
    block(ctx, x + 1240, y, 110, 26);
    hangar(ctx, x + 1420, y, 200, 54);
  }
  ctx.fillStyle = 'rgba(242,223,190,0.18)';
  ctx.fillRect(0, 520, 1280, 86);
}

function windsock(ctx: CanvasRenderingContext2D, camX: number, t: number): void {
  const x = wrap(900 - camX * 0.8, 2600) - 200;
  ctx.strokeStyle = '#d8d8d8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, 616);
  ctx.lineTo(x, 584);
  ctx.stroke();
  const flap = Math.sin(t * 7) * 1.5;
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 ? '#f2f2f2' : '#ff6a2a';
    ctx.beginPath();
    ctx.moveTo(x + i * 7, 585 + i * 0.6);
    ctx.lineTo(x + i * 7 + 7, 585 + (i + 1) * 0.6 + flap * (i / 4));
    ctx.lineTo(x + i * 7 + 7, 593 - (i + 1) * 0.8 + flap * (i / 4));
    ctx.lineTo(x + i * 7, 593 - i * 0.8);
    ctx.fill();
  }
}

function taxiway(ctx: CanvasRenderingContext2D, camX: number): void {
  ctx.fillStyle = '#7c7f7c';
  ctx.fillRect(0, 608, 1280, 9);
  ctx.fillStyle = '#e5c23c';
  const off = wrap(camX * 0.75, 70);
  for (let x = -off; x < 1280; x += 70) ctx.fillRect(x, 612, 36, 1.5);
}

function runway(ctx: CanvasRenderingContext2D, camX: number): void {
  ctx.fillStyle = '#4a4e52';
  ctx.fillRect(0, RUNWAY_TOP, 1280, RUNWAY_BOTTOM - RUNWAY_TOP);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, RUNWAY_TOP, 1280, 4);
  ctx.fillStyle = '#e9ecef';
  ctx.fillRect(0, RUNWAY_TOP + 2, 1280, 1.5);
  ctx.fillRect(0, RUNWAY_BOTTOM - 4, 1280, 2);
  const off = wrap(camX, 120);
  for (let x = -off; x < 1280; x += 120) ctx.fillRect(x, GROUND_Y - 1, 64, 2.5);
  ctx.fillStyle = 'rgba(20,20,20,0.25)';
  for (let x = -wrap(camX, 530); x < 1280; x += 530) ctx.fillRect(x, GROUND_Y + 5, 90, 4);
}

function edgeLights(ctx: CanvasRenderingContext2D, camX: number): void {
  const off = wrap(camX * 1.15, 150);
  for (let x = -off; x < 1290; x += 150) {
    ctx.fillStyle = '#2c3034';
    ctx.fillRect(x - 1, 664, 2, 8);
    ctx.fillStyle = '#ffe9a0';
    ctx.beginPath();
    ctx.arc(x, 663, 2.6, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(40,70,25,0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const o2 = camX * 1.35;
  for (let i = Math.floor(o2 / 23); i * 23 - o2 < 1300; i++) {
    const x = i * 23 - o2 + hash(i) * 12;
    const y = 684 + hash(i + 3) * 30;
    ctx.moveTo(x, y);
    ctx.lineTo(x - 2, y - 6);
    ctx.moveTo(x + 2, y);
    ctx.lineTo(x + 4, y - 5);
  }
  ctx.stroke();
}

/** Sky, hills, base buildings, runway and grass; `camX` is the world x at the left screen edge. */
export function drawAirBase(ctx: CanvasRenderingContext2D, camX: number, t: number): void {
  sky(ctx);
  clouds(ctx, camX, t);
  ridge(ctx, camX, 0.05, 566, 92, 0.008, '#a3b8cc');
  ridge(ctx, camX, 0.12, 578, 54, 0.013, '#87a39a');
  ground(ctx);
  trees(ctx, camX);
  buildings(ctx, camX);
  windsock(ctx, camX, t);
  taxiway(ctx, camX);
  runway(ctx, camX);
  edgeLights(ctx, camX);
}

/** World x at the left screen edge for a jet at `jetX` (the tower stands at x = 0). */
export function flybyCamera(jetX: number): number {
  const x = Math.min(jetX, CAM_HOLD_AT);
  if (x <= CAM_EASE_FROM) return x - JET_SCREEN_X;
  const d = x - CAM_EASE_FROM;
  return CAM_EASE_FROM - JET_SCREEN_X + d - (d * d) / (2 * (CAM_HOLD_AT - CAM_EASE_FROM));
}

/** The jet's shadow on the runway, fading with altitude. */
export function drawJetShadow(ctx: CanvasRenderingContext2D, x: number, alt: number, len: number): void {
  const a = Math.max(0, 0.32 - alt / 900);
  if (a <= 0) return;
  ctx.fillStyle = `rgba(10,14,18,${a.toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(x, GROUND_Y + 3, len * (0.5 + alt / 1600), 3.5, 0, 0, TAU);
  ctx.fill();
}
