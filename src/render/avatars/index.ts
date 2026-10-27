import { lookKey, portraitKey, type AvatarLook, type HairColor } from '../../game/avatar-look';
import type { AvatarId } from '../../game/profiles';
import { CUSTOM_KEYS, customFrames, customUrls, fixedFrames, type FrameSet } from '../portraits/assets';
import { drawImagePortrait, drawPlaceholder, preloadImages } from '../portraits/image';
import type { Box, Mood } from '../portraits/types';

/**
 * The player's pilot portrait (docs 08, 29, 33): one of the owner's three preset portraits (`pilot1–3.png`) or the
 * generated portrait nearest a builder pick (`custom/<age>-<skin>-<hair>-<length>.png`), drawn like the cast's
 * portraits — cover-fit, bottom-aligned, clipped, never smoothed — with breathing and the gold selection frame.
 * A pick whose set is still missing shows a dark pilot silhouette.
 */

export interface AvatarState { t: number; mouth?: number; mood?: Mood; selected?: boolean }
/** Who to draw: a preset id or a builder pick (`pilotFace(profile)`). */
export type PilotFace = AvatarId | AvatarLook;

/** One accent colour per preset for UI (card borders, the ladder). */
export const AVATAR_COLORS: Readonly<Record<AvatarId, string>> = {
  pilot1: '#f2a531', pilot2: '#4fb0e6', pilot3: '#e2574c', pilot4: '#8fd16a', pilot5: '#c9a46a', pilot6: '#e88b5a', pilot7: '#f6d55c',
  pilot8: '#b88ad8', pilot9: '#6ad1c8', pilot10: '#e6c27a', pilot11: '#9c7a5a', pilot12: '#d96b8f', pilot13: '#5fa8e0',
  pilot14: '#d9824a', pilot15: '#b5d65a', pilot16: '#9fb8c8', pilot17: '#f0a0b8', pilot18: '#a08ad0', pilot19: '#f2d23c',
};
/** A builder pick's accent, by hair colour. */
const HAIR_ACCENT: Readonly<Record<HairColor, string>> = { black: '#8fa6c8', brown: '#c98f55', blond: '#f2c94c', red: '#e2683c' };

/** Per-avatar phase so a row of portraits never blinks or bobs in sync. */
const SEED: Readonly<Record<AvatarId, number>> = {
  pilot1: 5.7, pilot2: 6.9, pilot3: 8.2, pilot4: 9.6, pilot5: 10.4, pilot6: 11.3, pilot7: 12.7, pilot8: 13.5, pilot9: 14.9,
  pilot10: 15.8, pilot11: 16.6, pilot12: 17.9, pilot13: 18.7, pilot14: 19.5, pilot15: 20.8, pilot16: 21.4, pilot17: 22.6,
  pilot18: 23.3, pilot19: 24.1,
};

/** The player's face for a profile: the builder pick if one was made, else the preset. */
export const pilotFace = (p: { avatar: AvatarId; save: { look: AvatarLook | null } }): PilotFace => p.save.look ?? p.avatar;

/** UI accent of a pilot (card borders): the preset colour, or the hair colour's accent of a pick. */
export const pilotAccent = (face: PilotFace): string => (typeof face === 'string' ? AVATAR_COLORS[face] : HAIR_ACCENT[face.hair]);

/** The portrait frames of a face: the preset's, or those of exactly the pick's generated portrait. */
export function avatarFrames(face: PilotFace): FrameSet | null {
  if (typeof face === 'string') return fixedFrames(face);
  const key = portraitKey(face, CUSTOM_KEYS);
  return key === null ? null : customFrames(key);
}

/** Starts loading face 1 of every builder pick (the builder and NEW PILOT call this); face 2 loads on first use. */
export const preloadCustomPortraits = (): void => preloadImages(customUrls((k) => k.endsWith('-f1')));

function seedOf(face: PilotFace): number {
  if (typeof face === 'string') return SEED[face];
  let h = 0;
  for (const ch of lookKey(face)) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return 3 + (h / 997) * 7;
}

/** Head-and-shoulders pilot portrait filling the box like drawPortrait: cover-fit, bottom-aligned, clipped.
 *  selected=true adds a pulsing gold pixel frame so a chosen portrait stands out in a picker. */
export function drawPilotAvatar(ctx: CanvasRenderingContext2D, face: PilotFace, box: Box, s: AvatarState): void {
  const frames = avatarFrames(face);
  if (!frames) return drawPlaceholder(ctx, box, s, true);
  drawImagePortrait(ctx, frames, box, { t: s.t, mouth: s.mouth ?? 0, seed: seedOf(face), selected: s.selected });
}

/** A preset avatar (kept for callers that only know the id, e.g. the dev page). */
export const drawAvatar = (ctx: CanvasRenderingContext2D, id: AvatarId, box: Box, s: AvatarState): void => drawPilotAvatar(ctx, id, box, s);
