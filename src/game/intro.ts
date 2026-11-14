import type { CampaignId } from '../data/types';
import type { SaveData } from './save';

// A new world's welcome (doc 97): Duke's short film of four key frames, each panned slowly with his line in the speech
// box, then the WELCOME TO card. It plays once when the map first shows the world, and again from the TV. Pure.

/** The worlds that open with a welcome: every world after the first (the second front since 2026-11-13). */
export const INTRO_WORLDS: readonly CampaignId[] = Object.freeze([2, 3, 4, 5, 6] as const);

export const INTRO = Object.freeze({
  /** Seconds per shot, the cross-fade between shots, when Duke's line comes up in a shot, the card's start, the end. */
  shot: 8,
  fade: 1,
  lineAt: 0.6,
  shots: 4,
  cardAt: 32,
  length: 37,
});

export interface IntroBeat {
  shot: number;
  /** The shot fading out under the new one, and how far the new one is in (1 = fully). */
  from: number | null;
  fade: number;
  /** How far the shot's pan has come, 0 … 1. */
  pan: number;
  /** Black over everything (fade in / out). */
  black: number;
  /** Duke's line for this shot is up. */
  line: boolean;
  /** The card's opacity. */
  card: number;
  end: boolean;
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

export function introBeat(t: number): IntroBeat {
  const { shot: S, fade: F, lineAt, shots, cardAt, length } = INTRO;
  const shot = Math.min(shots - 1, Math.max(0, Math.floor(t / S)));
  const into = t - shot * S;
  const from = shot > 0 && into < F ? shot - 1 : null;
  return {
    shot, from, fade: from === null ? 1 : clamp01(into / F),
    pan: clamp01(into / (shot === shots - 1 ? length - shot * S : S)),
    black: Math.max(clamp01(1 - t / F), clamp01((t - (length - F)) / F)),
    line: t < cardAt && into >= lineAt,
    card: clamp01((t - cardAt) / F),
    end: t >= length,
  };
}

/** ENTER / tap: to the next shot, from the last shot to the card, from the card to the end. */
export function introNext(t: number): number {
  if (t >= INTRO.cardAt) return INTRO.length;
  return Math.min(INTRO.cardAt, (Math.floor(t / INTRO.shot) + 1) * INTRO.shot);
}

/** The pilot has not yet been welcomed to this world. */
export const introDue = (save: SaveData, world: CampaignId): boolean => INTRO_WORLDS.includes(world) && !save.intros.includes(world);

/** The save with the world's welcome seen (the same save if it was). */
export const markIntroSeen = (save: SaveData, world: CampaignId): SaveData =>
  save.intros.includes(world) ? save : { ...save, intros: [...save.intros, world] };

/** A pan: the window's top-left from (x0, y0) to (x1, y1), art px on the 320 × 180 plate. */
type Pan = readonly [number, number, number, number];
/** The window: 256 × 144 art px (5 logical px per art px fill the 1280 × 720 screen), so it may sit 64 × 36 in. */
export const WINDOW = Object.freeze({ w: 256, h: 144, scale: 5 });

const PANS: Readonly<Record<number, readonly Pan[]>> = {
  2: [[56, 4, 10, 30], [0, 24, 64, 20], [0, 10, 60, 20], [32, 36, 32, 4]],
  3: [[0, 30, 56, 14], [60, 8, 10, 20], [32, 0, 32, 36], [0, 18, 64, 18]],
  4: [[20, 0, 40, 36], [0, 20, 64, 12], [64, 6, 14, 28], [32, 0, 32, 36]],
  5: [[8, 8, 56, 28], [64, 18, 0, 18], [0, 36, 60, 4], [10, 30, 54, 6]],
  6: [[32, 0, 32, 34], [0, 24, 64, 14], [60, 30, 4, 10], [10, 4, 54, 30]],
};

const ease = (u: number): number => u * u * (3 - 2 * u);

/** Where the window sits on shot `shot` of `world`'s film, `u` of the way through its pan. */
export function introCamera(world: CampaignId, shot: number, u: number): { x: number; y: number } {
  const p = PANS[world]?.[shot] ?? [0, 18, 64, 18];
  const k = ease(clamp01(u));
  return { x: p[0] + (p[2] - p[0]) * k, y: p[1] + (p[3] - p[1]) * k };
}
