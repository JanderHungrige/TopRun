import type { LiveryId } from '../../data/liveries';
import type { TimeOfDay } from '../../data/photo-looks';
import type { PlaneId } from '../../data/types';
import { drawPlaneSide } from '../draw-planes-side';
import { makeCanvas } from '../pixel/post';
import { pixelize } from '../pixel/quantize';

// Picture wall (doc 32): the jets of a photo — the pilot's jet in its paint job (and a wingman in standard paint
// on some photos), drawn with the side-view airframes, gear up, afterburner lit, tinted for the time of day and
// cleaned into pixel art (dominant colours, hard alpha, 1-px outline) like the game's other pixel figures.

/** Airframe length and centre in side-view units (the afterburner flame not counted). */
const METRICS: Readonly<Record<PlaneId, { len: number; cx: number; cy: number }>> = {
  f16: { len: 113, cx: 0, cy: -26 },
  f14: { len: 127, cx: -2, cy: -31 },
  sr71: { len: 158, cx: 7, cy: -27 },
  a10: { len: 114, cx: 1.6, cy: -24 },
  f35: { len: 112, cx: -2, cy: -25 },
  tornado: { len: 116, cx: 0, cy: -26 },
};

export interface JetPose {
  x: number;
  y: number;
  /** Photo px from nose to tail. */
  length: number;
  pitch: number;
  facing: 1 | -1;
}

export interface JetShot { plane: PlaneId; livery: LiveryId; pose: JetPose }

function tint(time: TimeOfDay): string | null {
  switch (time) {
    case 'day': return null;
    case 'dawn': return 'rgba(255,170,150,0.16)';
    case 'dusk': return 'rgba(255,118,60,0.24)';
    case 'night': return 'rgba(14,26,70,0.56)';
    case 'storm': return 'rgba(40,50,62,0.32)';
    default: throw new Error(`unhandled: ${time satisfies never}`);
  }
}

function drawJet(g: CanvasRenderingContext2D, j: JetShot, t: number): void {
  const m = METRICS[j.plane];
  const s = j.pose.length / m.len;
  g.save();
  g.translate(j.pose.x, j.pose.y);
  g.scale(j.pose.facing, 1);
  drawPlaneSide(g, j.plane, -m.cx * s, -m.cy * s, s, { gear: 0, throttle: 0.85, t, pitch: j.pose.pitch, livery: j.livery });
  g.restore();
}

let work: { canvas: HTMLCanvasElement; g: CanvasRenderingContext2D } | null = null;

/** The jets as one pixel-art layer of the photo's size (transparent elsewhere). */
export function jetLayer(w: number, h: number, jets: readonly JetShot[], time: TimeOfDay, seed: number): HTMLCanvasElement | null {
  if (!work) {
    const canvas = makeCanvas(w, h);
    const g = canvas.getContext('2d', { willReadFrequently: true });
    if (!g) return null;
    work = { canvas, g };
  }
  makeCanvas(w, h, work.canvas);
  const g = work.g;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, w, h);
  jets.forEach((j, i) => drawJet(g, j, seed * 0.37 + i));
  const c = tint(time);
  if (c) {
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = c;
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over';
  }
  const img = g.getImageData(0, 0, w, h);
  pixelize(img.data, w, h);
  const out = makeCanvas(w, h);
  out.getContext('2d')?.putImageData(img, 0, 0);
  return out;
}
