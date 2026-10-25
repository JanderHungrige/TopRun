import type { AvatarId } from '../../game/profiles';
import { drawBust, type BustArt } from '../pixel/bust';
import { breath, pixelRig, rigKey, type Box, type Mood, type Rig } from '../portraits';
import { deckBackdrop, selectionFrame, skyClouds, type AvatarArt } from './kit';
import { PILOT1 } from './pilot1';
import { PILOT2 } from './pilot2';
import { PILOT3 } from './pilot3';

/**
 * The three player pilot avatars (original cartoons) as modern hi-res pixel art (doc 08, doc 20), drawn like the
 * portraits: own background, clipped to the box, contain-fit and bottom-aligned, with blinking, breathing and an
 * optional talking mouth.
 */

export interface AvatarState { t: number; mouth?: number; mood?: Mood; selected?: boolean }

/** One accent colour per avatar for UI (card borders). */
export const AVATAR_COLORS: Readonly<Record<AvatarId, string>> = { pilot1: '#f2a531', pilot2: '#4fb0e6', pilot3: '#e2574c' };

const ART: Readonly<Record<AvatarId, AvatarArt>> = { pilot1: PILOT1, pilot2: PILOT2, pilot3: PILOT3 };
/** Per-avatar phase so a row of avatars never blinks or bobs in sync. */
const SEED: Readonly<Record<AvatarId, number>> = { pilot1: 5.7, pilot2: 6.9, pilot3: 8.2 };

function bust(id: AvatarId): BustArt<Rig> {
  const art = ART[id];
  return {
    id,
    background: (p, f) => deckBackdrop(p, f, art.sky),
    ambient: (g, v) => skyClouds(g, v, art.sky),
    figure(p, r) {
      art.body(p, r);
      const oy = p.oy;
      p.oy = oy + Math.round(r.m.nod * p.k);
      art.head(p, r);
      p.oy = oy;
      art.front?.(p, r);
    },
  };
}

const BUSTS: Readonly<Record<AvatarId, BustArt<Rig>>> = { pilot1: bust('pilot1'), pilot2: bust('pilot2'), pilot3: bust('pilot3') };
/** The pixel art of one avatar and its mood table (tests render its frames directly). */
export const avatarArt = (id: AvatarId): { art: BustArt<Rig>; moods: AvatarArt['moods'] } => ({ art: BUSTS[id], moods: ART[id].moods });

/** Head-and-shoulders pilot avatar filling the box like drawPortrait: own background, clipped, contain-fit, bottom-aligned.
 *  selected=true adds a pulsing gold pixel frame so a chosen avatar stands out in a picker. */
export function drawAvatar(ctx: CanvasRenderingContext2D, id: AvatarId, box: Box, s: AvatarState): void {
  const seed = SEED[id];
  const rig = pixelRig(s.t, s.mouth ?? 0, s.mood ?? 'neutral', 'none', seed, ART[id].moods);
  drawBust(ctx, box, BUSTS[id], {
    rig, key: rigKey(rig), t: s.t, bob: breath(s.t * 1.06, seed),
    overlay: s.selected ? selectionFrame : undefined,
  });
}
