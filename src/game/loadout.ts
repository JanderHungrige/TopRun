import type { AmmoType, Mark } from '../data/arsenal';
import {
  ARMOR_BONUS, atLevel, DAMAGE_CONTROL_RESTORE, DAMAGE_CONTROL_USES, ECM_BULLET, ECM_TURN, ENGINE_BONUS, FLARE_COUNT,
} from '../data/equipment';
import type { LiveryId } from '../data/liveries';
import { PLANES, type PlaneDef } from '../data/planes';
import type { GunLevel, SecondaryId } from '../data/types';
import { SECONDARIES, type WeaponRole } from '../data/weapons';
import { loadedRounds } from './ammo';
import { markOf, weaponStats, type WeaponStats } from './arsenal';
import { CHALLENGE } from './challenge';
import { doubleFirepower, jetGunLevel } from './firepower';
import type { SaveData } from './save';

export interface SecondaryAmmo {
  id: SecondaryId;
  ammo: number;
  /** Twin pods on a new jet: double ammo, both pods fire per trigger (doc 37). */
  twin: boolean;
  /** Mk I–III and the numbers it gives (doc 43). */
  mark: Mark;
  weapon: WeaponStats;
}

export interface PlayerStats {
  plane: PlaneDef;
  maxHull: number;
  speed: number;
  gunLevel: GunLevel;
  /** Second gun of the new jets, 0 = none (doc 37). */
  gun2Level: number;
  /** The jet's gun multiplier times the uranium ammo's (doc 43). */
  gunDamageMul: number;
  /** Share of gun damage ground and sea targets take: 0.5, more with uranium ammo (doc 43). */
  gunGround: number;
  /** Share of a gun hit on a plane that burns on: incendiary ammo (doc 45), else 0. */
  gunBurn: number;
  /** The ammo loaded, null = ordinary rounds (tracer colour, docs 43, 45). */
  rounds: AmmoType | null;
  /** Bofors 40 mm HE gun level, 0 = none (doc 46). */
  heLevel: number;
  secondaries: SecondaryAmmo[];
  flares: number;
  ecm: boolean;
  /** Share of enemy bullet / flak damage that hits, and enemy missile turn factor (ECM levels, doc 43). */
  ecmBullet: number;
  ecmTurn: number;
  damageControl: boolean;
  /** Damage control: hull share restored and uses per mission (doc 43). */
  damageControlRestore: number;
  damageControlUses: number;
  magnet: boolean;
  /** Cargo magnet level 0–2 (doc 43). */
  magnetLevel: number;
  /** Early-Warning Radar fitted (doc 02/05). */
  earlyWarning: boolean;
  /** Early-Warning Radar level 0–2 (doc 43). */
  radarLevel: number;
  /** Paint job of the selected jet (doc 09). */
  livery: LiveryId;
}

/** The single source of the player's combat stats for a mission. */
export function derivePlayerStats(save: SaveData): PlayerStats {
  const plane = PLANES[save.selectedPlane];
  const eq = save.equipment;
  const secondaries: SecondaryAmmo[] = [];
  const double = doubleFirepower(plane.id);
  for (const id of save.loadout[plane.id]) {
    if (id === null) continue;
    const twin = double && save.twinSecondaries.includes(id);
    const mark = markOf(save, id);
    const weapon = weaponStats(SECONDARIES[id], mark);
    const ammo = weapon.ammoPerSlot * (twin ? 2 : 1);
    const existing = secondaries.find((s) => s.id === id);
    if (existing) existing.ammo += ammo;
    else secondaries.push({ id, ammo, twin, mark, weapon });
  }
  const rounds = loadedRounds(save);
  return {
    plane,
    maxHull: Math.round(plane.hull * (1 + atLevel(ARMOR_BONUS, eq.armor)) * (save.rookie ? CHALLENGE.rookie.hullMul : 1)),
    speed: Math.round(plane.speed * (1 + atLevel(ENGINE_BONUS, eq.engine))),
    gunLevel: jetGunLevel(plane.id, save.gunLevel) as GunLevel,
    gun2Level: double ? save.gun2Level : 0,
    gunDamageMul: plane.gunDamageMul * rounds.damageMul,
    gunGround: rounds.groundFactor,
    gunBurn: rounds.burn,
    rounds: rounds.type,
    heLevel: save.heLevel,
    secondaries,
    flares: atLevel(FLARE_COUNT, eq.flares),
    ecm: eq.ecm > 0,
    ecmBullet: atLevel(ECM_BULLET, eq.ecm),
    ecmTurn: atLevel(ECM_TURN, eq.ecm),
    damageControl: eq.damageControl > 0,
    damageControlRestore: atLevel(DAMAGE_CONTROL_RESTORE, eq.damageControl),
    damageControlUses: atLevel(DAMAGE_CONTROL_USES, eq.damageControl),
    magnet: eq.magnet > 0,
    magnetLevel: eq.magnet,
    earlyWarning: eq.radar > 0,
    radarLevel: eq.radar,
    livery: save.livery[plane.id],
  };
}

type Stores = ReadonlyArray<{ id: SecondaryId; ammo: number }>;

const usable = (s: { id: SecondaryId; ammo: number } | undefined, role: WeaponRole): boolean =>
  !!s && s.ammo > 0 && SECONDARIES[s.id].role === role;

/**
 * The slot the AIR or GROUND key fires (doc 05): the picked slot while it has ammo, else the first
 * mounted weapon of that role with ammo, or −1.
 */
export function slotFor(secondaries: Stores, role: WeaponRole, pick = -1): number {
  if (usable(secondaries[pick], role)) return pick;
  return secondaries.findIndex((s) => usable(s, role));
}

/** SWITCH: the next weapon of that role with ammo after the one firing now, wrapping; unchanged if none other. */
export function nextPick(secondaries: Stores, role: WeaponRole, pick: number): number {
  const now = slotFor(secondaries, role, pick);
  for (let k = 1; k <= secondaries.length; k++) {
    const i = (now + k) % secondaries.length;
    if (usable(secondaries[i], role)) return i;
  }
  return now;
}

/** At least two weapons of that role still have ammo, so SWITCH does something. */
export const canSwitch = (secondaries: Stores, role: WeaponRole): boolean =>
  secondaries.filter((s) => usable(s, role)).length >= 2;
