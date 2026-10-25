// Hangar base (doc 30): where things are in the 1280 × 720 hangar (logical px), shared by the static layers,
// the ambient animation and the cast. The areas' hotspots and stand points are in src/data/base-areas.ts.

/** Underside of the roof truss and the line where the back wall meets the floor. */
export const ROOF_Y = 92;
export const WALL_BASE = 500;
/** Ceiling lamps (bulb x) hanging from the truss; bulbs at LAMP_Y. */
export const LAMPS: readonly number[] = Object.freeze([236, 460, 1068]);
export const LAMP_Y = 117;
/** Steel I-beam pillars (left edge, 12 wide). */
export const PILLARS: readonly number[] = Object.freeze([226, 444, 640, 1080]);

/** The open hangar door (EXIT): the opening onto the airfield, the frame around it, the horizon outside. */
export const DOOR = { x: 1108, y: 146, w: 130, h: WALL_BASE - 146 } as const;
export const DOOR_FRAME = { x: 1092, y: 124 } as const;
export const HORIZON = 432;
export const BEACON = { x: 1100, y: 130 } as const;

/** FUN MISSIONS: the rec-room doorway and the neon sign above it. */
export const REC = { x: 42, y: 300, w: 154, h: WALL_BASE - 300 } as const;
export const NEON = { x: 70, y: 222, w: 98, h: 62 } as const;
export const ARCADE = { x: 60, y: 368, w: 38 } as const;

/** LOCKER: four lockers from x, `w` wide each, tops at y; the third one stands ajar. */
export const LOCKERS = { x: 254, y: 318, w: 44, n: 4, ajar: 2, base: 492 } as const;
export const FAN = { x: 346, y: 190, r: 30 } as const;

/** PICTURE WALL: the framed corkboard. */
export const CORK = { x: 474, y: 194, w: 160, h: 148 } as const;

/** The parked jet: centre x, main-gear floor line and the box its side view is fitted into. */
export const JET = { cx: 800, ground: 574, w: 540, h: 215 } as const;
/** The plane captain polishing the nose and the tool cart with the coffee mug in front of the tail. */
export const MECH = { x: 952, foot: 598, scale: 0.42 } as const;
export const CART = { x: 452, y: 540, w: 78, base: 606 } as const;
export const MUG = { x: 514, y: 530 } as const;

/** The pilot figure's scale (people kit: 328 units tall → ~164 logical px). */
export const PILOT_SCALE = 0.5;
/** The floor's vanishing point (perspective joints, light shaft). */
export const VP = { x: 640, y: 230 } as const;

/** The flip board: 14 × 3 tiles of TILE_W × TILE_H art px with 1-px gaps, centred in the LADDER hotspot. */
export const BOARD_COLS = 14;
export const BOARD_ROWS = 3;
export const TILE_W = 7;
export const TILE_H = 11;
export const TILE_GAP = 1;
export const ROW_GAP = 3;
