import { TAU } from '../../core/math';

// Helicopter rotors (doc 50): a translucent spinning disc with blurred blades, from above or face-on, and the
// edge-on blade line of a side view. Turn rates are for the eye, not the real rpm (that would strobe at 60 fps).

const BLADE = 'rgba(24,27,22,0.62)';
const BLUR = 'rgba(24,27,22,0.12)';
const DISC = 'rgba(24,27,22,0.11)';

/** A rotor seen along its axis: the disc, `blades` blades turning at `spin` rad/s, each trailing a blur wedge. */
export function rotorDisc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, blades: number, t: number, spin: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = DISC;
  ctx.fill();
  ctx.strokeStyle = 'rgba(24,27,22,0.16)';
  ctx.lineWidth = 0.6;
  ctx.stroke();
  const a0 = t * spin;
  const trail = Math.sign(spin) * -0.42;
  for (let k = 0; k < blades; k++) {
    const a = a0 + (k * TAU) / blades;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, r * 0.97, Math.min(a, a + trail), Math.max(a, a + trail));
    ctx.closePath();
    ctx.fillStyle = BLUR;
    ctx.fill();
    ctx.strokeStyle = BLADE;
    ctx.lineWidth = Math.max(0.9, r * 0.055);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.08, y + Math.sin(a) * r * 0.08);
    ctx.lineTo(x + Math.cos(a) * r * 0.98, y + Math.sin(a) * r * 0.98);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(x, y, Math.max(1.2, r * 0.07), 0, TAU);
  ctx.fillStyle = '#23261f';
  ctx.fill();
  ctx.restore();
}

/** A main rotor seen from the side: the blade line flickering in length as the blades come round, and the hub. */
export function rotorEdge(ctx: CanvasRenderingContext2D, x: number, y: number, half: number, t: number): void {
  ctx.save();
  const flick = 0.55 + 0.45 * Math.abs(Math.cos(t * 9));
  ctx.strokeStyle = 'rgba(24,27,22,0.28)';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(x - half, y);
  ctx.lineTo(x + half, y);
  ctx.stroke();
  ctx.strokeStyle = BLADE;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x - half * flick, y);
  ctx.lineTo(x + half * flick, y);
  ctx.stroke();
  ctx.fillStyle = '#23261f';
  ctx.fillRect(x - 2.5, y - 1.5, 5, 4);
  ctx.restore();
}

/** A tail rotor seen edge-on from above: a thin flickering bar. */
export function rotorBar(ctx: CanvasRenderingContext2D, x: number, y: number, half: number, t: number): void {
  ctx.save();
  ctx.fillStyle = `rgba(24,27,22,${(0.25 + 0.25 * Math.abs(Math.sin(t * 23))).toFixed(2)})`;
  ctx.beginPath();
  ctx.ellipse(x, y, 0.9, half, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}
