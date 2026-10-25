// Dev-only carrier preview: http://localhost:5173/dev/carrier.html (not part of the production build).
// Default: a 2×2 grid (start with the deflector down / up, aft deck, launch over the bow). ?view= shows one
// camera at 1:1, ?zoom= with ?x= ?y= (logical top-left) magnifies a region, ?t= freezes time, ?theater= picks
// the sky/sea, ?plane= the jet on the catapult (none hides it).
import { THEATERS } from '../src/data/theaters';
import { PLANE_IDS, type PlaneId, type TheaterId } from '../src/data/types';
import { DECK_Y, drawCarrier, drawSea, drawSky } from '../src/render/draw-carrier';
import { drawPlaneSide } from '../src/render/draw-planes-side';

interface View {
  cam: number;
  jbd: number;
  pose: number;
  launched: boolean;
  plane: number;
  alt: number;
}

const VIEWS: Readonly<Record<string, (t: number) => View>> = {
  start: () => ({ cam: -520, jbd: 0, pose: 2.2, launched: false, plane: 0, alt: 0 }),
  up: () => ({ cam: -520, jbd: 1, pose: 0.6, launched: false, plane: 0, alt: 0 }),
  launch: () => ({ cam: -260, jbd: 1, pose: 0.9, launched: true, plane: 260, alt: 0 }),
  bow: () => ({ cam: 60, jbd: 1, pose: 0.9, launched: true, plane: 640, alt: 26 }),
  aft: () => ({ cam: -1010, jbd: 1, pose: 0.6, launched: false, plane: 0, alt: 0 }),
  stern: () => ({ cam: -1420, jbd: 1, pose: 0.6, launched: false, plane: 0, alt: 0 }),
  pan: (t) => ({ cam: -380 + Math.sin(t * 0.25) * 1060, jbd: (Math.sin(t) + 1) / 2, pose: t % 4 < 2 ? 2.2 : 0.9, launched: false, plane: 0, alt: 0 }),
};
const GRID = ['start', 'up', 'aft', 'launch'] as const;

const q = new URLSearchParams(location.search);
const num = (k: string): number | null => (q.get(k) === null ? null : Number(q.get(k)));
const frozen = num('t');
const zoom = num('zoom') ?? 1;
const theater = THEATERS[(q.get('theater') ?? 'pacific') as TheaterId] ?? THEATERS.pacific;
const planeParam = q.get('plane') ?? 'f16';
const plane: PlaneId | null = PLANE_IDS.find((id) => id === planeParam) ?? null;
const view = q.get('view');

const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
const dpr = window.devicePixelRatio || 1;
canvas.width = 1280 * dpr;
canvas.height = 720 * dpr;
canvas.style.width = '1280px';
canvas.style.height = '720px';

function scene(v: View, t: number): void {
  drawSky(ctx, theater.terrain, v.cam, t);
  drawSea(ctx, theater.palette, v.cam, t);
  drawCarrier(ctx, { camX: v.cam, t, jbd: v.jbd, shooterPose: v.pose, launched: v.launched });
  if (plane) {
    const pitch = v.alt > 0 ? 0.2 : 0;
    drawPlaneSide(ctx, plane, v.plane - v.cam, DECK_Y - v.alt, 1.25, { t, throttle: v.launched ? 1 : 0.6, gear: v.alt > 0 ? 0.3 : 1, pitch });
  }
}

function render(t: number): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const make = view ? VIEWS[view] : undefined;
  if (make) {
    const s = dpr * zoom;
    ctx.setTransform(s, 0, 0, s, -(num('x') ?? 0) * s, -(num('y') ?? 0) * s);
    scene(make(t), t);
    return;
  }
  GRID.forEach((name, i) => {
    const s = dpr * 0.5;
    ctx.setTransform(s, 0, 0, s, (i % 2) * 640 * dpr, Math.floor(i / 2) * 360 * dpr);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, 1280, 720);
    ctx.clip();
    scene(VIEWS[name]?.(t) ?? VIEWS.start!(t), t);
    ctx.restore();
  });
}

const t0 = performance.now();
const now = (): number => frozen ?? (performance.now() - t0) / 1000;
function tick(): void {
  render(now());
  if (frozen === null) requestAnimationFrame(tick);
}
tick(); // renders immediately, even when rAF is throttled in a background tab
(window as unknown as { __carrier: { render: (t: number) => void } }).__carrier = { render };
