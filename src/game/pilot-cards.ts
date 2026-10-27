import type { AvatarId } from './profiles';

// NEW PILOT's card grid (doc 08): rows of five in the owner's order (2026-10-27) — CREATE YOUR OWN closes row 3,
// row 4 holds the last four presets. Pure.

export const NEW_PILOT_COLS = 5;

export type PilotCard = AvatarId | 'own';

/** Every preset once plus CREATE YOUR OWN, row by row as the owner placed them. */
export const CARD_ORDER: readonly PilotCard[] = Object.freeze([
  'pilot1', 'pilot2', 'pilot3', 'pilot4', 'pilot10',
  'pilot5', 'pilot6', 'pilot7', 'pilot8', 'pilot9',
  'pilot12', 'pilot13', 'pilot15', 'pilot14', 'own',
  'pilot11', 'pilot16', 'pilot17', 'pilot18',
] as const);

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
