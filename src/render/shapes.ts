/** Small path helpers shared by all vector art. Points are flat [x0, y0, x1, y1, ...] arrays. */

/** Closed symmetric outline: `right` runs from the top centre down the right side; the left side is mirrored. */
export function symPath(ctx: CanvasRenderingContext2D, right: readonly number[]): void {
  ctx.beginPath();
  for (let i = 0; i < right.length; i += 2) {
    const x = right[i] ?? 0;
    const y = right[i + 1] ?? 0;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  for (let i = right.length - 2; i >= 0; i -= 2) ctx.lineTo(-(right[i] ?? 0), right[i + 1] ?? 0);
  ctx.closePath();
}

export function polyPath(ctx: CanvasRenderingContext2D, pts: readonly number[], mirror = false): void {
  ctx.beginPath();
  for (let i = 0; i < pts.length; i += 2) {
    const x = (pts[i] ?? 0) * (mirror ? -1 : 1);
    const y = pts[i + 1] ?? 0;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** Fills (and optionally strokes) a polygon and its mirror image across x = 0. */
export function fillPair(ctx: CanvasRenderingContext2D, pts: readonly number[], fill: string, stroke?: string): void {
  for (const m of [false, true]) {
    polyPath(ctx, pts, m);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }
}

export function fillSym(ctx: CanvasRenderingContext2D, right: readonly number[], fill: string, stroke?: string): void {
  symPath(ctx, right);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

export function fillPoly(ctx: CanvasRenderingContext2D, pts: readonly number[], fill: string, stroke?: string): void {
  polyPath(ctx, pts);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

export function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, rot = 0): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

export function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/**
 * Afterburner / exhaust flame pointing along +y from (x, y) (rotate the context for other directions).
 * `power` 0..1 scales length; `t` drives the flicker.
 */
export function flame(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, power: number, t: number): void {
  if (power <= 0.02) return;
  const flick = 0.85 + Math.sin(t * 61) * 0.08 + Math.sin(t * 37) * 0.07;
  const len = (6 + power * 22) * flick;
  const g = ctx.createLinearGradient(x, y, x, y + len);
  g.addColorStop(0, 'rgba(255,255,230,0.95)');
  g.addColorStop(0.25, 'rgba(255,200,80,0.9)');
  g.addColorStop(0.7, 'rgba(255,90,30,0.55)');
  g.addColorStop(1, 'rgba(255,60,20,0)');
  ctx.beginPath();
  ctx.moveTo(x - width / 2, y);
  ctx.quadraticCurveTo(x - width * 0.45, y + len * 0.55, x, y + len);
  ctx.quadraticCurveTo(x + width * 0.45, y + len * 0.55, x + width / 2, y);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
}
