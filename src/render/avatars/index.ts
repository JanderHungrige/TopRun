import { lookKey, type AvatarLook } from '../../game/avatar-look';
import type { AvatarId } from '../../game/profiles';
import { drawBust, type BustArt } from '../pixel/bust';
import { hexOf } from '../pixel/palette';
import { breath, hash, pixelRig, rigKey, type Box, type Mood, type Rig } from '../portraits';
import { customArt, suitRamp } from './custom';
import { selectionFrame, TILT_PIVOT, type AvatarArt } from './kit';
import { PILOT1 } from './pilot1';
import { PILOT2 } from './pilot2';
import { PILOT3 } from './pilot3';
import { deckBackdrop, skyClouds } from './skies';

/**
 * The player's pilot avatar as modern hi-res pixel art (doc 08, doc 20, doc 29): one of three hand-drawn presets
 * or a look composed in the builder, drawn like the portraits — own background, clipped to the box, contain-fit
 * and bottom-aligned, with blinking, breathing and an optional talking mouth. Every animation frame is
 * rasterised once and cached by the bust pipeline.
 */

export interface AvatarState { t: number; mouth?: number; mood?: Mood; selected?: boolean }
/** Who to draw: a preset id or a custom look (`pilotFace(profile)`). */
export type PilotFace = AvatarId | AvatarLook;

/** One accent colour per preset for UI (card borders). */
export const AVATAR_COLORS: Readonly<Record<AvatarId, string>> = { pilot1: '#f2a531', pilot2: '#4fb0e6', pilot3: '#e2574c' };

const ART: Readonly<Record<AvatarId, AvatarArt>> = { pilot1: PILOT1, pilot2: PILOT2, pilot3: PILOT3 };
/** Per-avatar phase so a row of avatars never blinks or bobs in sync. */
const SEED: Readonly<Record<AvatarId, number>> = { pilot1: 5.7, pilot2: 6.9, pilot3: 8.2 };

function bust(id: string, art: AvatarArt, backgroundId?: string): BustArt<Rig> {
  return {
    id,
    backgroundId,
    background: (p, f) => deckBackdrop(p, f, art.sky),
    ambient: (g, v) => skyClouds(g, v, art.sky),
    figure(p, r) {
      art.body(p, r);
      const oy = p.oy;
      p.oy = oy + Math.round(r.m.nod * p.k);
      p.rot = art.tilt ?? 0;
      p.pivotY = TILT_PIVOT;
      art.head(p, r);
      p.rot = 0;
      p.oy = oy;
      art.front?.(p, r);
    },
  };
}

const BUSTS: Readonly<Record<AvatarId, BustArt<Rig>>> = { pilot1: bust('pilot1', PILOT1), pilot2: bust('pilot2', PILOT2), pilot3: bust('pilot3', PILOT3) };

interface Built { art: AvatarArt; bust: BustArt<Rig>; seed: number }
const built = new Map<string, Built>();

/** The composed art of a custom look, memoised by its key (LRU 32). */
function custom(look: AvatarLook): Built {
  const key = lookKey(look);
  const hit = built.get(key);
  if (hit) {
    built.delete(key);
    built.set(key, hit);
    return hit;
  }
  const art = customArt(look);
  const made = { art, bust: bust(`look:${key}`, art, `sky:${look.sky}`), seed: 3 + hash(Number.parseInt(key.slice(0, 6), 36)) * 7 };
  built.set(key, made);
  if (built.size > 32) {
    const oldest = built.keys().next();
    if (!oldest.done) built.delete(oldest.value);
  }
  return made;
}

function resolve(face: PilotFace): Built {
  return typeof face === 'string' ? { art: ART[face], bust: BUSTS[face], seed: SEED[face] } : custom(face);
}

/** The pixel art of a preset or look and its mood table (tests render its frames directly). */
export function avatarArt(face: PilotFace): { art: BustArt<Rig>; moods: AvatarArt['moods'] } {
  const b = resolve(face);
  return { art: b.bust, moods: b.art.moods };
}

/** The player's face for a profile: the custom look if one was built, else the preset. */
export const pilotFace = (p: { avatar: AvatarId; save: { look: AvatarLook | null } }): PilotFace => p.save.look ?? p.avatar;

/** UI accent of a pilot (card borders): the preset colour, or the light tone of a custom look's suit. */
export function pilotAccent(face: PilotFace): string {
  return typeof face === 'string' ? AVATAR_COLORS[face] : hexOf(suitRamp(face.suit)[4] ?? 0);
}

/** Head-and-shoulders pilot avatar filling the box like drawPortrait: own background, clipped, contain-fit, bottom-aligned.
 *  selected=true adds a pulsing gold pixel frame so a chosen avatar stands out in a picker. */
export function drawPilotAvatar(ctx: CanvasRenderingContext2D, face: PilotFace, box: Box, s: AvatarState): void {
  const b = resolve(face);
  const rig = pixelRig(s.t, s.mouth ?? 0, s.mood ?? 'neutral', 'none', b.seed, b.art.moods);
  drawBust(ctx, box, b.bust, {
    rig, key: rigKey(rig), t: s.t, bob: breath(s.t * 1.06, b.seed),
    overlay: s.selected ? selectionFrame : undefined,
  });
}

/** A preset avatar (kept for callers that only know the id). */
export const drawAvatar = (ctx: CanvasRenderingContext2D, id: AvatarId, box: Box, s: AvatarState): void => drawPilotAvatar(ctx, id, box, s);
