import type { WarningLights } from '../../game/cockpit';
import type { Rect } from './layout';
import { bevel, halo, rr, screenText } from './metal';
import type { CockpitLabels } from './types';

/** The 2×3 annunciator panel: dark glass lamps with legends; lit ones glow in their caution colour. */

type LampId = 'missile' | 'lowHull' | 'boss' | 'power' | 'ecm' | 'dmgCtrl';
const ORDER: readonly LampId[] = ['missile', 'lowHull', 'boss', 'power', 'ecm', 'dmgCtrl'];
const LABEL: Readonly<Record<LampId, keyof CockpitLabels>> = {
  missile: 'warnMissile', lowHull: 'warnLowHull', boss: 'warnBoss', power: 'warnPower', ecm: 'warnEcm', dmgCtrl: 'warnDmgCtrl',
};
const RED = '255,74,58';
const AMBER = '255,170,48';
const GREEN = '98,232,130';
const PAD = 10;
const GAP = 8;

function lampRect(r: Rect, i: number): Rect {
  const w = (r.w - PAD * 2 - GAP * 2) / 3;
  const h = (r.h - PAD * 2 - GAP) / 2;
  return { x: r.x + PAD + (i % 3) * (w + GAP), y: r.y + PAD + Math.floor(i / 3) * (h + GAP), w, h };
}

export function lampsStatic(ctx: CanvasRenderingContext2D, r: Rect, labels: CockpitLabels): void {
  bevel(ctx, r, 6, '#14171a', true);
  ORDER.forEach((id, i) => {
    const l = lampRect(r, i);
    bevel(ctx, l, 3, '#1b2024', true);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(l.x + 3, l.y + 3, l.w - 6, 2);
    screenText(ctx, labels[LABEL[id]], l.x + l.w / 2, l.y + l.h / 2 + 0.5, {
      size: 11, align: 'center', maxW: l.w - 10, color: '#475057', weight: 800, mono: false, spacing: 0.8,
    });
  });
}

/** Colour ("r,g,b") and brightness 0..1 of a lamp right now, or null when it is dark. */
function lampState(id: LampId, w: WarningLights, t: number): readonly [string, number] | null {
  switch (id) {
    case 'missile': return w.missile ? [RED, Math.floor(t * 6) % 2 === 0 ? 1 : 0.25] : null;
    case 'lowHull': return w.lowHull ? [RED, 0.8 + Math.sin(t * 4) * 0.2] : null;
    case 'boss': return w.boss ? [AMBER, 1] : null;
    case 'power': return w.power ? [GREEN, 1] : null;
    case 'ecm': return w.ecm ? [GREEN, 1] : null;
    case 'dmgCtrl': return w.damageControl === 'armed' ? [GREEN, 1] : w.damageControl === 'used' ? [AMBER, 0.32] : null;
    default: throw new Error(`unhandled: ${id satisfies never}`);
  }
}

export function lampsLive(ctx: CanvasRenderingContext2D, r: Rect, w: WarningLights, labels: CockpitLabels, t: number): void {
  ORDER.forEach((id, i) => {
    const s = lampState(id, w, t);
    if (!s) return;
    const [rgb, a] = s;
    const l = lampRect(r, i);
    if (a > 0.5) halo(ctx, l, 4, rgb, a);
    rr(ctx, l.x, l.y, l.w, l.h, 3);
    ctx.fillStyle = `rgba(${rgb},${(0.2 + a * 0.75).toFixed(3)})`;
    ctx.fill();
    ctx.fillStyle = `rgba(255,255,255,${(0.25 * a).toFixed(3)})`;
    ctx.fillRect(l.x + 3, l.y + 3, l.w - 6, l.h * 0.3);
    screenText(ctx, labels[LABEL[id]], l.x + l.w / 2, l.y + l.h / 2 + 0.5, {
      size: 11, align: 'center', maxW: l.w - 10, color: a > 0.5 ? '#1a0d04' : `rgba(${rgb},0.9)`, weight: 900, mono: false, spacing: 0.8,
    });
  });
}
