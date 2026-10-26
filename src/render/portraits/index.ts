import { fixedFrames, fixedUrls } from './assets';
import { drawImagePortrait, drawPlaceholder, preloadImages } from './image';
import { drawProceduralWingman } from './procedural';
import type { Box, CharacterId, Gesture, Mood } from './types';

/**
 * The talking characters' portraits (doc 06, doc 33): the owner's generated pixel-art images for the admiral, the
 * deck officer (shooter), the crew chief and — once `wingman.png` exists — the wingman, drawn by
 * `drawImagePortrait` (talk and blink frames, breathing, the radio feed). Moods and gestures are ignored for image
 * portraits. Until its image exists the wingman keeps the procedural portrait (procedural.ts).
 */

export type { Box, CharacterId, Frame, Gesture, Mood, MoodShape, Rig } from './types';
export interface PortraitState {
  t: number; // seconds; drives breathing and the blink timer (deterministic from t)
  mouth: number; // 0 = closed .. 1 = wide open; the caller animates this while the character talks
  mood: Mood; // procedural wingman only: brows, lids, mouth corners, a small head drop
  gesture: Gesture; // procedural wingman only: a hand/arm in frame
  radio?: boolean; // draw as a live radio video feed: green phosphor palette, scanlines, flicker, thin frame
}

/** Per-character phase so the cast never blinks or bobs in sync. */
const SEED: Readonly<Record<CharacterId, number>> = { admiral: 0.3, chief: 1.9, shooter: 3.1, wingman: 4.6 };
const CAST: readonly CharacterId[] = ['admiral', 'shooter', 'chief', 'wingman'];

/** Starts loading the portraits of the cast and of the three preset pilots (called once at boot). */
export function preloadPortraits(): void {
  preloadImages(fixedUrls([...CAST, 'pilot1', 'pilot2', 'pilot3']));
}

/** Head-and-shoulders portrait filling the box (aspect ~5:6), bottom-aligned, clipped to the box. */
export function drawPortrait(ctx: CanvasRenderingContext2D, id: CharacterId, box: Box, s: PortraitState): void {
  const frames = fixedFrames(id);
  if (frames) drawImagePortrait(ctx, frames, box, { t: s.t, mouth: s.mouth, seed: SEED[id], radio: s.radio });
  else if (id === 'wingman') drawProceduralWingman(ctx, box, s); // until wingman.png exists
  else drawPlaceholder(ctx, box, s);
}
