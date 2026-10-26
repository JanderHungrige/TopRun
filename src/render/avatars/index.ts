import { lookKey, nearestLookKey, type AvatarLook, type HairColor } from '../../game/avatar-look';
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
export const AVATAR_COLORS: Readonly<Record<AvatarId, string>> = { pilot1: '#f2a531', pilot2: '#4fb0e6', pilot3: '#e2574c' };
/** A builder pick's accent, by hair colour. */
const HAIR_ACCENT: Readonly<Record<HairColor, string>> = { black: '#8fa6c8', brown: '#c98f55', blond: '#f2c94c', red: '#e2683c' };

/** Per-avatar phase so a row of portraits never blinks or bobs in sync. */
const SEED: Readonly<Record<AvatarId, number>> = { pilot1: 5.7, pilot2: 6.9, pilot3: 8.2 };

/** The player's face for a profile: the builder pick if one was made, else the preset. */
export const pilotFace = (p: { avatar: AvatarId; save: { look: AvatarLook | null } }): PilotFace => p.save.look ?? p.avatar;

/** UI accent of a pilot (card borders): the preset colour, or the hair colour's accent of a pick. */
export const pilotAccent = (face: PilotFace): string => (typeof face === 'string' ? AVATAR_COLORS[face] : HAIR_ACCENT[face.hair]);

/** The portrait frames of a face: the preset's, or those of the generated portrait nearest the pick. */
export function avatarFrames(face: PilotFace): FrameSet | null {
  if (typeof face === 'string') return fixedFrames(face);
  const key = nearestLookKey(face, CUSTOM_KEYS);
  return key === null ? null : customFrames(key);
}

/** Starts loading the builder's portraits (the builder and NEW PILOT call this). */
export const preloadCustomPortraits = (): void => preloadImages(customUrls());

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
