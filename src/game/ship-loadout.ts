import { LASER_LEVELS, MAX_LASER_LEVEL } from '../data/ship-modules';
import { PLANES } from '../data/planes';
import { SECONDARIES, type GunLevelDef } from '../data/weapons';
import type { GunLevel } from '../data/types';
import { toMark } from '../data/arsenal';
import { weaponStats } from './arsenal';
import { CHALLENGE } from './challenge';
import type { PlayerStats, SecondaryAmmo } from './loadout';
import type { SaveData } from './save';
import { shipStats, type ShipStats } from './ship';

// The spacecraft's combat stats for a mission (doc 54): everything comes from its modules and laser level. Pure.

/** One station per space weapon with copies on the ship: ammo = per-slot ammo at the family's mark × copies (doc 57). */
function shipStations(save: SaveData, st: ShipStats): SecondaryAmmo[] {
  const stations: SecondaryAmmo[] = [];
  for (const [id, copies] of [['spacerocket', st.rocketWings], ['torpedo', st.torpedoBays]] as const) {
    if (copies <= 0) continue;
    const mark = toMark(save.ship.marks[id === 'spacerocket' ? 'rockets' : 'torpedo']);
    const weapon = weaponStats(SECONDARIES[id], mark);
    stations.push({ id, ammo: weapon.ammoPerSlot * copies, twin: false, mark, weapon, recharge: 0 });
  }
  return stations;
}

export function shipPlayerStats(save: SaveData): PlayerStats {
  const st = shipStats(save.ship);
  return {
    plane: PLANES.starship, ship: st,
    maxHull: Math.round(st.hull * (save.rookie ? CHALLENGE.rookie.hullMul : 1)), speed: st.speed,
    gunLevel: save.ship.laserLevel as GunLevel, gun2Level: 0, gunDamageMul: 1, gunGround: 1, gunBurn: 0, burnGround: false, rounds: null, arms: null, heLevel: 0,
    secondaries: shipStations(save, st),
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
