import { LASER_LEVELS, MAX_LASER_LEVEL, MODULES, type ModuleId } from '../data/ship-modules';
import { mapOpen } from './progress';
import type { SaveData } from './save';

// The shipyard's shop (doc 55): modules bought into stock — each further copy of a module costs a quarter more — and
// laser power. On sale once map 4 is open. Pure; works on any save (the ship's fields are its own).

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
