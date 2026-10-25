import type { Athlete } from '../../game/minigames/volleyball-athlete';
import { drawFrontFigure, drawSideFigure, type PersonLook } from '../people';
import { block, FIG, GROUND_Y, sx, sy } from './volleyball-court';
import { FANS } from './volleyball-looks';
import { athletePose, type PoseCtx } from './volleyball-poses';

// Beach Volleyball (doc 21): the four athletes as pixel-art people-kit side figures with their shadows, and
// the spectators on the far sand (front figures) who cheer on points.

function blinkAt(t: number): number {
  const ph = t % 3.9;
  return ph < 0.14 ? 1 - Math.abs(ph / 0.07 - 1) : 0;
}

export function drawAthleteShadow(ctx: CanvasRenderingContext2D, a: Athlete): void {
  const w = Math.max(18, 40 - a.y * 14) + (a.dive > 0 ? 40 : 0);
  const x = sx(a.x) + (a.dive > 0 ? Math.sign(a.vx) * 8 : 0);
  block(ctx, x - w / 2, GROUND_Y - 2, w, 4, 'rgba(60,24,30,0.3)');
  block(ctx, x - w / 2 + 6, GROUND_Y - 4, w - 12, 8, 'rgba(60,24,30,0.22)');
}

/** One athlete; `phase` keeps the four from blinking and hopping in sync. */
export function drawAthlete(ctx: CanvasRenderingContext2D, look: PersonLook, a: Athlete, facing: 1 | -1, c: PoseCtx, phase: number): void {
  const p = athletePose(a, facing, c);
  const hop = a.mood === 'cheer' && a.y <= 0 ? -Math.round(Math.abs(Math.sin(c.t * 7 + phase)) * 5) * 2 : 0;
  ctx.save();
  ctx.translate(Math.round(sx(a.x) / 2) * 2, Math.round((sy(a.y) + hop) / 2) * 2);
  ctx.scale((p.flip ? -facing : facing) * FIG, FIG);
  drawSideFigure(ctx, look, p.pose, { expression: p.expression, strain: 0, blink: p.blink ? blinkAt(c.t + phase) : 0, t: c.t });
  ctx.restore();
}

interface Fan { x: number; turn: number; phase: number }
const FAN_SPOTS: readonly Fan[] = [
  { x: 150, turn: 0.32, phase: 0 }, { x: 222, turn: 0.18, phase: 1.3 }, { x: 296, turn: 0.38, phase: 2.6 },
  { x: 984, turn: -0.38, phase: 0.7 }, { x: 1058, turn: -0.2, phase: 2.0 }, { x: 1132, turn: -0.3, phase: 3.3 },
];
const FAN_SCALE = 0.25;
const FAN_FEET = 478;

/** `cheer` 0 … 1 raises arms and bounces. */
export function drawCrowd(ctx: CanvasRenderingContext2D, cheer: number, t: number): void {
  FAN_SPOTS.forEach((f, i) => {
    const look = FANS[i % FANS.length];
    if (!look) return;
    const wave = cheer > 0.05 ? cheer * (0.7 + 0.3 * Math.sin(t * 9 + f.phase)) : 0;
    const bounce = -Math.round(Math.abs(Math.sin(t * (cheer > 0.3 ? 8 : 1.4) + f.phase)) * (1 + cheer * 4)) * 2;
    block(ctx, f.x - 14, FAN_FEET - 2, 28, 4, 'rgba(70,30,30,0.25)');
    ctx.save();
    ctx.translate(f.x, FAN_FEET + bounce);
    ctx.scale(FAN_SCALE, FAN_SCALE);
    const blink = (t + f.phase * 1.7) % 4.3 < 0.14 ? 1 : 0;
    drawFrontFigure(ctx, look, { turn: f.turn, raise: [wave, i % 2 ? wave : wave * 0.8], hands: 'open' }, {
      expression: cheer > 0.3 ? 'grin' : 'calm', strain: 0, blink, t,
    });
    ctx.restore();
  });
}
