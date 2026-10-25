import { GREEN, RED, flareButton, pauseButton, pushButton, specialButton } from './buttons';
import { attitudeLive, cannonLive, hullLive } from './gauges';
import { lampsLive } from './lamps';
import { LEFT, RIGHT } from './layout';
import { missionLive } from './mission';
import { buildLeft, buildRight } from './plates';
import { radarLive } from './radar';
import { storesLive } from './screens';
import type { CockpitLabels, LeftConsoleView, RightConsoleView } from './types';

/**
 * The mission HUD side consoles as 80s fighter cockpit panels (doc 05). Every element stays inside its rect from
 * layout.ts. The metal plates, bezels, dial faces and engraved legends are painted once into an offscreen canvas
 * per console at the current device scale; each frame only blits that and draws the live instruments on top.
 */

interface PlateCache { canvas: HTMLCanvasElement | null; key: string }

const leftCache: PlateCache = { canvas: null, key: '' };
const rightCache: PlateCache = { canvas: null, key: '' };
let labelsRef: CockpitLabels | null = null;
let labelsKey = '';

/** Cache key part for the translated legends; recomputed only when the labels object changes. */
function keyOfLabels(l: CockpitLabels): string {
  if (l !== labelsRef) {
    labelsRef = l;
    labelsKey = Object.values(l).join('\u0001');
  }
  return labelsKey;
}

/** Device pixels per logical unit, in quarter steps so tiny resizes do not rebuild the plates. */
function deviceScale(ctx: CanvasRenderingContext2D): number {
  const m = ctx.getTransform();
  return Math.min(3, Math.max(1, Math.ceil(Math.hypot(m.a, m.b) * 4) / 4));
}

function blitPlate(ctx: CanvasRenderingContext2D, c: PlateCache, key: string, x: number, build: (o: CanvasRenderingContext2D) => void): void {
  const s = deviceScale(ctx);
  const full = `${s}\u0002${key}`;
  if (!c.canvas || c.key !== full) {
    const canvas = c.canvas ?? document.createElement('canvas');
    canvas.width = Math.ceil(320 * s);
    canvas.height = Math.ceil(720 * s);
    const o = canvas.getContext('2d');
    if (!o) return;
    o.setTransform(s, 0, 0, s, -x * s, 0);
    o.lineCap = 'round';
    o.lineJoin = 'round';
    build(o);
    c.canvas = canvas;
    c.key = full;
  }
  ctx.drawImage(c.canvas, x, 0, 320, 720);
}

export function drawLeftConsole(ctx: CanvasRenderingContext2D, v: LeftConsoleView, t: number): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const key = `${v.plane}|${v.planeName}|${v.callsign}|${v.keys.missile}|${v.keys.switch}|${keyOfLabels(v.labels)}`;
  blitPlate(ctx, leftCache, key, LEFT.panel.x, (o) => buildLeft(o, v));
  radarLive(ctx, LEFT.radar, v.radar.contacts, v.radar.early, v.labels.early, t);
  hullLive(ctx, LEFT.hull, v.hull);
  cannonLive(ctx, LEFT.cannon, v.cannon, t);
  storesLive(ctx, LEFT.stores, v.stores, v.labels.noStores);
  const m = v.buttons.missile;
  const mStatus = m === 'empty' ? v.labels.empty : m === 'none' ? v.labels.none : '';
  pushButton(ctx, LEFT.missileBtn, m, RED, v.labels.missile, mStatus, t);
  const sw = v.buttons.switch;
  pushButton(ctx, LEFT.switchBtn, sw, GREEN, v.labels.switch, sw === 'none' ? v.labels.none : '', t);
  ctx.restore();
}

export function drawRightConsole(ctx: CanvasRenderingContext2D, v: RightConsoleView, t: number): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const key = `${v.keys.flare}|${v.keys.special}|${v.keys.pause}|${keyOfLabels(v.labels)}`;
  blitPlate(ctx, rightCache, key, RIGHT.panel.x, (o) => buildRight(o, v));
  missionLive(ctx, RIGHT.mission, v, t);
  lampsLive(ctx, RIGHT.warnings, v.warnings, v.labels, t);
  const f = v.flare.state;
  const fStatus = f === 'empty' ? v.labels.empty : f === 'none' ? v.labels.none : '';
  flareButton(ctx, RIGHT.flareBtn, f, v.labels.flare, v.flare.count, fStatus, t);
  specialButton(ctx, RIGHT.specialBtn, v.special.state, v.special.progress, v.special.name, v.labels.special, t);
  attitudeLive(ctx, RIGHT.attitude, v.attitude.bank, v.attitude.forward, t);
  pauseButton(ctx, RIGHT.pauseBtn, v.labels.pause, t);
  ctx.restore();
}

