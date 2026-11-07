import { MARKS, toMark } from '../data/arsenal';
import { LASER_LEVELS, MAX_LASER_LEVEL, MAX_SHIP_MARK, MODULES, SHIELD, type ModuleId, type ShipMarkFamily } from '../data/ship-modules';
import { SECONDARIES } from '../data/weapons';
import { weaponStats } from './arsenal';
import { mapOpen } from './progress';
import type { SaveData } from './save';
import { markGain } from './ship';

// The shipyard's shop (doc 55): modules bought into stock — each further copy of a module costs a quarter more —,
// laser power, and Mk II–V marks per module family (doc 57). On sale once map 4 is open. Pure; works on any save (the
// ship's fields are its own).

export const COPY_STEP = 0.25;

/** How many of a module the ship has: placed plus in stock. */
export const owned = (save: SaveData, id: ModuleId): number =>
  save.ship.modules.filter((m) => m.id === id).length + (save.ship.stock[id] ?? 0);

export function modulePrice(save: SaveData, id: ModuleId): number | null {
  const def = MODULES[id];
  if (id === 'core' || (def.max > 0 && owned(save, id) >= def.max)) return null;
  return Math.round((def.price * (1 + COPY_STEP * owned(save, id))) / 1000) * 1000;
}

export type ShipBuyFailure = 'locked' | 'max' | 'insufficient-funds';
export type ShipCheck = { ok: true } | { ok: false; reason: ShipBuyFailure };

function check(save: SaveData, price: number | null): ShipCheck {
  if (!mapOpen(save, 4)) return { ok: false, reason: 'locked' };
  if (price === null) return { ok: false, reason: 'max' };
  return save.money < price ? { ok: false, reason: 'insufficient-funds' } : { ok: true };
}

export const canBuyModule = (save: SaveData, id: ModuleId): ShipCheck => check(save, modulePrice(save, id));

export function buyModule(save: SaveData, id: ModuleId): SaveData {
  const price = modulePrice(save, id);
  if (!canBuyModule(save, id).ok || price === null) return save;
  return { ...save, money: save.money - price, ship: { ...save.ship, stock: { ...save.ship.stock, [id]: save.ship.stock[id] + 1 } } };
}

export const laserPrice = (save: SaveData): number | null =>
  (save.ship.laserLevel >= MAX_LASER_LEVEL ? null : LASER_LEVELS[save.ship.laserLevel]?.price ?? null);

export const canBuyLaser = (save: SaveData): ShipCheck => check(save, laserPrice(save));

export function buyLaser(save: SaveData): SaveData {
  const price = laserPrice(save);
  if (!canBuyLaser(save).ok || price === null) return save;
  return { ...save, money: save.money - price, ship: { ...save.ship, laserLevel: save.ship.laserLevel + 1 } };
}

/** A module family's mark (doc 57). */
export const shipMarkOf = (save: SaveData, f: ShipMarkFamily): number => save.ship.marks[f];

/** The next mark's price: the module's first-copy price × the deep arsenal's factor; null at Mk V. */
export function shipMarkPrice(save: SaveData, f: ShipMarkFamily): number | null {
  const mark = shipMarkOf(save, f);
  if (mark >= MAX_SHIP_MARK) return null;
  return Math.round((MODULES[f].price * MARKS[toMark(mark + 1)].priceMul) / 1000) * 1000;
}

export const canBuyShipMark = (save: SaveData, f: ShipMarkFamily): ShipCheck => check(save, shipMarkPrice(save, f));

export function buyShipMark(save: SaveData, f: ShipMarkFamily): SaveData {
  const price = shipMarkPrice(save, f);
  if (!canBuyShipMark(save, f).ok || price === null) return save;
  return { ...save, money: save.money - price, ship: { ...save.ship, marks: { ...save.ship.marks, [f]: shipMarkOf(save, f) + 1 } } };
}

/** What a family's mark gives, for the shipyard's "now → next" line: hull per plate, thrust per engine, shield per
 *  generator, damage per rocket or torpedo. */
export function markValue(f: ShipMarkFamily, mark: number): number {
  switch (f) {
    case 'plate': return Math.round(MODULES.plate.hull * markGain(mark));
    case 'engine': return MODULES.engine.thrust * markGain(mark);
    case 'shield': return Math.round(SHIELD.points * markGain(mark));
    case 'rockets': return weaponStats(SECONDARIES.spacerocket, toMark(mark)).damage;
    case 'torpedo': return weaponStats(SECONDARIES.torpedo, toMark(mark)).damage;
    default: throw new Error(`unhandled: ${f satisfies never}`);
  }
}
