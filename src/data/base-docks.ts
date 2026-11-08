import { PILOT_FLOOR_Y, type AreaRect, type AreaTable, type BaseAreaDef, type BaseAreaId } from './base-areas';

// The home base's picture looks (docs 73, 76, 86, 91, 92): the carrier lounge (maps 1–2), the helicopter base (map 3), the
// underwater dock (map 4), the
// space-station dock (map 5) and the jungle hut (map 6), each a generated picture with every area's hotspot, name plate and
// stand point placed on the picture's own objects, and the places the game draws over it — the flip board, the chalkboard's
// slate, the TV cart, the neon sign, a globe. The way to the map is the carrier's opening onto the flight deck, the space
// dock's porthole and the globes (doc 76).

const area = (id: BaseAreaId, row: BaseAreaDef['row'], hot: AreaRect, plate: { x: number; y: number }, standX: number, deep?: { y: number; via?: number }): BaseAreaDef =>
  ({ id, row, hot, plate, standX, ...(deep ? { standY: deep.y, via: deep.via ?? standX } : {}) });

export interface DockLayout {
  /** The picture's scoreboard: world 1's flip board covers it, `boardRows` rows of tiles (the ladder's three, blank
   *  rows below on a tall board). */
  board: AreaRect;
  boardRows: number;
  /** The picture's chalkboard: world 1's framed chalkboard covers it. */
  slate: AreaRect;
  /** The TV cart's footprint (left, floor line); null where the picture has its own TV (`picturedTv`). */
  tv: { x: number; base: number } | null;
  /** The picture's own TV (doc 93): its screen, where the game plays the TV's picture, and the video recorder's clock. */
  picturedTv?: { screen: AreaRect; clock: { x: number; y: number } };
  /** The neon sign over the rec room: the joystick sign covers the picture's own. */
  neon: AreaRect;
  /** The globe drawn in code, the way to the map (doc 76); null where the picture's own windows are. */
  globe: AreaRect | null;
  /** The pilot's scale on this dock's floor, so a grown-up is as tall as its lockers and doors say (doc 76). */
  pilot: number;
  /** Whether the picture has a walk-behind mask (`<look>-front.png`): what stands in front of the pilot (doc 92). */
  front?: boolean;
  /** A look with depth (doc 92): the horizon's y; the pilot's scale is `pilot` on the front line and shrinks towards it. */
  horizon?: number;
}

/** The pilot's scale with the feet on floor line y: shrinking towards the horizon on a look with depth (doc 92). */
export const scaleAt = (L: DockLayout, y: number): number => (L.horizon === undefined ? L.pilot : (L.pilot * (y - L.horizon)) / (PILOT_FLOOR_Y - L.horizon));

/** The carrier lounge D (maps 1–2, doc 91): the rec room alcove with the arcade and the lockers on the left, the scoreboard
 *  over the long chalkboard, the couch on its rug, the open steel door into the hangar hall (the craft), the cork board on the
 *  right wall and the big opening onto the flight deck (the way to the map); the TV cart stands on the free floor by the
 *  couch. Depth (doc 92): the arcade and the lockers a step back, the door up the lane between the coffee table and the TV
 *  cart, the opening on its threshold. */
export const CARRIER_AREAS: AreaTable = Object.freeze({
  fun: area('fun', 'floor', { x: 76, y: 160, w: 200, h: 360 }, { x: 176, y: 148 }, 176, { y: 560 }),
  tv: area('tv', 'floor', { x: 886, y: 375, w: 156, h: 282 }, { x: 964, y: 363 }, 964),
  locker: area('locker', 'floor', { x: 216, y: 246, w: 118, h: 274 }, { x: 275, y: 234 }, 275, { y: 560 }),
  photos: area('photos', 'mid', { x: 956, y: 254, w: 62, h: 118 }, { x: 987, y: 242 }, 987),
  jet: area('jet', 'floor', { x: 726, y: 226, w: 158, h: 266 }, { x: 805, y: 214 }, 790, { y: 495 }), // the door's left side: the jet stays in view
  ladder: area('ladder', 'wall', { x: 378, y: 166, w: 244, h: 92 }, { x: 500, y: 154 }, 500),
  chalk: area('chalk', 'mid', { x: 378, y: 264, w: 356, h: 136 }, { x: 556, y: 252 }, 556),
  exit: area('exit', 'floor', { x: 1044, y: 150, w: 196, h: 380 }, { x: 1142, y: 138 }, 1142, { y: 580 }),
});

export const CARRIER_LAYOUT: DockLayout = {
  board: { x: 382, y: 170, w: 236, h: 82 },
  boardRows: 3,
  slate: { x: 384, y: 270, w: 344, h: 124 },
  tv: { x: 888, base: 655 },
  neon: { x: 106, y: 108, w: 140, h: 42 },
  globe: null,
  pilot: 1,
  horizon: 270,
};

/** The helicopter base's hangar corner K2 (map 3, doc 92): the pink arcade between the lockers, the scoreboard over the
 *  chalkboard, the cork board, the couch and coffee table on the rug, the huge open gate with the helicopter outside (the
 *  craft), the map table in the right foreground (the way to the map, drawn over the pilot). The room has depth: the pilot
 *  walks the front line and goes up the free lane between the coffee table and the map table to the gate, the TV and the
 *  photos, smaller the deeper he goes. */
export const HELI_AREAS: AreaTable = Object.freeze({
  fun: area('fun', 'floor', { x: 104, y: 340, w: 104, h: 262 }, { x: 156, y: 328 }, 160, { y: 612 }),
  tv: area('tv', 'floor', { x: 656, y: 400, w: 76, h: 126 }, { x: 694, y: 388 }, 728, { y: 556, via: 750 }),
  locker: area('locker', 'floor', { x: 224, y: 342, w: 80, h: 236 }, { x: 264, y: 330 }, 264, { y: 600 }),
  photos: area('photos', 'mid', { x: 652, y: 322, w: 92, h: 72 }, { x: 698, y: 310 }, 734, { y: 532, via: 750 }),
  jet: area('jet', 'floor', { x: 822, y: 176, w: 356, h: 316 }, { x: 1000, y: 164 }, 900, { y: 512, via: 750 }),
  ladder: area('ladder', 'wall', { x: 296, y: 184, w: 236, h: 124 }, { x: 414, y: 172 }, 414),
  chalk: area('chalk', 'mid', { x: 298, y: 308, w: 304, h: 134 }, { x: 450, y: 296 }, 450),
  exit: area('exit', 'floor', { x: 790, y: 496, w: 470, h: 224 }, { x: 1025, y: 484 }, 1030),
});

export const HELI_LAYOUT: DockLayout = {
  board: { x: 300, y: 190, w: 226, h: 112 },
  boardRows: 3,
  slate: { x: 300, y: 312, w: 300, h: 126 }, // world 1's chalkboard over the picture's and the first cork board, as wide as it wants
  tv: { x: 660, base: 522 },
  neon: { x: 104, y: 296, w: 104, h: 40 },
  globe: null,
  pilot: 0.91,
  front: true,
  horizon: 417,
};

/** The space lounge H81 (map 5, doc 94): cozy crew quarters inside the hull — the pink rec room through a doorway on the
 *  left, the lockers, the scoreboard over the big chalkboard, the cork board, the couch on its rug, the flat-screen TV on a
 *  battered cabinet, the big square window with the docked starfighter against a huge planet (the craft) and the glowing
 *  holographic map table in front of it (the way to the map; the pilot walks behind it, doc 92). */
export const SPACE_AREAS: AreaTable = Object.freeze({
  fun: area('fun', 'floor', { x: 60, y: 140, w: 170, h: 410 }, { x: 145, y: 128 }, 150, { y: 548 }),
  tv: area('tv', 'floor', { x: 700, y: 332, w: 154, h: 110 }, { x: 777, y: 320 }, 612),
  locker: area('locker', 'floor', { x: 200, y: 214, w: 146, h: 318 }, { x: 273, y: 202 }, 275, { y: 548 }),
  photos: area('photos', 'mid', { x: 724, y: 204, w: 90, h: 118 }, { x: 769, y: 192 }, 700),
  jet: area('jet', 'wall', { x: 900, y: 64, w: 336, h: 352 }, { x: 1068, y: 52 }, 1000, { y: 495 }),
  ladder: area('ladder', 'wall', { x: 388, y: 102, w: 296, h: 106 }, { x: 536, y: 90 }, 500),
  chalk: area('chalk', 'mid', { x: 380, y: 214, w: 334, h: 194 }, { x: 547, y: 202 }, 560),
  exit: area('exit', 'floor', { x: 834, y: 456, w: 440, h: 244 }, { x: 1054, y: 444 }, 1050),
});

export const SPACE_LAYOUT: DockLayout = {
  board: { x: 392, y: 104, w: 290, h: 102 },
  boardRows: 3,
  slate: { x: 388, y: 224, w: 318, h: 178 },
  tv: null,
  picturedTv: { screen: { x: 710, y: 342, w: 134, h: 88 }, clock: { x: 712, y: 454 } },
  neon: { x: 96, y: 186, w: 100, h: 34 },
  globe: null,
  pilot: 1.05,
  front: true,
  horizon: 190,
};

/** The underwater lounge D41 (map 4, doc 93): the whole left wall one big window with the docked submarine's bow right
 *  outside (the craft), the antique floor globe in front of it (the way to the map), the scoreboard over the big chalkboard
 *  on the back wall, the couch, the old TV with its video recorder on a cabinet, the cork board, the pink rec room through
 *  the doorway on the right and the lockers along the right wall. The room has depth: the window, the TV, the photos, the
 *  rec room and the lockers are a step or two back from the front line, which runs right of the globe. */
export const SEA_AREAS: AreaTable = Object.freeze({
  fun: area('fun', 'floor', { x: 944, y: 220, w: 128, h: 326 }, { x: 1008, y: 208 }, 1005, { y: 555 }),
  tv: area('tv', 'floor', { x: 776, y: 390, w: 132, h: 150 }, { x: 842, y: 378 }, 735, { y: 572 }),
  locker: area('locker', 'floor', { x: 1086, y: 150, w: 194, h: 500 }, { x: 1183, y: 138 }, 1150, { y: 605 }),
  photos: area('photos', 'mid', { x: 846, y: 254, w: 72, h: 108 }, { x: 882, y: 242 }, 928, { y: 555 }),
  jet: area('jet', 'wall', { x: 44, y: 24, w: 360, h: 344 }, { x: 224, y: 12 }, 400, { y: 585 }),
  ladder: area('ladder', 'wall', { x: 520, y: 150, w: 318, h: 94 }, { x: 679, y: 138 }, 700),
  chalk: area('chalk', 'mid', { x: 520, y: 248, w: 318, h: 144 }, { x: 679, y: 236 }, 600),
  exit: area('exit', 'floor', { x: 80, y: 376, w: 216, h: 324 }, { x: 188, y: 364 }, 360),
});

export const SEA_LAYOUT: DockLayout = {
  board: { x: 522, y: 152, w: 314, h: 90 },
  boardRows: 3,
  slate: { x: 526, y: 254, w: 304, h: 132 },
  tv: null,
  picturedTv: { screen: { x: 796, y: 404, w: 56, h: 40 }, clock: { x: 800, y: 472 } },
  neon: { x: 946, y: 166, w: 122, h: 40 },
  globe: null,
  pilot: 1.05,
  horizon: 240,
};

/** The jungle base's crew hut (map 6, doc 86): the lockers and the rec room on the left, the scoreboard over the chalkboard,
 *  the lab's door with its green window, the cork board, the big window onto the ground base's compound and the open
 *  gate with a mech parked outside (the craft); a planet globe drawn in code is the way to the map. */
export const JUNGLE_AREAS: AreaTable = Object.freeze({
  fun: area('fun', 'floor', { x: 138, y: 226, w: 128, h: 330 }, { x: 202, y: 214 }, 206),
  tv: area('tv', 'floor', { x: 282, y: 430, w: 130, h: 230 }, { x: 347, y: 418 }, 352),
  locker: area('locker', 'floor', { x: 0, y: 270, w: 136, h: 410 }, { x: 68, y: 258 }, 90),
  photos: area('photos', 'mid', { x: 698, y: 290, w: 84, h: 72 }, { x: 740, y: 278 }, 736),
  jet: area('jet', 'floor', { x: 1040, y: 150, w: 240, h: 490 }, { x: 1160, y: 138 }, 1110),
  base: area('base', 'wall', { x: 828, y: 222, w: 164, h: 200 }, { x: 910, y: 210 }, 910),
  lab: area('lab', 'floor', { x: 552, y: 262, w: 140, h: 252 }, { x: 622, y: 250 }, 622),
  ladder: area('ladder', 'wall', { x: 376, y: 210, w: 120, h: 78 }, { x: 436, y: 198 }, 440),
  chalk: area('chalk', 'mid', { x: 352, y: 296, w: 180, h: 104 }, { x: 442, y: 284 }, 450),
  exit: area('exit', 'floor', { x: 922, y: 446, w: 112, h: 210 }, { x: 978, y: 434 }, 960),
});

export const JUNGLE_LAYOUT: DockLayout = {
  board: { x: 380, y: 214, w: 112, h: 68 },
  boardRows: 3,
  slate: { x: 360, y: 303, w: 162, h: 90 },
  tv: { x: 288, base: 656 },
  neon: { x: 146, y: 196, w: 114, h: 34 },
  globe: { x: 930, y: 452, w: 100, h: 200 },
  pilot: 0.9,
};
