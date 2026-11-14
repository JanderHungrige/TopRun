import {
  APDS, AUTOLOADER_LEVELS, COAX_LEVELS, HEFRAG, MAX_TANK_LEVEL, STABILISER_LEVELS, TANK_MODS, TANK_ROUNDS, THERMITE,
  type TankMod, type TankRounds,
} from '../data/tank-arms';
import type { RoundsLook } from '../data/heli-arms';
import type { PlaneId } from '../data/types';
import type { ArmsStats } from './heli-arms';
import { vehicleOf } from './tank-drive';

// The tanks' arsenal (docs 104, 108): a tank's turret follows the nearest target ahead (doc 99's turret aim), a buggy's
// gun fires straight; the cannon's upgrades and ammo types — the save entry and the numbers the mission takes. On sale,
// prices, buying and loading run through gear.ts. Pure.

/** How far a tank's turret turns toward a target (rad). */
export const TANK_SWIVEL = (25 * Math.PI) / 180;

export type TankArms = Record<TankMod | TankRounds, number> & { loaded: TankRounds };

export const freshTankArms = (): TankArms => ({ autoloader: 0, stabiliser: 0, coaxmg: 0, apds: 0, hefrag: 0, thermite: 0, loaded: 'hefrag' });

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const level = (v: unknown, hi: number): number => (typeof v === 'number' && Number.isFinite(v) ? Math.floor(Math.min(hi, Math.max(0, v))) : 0);

/** The entry from untrusted storage: each level clamped, a broken or missing part fresh. */
export function parseTankArms(v: unknown): TankArms {
  if (!isRecord(v)) return freshTankArms();
  const arms = freshTankArms();
  for (const id of [...TANK_MODS, ...TANK_ROUNDS]) arms[id] = level(v[id], MAX_TANK_LEVEL[id]);
  arms.loaded = TANK_ROUNDS.find((r) => r === v.loaded) ?? 'hefrag';
  return arms;
}

/** The tracer each ammo type borrows from the other fleets. */
const LOOK: Readonly<Record<TankRounds, RoundsLook>> = { apds: 'cavitation', hefrag: 'hedp', thermite: 'incendiary' };

export function tankArmsStats(id: PlaneId, arms: TankArms = freshTankArms()): ArmsStats {
  const loader = AUTOLOADER_LEVELS[arms.autoloader - 1];
  const coax = COAX_LEVELS[arms.coaxmg - 1];
  const lvl = arms[arms.loaded];
  const type = lvl > 0 ? arms.loaded : null;
  const k = lvl - 1;
  return {
    gatling: loader ? { mul: loader.mul, spinUp: loader.spinUp } : null,
    swivel: (vehicleOf(id) === 'tank' ? TANK_SWIVEL : 0) + (STABILISER_LEVELS[arms.stabiliser - 1]?.swivel ?? 0),
    doorGuns: coax ? { range: coax.range, damage: coax.damage } : null,
    rounds: type ? LOOK[type] : null,
    paint: 0,
    splash: type === 'hefrag' ? { share: HEFRAG.share[k] ?? 0, radius: HEFRAG.radius[k] ?? 0 } : null,
    burn: type === 'thermite' ? THERMITE.burn[k] ?? 0 : 0,
    chain: null,
    pierce: type === 'apds' ? { count: APDS.pierce[k] ?? 0, speed: APDS.speed } : null,
  };
}

/** The gear's levels summed (kit score, doc 38). */
export const tankArmsLevels = (arms: TankArms): number => [...TANK_MODS, ...TANK_ROUNDS].reduce((sum, id) => sum + arms[id], 0);
