import type { TheaterId } from './types';

// Picture wall (doc 32): the time of day each mission's photo is taken at, per theater in mission order
// (missions 1–6 of the theater). A static look table — the photo art reads it through game/photos.ts.

export type TimeOfDay = 'day' | 'dawn' | 'dusk' | 'night' | 'storm';
export const TIMES_OF_DAY: readonly TimeOfDay[] = Object.freeze(['day', 'dawn', 'dusk', 'night', 'storm'] as const);

export const PHOTO_TIMES: Readonly<Record<TheaterId, readonly TimeOfDay[]>> = Object.freeze({
  pacific: ['day', 'day', 'dawn', 'day', 'dusk', 'dusk'],
  gulf: ['dawn', 'day', 'dusk', 'day', 'day', 'dusk'],
  arctic: ['dawn', 'day', 'night', 'dawn', 'day', 'night'],
  canyon: ['day', 'dusk', 'day', 'dawn', 'day', 'dusk'],
  leviathan: ['storm', 'dusk', 'day', 'night', 'storm', 'dusk'],
  // Map 2 (doc 35): ready for its photos, which the wall does not show yet.
  northsea: ['day', 'storm', 'dusk', 'day', 'storm', 'dusk'],
  himalaya: ['dawn', 'day', 'day', 'dawn', 'day', 'dusk'],
  jungle: ['dawn', 'day', 'dusk', 'day', 'dawn', 'dusk'],
  nightfall: ['night', 'night', 'dusk', 'night', 'night', 'night'],
  thunderhead: ['storm', 'storm', 'night', 'storm', 'dusk', 'storm'],
  // Map 3 (doc 48): no photos in this initiative, but the table covers every theater.
  fjords: ['dawn', 'day', 'day', 'dusk', 'day', 'storm'],
  highlands: ['dawn', 'day', 'day', 'dusk', 'dawn', 'day'],
  delta: ['day', 'dawn', 'day', 'dusk', 'dusk', 'day'],
  mesa: ['dawn', 'day', 'day', 'dusk', 'day', 'dusk'],
  ashfall: ['storm', 'dusk', 'day', 'night', 'storm', 'night'],
  orbit: ['night', 'night', 'dusk', 'night', 'night', 'night'],
  belt: ['night', 'night', 'night', 'dusk', 'night', 'night'],
  moon: ['night', 'dusk', 'night', 'night', 'dusk', 'night'],
  rings: ['dusk', 'night', 'night', 'night', 'dusk', 'night'],
  reef: ['day', 'day', 'dusk', 'day', 'night', 'dusk'],
  kelp: ['day', 'dusk', 'day', 'day', 'dusk', 'night'],
  wrecks: ['dusk', 'day', 'dusk', 'night', 'dusk', 'night'],
  trench: ['night', 'night', 'dusk', 'night', 'night', 'night'],
  abyss: ['night', 'night', 'night', 'night', 'night', 'night'],
  deep: ['night', 'night', 'night', 'night', 'night', 'night'],
  landing: ['dawn', 'day', 'day', 'dusk', 'night', 'dusk'],
  canopy: ['day', 'day', 'dusk', 'day', 'dusk', 'night'],
  swamp: ['storm', 'dawn', 'day', 'dusk', 'night', 'storm'],
  ruins: ['dawn', 'day', 'day', 'dusk', 'day', 'dusk'],
  hive: ['dusk', 'night', 'night', 'dusk', 'night', 'night'],
  grass: ['dawn', 'day', 'day', 'dusk', 'day', 'dusk'],
  saltflats: ['day', 'day', 'dusk', 'day', 'day', 'dusk'],
  badlands: ['dawn', 'day', 'dusk', 'day', 'dusk', 'dusk'],
  barrows: ['dusk', 'day', 'storm', 'storm', 'day', 'dusk'],
  impact: ['night', 'dusk', 'night', 'night', 'night', 'night'],
});
