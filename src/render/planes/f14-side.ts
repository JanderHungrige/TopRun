import type { Look } from '../livery-art';
import type { Pts } from './geom';
import { band, bounds, lazy, lines, polys, reversed, stroke } from './geom';
import { paintPass, panelLines } from './paint-pass';
import { flameSide, gearLeg, helmet, missileSide, nozzleSide } from './parts';
import { canopySide, farFin, sliver, tailHook } from './side-kit';
import type { Fin, SideOpts, Surface } from './surface';
import { finArtSide } from './tail-art';

/** F-14 side view, nose right, origin = main-gear deck contact. Twin fins, nozzle exit at x = -62.5. */

const TOP: Pts = [62, -20.6, 60, -21.8, 57, -23.0, 53, -24.4, 48, -25.8, 43, -26.9, 38, -27.6, 34, -28.0, 8, -29.6, 0, -29.8,
  -10, -29.4, -20, -28.6, -34, -28.2, -50, -27.6, -56, -26.6, -56.5, -24.8];
const BOTTOM: Pts = [62, -20.6, 60, -19.4, 56, -18.2, 51, -17.3, 46, -16.8, 40, -16.6, 24, -16.6, 19.4, -16.6, 16.2, -13.0, 8, -12.6,
  -6, -12.4, -24, -12.8, -38, -13.6, -48, -15.0, -56.5, -15.6];
const BELLY: Pts = BOTTOM.slice(16);
const FIN: Pts = [-16, -28.9, -22, -30.6, -40, -52, -48.5, -52, -55.5, -27.4];
const VENTRAL: Pts = [-36, -13.4, -44, -14.4, -46.5, -8.8, -41, -8.2];
const STAB: Pts = [-40, -20.4, -58, -20.8, -66, -20.0, -65.6, -18.8, -58, -18.6, -40, -19.0];
const WING: Pts = [18, -26.8, 0, -27.4, -26, -26.8, -26, -25.6, 0, -25.8, 18, -26.0];
const CANOPY: Pts = [34.5, -28.0, 32.2, -31.4, 29.2, -34.0, 25.5, -35.4, 21.5, -35.5, 18, -34.6, 14.5, -34.9, 11, -34.0, 8.5, -32.6,
  6.4, -31.0, 4.8, -29.8, 4.8, -29.6];
const FIN_Q: Pts = [-21, -28.9, -40, -52, -48.5, -52, -55.5, -27.6];
/** The far fin peeks out slightly ahead and above the near one. */
const far = (p: Pts): Pts => p.map((v, i) => (i % 2 === 0 ? v + 2.6 : v - 1));

const geo = lazy(() => {
  const body = [...TOP, ...reversed(BOTTOM)];
  const surface: Surface = {
    key: 'f14-side', clip: polys(body, FIN, VENTRAL, STAB), box: bounds(body, FIN, STAB), cell: 10,
    under: polys([66, -20.6, 22, -21, -60, -21, -60, 2, 66, 2]),
    twoTone: polys([34, -28.2, 8, -29.8, -50, -27.8, -50, -26, 8, -27.6, 34, -26.4]),
    radome: polys([63, -20.6, 60, -21.8, 57, -23.0, 53, -24.4, 48, -25.8, 43.2, -26.9, 43.2, -16.8, 46, -16.8, 51, -17.3, 56, -18.2, 60, -19.4]),
    band: { x: 40, y: -32, w: 2.4, h: 20 },
    nose: { x: 34, y: -32, w: 30, h: 20, dir: 'y', out: 1 },
    stripes: [[58, -21.4, 5, -15, -42, -47]],
    trim: [[56, -21.2, 20, -21.6, -54, -21.6], [42.9, -26.8, 42.9, -16.9]],
  };
  const fin: Fin = { path: polys(FIN), q: FIN_Q };
  const farFin: Fin = { path: polys(far(FIN)), q: far(FIN_Q) };
  const shades = [
    { path: polys(band(TOP, -1, 2.4)), color: 'rgba(255,255,255,0.15)', gloss: true },
    { path: polys(band(BELLY, -3.8, 1)), color: 'rgba(0,0,0,0.12)' },
    { path: polys(band(BELLY, -1.5, 1)), color: 'rgba(0,0,0,0.1)' },
    { path: polys([-4, -25.8, -54, -25.4, -54, -23.8, -4, -24.2]), color: 'rgba(255,255,255,0.1)', gloss: true },
    { path: polys([19.6, -27.4, -4, -27.8, -4, -12.4, 16.2, -13.0]), color: 'rgba(0,0,0,0.06)' },
    { path: polys([19.6, -27.4, -4, -27.8, -4, -26.6, 19.2, -26.2]), color: 'rgba(255,255,255,0.14)', gloss: true },
    { path: polys([-22, -30.6, -40, -52, -42.2, -52, -24.6, -30.4]), color: 'rgba(255,255,255,0.12)', gloss: true },
    { path: polys([-40, -52, -48.5, -52, -48.3, -50.6, -40.8, -50.6]), color: 'rgba(0,0,0,0.3)' },
  ];
  const panels = lines([[43.2, -26.9, 43.2, -16.8], [34, -28, 34, -16.6], [19.6, -27.4, -4, -27.8], [10, -27.4, 9, -12.7],
    [-4, -27.6, -4, -12.4], [-20, -28.6, -20, -12.8], [-36, -28.2, -36, -13.6], [16, -20.6, -52, -21]]);
  const hinges = lines([[-50.6, -28.5, -46.0, -46.5, -49.9, -47], [36, -26.4, 42.5, -26.4, 42.5, -24.9, 36, -24.9],
    [18.4, -25.6, 4, -25.9], [12, -25.2, 6, -25.2, 6, -22.6, 12, -22.6, 12, -25.2]]);
  return {
    surface, shades, panels, hinges, wing: polys(WING), wingEdge: lines([[18, -26.8, 0, -27.4, -26, -26.8]]),
    fin, farFin,
    stab: polys(STAB), stabEdge: lines([[-40, -20.4, -58, -20.8, -66, -20.0]]), canopy: polys(CANOPY),
    mouth: polys([19.6, -27.4, 21.2, -27.4, 17.8, -13.0, 16.2, -13.0]),
    pylon: polys([12, -26.4, 4, -26.6, 3, -23.4, 10.6, -23.4]),
  };
});

function interior(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#2a2e34';
  ctx.fillRect(4.6, -30.8, 30.4, 2.6);
  for (const [sx, hx] of [[18.4, 23.4], [7.4, 12.4]] as const) {
    ctx.fillStyle = '#2a2e34';
    ctx.beginPath();
    ctx.moveTo(sx, -29);
    ctx.lineTo(sx + 0.7, -34.2);
    ctx.lineTo(sx + 2.8, -34.4);
    ctx.lineTo(sx + 3.4, -29);
    ctx.fill();
    helmet(ctx, hx, -31.8, 2, '#4a515b', '#1d2126');
  }
}

export function drawF14Side(ctx: CanvasRenderingContext2D, l: Look, o: SideOpts): void {
  const g = geo();
  const r1 = 3.9 + o.throttle * 0.5;
  gearLeg(ctx, 35.5, -16.6, 2.6, o.gear, { door: l.under, doorSide: 1, wheels: [1.2], far: true });
  if (o.gear > 0.9) {
    ctx.strokeStyle = '#3b4047';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(35.7, -6.5); // catapult launch bar
    ctx.lineTo(41, -0.8);
    ctx.stroke();
  }
  gearLeg(ctx, -10, -12.4, 3.6, o.gear, { door: l.under, doorSide: -1, rake: 5 });
  flameSide(ctx, -62.5, -20.2, r1 * 1.9, o.throttle, o.t);
  farFin(ctx, l, g.farFin, 21);
  paintPass(ctx, l, g.surface, { shades: g.shades });
  finArtSide(ctx, l, g.fin, 21);
  panelLines(ctx, l, g.panels, g.hinges);
  sliver(ctx, g.wing, g.wingEdge, l.gloss);
  sliver(ctx, g.stab, g.stabEdge, l.gloss);
  ctx.fillStyle = '#16181c';
  ctx.fill(g.mouth);
  stroke(ctx, g.mouth, 'rgba(255,255,255,0.25)', 0.3);
  tailHook(ctx, -44, -14.6, 10, o.hook);
  canopySide(ctx, g.canopy, { glass: '#86c4e2', tint: 'rgba(120,180,215,0.35)', frame: 'rgba(35,40,46,0.8)' }, () => interior(ctx), 22, -34.4, 9);
  ctx.strokeStyle = 'rgba(35,40,46,0.85)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(31.4, -28.2); // windscreen bow
  ctx.lineTo(28.6, -34.2);
  ctx.stroke();
  nozzleSide(ctx, -56.5, -62.5, -20.2, 4.4, r1);
  ctx.fillStyle = l.under;
  ctx.fill(g.pylon);
  stroke(ctx, g.pylon, l.ink, 0.3);
  missileSide(ctx, 17, -22.6, 14, 0.9);
}
