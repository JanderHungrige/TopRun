import { createRng } from '../core/rng';
import { lightsLit, RAMP } from '../game/ramp-start';

// The ramp start's world (doc 109), side view in logical 1280 × 720: the golden steppe at dawn under a pale sky with the
// big moon, the lander on its legs with the ramp coming down and its bay lit red, then green, the light tree, and the
// dust the vehicle throws up as it rolls off. The camera follows the vehicle a little (`camX`).

export interface RampView { t: number; phase: 'ramp' | 'lights' | 'go' | 'done'; phaseT: number; camX: number; vehicleX: number; spin: boolean }

export const GROUND_Y = 560;
const DECK_Y = 508;
const HINGE = { x: 560, y: DECK_Y };
const RAMP_LEN = 150;

/** The ramp's direction from its hinge (rad, canvas y down): straight up and closed, swinging down while the ramp phase
 *  runs, then resting on the grass. */
export function rampAngle(v: Pick<RampView, 'phase' | 'phaseT'>): number {
  const open = v.phase === 'ramp' ? Math.min(1, v.phaseT / RAMP.ramp) : 1;
  const eased = open * open * (3 - 2 * open);
  const down = Math.asin((GROUND_Y - DECK_Y) / RAMP_LEN);
  return -Math.PI / 2 + (Math.PI / 2 + down) * eased;
}

/** Where the vehicle sits for a distance rolled from its spot in the bay: along the deck, down the ramp, on the grass. */
export function vehicleAt(x: number): { x: number; y: number; pitch: number } {
  const end = HINGE.x + Math.cos(rampAngle({ phase: 'go', phaseT: 0 })) * RAMP_LEN;
  if (x <= HINGE.x) return { x, y: DECK_Y, pitch: 0 };
  if (x >= end) return { x, y: GROUND_Y, pitch: 0 };
  const u = (x - HINGE.x) / (end - HINGE.x);
  return { x, y: DECK_Y + (GROUND_Y - DECK_Y) * u, pitch: -Math.asin((GROUND_Y - DECK_Y) / RAMP_LEN) }; // nose down
}

function sky(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, '#7f9fc8');
  g.addColorStop(0.65, '#d8c8a8');
  g.addColorStop(1, '#f4d8a0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1280, GROUND_Y);
  ctx.fillStyle = 'rgba(240,236,220,0.85)';
  ctx.beginPath();
  ctx.arc(1010, 170, 92, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(190,184,170,0.45)';
  for (const [x, y, r] of [[980, 150, 18], [1040, 200, 12], [1020, 130, 8], [985, 205, 9]] as const) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function land(ctx: CanvasRenderingContext2D, camX: number, t: number): void {
  ctx.fillStyle = '#a8904e';
  ctx.beginPath();
  ctx.moveTo(0, 470);
  for (let x = 0; x <= 1280; x += 40) ctx.lineTo(x, 455 + Math.sin((x + camX * 0.2) * 0.008) * 18 + Math.sin((x + camX * 0.2) * 0.021) * 8);
  ctx.lineTo(1280, GROUND_Y);
  ctx.lineTo(0, GROUND_Y);
  ctx.fill();
  ctx.fillStyle = '#c9a24e';
  ctx.fillRect(0, GROUND_Y - 30, 1280, 200);
  const rng = createRng(17);
  for (let i = 0; i < 160; i++) { // grass tufts swaying, scrolling with the camera
    const x = ((rng.next() * 1600 - camX) % 1600 + 1600) % 1600 - 160;
    const y = GROUND_Y - 24 + rng.next() * 180;
    const sway = Math.sin(t * 1.8 + x * 0.03) * 3;
    ctx.strokeStyle = rng.next() < 0.5 ? '#e8d48a' : '#8a7a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + sway + 3, y - 10 - rng.next() * 8);
    ctx.stroke();
  }
}

/** The bay light: red while the ramp comes down and the lights count, green once the brake lets go. */
const bayLight = (v: RampView): string => (v.phase === 'go' || v.phase === 'done' ? '90,255,120' : '255,70,50');

function hull(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(40,30,10,0.35)'; // its shadow on the grass
  ctx.beginPath();
  ctx.ellipse(330, GROUND_Y + 4, 300, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a2c24'; // the legs and their pads
  for (const x of [130, 250, 420]) {
    ctx.fillRect(x, DECK_Y - 10, 12, GROUND_Y - DECK_Y + 6);
    ctx.fillRect(x - 12, GROUND_Y - 6, 36, 8);
  }
  const g = ctx.createLinearGradient(0, 230, 0, DECK_Y + 10);
  g.addColorStop(0, '#7d8470');
  g.addColorStop(0.5, '#5c6352');
  g.addColorStop(1, '#3c4036');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(60, 470);
  ctx.quadraticCurveTo(52, 330, 150, 290);
  ctx.lineTo(260, 246);
  ctx.lineTo(540, 246);
  ctx.lineTo(566, 300);
  ctx.lineTo(566, DECK_Y + 8);
  ctx.lineTo(90, DECK_Y + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6c7360'; // the engine pod on top, its nozzle still glowing
  ctx.fillRect(280, 222, 220, 30);
  ctx.fillStyle = 'rgba(255,150,70,0.6)';
  ctx.fillRect(500, 226, 8, 22);
  ctx.fillStyle = '#d6c08a'; // the sand stripe
  ctx.fillRect(70, 404, 230, 8);
  ctx.fillStyle = '#9ad8ff'; // the cockpit
  ctx.beginPath();
  ctx.moveTo(90, 330);
  ctx.lineTo(150, 304);
  ctx.lineTo(176, 304);
  ctx.lineTo(176, 336);
  ctx.closePath();
  ctx.fill();
}

function panels(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = 2;
  for (const x of [200, 260, 330, 400, 470, 530]) {
    ctx.beginPath();
    ctx.moveTo(x, 252);
    ctx.lineTo(x, 372);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(66, 372);
  ctx.lineTo(566, 372);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  for (let x = 206; x < 560; x += 22) ctx.fillRect(x, 258, 3, 3);
}

function bay(ctx: CanvasRenderingContext2D, v: RampView): void {
  ctx.fillStyle = '#1e201a';
  ctx.fillRect(300, 380, 262, DECK_Y - 380);
  const light = bayLight(v);
  const pulse = 0.5 + 0.3 * Math.sin(v.t * (v.phase === 'go' ? 3 : 6));
  ctx.fillStyle = `rgba(${light},${(0.22 * pulse).toFixed(3)})`;
  ctx.fillRect(300, 380, 262, DECK_Y - 380);
  ctx.fillStyle = `rgba(${light},0.95)`;
  for (const x of [330, 430, 530]) ctx.fillRect(x, 384, 16, 5);
  for (let k = 0; k < 10; k++) { // the hazard chevrons round the opening
    ctx.fillStyle = k % 2 === 0 ? '#e8c23a' : '#1e1c16';
    ctx.fillRect(566 - 6, 380 + k * 13, 6, 13);
  }
}

function ramp(ctx: CanvasRenderingContext2D, v: RampView): void {
  const a = rampAngle(v);
  const end = { x: HINGE.x + Math.cos(a) * RAMP_LEN, y: HINGE.y + Math.sin(a) * RAMP_LEN };
  ctx.strokeStyle = '#2a2c24'; // the hydraulic arm from the hull to the ramp's middle
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(548, 400);
  ctx.lineTo((HINGE.x + end.x) / 2, (HINGE.y + end.y) / 2);
  ctx.stroke();
  ctx.save();
  ctx.translate(HINGE.x, HINGE.y);
  ctx.rotate(a);
  ctx.fillStyle = '#4c5244';
  ctx.fillRect(0, -7, RAMP_LEN, 14);
  ctx.fillStyle = '#6a7160';
  ctx.fillRect(0, -7, RAMP_LEN, 3);
  ctx.fillStyle = '#2a2c24';
  for (let k = 10; k < RAMP_LEN; k += 14) ctx.fillRect(k, -4, 4, 11);
  ctx.restore();
}

function lander(ctx: CanvasRenderingContext2D, v: RampView): void {
  hull(ctx);
  panels(ctx);
  bay(ctx, v);
  ramp(ctx, v);
}

function lights(ctx: CanvasRenderingContext2D, v: RampView): void {
  const lit = v.phase === 'lights' ? lightsLit(v.phaseT) : v.phase === 'go' || v.phase === 'done' ? 4 : 0;
  const x = 760;
  ctx.fillStyle = '#2a2a24';
  ctx.fillRect(x - 4, 330, 8, GROUND_Y - 330);
  ctx.fillRect(x - 22, 300, 44, 140);
  for (let k = 0; k < 4; k++) {
    const on = k < 3 ? lit > k && lit < 4 : lit === 4;
    ctx.fillStyle = on ? (k < 3 ? '#ff3a2a' : '#5aff6a') : k < 3 ? '#4a1a14' : '#1a3a1a';
    ctx.beginPath();
    ctx.arc(x, 318 + k * 32, 12, 0, Math.PI * 2);
    ctx.fill();
    if (on) {
      ctx.fillStyle = k < 3 ? 'rgba(255,80,60,0.25)' : 'rgba(90,255,110,0.3)';
      ctx.beginPath();
      ctx.arc(x, 318 + k * 32, 26, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Everything but the vehicle, in world space (the scene translates by −camX before). */
export function drawRampWorld(ctx: CanvasRenderingContext2D, v: RampView): void {
  sky(ctx);
  land(ctx, v.camX, v.t);
  ctx.save();
  ctx.translate(-v.camX, 0);
  lander(ctx, v);
  lights(ctx, v);
  ctx.restore();
}

/** The dust behind a vehicle on the go: thicker and redder when the wheels spin. */
export function drawRampDust(ctx: CanvasRenderingContext2D, v: RampView): void {
  if (v.phase !== 'go' && v.phase !== 'done') return;
  const at = vehicleAt(v.vehicleX);
  const n = v.spin ? 16 : 8;
  for (let i = 0; i < n; i++) {
    const k = (v.t * 2 + i / n) % 1;
    const x = at.x - v.camX - 50 - k * 160 + Math.sin(i * 7) * 10;
    const y = at.y - 8 - k * 40 + Math.cos(i * 3) * 6;
    ctx.fillStyle = `rgba(${v.spin ? '200,150,100' : '210,190,140'},${(0.5 * (1 - k)).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(x, y, 8 + k * 26, 0, Math.PI * 2);
    ctx.fill();
  }
}
