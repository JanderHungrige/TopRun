import { AVATAR_IDS } from '../../game/profiles';
import { fixedFrames, fixedUrls } from './assets';
import { drawImagePortrait, drawPlaceholder, preloadImages } from './image';
import type { Box, CharacterId, Gesture, Mood } from './types';

/**
 * The talking characters' portraits (doc 06, doc 33): the owner's generated pixel-art images for the admiral, the
 * deck officer (shooter), the crew chief and the wingman, drawn by `drawImagePortrait` (talk and blink frames,
 * breathing, the radio feed). Moods and gestures are kept in the API but not drawn.
 */

export type { Box, CharacterId, Frame, Gesture, Mood, MoodShape, Rig } from './types';
export interface PortraitState {
  t: number; // seconds; drives breathing and the blink timer (deterministic from t)
  mouth: number; // 0 = closed .. 1 = wide open; the caller animates this while the character talks
  mood: Mood; // kept for the dialogue scripts; image portraits don't show moods
  gesture: Gesture; // kept for the dialogue scripts; image portraits don't show gestures
  radio?: boolean; // draw as a live radio video feed: green phosphor palette, scanlines, flicker, thin frame
}

/** Per-character phase so the cast never blinks or bobs in sync. */
const SEED: Readonly<Record<CharacterId, number>> = { admiral: 0.3, chief: 1.9, shooter: 3.1, wingman: 4.6 };
const CAST: readonly CharacterId[] = ['admiral', 'shooter', 'chief', 'wingman'];

/** Starts loading the portraits of the cast and of the preset pilots (called once at boot). */
export function preloadPortraits(): void {
  preloadImages(fixedUrls([...CAST, ...AVATAR_IDS]));
}

/** Head-and-shoulders portrait filling the box (aspect ~5:6), bottom-aligned, clipped to the box. */
export function drawPortrait(ctx: CanvasRenderingContext2D, id: CharacterId, box: Box, s: PortraitState): void {
  const frames = fixedFrames(id);
  if (frames) drawImagePortrait(ctx, frames, box, { t: s.t, mouth: s.mouth, seed: SEED[id], radio: s.radio });
  else drawPlaceholder(ctx, box, s);
}
