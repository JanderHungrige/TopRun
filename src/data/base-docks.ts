import { PILOT_FLOOR_Y, type AreaRect, type AreaTable, type BaseAreaDef, type BaseAreaId } from './base-areas';

// The home base's picture looks (docs 73, 76, 86, 91): the carrier lounge (maps 1–3), the underwater dock (map 4), the
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
  /** The TV cart's footprint (left, floor line). */
  tv: { x: number; base: number };
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

/** The carrier lounge D (maps 1–3, doc 91): the rec room alcove with the arcade and the lockers on the left, the scoreboard
 *  over the long chalkboard, the couch on its rug, the open steel door into the hangar hall (the craft), the cork board on the
 *  right wall and the big opening onto the flight deck (the way to the map); the TV cart stands on the free floor by the
 *  couch. */
export const CARRIER_AREAS: AreaTable = Object.freeze({
  fun: area('fun', 'floor', { x: 76, y: 160, w: 200, h: 360 }, { x: 176, y: 148 }, 176),
  tv: area('tv', 'floor', { x: 886, y: 375, w: 156, h: 282 }, { x: 964, y: 363 }, 964),
  locker: area('locker', 'floor', { x: 216, y: 246, w: 118, h: 274 }, { x: 275, y: 234 }, 275),
  photos: area('photos', 'mid', { x: 956, y: 254, w: 62, h: 118 }, { x: 987, y: 242 }, 987),
  jet: area('jet', 'floor', { x: 726, y: 226, w: 158, h: 266 }, { x: 805, y: 214 }, 690), // the pilot stands aside, the hall stays in view
  ladder: area('ladder', 'wall', { x: 378, y: 166, w: 244, h: 92 }, { x: 500, y: 154 }, 500),
  chalk: area('chalk', 'mid', { x: 378, y: 264, w: 356, h: 136 }, { x: 556, y: 252 }, 556),
  exit: area('exit', 'floor', { x: 1044, y: 150, w: 196, h: 380 }, { x: 1142, y: 138 }, 1142),
});

export const CARRIER_LAYOUT: DockLayout = {
  board: { x: 382, y: 170, w: 236, h: 82 },
  boardRows: 3,
  slate: { x: 384, y: 270, w: 344, h: 124 },
  tv: { x: 888, base: 655 },
  neon: { x: 106, y: 108, w: 140, h: 42 },
  globe: null,
  pilot: 1,
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

/** Space dock G (map 5, doc 76): cozy crew quarters — the rec room alcove with the arcade, the lockers, the scoreboard over
 *  the chalkboard, the shelf of framed photos, the couch on its rug; the left porthole leads to the map, the right one
 *  shows a sliver of the docked starfighter (the craft). */
export const SPACE_AREAS: AreaTable = Object.freeze({
  fun: area('fun', 'floor', { x: 116, y: 196, w: 170, h: 344 }, { x: 200, y: 184 }, 200),
  tv: area('tv', 'floor', { x: 618, y: 400, w: 136, h: 246 }, { x: 686, y: 388 }, 686),
  locker: area('locker', 'floor', { x: 318, y: 232, w: 164, h: 300 }, { x: 400, y: 220 }, 400),
  photos: area('photos', 'mid', { x: 560, y: 380, w: 124, h: 140 }, { x: 622, y: 368 }, 560),
  jet: area('jet', 'wall', { x: 1068, y: 112, w: 192, h: 300 }, { x: 1164, y: 100 }, 1150),
  ladder: area('ladder', 'wall', { x: 486, y: 120, w: 284, h: 116 }, { x: 628, y: 108 }, 628),
  chalk: area('chalk', 'mid', { x: 510, y: 250, w: 242, h: 146 }, { x: 631, y: 238 }, 640),
  exit: area('exit', 'wall', { x: 834, y: 184, w: 154, h: 216 }, { x: 911, y: 172 }, 900),
});

export const SPACE_LAYOUT: DockLayout = {
  board: { x: 488, y: 124, w: 280, h: 108 },
  boardRows: 3,
  slate: { x: 512, y: 252, w: 238, h: 142 },
  tv: { x: 620, base: 646 },
  neon: { x: 140, y: 136, w: 130, h: 44 },
  globe: null,
  pilot: 0.86,
};

/** Underwater dock C (map 4): lockers, the rec room, the scoreboard and the photos over the chalkboard, the big
 *  round window with the sub docked outside. */
export const SEA_AREAS: AreaTable = Object.freeze({
  fun: area('fun', 'floor', { x: 104, y: 188, w: 216, h: 376 }, { x: 200, y: 176 }, 210),
  tv: area('tv', 'floor', { x: 178, y: 384, w: 136, h: 240 }, { x: 246, y: 372 }, 246),
  locker: area('locker', 'floor', { x: 322, y: 278, w: 148, h: 280 }, { x: 396, y: 266 }, 396),
  photos: area('photos', 'wall', { x: 408, y: 234, w: 190, h: 54 }, { x: 652, y: 262 }, 503),
  jet: area('jet', 'floor', { x: 780, y: 170, w: 490, h: 320 }, { x: 1020, y: 520 }, 900),
  ladder: area('ladder', 'wall', { x: 388, y: 82, w: 212, h: 150 }, { x: 494, y: 70 }, 494),
  chalk: area('chalk', 'mid', { x: 464, y: 288, w: 144, h: 138 }, { x: 536, y: 440 }, 536),
  exit: area('exit', 'floor', { x: 1096, y: 426, w: 132, h: 248 }, { x: 1162, y: 414 }, 1030),
});

export const SEA_LAYOUT: DockLayout = {
  board: { x: 388, y: 82, w: 210, h: 148 },
  boardRows: 4,
  slate: { x: 466, y: 286, w: 140, h: 138 },
  tv: { x: 182, base: 622 },
  neon: { x: 134, y: 242, w: 132, h: 38 },
  globe: { x: 1100, y: 430, w: 124, h: 240 },
  pilot: 0.84,
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
