import { antenna, bevel, bolts, cylinder, INK, lens, path, plate, sheen } from '../detail/parts';
import { drawCached } from '../detail/sprite';
import { paintFleet } from '../fleet-paint';
import type { Look } from '../livery-art';
import { BUGGY_SIDE } from './vehicle-build';
import { C, jerrycan, lightBar, lookKey, tyreSide } from './vehicle-parts';

// The buggies from the side (docs 104, 114), facing right (+x), the ground at y = 0: cached per look, the low tub in its
// paint with the bull bar, headlight and sand ladders, the coil-over suspension, the crew in helmets at the wheel and on
// the gun, the tube roll cage with its light bar, the upright spare wheel, jerrycans and the antenna — the Jackal's
// pintle MG on the rear hoop, the Viper's rocket pod tilted up on its cradle; then the big tyres turning with `t`; then
// the flared fenders over them.

type Ctx = CanvasRenderingContext2D;
type BuggyId = 'jackal' | 'viper';

const TUBE = '#a9aaa2';

function tube(ctx: Ctx, pts: readonly number[], w = 1.3): void {
  const p = path(pts, false);
  ctx.strokeStyle = INK;
  ctx.lineWidth = w + 0.7;
  ctx.stroke(p);
  ctx.strokeStyle = TUBE;
  ctx.lineWidth = w;
  ctx.stroke(p);
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = w * 0.3;
  ctx.stroke(p);
}

function painted(ctx: Ctx, pts: readonly number[], look: Look, key: string): void {
  const p = path(pts);
  ctx.fillStyle = look.base;
  ctx.fill(p);
  paintFleet(ctx, look, p, { x: -28, y: -24, w: 56, h: 18 }, key, 'side');
  sheen(ctx, p, -28, -24, -12, -6, 0.8);
  bevel(ctx, pts, null, look.ink, 0.6);
}

/** A seated or standing crew member from the side: torso in fatigues, arm, the helmet with goggles. */
function crewSide(ctx: Ctx, x: number, y: number, standing: boolean): void {
  const torso = standing ? 8 : 6;
  plate(ctx, x - 1.8, y - torso, 3.6, torso, C.fatigue, INK, 0.35);
  ctx.strokeStyle = C.fatigue;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + 1, y - torso + 1.5);
  ctx.lineTo(x + 4, y - torso + 4);
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(x, y - torso - 1.9, 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.helmet;
  ctx.beginPath();
  ctx.arc(x, y - torso - 1.9, 2, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#c99a76';
  ctx.fillRect(x - 0.6, y - torso - 1.9, 2.2, 1.6); // face below the helmet's rim
  plate(ctx, x + 0.4, y - torso - 2.4, 1.8, 0.8, '#2a2a22', INK, 0.2); // goggles
}

function suspension(ctx: Ctx, x: number, r: number): void {
  ctx.strokeStyle = '#2c2c28';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, -r);
  ctx.lineTo(x * 0.62, -10);
  ctx.stroke();
  const sx = x > 0 ? x - 2.4 : x + 2.4;
  ctx.strokeStyle = '#c84a2a'; // the coil spring
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let k = 0; k <= 8; k++) ctx.lineTo(sx + (k % 2 ? 0.9 : -0.9), -r - 1 - k * 0.95);
  ctx.stroke();
  cylinder(ctx, sx - 0.4, -r - 9, 0.8, 8.5, '#3a3a34', 'y');
}

function body(ctx: Ctx, id: BuggyId, look: Look): void {
  const v = id === 'viper';
  const b = BUGGY_SIDE[id];
  const L = v ? 27 : 23;
  for (const x of [-b.wheelX, b.wheelX]) suspension(ctx, x, b.r);
  ctx.save(); // the spare wheel, upright behind the seats
  ctx.translate(-L + 3, -17);
  tyreSide(ctx, 0, 0, 5.2, 0.3);
  ctx.restore();
  painted(ctx, [-L, -9, L - 6, -9, L, -12.5, L - 2, -15.6, L - 9, -16.8, -L + 4, -17, -L - 1, -13.5], look, `${id}-side`);
  if (v) {
    plate(ctx, -8, -15.4, 16, 3, '#c8a65a', INK, 0.35); // sand ladder
    ctx.fillStyle = 'rgba(40,30,10,0.6)';
    for (let x = -7; x < 7.6; x += 1.9) ctx.fillRect(x, -14.4, 1, 1);
  }
  bolts(ctx, [-L + 3, -10.5, -L + 10, -10.5, L - 12, -10.5, L - 5, -10.5], 0.3);
  tube(ctx, [L - 1, -11.5, L + 1.6, -12, L + 1.6, -17, L - 2, -17.6], 1.1); // bull bar
  lens(ctx, L - 1.4, -14.6, 0.9, '#f6efcf');
  jerrycan(ctx, -L + 7, -21, 3, 4);
  cylinder(ctx, -L - 0.5, -10.6, 4, 1, '#3a342c', 'x'); // exhaust
  crewSide(ctx, 5, -16.5, false);
  crewSide(ctx, -5.5, -16.5, !v);
  ctx.strokeStyle = '#1a1a16'; // steering wheel
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(9.4, -19);
  ctx.lineTo(10.4, -23.5);
  ctx.stroke();
  tube(ctx, [-12, -16.8, -10, -32, 7, -32, 13, -17]); // the roll cage
  tube(ctx, [-10, -32, -1, -17], 1);
  tube(ctx, [-2, -32, -1.5, -17], 1);
  lightBar(ctx, 0.5, -33.2, 7, 4);
  antenna(ctx, -L + 4, -17, 22, -0.35);
  if (v) viperPod(ctx);
  else jackalGun(ctx);
}

function jackalGun(ctx: Ctx): void {
  cylinder(ctx, -6.8, -36.5, 1.2, 4.6, '#3a3a34', 'y'); // the post on the rear hoop
  plate(ctx, -9.4, -38.6, 6.4, 2.6, '#34362f', INK, 0.3); // receiver
  cylinder(ctx, -3, -38, 13, 1, C.gun, 'x');
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  for (let x = -2; x < 4; x += 1.2) ctx.fillRect(x, -38, 0.4, 1);
  plate(ctx, -9, -36.2, 3, 2.6, C.can, INK, 0.3); // ammo can
}

function viperPod(ctx: Ctx): void {
  ctx.save();
  ctx.translate(-16, -20);
  ctx.rotate(-0.32);
  plate(ctx, -1, -8.5, 19, 8.5, '#4a5030', INK, 0.5);
  for (let r = 0; r < 2; r++) {
    lens(ctx, 18, -6.4 + r * 4.2, 1.4, '#141410');
    lens(ctx, 18, -6.4 + r * 4.2, 0.8, C.red);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  for (let x = 3; x < 17; x += 3.5) ctx.fillRect(x, -8.3, 0.35, 8.1);
  ctx.restore();
  cylinder(ctx, -14, -21, 1.4, 5, '#3a3a34', 'y'); // the cradle
}

/** The flared fenders over the tyres, in the vehicle's paint. */
function fenders(ctx: Ctx, id: BuggyId, look: Look): void {
  const b = BUGGY_SIDE[id];
  for (const x of [-b.wheelX, b.wheelX]) {
    const pts: number[] = [];
    for (let k = 0; k <= 8; k++) {
      const a = Math.PI * (1.1 + (0.8 * k) / 8);
      pts.push(x + Math.cos(a) * (b.r + 2.2), -b.r + Math.sin(a) * (b.r + 2.2));
    }
    for (let k = 8; k >= 0; k--) {
      const a = Math.PI * (1.1 + (0.8 * k) / 8);
      pts.push(x + Math.cos(a) * (b.r + 0.9), -b.r + Math.sin(a) * (b.r + 0.9));
    }
    painted(ctx, pts, look, `${id}-fender`);
  }
}

export function drawBuggySide(ctx: Ctx, id: BuggyId, look: Look, t: number): void {
  const b = BUGGY_SIDE[id];
  const key = `${id}-${lookKey(look)}`;
  drawCached(ctx, `${key}-side`, [32, 44], (g) => body(g, id, look));
  for (const x of [-b.wheelX, b.wheelX]) tyreSide(ctx, x, -b.r, b.r, -t * 9);
  drawCached(ctx, `${key}-fenders`, [28, 18], (g) => fenders(g, id, look));
}
