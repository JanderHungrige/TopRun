import { AVATAR_IDS, type AvatarId } from './profiles';

// NEW PILOT's card grid (doc 08): rows of five; the first row ends with CREATE YOUR OWN, later presets fill the
// rows below it (owner, 2026-10-27: "from now on simply a second row under the first 4 + own avatar"). Pure.

export const NEW_PILOT_COLS = 5;

export type PilotCard = AvatarId | 'own';

/** Presets in order with CREATE YOUR OWN closing the first row. */
export function cardOrder(ids: readonly AvatarId[] = AVATAR_IDS, cols = NEW_PILOT_COLS): PilotCard[] {
  return [...ids.slice(0, cols - 1), 'own', ...ids.slice(cols - 1)];
}

export const cardCell = (i: number, cols = NEW_PILOT_COLS): { row: number; col: number } =>
  ({ row: Math.floor(i / cols), col: i % cols });

/** ←/→ walk every card, wrapping; ↑/↓ change row in the same column, clamped to the last card. */
export function moveCard(i: number, dx: number, dy: number, count: number, cols = NEW_PILOT_COLS): number {
  if (count <= 0) return 0;
  if (dy === 0) return (((i + dx) % count) + count) % count;
  const j = i + dy * cols;
  if (j < 0) return i;
  if (j < count) return j;
  return cardCell(i, cols).row < cardCell(count - 1, cols).row ? count - 1 : i;
}
