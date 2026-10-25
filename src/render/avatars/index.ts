import type { AvatarId } from '../../game/profiles';
import type { Box, Mood, Rig } from '../portraits';
import { avatarRig, deckBackdrop, FRAME_H, FRAME_W, NECK_Y, selectionFrame, type AvatarArt } from './kit';
import { PILOT1 } from './pilot1';
import { PILOT2 } from './pilot2';
import { PILOT3 } from './pilot3';

/**
 * The three player pilot avatars (original cartoons), drawn like the portraits: own background, clipped to the
 * box, contain-fit and bottom-aligned, with blinking, breathing and an optional talking mouth.
 */

export interface AvatarState { t: number; mouth?: number; mood?: Mood; selected?: boolean }

/** One accent colour per avatar for UI (card borders). */
export const AVATAR_COLORS: Readonly<Record<AvatarId, string>> = { pilot1: '#f2a531', pilot2: '#4fb0e6', pilot3: '#e2574c' };

const ART: Readonly<Record<AvatarId, AvatarArt>> = { pilot1: PILOT1, pilot2: PILOT2, pilot3: PILOT3 };
/** Per-avatar phase so a row of avatars never blinks or bobs in sync. */
const SEED: Readonly<Record<AvatarId, number>> = { pilot1: 5.7, pilot2: 6.9, pilot3: 8.2 };

function figure(ctx: CanvasRenderingContext2D, art: AvatarArt, r: Rig, seed: number): void {
  ctx.save();
  ctx.translate(0, Math.sin(r.t * 1.7 + seed) * 0.45); // breathing
  art.body(ctx, r);
  ctx.save();
  const tilt = art.tilt + r.m.tilt + Math.sin(r.t * 0.8 + seed) * 0.02;
  const bob = Math.sin(r.t * 1.7 + seed + 0.5) * 0.5 + r.m.nod + r.mouth * 0.6;
  ctx.translate(0, NECK_Y);
  ctx.rotate(tilt);
  ctx.translate(0, bob - NECK_Y);
  art.head(ctx, r);
  ctx.restore();
  art.front?.(ctx, r);
  ctx.restore();
}

/** Head-and-shoulders pilot avatar filling the box like drawPortrait: own background, clipped, contain-fit, bottom-aligned.
 *  selected=true adds a bright gold frame/glow so a chosen avatar stands out in a picker. */
export function drawAvatar(ctx: CanvasRenderingContext2D, id: AvatarId, box: Box, s: AvatarState): void {
  const k = Math.min(box.w / FRAME_W, box.h / FRAME_H);
  if (!(k > 0)) return;
  const art = ART[id];
  const seed = SEED[id];
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  ctx.save();
  ctx.translate(box.x + box.w / 2, box.y + box.h);
  ctx.scale(k, k);
  ctx.translate(0, -FRAME_H);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const hw = box.w / 2 / k + 2;
  deckBackdrop(ctx, { l: -hw, r: hw, t: FRAME_H - box.h / k - 2, b: FRAME_H + 2 }, s.t, art.sky);
  figure(ctx, art, avatarRig(s.t, s.mouth ?? 0, s.mood ?? 'neutral', seed, art.moods), seed);
  ctx.restore();
  if (s.selected) selectionFrame(ctx, box, s.t);
  ctx.restore();
}
