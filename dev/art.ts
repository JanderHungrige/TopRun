// Dev-only jet art preview: http://localhost:5173/dev/art.html (not part of the production build).
// #top: every livery top-down (scale 1.5, 1 and the 0.62 hangar thumb) · #side: every livery side view ·
// #anim: sweep / bank / throttle / gear animation with the mission shadow · #big/<livery>: scale 3 + side ×2.4.
// The grids show the three map-1 jets; art.html?new shows the three map-2 jets (doc 36) instead.
import { LIVERY_IDS, type LiveryId } from '../src/data/liveries';
import { PLANE_IDS } from '../src/data/types';
import { drawPlaneTop } from '../src/render/draw-planes';
import { drawPlaneSide } from '../src/render/draw-planes-side';
import { liverySwatch } from '../src/render/livery-art';

// Layout is in 1400 × 1000 units, scaled to the window width; #zoom draws 1:1 for close inspection.
const W = 1400;
const H = 1000;
const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
const dpr = window.devicePixelRatio || 1;
const cssW = window.innerWidth;
const cssH = Math.round(window.innerHeight - 40);
canvas.width = cssW * dpr;
canvas.height = cssH * dpr;
canvas.style.width = `${cssW}px`;
canvas.style.height = `${cssH}px`;

/** The jets the grid views show: three at a time (map 1, or map 2 with ?new). */
const JETS = location.search.includes('new') ? PLANE_IDS.slice(3) : PLANE_IDS.slice(0, 3);

const big = document.getElementById('big');
if (big) big.innerHTML = LIVERY_IDS.map((id) => `<a href="#big/${id}">${id}</a>`).join(' ');

function label(text: string, x: number, y: number, align: CanvasTextAlign = 'center'): void {
  ctx.fillStyle = '#e8f0f8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function swatch(id: LiveryId, x: number, y: number): void {
  liverySwatch(id).forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + i * 9, y, 9, 9);
  });
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.strokeRect(x, y, 27, 9);
}

function topGrid(t: number): void {
  const cw = W / LIVERY_IDS.length;
  LIVERY_IDS.forEach((id, c) => {
    const x = cw * (c + 0.5);
    label(id, x, 18);
    swatch(id, x - 13, 24);
    JETS.forEach((plane, r) => {
      const y = 110 + r * 150;
      drawPlaneTop(ctx, plane, x + 10, y + 16, 1.5, { shadow: true, sweep: 0.3, livery: id });
      drawPlaneTop(ctx, plane, x, y, 1.5, { t, throttle: 0.5, sweep: 0.3, livery: id });
      drawPlaneTop(ctx, plane, x - 26, 590 + r * 110, 1, { t, throttle: 0.5, sweep: 0.2, livery: id });
      drawPlaneTop(ctx, plane, x + 28, 590 + r * 110, 0.62, { t, throttle: 0.3, sweep: 0.3, livery: id });
    });
  });
}

function sideGrid(t: number): void {
  const cols = 4;
  LIVERY_IDS.forEach((id, i) => {
    const x = 175 + (i % cols) * 350;
    const y0 = 20 + Math.floor(i / cols) * 330;
    label(id, x, y0 + 12);
    swatch(id, x - 13, y0 + 18);
    JETS.forEach((plane, r) => {
      drawPlaneSide(ctx, plane, x + 10, y0 + 110 + r * 95, 1.25, { t, throttle: 0.4, gear: 1, livery: id });
    });
  });
}

function anim(t: number): void {
  const sweep = (Math.sin(t * 0.8) + 1) / 2;
  const bank = Math.sin(t * 0.7);
  const throttle = (Math.sin(t * 1.3) + 1) / 2;
  JETS.forEach((plane, i) => {
    const x = 240 + i * 460;
    drawPlaneTop(ctx, plane, x + 16 * 2.4, 200 + 26 * 2.4, 2.4, { shadow: true, sweep, bank });
    drawPlaneTop(ctx, plane, x, 200, 2.4, { t, throttle, sweep, bank });
    drawPlaneTop(ctx, plane, x + 16, 470 + 26, 1, { shadow: true, sweep, bank });
    drawPlaneTop(ctx, plane, x, 470, 1, { t, throttle, sweep, bank });
    drawPlaneTop(ctx, plane, x + 90, 470, 1, { flash: true, sweep });
    const gear = (Math.sin(t * 0.9) + 1) / 2;
    drawPlaneSide(ctx, plane, x, 760, 2, { t, throttle, gear, hook: gear < 0.5, pitch: (1 - gear) * 0.2 });
    drawPlaneSide(ctx, plane, x, 920, 0.75, { t, throttle: 0.8, gear: 0, pitch: 0.06 });
  });
  label(`sweep ${sweep.toFixed(2)} · bank ${bank.toFixed(2)} · throttle ${throttle.toFixed(2)}`, 20, 30, 'left');
}

function bigView(id: LiveryId, t: number): void {
  label(id, W / 2, 24);
  JETS.forEach((plane, i) => {
    const x = 240 + i * 460;
    drawPlaneTop(ctx, plane, x + 20, 300 + 22, 3, { shadow: true, sweep: 0.15, livery: id });
    drawPlaneTop(ctx, plane, x, 300, 3, { t, throttle: 0.5, sweep: 0.15, livery: id });
    drawPlaneSide(ctx, plane, x, 720, 2.4, { t, throttle: 0.3, gear: 1, livery: id });
    drawPlaneSide(ctx, plane, x, 900, 1.25, { t, throttle: 0.3, gear: 1, livery: id });
  });
}

/** Close-up at 1:1 pixels: top view ×6 and side view ×3.6 of one jet (#zoom/<plane>/<livery>). */
function zoom(planeArg: string | undefined, liveryArg: string | undefined, t: number, sweepArg?: string): void {
  const sweep = sweepArg ? Number(sweepArg) : 0.1;
  const plane = PLANE_IDS.find((p) => p === planeArg) ?? 'f16';
  const id = LIVERY_IDS.find((l) => l === liveryArg) ?? 'standard';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#1d6596';
  ctx.fillRect(0, 0, cssW, cssH);
  label(`${plane} · ${id}`, 10, 16, 'left');
  const k = plane === 'sr71' ? 4.6 : 6;
  drawPlaneTop(ctx, plane, cssW * 0.26, cssH * 0.5, k, { t, throttle: 0.5, sweep, livery: id });
  drawPlaneSide(ctx, plane, cssW * 0.72, cssH * 0.42, plane === 'sr71' ? 2.3 : 2.9, { t, throttle: 0.3, gear: 1, livery: id });
  drawPlaneTop(ctx, plane, cssW * 0.62, cssH * 0.8, 1, { t, throttle: 0.5, sweep, livery: id });
  drawPlaneTop(ctx, plane, cssW * 0.72, cssH * 0.8, 2, { t, throttle: 0.5, sweep, livery: id });
  drawPlaneSide(ctx, plane, cssW * 0.88, cssH * 0.8, 1.25, { t, throttle: 0.3, gear: 1, livery: id });
}

/** Side-view close-up at 1:1 pixels (#zside/<plane>/<livery>): ×6.5 plus the carrier (×1.25) and title (×0.75) sizes. */
function zside(planeArg: string | undefined, liveryArg: string | undefined, t: number): void {
  const plane = PLANE_IDS.find((p) => p === planeArg) ?? 'f16';
  const id = LIVERY_IDS.find((l) => l === liveryArg) ?? 'standard';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#7fa7c9';
  ctx.fillRect(0, 0, cssW, cssH);
  label(`${plane} · ${id}`, 10, 16, 'left');
  const k = (cssW * 0.85) / (plane === 'sr71' ? 152 : plane === 'f14' ? 128 : plane === 'tornado' ? 120 : 114);
  const gear = (Math.sin(t * 0.6) + 1) / 2;
  drawPlaneSide(ctx, plane, cssW * 0.5, cssH * 0.45, k, { t, throttle: 0.6, gear: 1, livery: id });
  drawPlaneSide(ctx, plane, cssW * 0.3, cssH * 0.85, 1.25, { t, throttle: 0.6, gear, hook: gear < 0.5, livery: id });
  drawPlaneSide(ctx, plane, cssW * 0.75, cssH * 0.85, 0.75, { t, throttle: 0.8, gear: 0, pitch: 0.06, livery: id });
}

/** One jet in all liveries at 1:1 pixels: #gal/<plane>[/<from>] (top view ×2.2) or #gals/<plane>[/<from>] (side view ×1.9). */
function gallery(planeArg: string | undefined, side: boolean, t: number, from = 0): void {
  const plane = PLANE_IDS.find((p) => p === planeArg) ?? 'f16';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = side ? '#7fa7c9' : '#1d6596';
  ctx.fillRect(0, 0, cssW, cssH);
  const cols = side ? 3 : 4;
  const cw = cssW / cols;
  const ch = side ? 128 : 210;
  LIVERY_IDS.slice(from).forEach((id, i) => {
    const x = cw * ((i % cols) + 0.5);
    const y = 20 + ch * Math.floor(i / cols);
    label(id, x - cw * 0.45, y, 'left');
    swatch(id, x - cw * 0.45, y + 6);
    if (side) drawPlaneSide(ctx, plane, x + 6, y + 100, plane === 'sr71' ? 1.5 : 1.8, { t, throttle: 0.4, gear: 1, livery: id });
    else drawPlaneTop(ctx, plane, x, y + 105, 2.2, { t, throttle: 0.5, sweep: 0.25, livery: id });
  });
}

/** Mission size at 1:1 pixels (#mission): every livery at scale 1 with the mission's shadow offset, banking. */
function mission(t: number): void {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#1d6596';
  ctx.fillRect(0, 0, cssW, cssH);
  ctx.fillStyle = '#a38f62';
  ctx.fillRect(0, cssH * 0.55, cssW, cssH * 0.45);
  const cw = cssW / LIVERY_IDS.length;
  LIVERY_IDS.forEach((id, c) => {
    JETS.forEach((plane, r) => {
      const x = cw * (c + 0.5);
      for (const [y, bank] of [[60 + r * 95, 0], [cssH * 0.55 + 50 + r * 95, Math.sin(t + c)]] as const) {
        const o = { t, throttle: 0.6, sweep: 0.2 + 0.8 * ((Math.sin(t * 0.5) + 1) / 2), bank, livery: id };
        drawPlaneTop(ctx, plane, x + 16, y + 26, 1, { ...o, shadow: true });
        drawPlaneTop(ctx, plane, x, y, 1, o);
      }
    });
  });
}

let t = 0;
function frame(): void {
  t += 1 / 60;
  const [view, arg, arg2, arg3] = location.hash.slice(1).split('/');
  requestAnimationFrame(frame);
  if (view === 'zoom') {
    zoom(arg, arg2, t, arg3);
    return;
  }
  if (view === 'zside') {
    zside(arg, arg2, t);
    return;
  }
  if (view === 'mission') {
    mission(t);
    return;
  }
  if (view === 'gal' || view === 'gals') {
    gallery(arg, view === 'gals', t, Number(arg2 ?? 0));
    return;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#0d1520';
  ctx.fillRect(0, 0, cssW, cssH);
  const k = cssW / W;
  ctx.setTransform(dpr * k, 0, 0, dpr * k, 0, 0);
  ctx.fillStyle = '#1d6596';
  ctx.fillRect(0, 0, W, H);
  if (view === 'side') sideGrid(t);
  else if (view === 'anim') anim(t);
  else if (view === 'big') bigView((LIVERY_IDS.find((l) => l === arg) ?? 'standard'), t);
  else topGrid(t);
}
frame();
