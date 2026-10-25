import { createRng } from '../../core/rng';
import type { TimeOfDay } from '../../data/photo-looks';
import { glow, rect, vgrad } from '../pixel/fx';
import { PAL, RGB, type Ramp } from '../pixel/palette';
import { bayer, checker, type Pix } from '../pixel/raster';

// Picture wall (doc 32): the sky of a photo in the master palette — dithered bands of the time of day's ramp, the
// sun (or moon and stars) with banded glow, cloud streaks, rain in a storm. Photo units = art pixels (k = 1).

export interface SkyLook {
  /** Ramp indices from the top of the frame down to the horizon. */
  bands: readonly number[];
  ramp: Ramp;
  /** Silhouettes on the horizon: body, shade and lit edge (palette indices). */
  far: readonly [number, number, number];
}

const at = (ramp: Ramp, i: number): number => ramp[i] ?? 0;

export function skyLook(time: TimeOfDay): SkyLook {
  switch (time) {
    case 'day': return { ramp: PAL.sky, bands: [2, 3, 4, 5, 6], far: [at(PAL.steel, 3), at(PAL.steel, 2), at(PAL.steel, 4)] };
    case 'dawn': return { ramp: PAL.dawn, bands: [0, 1, 2, 3, 4, 5], far: [at(PAL.dawn, 1), at(PAL.dawn, 0), at(PAL.dawn, 3)] };
    case 'dusk': return { ramp: PAL.dusk, bands: [1, 2, 3, 4, 5, 6], far: [at(PAL.dusk, 1), at(PAL.dusk, 0), at(PAL.dusk, 4)] };
    case 'night': return { ramp: PAL.night, bands: [0, 1, 2, 3, 4], far: [at(PAL.night, 1), at(PAL.night, 0), at(PAL.night, 3)] };
    case 'storm': return { ramp: PAL.wall, bands: [1, 2, 3, 3, 4], far: [at(PAL.wall, 1), at(PAL.wall, 0), at(PAL.wall, 3)] };
    default: throw new Error(`unhandled: ${time satisfies never}`);
  }
}

/** The colour at the horizon (RGB), for the ground's haze. */
export function hazeRgb(time: TimeOfDay): readonly [number, number, number] {
  const l = skyLook(time);
  return RGB[at(l.ramp, l.bands[l.bands.length - 1] ?? 0)] ?? [128, 128, 128];
}

/** Where the sun (or moon) sits: x by facing, low for dawn / dusk. */
export function sunAt(time: TimeOfDay, horizon: number, facing: 1 | -1): { x: number; y: number } {
  const x = facing > 0 ? 160 : 40;
  return time === 'dawn' || time === 'dusk' ? { x, y: horizon - 9 } : { x, y: 18 };
}

function clouds(p: Pix, look: SkyLook, horizon: number, seed: number): void {
  const rng = createRng(seed);
  const hi = at(look.ramp, Math.min(look.ramp.length - 1, (look.bands[look.bands.length - 1] ?? 0) + 1));
  const mid = at(look.ramp, look.bands[Math.floor(look.bands.length / 2)] ?? 0);
  for (let i = 0; i < 4; i++) {
    const x = rng.range(-10, 210);
    const y = rng.range(12, horizon - 14);
    const w = rng.range(18, 46);
    p.paint(p.oval(x, y, w, 2.5), mid);
    p.paint(p.oval(x + 4, y - 1, w * 0.7, 1.5), hi, undefined, i % 2 ? checker : undefined);
  }
}

function stars(p: Pix, horizon: number, seed: number): void {
  const rng = createRng(seed + 99);
  for (let i = 0; i < 40; i++) {
    const c = Math.floor(rng.range(0, p.w));
    const r = Math.floor(rng.range(0, horizon - 6));
    p.set(c, r, at(PAL.night, i % 5 === 0 ? 7 : 6));
  }
}

function rain(p: Pix, horizon: number): void {
  const streak = at(PAL.wall, 5);
  for (let i = 0; i < 60; i++) {
    const x = (i * 37) % 214;
    const y = (i * 53) % (p.h + 10);
    p.line(x, y, x - 3, y + 7, streak);
  }
  rect(p, 0, horizon - 22, p.w, 22, at(PAL.wall, 4), undefined, bayer(0.3));
}

/** Paints the sky above `horizon` (the ground covers the rest later). */
export function paintSky(p: Pix, time: TimeOfDay, horizon: number, facing: 1 | -1, seed: number): void {
  const look = skyLook(time);
  vgrad(p, look.bands.map((b) => at(look.ramp, b)), 0, horizon, undefined, 5);
  const sun = sunAt(time, horizon, facing);
  if (time === 'night') {
    stars(p, horizon, seed);
    glow(p, sun.x, sun.y, 7, PAL.night, 2, 1.1);
    p.paint(p.oval(sun.x, sun.y, 5, 5), at(PAL.white, 4));
    p.paint(p.oval(sun.x + 1.5, sun.y - 1, 1.2, 1.2), at(PAL.white, 2));
    p.paint(p.oval(sun.x - 1.5, sun.y + 1.5, 1, 1), at(PAL.white, 2));
  } else if (time !== 'storm') {
    glow(p, sun.x, sun.y, time === 'day' ? 6 : 9, look.ramp, 3, 1);
    p.paint(p.oval(sun.x, sun.y, time === 'day' ? 5 : 8, time === 'day' ? 5 : 8), at(PAL.lamp, 5));
  }
  if (time === 'storm') rain(p, horizon);
  else clouds(p, look, horizon, seed);
}
