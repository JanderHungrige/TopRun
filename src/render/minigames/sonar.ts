import { SONAR_GRID, type Cell, type Ping } from '../../game/minigames/sonar';
import { COLORS, text } from '../text';

// SONAR HUNT's screen (doc 88): the sonar chart — dark water in a green grid with a turning sweep, the echo rings of the
// last pings, the cursor, the torpedo's run and the sinking sub — and its hub icon.

export const CELL = 76;
export const CHART = { x: (1280 - SONAR_GRID.w * CELL) / 2, y: 92, w: SONAR_GRID.w * CELL, h: SONAR_GRID.h * CELL };

export const cellCentre = (c: Cell): { x: number; y: number } => ({ x: CHART.x + (c.x + 0.5) * CELL, y: CHART.y + (c.y + 0.5) * CELL });

export function cellAtPoint(p: { x: number; y: number }): Cell | null {
  const x = Math.floor((p.x - CHART.x) / CELL);
  const y = Math.floor((p.y - CHART.y) / CELL);
  return x >= 0 && y >= 0 && x < SONAR_GRID.w && y < SONAR_GRID.h ? { x, y } : null;
}

export function drawChart(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.fillStyle = '#021a1c';
  ctx.fillRect(0, 56, 1280, 664);
  ctx.fillStyle = '#04282a';
  ctx.fillRect(CHART.x, CHART.y, CHART.w, CHART.h);
  ctx.strokeStyle = 'rgba(90,240,190,0.18)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= SONAR_GRID.w; x++) {
    ctx.beginPath();
    ctx.moveTo(CHART.x + x * CELL, CHART.y);
    ctx.lineTo(CHART.x + x * CELL, CHART.y + CHART.h);
    ctx.stroke();
  }
  for (let y = 0; y <= SONAR_GRID.h; y++) {
    ctx.beginPath();
    ctx.moveTo(CHART.x, CHART.y + y * CELL);
    ctx.lineTo(CHART.x + CHART.w, CHART.y + y * CELL);
    ctx.stroke();
  }
  const cx = CHART.x + CHART.w / 2;
  const cy = CHART.y + CHART.h / 2;
  const a = t * 1.2;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, CHART.w * 0.7);
  g.addColorStop(0, 'rgba(90,240,190,0.12)');
  g.addColorStop(1, 'rgba(90,240,190,0)');
  ctx.save();
  ctx.beginPath();
  ctx.rect(CHART.x, CHART.y, CHART.w, CHART.h);
  ctx.clip();
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, CHART.w, a - 0.5, a);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** The echo rings: each ping's ring out to the sub's distance, the newest brightest. */
export function drawPings(ctx: CanvasRenderingContext2D, pings: readonly Ping[], t: number): void {
  pings.forEach((p, i) => {
    const c = cellCentre(p.at);
    const fresh = (i + 1) / pings.length;
    ctx.strokeStyle = `rgba(120,255,200,${(0.25 + fresh * 0.6).toFixed(2)})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 6]);
    ctx.lineDashOffset = -t * 30;
    ctx.beginPath();
    ctx.arc(c.x, c.y, Math.max(6, p.range * CELL), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(120,255,200,0.9)';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function drawCursor(ctx: CanvasRenderingContext2D, c: Cell, t: number): void {
  const x = CHART.x + c.x * CELL;
  const y = CHART.y + c.y * CELL;
  ctx.strokeStyle = `rgba(255,215,106,${(0.6 + Math.sin(t * 8) * 0.3).toFixed(2)})`;
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 4, y + 4, CELL - 8, CELL - 8);
}

/** A sub breaking up where it was hit (age 0 → 1). */
export function drawSinking(ctx: CanvasRenderingContext2D, c: Cell, age: number): void {
  const p = cellCentre(c);
  ctx.globalAlpha = Math.max(0, 1 - age);
  ctx.fillStyle = '#ff8a3d';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 10 + age * 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#20262c';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + age * 10, 30, 9, 0.3 + age, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function drawStatus(ctx: CanvasRenderingContext2D, left: string, right: string, flash: string | null): void {
  text(ctx, left, CHART.x, CHART.y + CHART.h + 30, { size: 20, display: true, color: COLORS.cyan });
  text(ctx, right, CHART.x + CHART.w, CHART.y + CHART.h + 30, { size: 20, display: true, align: 'right', color: COLORS.gold });
  if (flash) text(ctx, flash, 640, CHART.y + CHART.h + 30, { size: 24, display: true, align: 'center', color: COLORS.gold });
}

/** The hub card's icon: a round sonar screen with a sweep and a blip. */
export function drawSonarIcon(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.fillStyle = '#04282a';
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,255,200,0.7)';
  ctx.lineWidth = 2;
  for (const r of [12, 24, 34]) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(t * 2) * 34, Math.sin(t * 2) * 34);
  ctx.stroke();
  ctx.fillStyle = '#ff8a3d';
  ctx.beginPath();
  ctx.arc(14, -10, 4, 0, Math.PI * 2);
  ctx.fill();
}
