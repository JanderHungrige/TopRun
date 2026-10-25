import { TAU } from '../core/math';
import { FONT_DISPLAY } from './text';

/**
 * The TopGun badge: an original emblem in the 80s naval-aviation style — gold wings,
 * a star roundel, chrome italic lettering and a red "CARRIER STRIKE" ribbon.
 * (Deliberately not the film's logo, which is a third-party trademark.)
 */
export function drawLogo(ctx: CanvasRenderingContext2D, cx: number, y: number, t: number): void {
  drawWings(ctx, cx, y - 44);
  drawRoundel(ctx, cx, y - 112, t);
  drawWordmark(ctx, cx, y, t);
  drawRibbon(ctx, cx, y + 40);
}

function wing(ctx: CanvasRenderingContext2D, cx: number, y: number, side: number): void {
  // Five feather rows, each a tapered blade sweeping outward and slightly up.
  for (let i = 0; i < 5; i++) {
    const inner = 70 + i * 6;
    const outer = 430 - i * 62;
    const lift = -26 + i * 13;
    const thick = 15 - i * 1.4;
    ctx.beginPath();
    ctx.moveTo(cx + side * inner, y + i * 11);
    ctx.quadraticCurveTo(cx + side * (inner + outer) * 0.55, y + lift - 18 + i * 11, cx + side * outer, y + lift + i * 7);
    ctx.quadraticCurveTo(cx + side * (inner + outer) * 0.5, y + lift + thick + i * 11, cx + side * inner, y + thick + i * 11);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, y - 30, 0, y + 70);
    g.addColorStop(0, '#fff3b8');
    g.addColorStop(0.5, '#e8b83a');
    g.addColorStop(1, '#9a6a12');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#4a2a06';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawWings(ctx: CanvasRenderingContext2D, cx: number, y: number): void {
  ctx.save();
  wing(ctx, cx, y, -1);
  wing(ctx, cx, y, 1);
  ctx.restore();
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.42;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

function drawRoundel(ctx: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 46, 0, TAU);
  ctx.fillStyle = '#1b2a4a';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#e8b83a';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 36, 0, TAU);
  ctx.strokeStyle = '#c8202f';
  ctx.lineWidth = 5;
  ctx.stroke();
  star(ctx, x, y + 2, 30);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  const pulse = 0.25 + 0.2 * Math.sin(t * 2);
  ctx.fillStyle = `rgba(255,240,180,${pulse})`;
  ctx.fill();
  ctx.restore();
}

function drawWordmark(ctx: CanvasRenderingContext2D, cx: number, y: number, t: number): void {
  ctx.save();
  ctx.font = `italic 900 124px ${FONT_DISPLAY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const g = ctx.createLinearGradient(0, y - 104, 0, y + 6);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.46, '#d6e0ea');
  g.addColorStop(0.5, '#7f93a8');
  g.addColorStop(0.78, '#c9d6e2');
  g.addColorStop(1, '#ffffff');
  ctx.lineJoin = 'round';
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#0d1a33';
  ctx.strokeText('TOPGUN', cx, y);
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#c8202f';
  ctx.strokeText('TOPGUN', cx, y);
  ctx.fillStyle = g;
  ctx.fillText('TOPGUN', cx, y);
  // A glint sweeping across the chrome.
  const shine = cx - 520 + (((t * 0.35) % 1.6) / 1.6) * 1040;
  const glint = ctx.createLinearGradient(shine - 60, 0, shine + 60, 0);
  glint.addColorStop(0, 'rgba(255,255,255,0)');
  glint.addColorStop(0.5, 'rgba(255,255,255,0.6)');
  glint.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glint;
  ctx.fillText('TOPGUN', cx, y);
  ctx.restore();
}

function drawRibbon(ctx: CanvasRenderingContext2D, cx: number, y: number): void {
  const w = 300;
  const h = 34;
  ctx.save();
  for (const side of [-1, 1]) {
    // Folded tails behind the band.
    ctx.beginPath();
    ctx.moveTo(cx + side * (w / 2 - 10), y + 8);
    ctx.lineTo(cx + side * (w / 2 + 44), y + 8);
    ctx.lineTo(cx + side * (w / 2 + 28), y + 8 + h / 2);
    ctx.lineTo(cx + side * (w / 2 + 44), y + 8 + h);
    ctx.lineTo(cx + side * (w / 2 - 10), y + 8 + h);
    ctx.closePath();
    ctx.fillStyle = '#7d1019';
    ctx.fill();
  }
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, y, w, h, 4);
  ctx.fillStyle = '#c8202f';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#e8b83a';
  ctx.stroke();
  ctx.font = `900 19px ${FONT_DISPLAY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '5px';
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText('CARRIER STRIKE', cx + 2, y + h / 2 + 1);
  ctx.restore();
}
