import type { AreaRect, BaseAreaDef, BaseAreaId } from './base-areas';

// The home base's other looks (doc 73): the space-station dock (map 5) and the underwater dock (map 4, doc 74), each a generated
// picture with every area's hotspot, name plate and stand point placed on the picture's own objects, and the places the
// game draws over it — the flip board, the chalkboard's slate, the TV cart, the neon sign, the exit hatch.

const area = (id: BaseAreaId, row: BaseAreaDef['row'], hot: AreaRect, plate: { x: number; y: number }, standX: number): BaseAreaDef =>
  ({ id, row, hot, plate, standX });

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
  /** The exit hatch drawn in code (left, top, size). */
  hatch: AreaRect;
}

/** Space dock A (map 5): rec room left, lockers, the scoreboard on the catwalk, the chalkboard, the starfighter. */
export const SPACE_AREAS: Readonly<Record<BaseAreaId, BaseAreaDef>> = Object.freeze({
  fun: area('fun', 'floor', { x: 18, y: 200, w: 264, h: 356 }, { x: 150, y: 188 }, 150),
  tv: area('tv', 'floor', { x: 150, y: 452, w: 92, h: 168 }, { x: 196, y: 440 }, 196),
  locker: area('locker', 'floor', { x: 324, y: 284, w: 196, h: 230 }, { x: 422, y: 272 }, 422),
  photos: area('photos', 'wall', { x: 530, y: 288, w: 54, h: 84 }, { x: 556, y: 276 }, 556),
  jet: area('jet', 'floor', { x: 364, y: 432, w: 650, h: 188 }, { x: 900, y: 610 }, 690),
  ladder: area('ladder', 'wall', { x: 468, y: 92, w: 346, h: 92 }, { x: 640, y: 248 }, 640),
  chalk: area('chalk', 'mid', { x: 590, y: 286, w: 242, h: 136 }, { x: 712, y: 434 }, 712),
  exit: area('exit', 'floor', { x: 1060, y: 520, w: 200, h: 130 }, { x: 1160, y: 508 }, 1150),
});

export const SPACE_LAYOUT: DockLayout = {
  board: { x: 470, y: 94, w: 340, h: 86 },
  boardRows: 3,
  slate: { x: 588, y: 290, w: 240, h: 126 },
  tv: { x: 156, base: 618 },
  neon: { x: 120, y: 240, w: 122, h: 44 },
  hatch: { x: 1100, y: 590, w: 128, h: 56 },
};

/** Underwater dock C (map 4): lockers, the rec room, the scoreboard and the photos over the chalkboard, the big
 *  round window with the sub docked outside. */
export const SEA_AREAS: Readonly<Record<BaseAreaId, BaseAreaDef>> = Object.freeze({
  fun: area('fun', 'floor', { x: 104, y: 188, w: 216, h: 376 }, { x: 200, y: 176 }, 210),
  tv: area('tv', 'floor', { x: 176, y: 452, w: 92, h: 172 }, { x: 222, y: 440 }, 222),
  locker: area('locker', 'floor', { x: 322, y: 278, w: 148, h: 280 }, { x: 396, y: 266 }, 396),
  photos: area('photos', 'wall', { x: 408, y: 234, w: 190, h: 54 }, { x: 652, y: 262 }, 503),
  jet: area('jet', 'floor', { x: 780, y: 170, w: 490, h: 320 }, { x: 1020, y: 520 }, 900),
  ladder: area('ladder', 'wall', { x: 388, y: 82, w: 212, h: 150 }, { x: 494, y: 70 }, 494),
  chalk: area('chalk', 'mid', { x: 464, y: 288, w: 144, h: 138 }, { x: 536, y: 440 }, 536),
  exit: area('exit', 'floor', { x: 1080, y: 600, w: 190, h: 100 }, { x: 1175, y: 588 }, 1170),
});

export const SEA_LAYOUT: DockLayout = {
  board: { x: 388, y: 82, w: 210, h: 148 },
  boardRows: 4,
  slate: { x: 466, y: 286, w: 140, h: 138 },
  tv: { x: 182, base: 622 },
  neon: { x: 134, y: 242, w: 132, h: 38 },
  hatch: { x: 1110, y: 640, w: 130, h: 56 },
};
