import { TAU } from '../core/math';
import { SONAR, sonarRadius } from '../game/sub-flight';

// Shots that need their own look: the spacecraft's plasma torpedo (doc 57), and under the sea (docs 67, 68) the harpoon
// bolts, torpedoes (the MK48 and the enemy's), the sinking depth mine and the sonar ring.

/** A plasma torpedo (doc 57): a pulsing orange ball with a white-hot heart. */
export function plasmaBolt(ctx: CanvasRenderingContext2D, x: number, y: number, ttl: number): void {
  const r = 6 + Math.sin(ttl * 40) * 1.2;
  ctx.fillStyle = 'rgba(255,140,60,0.35)';
  ctx.beginPath();
  ctx.arc(x, y, r * 1.9, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffb35a';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff4d8';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.45, 0, TAU);
  ctx.fill();
}

/** A harpoon bolt: a short steel dart with a barbed head and a thin line of bubbles behind. */
export function harpoonBolt(ctx: CanvasRenderingContext2D, x: number, y: number, tip = '#eef6fa'): void {
  ctx.fillStyle = 'rgba(220,245,255,0.45)';
  for (let k = 1; k <= 3; k++) ctx.fillRect(x - 0.5 + (k % 2), y + 4 + k * 4, 1.5, 1.5);
  ctx.fillStyle = '#c9d3da';
  ctx.fillRect(x - 1, y - 6, 2, 11);
  ctx.fillStyle = tip; // the loaded bolts' colour (doc 101)
  ctx.beginPath();
  ctx.moveTo(x, y - 10);
  ctx.lineTo(x + 2.5, y - 5);
  ctx.lineTo(x - 2.5, y - 5);
  ctx.closePath();
  ctx.fill();
}

/** A torpedo along `heading`: a dark cylinder with a ducted screw; the enemy's has a red nose. */
export function torpedo(ctx: CanvasRenderingContext2D, x: number, y: number, heading: number, enemy: boolean): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(heading);
  ctx.fillStyle = enemy ? '#3a3236' : '#2f3a44';
  ctx.beginPath();
  ctx.roundRect(-2.5, -9, 5, 17, 2.5);
  ctx.fill();
  ctx.fillStyle = enemy ? '#d8483a' : '#c8a24a';
  ctx.fillRect(-2.5, -7, 5, 1.6);
  ctx.fillStyle = '#7a8288';
  ctx.fillRect(-4, 7, 8, 2);
  ctx.restore();
}

/** A depth mine on its way down: a spiked ball, shrinking as it sinks (`s` 1 → 0.1). */
export function sinkingMine(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  const r = 6 * s + 1.5;
  ctx.fillStyle = '#262b31';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    ctx.fillRect(x + Math.cos(a) * r * 1.3 - 1, y + Math.sin(a) * r * 1.3 - 1, 2, 2);
  }
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(x - r, y - 0.75, r * 2, 1.5);
}

/** The Type 212's sonar ring (doc 67): a bright front with a fainter echo behind it, fading as it reaches out. */
export function sonarRing(ctx: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  const fade = Math.max(0, 1 - t / (SONAR.time + 0.25));
  for (const [lag, alpha, width] of [[0, 0.85, 4], [0.1, 0.35, 2]] as const) {
    ctx.strokeStyle = `rgba(150,255,235,${(alpha * fade).toFixed(3)})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1, sonarRadius(t - lag)), 0, TAU);
    ctx.stroke();
  }
}
