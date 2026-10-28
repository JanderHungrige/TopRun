import { CELL_PX, PX_H, PX_W, type ChalkColor } from '../game/chalkboard';
import { SPONGE_H, SPONGE_W } from '../game/chalkboard-ops';

// Chalkboard scene (doc 40): where things are on the 1280 × 720 screen (logical px).

export interface Box { x: number; y: number; w: number; h: number }

/** The slate: one board px per logical px (4 per cell). */
export const SLATE: Box = { x: 40, y: 92, w: PX_W, h: PX_H };
/** Width of the wooden frame around the slate. */
export const FRAME_W = 14;
/** The ledge under the frame that holds the chalk and the sponge. */
export const LEDGE: Box = { x: 20, y: SLATE.y + PX_H + FRAME_W, w: 1240, h: 14 };
/** Where the floor starts below the board. */
export const FLOOR_Y = 600;

export type ToolId = 'white' | 'yellow' | 'pink' | 'blue' | 'sponge';
/** Tools in tray order (X cycles through them). */
export const TOOLS: readonly ToolId[] = Object.freeze(['white', 'yellow', 'pink', 'blue', 'sponge'] as const);

/** The chalk colour a tool draws, or null for the sponge. */
export function toolColor(id: ToolId): ChalkColor | null {
  switch (id) {
    case 'white': return 0;
    case 'yellow': return 1;
    case 'pink': return 2;
    case 'blue': return 3;
    case 'sponge': return null;
    default: throw new Error(`unhandled: ${id satisfies never}`);
  }
}

/** Each tool's place on the ledge (also its tap target). */
export const TOOL_SPOT: Readonly<Record<ToolId, Box>> = Object.freeze({
  white: { x: 70, y: LEDGE.y - 26, w: 64, h: 44 },
  yellow: { x: 140, y: LEDGE.y - 26, w: 64, h: 44 },
  pink: { x: 210, y: LEDGE.y - 26, w: 64, h: 44 },
  blue: { x: 280, y: LEDGE.y - 26, w: 64, h: 44 },
  sponge: { x: 370, y: LEDGE.y - 40, w: 96, h: 58 },
});

/** The water bucket on the floor. */
export const BUCKET: Box = { x: 940, y: 556, w: 120, h: 104 };

/** The sponge's footprint in logical px (SPONGE_W × SPONGE_H cells). */
export const SPONGE_PX = { w: SPONGE_W * CELL_PX, h: SPONGE_H * CELL_PX } as const;
