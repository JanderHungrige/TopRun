// Cockpit console geometry in logical 1280×720 units (doc 05). Scenes hit-test the buttons with these.

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Dial {
  cx: number;
  cy: number;
  r: number;
}

export const LEFT = Object.freeze({
  panel: { x: 0, y: 0, w: 320, h: 720 },
  plate: { x: 14, y: 10, w: 292, h: 48 },
  radar: { cx: 160, cy: 192, r: 104 },
  hull: { cx: 84, cy: 392, r: 56 },
  cannon: { x: 160, y: 340, w: 146, h: 108 },
  stores: { x: 14, y: 462, w: 292, h: 132 },
  missileBtn: { x: 14, y: 606, w: 140, h: 96 },
  switchBtn: { x: 166, y: 606, w: 140, h: 96 },
});

export const RIGHT = Object.freeze({
  panel: { x: 960, y: 0, w: 320, h: 720 },
  mission: { x: 974, y: 10, w: 292, h: 240 },
  warnings: { x: 974, y: 262, w: 292, h: 110 },
  flareBtn: { x: 974, y: 386, w: 140, h: 150 },
  specialBtn: { x: 1126, y: 386, w: 140, h: 150 },
  attitude: { cx: 1046, cy: 626, r: 62 },
  pauseBtn: { x: 1126, y: 592, w: 140, h: 68 },
});
