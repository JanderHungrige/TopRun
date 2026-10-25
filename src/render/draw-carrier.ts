import { drawDeckVehicles, drawParkedAircraft } from './carrier/aircraft';
import { drawCrew } from './carrier/crew';
import { drawDeck, drawDeflector, drawShuttle } from './carrier/deck';
import { drawFittings } from './carrier/fittings';
import { CARRIER_BOW, CARRIER_STERN, ISLAND_W, ISLAND_X } from './carrier/geometry';
import { drawHull } from './carrier/hull';
import { drawIsland } from './carrier/island';
import { drawFlag, drawLights, drawMast, drawRadars } from './carrier/mast';
import { drawWater } from './carrier/water';

/** Side-view carrier world. World x runs along the deck (catapult start = 0); screen y is absolute. */
export { CARRIER_BOW, CARRIER_STERN, DECK_Y, SEA_Y } from './carrier/geometry';
export { drawSea, drawSky } from './carrier/sky-sea';

export interface CarrierView {
  camX: number;
  t: number;
  jbd: number; // jet blast deflector raise 0..1
  shooterPose: number; // radians of the launch officer's arm
  launched: boolean;
}

/** World-x span (with wake and mast overhang) that must be on screen for a part to be drawn. */
const visible = (camX: number, x0: number, x1: number): boolean => x1 > camX - 40 && x0 < camX + 1320;

/**
 * Side-view supercarrier (doc 04), drawn in world units under a camera translation: hull and fittings, flight
 * deck, parked aircraft, island with mast and rotating radars, deck crew, catapult shuttle, jet blast
 * deflector and the water around the hull. Static parts are baked into Path2D once (see carrier/pen.ts).
 */
export function drawCarrier(ctx: CanvasRenderingContext2D, v: CarrierView): void {
  if (!visible(v.camX, CARRIER_STERN - 320, CARRIER_BOW + 60)) return;
  ctx.save();
  ctx.translate(-v.camX, 0);
  drawHull(ctx);
  drawFittings(ctx);
  drawDeck(ctx);
  drawParkedAircraft(ctx);
  if (visible(v.camX, ISLAND_X - 20, ISLAND_X + ISLAND_W + 10)) {
    drawIsland(ctx);
    drawMast(ctx);
    drawRadars(ctx, v.t);
    drawFlag(ctx, v.t);
    drawLights(ctx, v.t, v.launched);
  }
  drawDeckVehicles(ctx);
  drawShuttle(ctx, v.launched);
  drawDeflector(ctx, v.jbd);
  drawCrew(ctx, v.t, v.shooterPose, v.launched);
  drawWater(ctx, v.t);
  ctx.restore();
}
