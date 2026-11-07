import { LASER_LEVELS, MAX_LASER_LEVEL } from '../data/ship-modules';
import { PLANES } from '../data/planes';
import { SECONDARIES, type GunLevelDef } from '../data/weapons';
import type { GunLevel } from '../data/types';
import { weaponStats } from './arsenal';
import { CHALLENGE } from './challenge';
import type { PlayerStats } from './loadout';
import type { SaveData } from './save';
import { shipStats, type ShipStats } from './ship';

// The spacecraft's combat stats for a mission (doc 54): everything comes from its modules and laser level. Pure.

/** Rockets per rocket wing. */
export const ROCKETS_PER_WING = 6;

export function shipPlayerStats(save: SaveData): PlayerStats {
  const st = shipStats(save.ship);
  const wings = st.rocketWings;
  const rocket = weaponStats(SECONDARIES.spacerocket, 1);
  return {
    plane: PLANES.starship, ship: st,
    maxHull: Math.round(st.hull * (save.rookie ? CHALLENGE.rookie.hullMul : 1)), speed: st.speed,
    gunLevel: save.ship.laserLevel as GunLevel, gun2Level: 0, gunDamageMul: 1, gunGround: 1, gunBurn: 0, rounds: null, heLevel: 0,
    secondaries: wings > 0 ? [{ id: 'spacerocket', ammo: ROCKETS_PER_WING * wings, twin: false, mark: 1, weapon: rocket }] : [],
    flares: 0, ecm: false, ecmBullet: 1, ecmTurn: 1, damageControl: false, damageControlRestore: 0, damageControlUses: 0,
    magnet: false, magnetLevel: 0, earlyWarning: st.radar, radarLevel: st.radar ? 1 : 0, livery: 'standard',
  };
}

/** The ship's guns at a laser level: one barrel per laser, all firing together. */
export function shipGun(st: ShipStats, level: number): GunLevelDef {
  const def = LASER_LEVELS[Math.max(1, Math.min(MAX_LASER_LEVEL, Math.floor(level))) - 1] ?? LASER_LEVELS[0];
  if (!def) throw new Error('no laser levels');
  return { level: def.level as GunLevel, price: def.price, shotsPerSec: def.shotsPerSec, damage: def.damage, pattern: st.barrels.map((b) => ({ dx: b.dx, angle: 0 })) };
}

/** A circle at (x, y) with radius r touches one of the ship's cells around (px, py). */
export function touchesShip(st: ShipStats, px: number, py: number, x: number, y: number, r: number, cell: number): boolean {
  const h = cell / 2;
  return st.cells.some((c) => {
    const nx = Math.max(px + c.dx - h, Math.min(x, px + c.dx + h));
    const ny = Math.max(py + c.dy - h, Math.min(y, py + c.dy + h));
    return (nx - x) ** 2 + (ny - y) ** 2 <= r * r;
  });
}
