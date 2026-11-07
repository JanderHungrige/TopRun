import { TAU } from '../core/math';
import { DIVE } from '../game/dive-launch';
import { circle } from './shapes';

// The dive launch's side view (doc 71): the sky and the sea, the carrier's stern cut open with the flooded well deck and
// the lowered ramp, the seabed and the reef, the anti-sub net on its buoys. World x and depth in metres; `camX` is the
// world x at the screen's left edge.

export const PX = 14;
export const SURFACE_Y = 250;

export const toScreen = (x: number, depth: number, camX: number): [number, number] => [(x - camX) * PX, SURFACE_Y + depth * PX];

/** The seabed's depth along the way: under the ship, sloping off, the reef under the net, then the deep. */
export function floorDepth(x: number): number {
  if (x < 40) return 12;
  if (x < 62) return 12 + ((x - 40) / 22) * 14;
  const reef = Math.max(0, 1 - Math.abs(x - DIVE.net) / 9);
  return 26 - reef * (26 - DIVE.reef);
}

function sea(ctx: CanvasRenderingContext2D, t: number): void {
  const sky = ctx.createLinearGradient(0, 0, 0, SURFACE_Y);
  sky.addColorStop(0, '#5f9fd6');
  sky.addColorStop(1, '#d2e8f4');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1280, SURFACE_Y);
  const water = ctx.createLinearGradient(0, SURFACE_Y, 0, 720);
  water.addColorStop(0, '#2389a8');
  water.addColorStop(1, '#082a44');
  ctx.fillStyle = water;
  ctx.fillRect(0, SURFACE_Y, 1280, 720 - SURFACE_Y);
  for (let i = 0; i < 6; i++) {
    const x = 120 + i * 210 + Math.sin(t * 0.4 + i) * 30;
    ctx.fillStyle = 'rgba(220,250,255,0.06)';
    ctx.beginPath();
    ctx.moveTo(x, SURFACE_Y);
    ctx.lineTo(x + 60, SURFACE_Y);
    ctx.lineTo(x + 220, 720);
    ctx.lineTo(x + 150, 720);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= 1280; x += 16) ctx.lineTo(x, SURFACE_Y + Math.sin(x * 0.05 + t * 2) * 2);
  ctx.stroke();
}

function seabed(ctx: CanvasRenderingContext2D, camX: number): void {
  ctx.beginPath();
  ctx.moveTo(0, 720);
  for (let sx = 0; sx <= 1280; sx += 10) ctx.lineTo(sx, toScreen(0, floorDepth(camX + sx / PX), 0)[1]);
  ctx.lineTo(1280, 720);
  ctx.fillStyle = '#7a7254';
  ctx.fill();
  ctx.strokeStyle = '#a89c70';
  ctx.lineWidth = 3;
  ctx.stroke();
  for (let k = -6; k <= 6; k++) {
    const [x, y] = toScreen(DIVE.net + k * 0.8, floorDepth(DIVE.net + k * 0.8), camX);
    circle(ctx, x, y + 4, 6 + (k % 3) * 2, ['#ff8a78', '#c87ae8', '#ffb84a'][Math.abs(k) % 3] ?? '#ff8a78');
  }
}

/** The carrier's stern, cut open: the hull below the waterline, the flooded well deck, the ramp lowered to the sea. */
function stern(ctx: CanvasRenderingContext2D, camX: number): void {
  const [x0, deck] = toScreen(-80, -9, camX);
  const [x1] = toScreen(DIVE.deckEnd, 0, camX);
  const [, keel] = toScreen(0, 8, camX);
  ctx.fillStyle = '#5c646c';
  ctx.fillRect(x0, deck, x1 - x0, keel - deck);
  ctx.fillStyle = '#3a4048';
  ctx.fillRect(x0, deck - 10, x1 - x0 + 30, 12);
  const [, floor] = toScreen(0, DIVE.deckFloor + 0.6, camX);
  const [dx0, top] = toScreen(0, -5, camX);
  ctx.fillStyle = '#2b3036';
  ctx.fillRect(dx0, top, x1 - dx0, floor - top);
  ctx.fillStyle = 'rgba(35,137,168,0.85)';
  ctx.fillRect(dx0, SURFACE_Y, x1 - dx0, floor - SURFACE_Y);
  ctx.fillStyle = '#6c747c';
  ctx.fillRect(dx0, floor, x1 - dx0, keel - floor);
  const [rx, ry] = toScreen(DIVE.deckEnd + 6, DIVE.deckFloor + 2.4, camX);
  ctx.strokeStyle = '#8a929a';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(x1, floor);
  ctx.lineTo(rx, ry);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  for (let x = x0 + 30; x < x1 - 20; x += 46) ctx.fillRect(x, deck + 18, 22, 10);
}

/** The anti-sub net: orange buoys on the surface, a mesh hanging down to the net's bottom, weights below. */
function net(ctx: CanvasRenderingContext2D, camX: number, t: number): void {
  const [x, top] = toScreen(DIVE.net, 0, camX);
  const [, bottom] = toScreen(DIVE.net, DIVE.netBottom, camX);
  ctx.strokeStyle = 'rgba(30,40,40,0.7)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let y = top; y <= bottom; y += 10) {
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x + 10, y + 10);
    ctx.moveTo(x + 10, y);
    ctx.lineTo(x - 10, y + 10);
  }
  ctx.stroke();
  ctx.fillStyle = '#2a2e32';
  ctx.fillRect(x - 12, bottom - 2, 24, 6);
  for (const dx of [-12, 12]) circle(ctx, x + dx, top + Math.sin(t * 2 + dx) * 2, 9, '#ff7a2e');
}

/** Bubbles rising from the tanks while they flood. */
export function ballastBubbles(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, strength: number): void {
  ctx.strokeStyle = `rgba(230,250,255,${(0.6 * strength).toFixed(3)})`;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 10; i++) {
    const k = (t * 0.8 + i / 10) % 1;
    ctx.beginPath();
    ctx.arc(x - 30 + i * 7 + Math.sin(t * 5 + i) * 4, y - k * 60, 2 + (i % 3), 0, TAU);
    ctx.stroke();
  }
}

export function drawDiveWorld(ctx: CanvasRenderingContext2D, camX: number, t: number): void {
  sea(ctx, t);
  seabed(ctx, camX);
  stern(ctx, camX);
  net(ctx, camX, t);
}
