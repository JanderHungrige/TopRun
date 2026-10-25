import { circle } from '../shapes';
import { cached, fillPath, LIGHT, shape, SHADE, strokePath, sym, tube, type AirPal } from './kit';

/** Small aircraft parts drawn on top of (or under) an airframe: stores, nozzles, fins, lights. */

interface MissileParts { body: Path2D; side: Path2D; fins: Path2D; nose: Path2D }
const MISSILES = new Map<string, MissileParts>();

function missileParts(len: number, r: number): MissileParts {
  const key = `${len}:${r}`;
  let m = MISSILES.get(key);
  if (!m) {
    const e = -len;
    m = {
      body: shape([sym([0, 0, r * 0.55, -r * 0.6, r * 0.9, -r * 1.6, r, -r * 2.8, r, e + 0.2, r * 0.75, e, 0, e])]),
      side: shape([[r * 0.25, -r * 2, r, -r * 2.8, r, e + 0.2, r * 0.25, e + 0.2]]),
      fins: shape([], [
        [r * 0.8, e + r * 4.4, r * 3.1, e + r * 1.1, r * 3.1, e + 0.15, r * 0.8, e + 0.35],
        [r * 0.8, -r * 3.4, r * 2.3, -r * 4.6, r * 2.3, -r * 5.2, r * 0.8, -r * 5.6],
      ]),
      nose: shape([sym([0, 0, r * 0.55, -r * 0.6, r * 0.88, -r * 1.5, 0, -r * 1.55])]),
    };
    MISSILES.set(key, m);
  }
  return m;
}

/** Air-to-air missile, nose at (x, y) pointing +y. Hidden in silhouettes (it hangs under the wing). */
export function missile(ctx: CanvasRenderingContext2D, a: AirPal, x: number, y: number, len: number, r: number): void {
  if (a.mono) return;
  const m = missileParts(len, r);
  ctx.translate(x, y);
  fillPath(ctx, m.fins, '#8f948f');
  fillPath(ctx, m.body, a.store);
  fillPath(ctx, m.side, 'rgba(0,0,0,0.18)');
  fillPath(ctx, m.nose, '#394046');
  ctx.translate(-x, -y);
}

/** Rocket pod (seen from above): blunt cylinder with a dark front ring, nose at (x, y). */
export function pod(ctx: CanvasRenderingContext2D, a: AirPal, x: number, y: number, len: number, r: number, fill = a.store): void {
  if (a.mono) return;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x - r, y - len, r * 2, len, [r * 0.4, r * 0.4, r * 0.9, r * 0.9]);
  ctx.fill();
  ctx.fillStyle = tube(ctx, -r, r);
  ctx.translate(x, 0);
  ctx.fill();
  ctx.translate(-x, 0);
  ctx.fillStyle = a.dark;
  ctx.fillRect(x - r, y - r * 0.55, r * 2, r * 0.3);
  ctx.fillRect(x - r * 0.8, y - len + r * 0.4, r * 1.6, r * 0.25);
}

/** Engine nozzle seen from above: tapering metal section from the airframe joint y back to y - len. */
export function nozzle(ctx: CanvasRenderingContext2D, a: AirPal, x: number, y: number, hw: number, len: number): void {
  ctx.beginPath();
  ctx.moveTo(x - hw, y);
  ctx.lineTo(x + hw, y);
  ctx.lineTo(x + hw * 0.86, y - len);
  ctx.lineTo(x - hw * 0.86, y - len);
  ctx.closePath();
  ctx.fillStyle = a.metal;
  ctx.fill();
  if (a.mono) return;
  ctx.fillStyle = tube(ctx, x - hw, x + hw);
  ctx.fill();
  ctx.beginPath();
  for (let i = -2; i <= 2; i++) {
    ctx.moveTo(x + i * hw * 0.37, y - len * 0.25);
    ctx.lineTo(x + i * hw * 0.32, y - len);
  }
  ctx.lineWidth = 0.22;
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(x - hw, y - 0.35, hw * 2, 0.35);
  ctx.fillStyle = 'rgba(20,16,14,0.85)';
  ctx.fillRect(x - hw * 0.86, y - len, hw * 1.72, 0.5);
}

/** Heat / soot staining on the airframe just ahead of a nozzle joint at (x, y), fading toward the nose. */
export function soot(ctx: CanvasRenderingContext2D, a: AirPal, x: number, y: number, hw: number, len: number): void {
  if (a.mono) return;
  ctx.fillStyle = cached(ctx, `soot${y}:${len}`, () => {
    const g = ctx.createLinearGradient(0, y + len, 0, y);
    g.addColorStop(0, 'rgba(34,26,20,0)');
    g.addColorStop(1, 'rgba(34,26,20,0.5)');
    return g;
  });
  ctx.beginPath();
  ctx.ellipse(x, y, hw, len, 0, 0, Math.PI);
  ctx.fill();
}

/** Vertical fin seen from above (only its thin top surface shows). */
export interface Fin { body: Path2D; shade: Path2D; lit: Path2D; hinge: Path2D }

export function drawFin(ctx: CanvasRenderingContext2D, a: AirPal, f: Fin, cap?: string): void {
  strokePath(ctx, f.body, a.outline, 0.6);
  fillPath(ctx, f.body, a.base);
  if (a.mono) return;
  fillPath(ctx, f.lit, LIGHT);
  fillPath(ctx, f.shade, SHADE);
  strokePath(ctx, f.hinge, a.hinge, 0.3);
  if (cap) fillPath(ctx, f.lit, cap);
}

/** Port (+x, red) and starboard (-x, green) wingtip lights. */
export function navLights(ctx: CanvasRenderingContext2D, a: AirPal, x: number, y: number): void {
  if (a.mono) return;
  circle(ctx, x, y, 0.4, '#ff4b3a');
  circle(ctx, -x, y, 0.4, '#46e07a');
}

/** Blinking red anti-collision beacon (live units only). */
export function beacon(ctx: CanvasRenderingContext2D, a: AirPal, x: number, y: number, t: number): void {
  if (a.mono || !a.live) return;
  const on = (((t * 1.1) % 1) + 1) % 1 < 0.14;
  if (on) circle(ctx, x, y, 1.6, 'rgba(255,70,50,0.28)');
  circle(ctx, x, y, 0.5, on ? '#ff8a70' : '#6b2620');
}
