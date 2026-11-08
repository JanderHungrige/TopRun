import { DOCK, speedOf, type DockState } from '../../game/minigames/docking';
import { COLORS, text } from '../text';

// STATION DOCKING's screen (doc 89): stars and the curve of the Earth, the station with its port and guide lights, the
// approach line, the shuttle with its thruster flames, the HUD — and the hub icon.

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function drawSpace(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.fillStyle = '#03050c';
  ctx.fillRect(0, 56, 1280, 664);
  for (let i = 0; i < 160; i++) {
    const a = 0.3 + 0.6 * Math.abs(Math.sin(t * 0.7 + i));
    ctx.fillStyle = `rgba(220,230,255,${(a * hash(i * 3)).toFixed(2)})`;
    ctx.fillRect(hash(i) * 1280, 56 + hash(i * 7) * 664, 2, 2);
  }
  const g = ctx.createRadialGradient(400, 1500, 820, 400, 1500, 900);
  g.addColorStop(0, '#2f74b4');
  g.addColorStop(0.9, '#5aa6dc');
  g.addColorStop(1, 'rgba(120,200,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(400, 1500, 900, 0, Math.PI * 2);
  ctx.fill();
}

export function drawStation(ctx: CanvasRenderingContext2D, portY: number, t: number): void {
  const x = DOCK.face;
  ctx.fillStyle = '#9aa4b0';
  ctx.fillRect(x, 70, 120, 640);
  ctx.fillStyle = '#c8d0d8';
  ctx.fillRect(x, 70, 14, 640);
  for (let y = 100; y < 700; y += 60) {
    ctx.fillStyle = '#6a7480';
    ctx.fillRect(x + 20, y, 90, 4);
  }
  for (const py of [140, 640]) {
    ctx.fillStyle = '#1e3a6a';
    ctx.fillRect(x + 120, py - 40, 120, 80);
    ctx.strokeStyle = '#5aa6dc';
    ctx.lineWidth = 1;
    for (let k = 0; k < 6; k++) ctx.strokeRect(x + 120 + k * 20, py - 40, 20, 80);
  }
  ctx.fillStyle = '#05080e';
  ctx.fillRect(x - 4, portY - DOCK.tolerance - 8, 30, (DOCK.tolerance + 8) * 2);
  ctx.strokeStyle = '#e9f2f7';
  ctx.lineWidth = 3;
  ctx.strokeRect(x - 4, portY - DOCK.tolerance - 8, 30, (DOCK.tolerance + 8) * 2);
  const blink = Math.sin(t * 6) > 0;
  for (const dy of [-DOCK.tolerance - 14, DOCK.tolerance + 14]) {
    ctx.fillStyle = blink ? '#5be37d' : '#1a4a28';
    ctx.fillRect(x - 10, portY + dy - 3, 6, 6);
  }
  ctx.strokeStyle = 'rgba(91,227,125,0.35)';
  ctx.setLineDash([12, 10]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 6, portY);
  ctx.lineTo(x - 420, portY);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawShuttle(ctx: CanvasRenderingContext2D, s: DockState, thrust: { x: number; y: number }, t: number): void {
  ctx.save();
  ctx.translate(s.x, s.y);
  const flame = (fx: number, fy: number, dx: number, dy: number): void => {
    ctx.fillStyle = `rgba(255,190,90,${(0.6 + Math.sin(t * 40) * 0.3).toFixed(2)})`;
    ctx.beginPath();
    ctx.moveTo(fx - dy * 5, fy - dx * 5);
    ctx.lineTo(fx + dy * 5, fy + dx * 5);
    ctx.lineTo(fx + dx * 22, fy + dy * 22);
    ctx.fill();
  };
  if (s.fuel > 0 && s.phase === 'fly') {
    if (thrust.x > 0) flame(-30, 0, -1, 0);
    if (thrust.x < 0) flame(26, 0, 1, 0);
    if (thrust.y > 0) flame(0, -14, 0, -1);
    if (thrust.y < 0) flame(0, 14, 0, 1);
  }
  ctx.fillStyle = '#e9edf2';
  ctx.beginPath();
  ctx.moveTo(30, 0);
  ctx.lineTo(10, -12);
  ctx.lineTo(-30, -12);
  ctx.lineTo(-30, 12);
  ctx.lineTo(10, 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1e3a44';
  ctx.fillRect(8, -6, 12, 12);
  ctx.fillStyle = '#c84a2a';
  ctx.fillRect(-30, -12, 6, 24);
  ctx.restore();
}

export function drawDockHud(ctx: CanvasRenderingContext2D, s: DockState, labels: { round: string; speed: string; fuel: string; time: string }): void {
  const v = speedOf(s);
  const color = v <= DOCK.soft ? COLORS.green : v < DOCK.limit ? COLORS.gold : COLORS.red;
  text(ctx, labels.round, 24, 96, { size: 18, display: true, color: COLORS.cyan });
  text(ctx, labels.speed, 24, 126, { size: 18, display: true, color });
  text(ctx, labels.time, 24, 156, { size: 16, color: COLORS.ink });
  text(ctx, labels.fuel, 24, 186, { size: 12, color: COLORS.dim });
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(24, 194, 200, 10);
  ctx.fillStyle = s.fuel > 25 ? '#5be37d' : '#ff9d2e';
  ctx.fillRect(24, 194, 2 * s.fuel, 10);
}

/** The hub card's icon: a shuttle nosing into a port. */
export function drawDockingIcon(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.fillStyle = '#9aa4b0';
  ctx.fillRect(14, -34, 22, 68);
  ctx.fillStyle = '#05080e';
  ctx.fillRect(14, -10, 10, 20);
  const x = -30 + ((t * 10) % 20);
  ctx.fillStyle = '#e9edf2';
  ctx.beginPath();
  ctx.moveTo(x + 22, 0);
  ctx.lineTo(x + 8, -8);
  ctx.lineTo(x - 18, -8);
  ctx.lineTo(x - 18, 8);
  ctx.lineTo(x + 8, 8);
  ctx.closePath();
  ctx.fill();
}
