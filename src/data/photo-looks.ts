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
});
