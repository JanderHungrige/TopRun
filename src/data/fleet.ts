import { HELI_PRICE, heliGunDef, MAX_HELI_GUN_LEVEL } from './heli-kit';
import { MAX_SUB_GUN_LEVEL, SUB_PRICE, subGunDef } from './sub-kit';
import { HELI_IDS, SUB_IDS, type CampaignId, type PlaneId } from './types';
import type { GunLevelDef } from './weapons';

// The two fleet kits (doc 66): the helicopters of map 3 (doc 49) and the subs of map 5 — a few craft to buy, one gun
// table, their own weapons, the seven equipment items at their own price factor. The gates that knew only the
// helicopters read this table.

export type FleetKitId = 'heli' | 'sub';

export interface FleetDef {
  kit: FleetKitId;
  /** The map whose kit it is. */
  campaign: CampaignId;
  craft: readonly PlaneId[];
  /** Free, always owned in the kit's view. */
  starter: PlaneId;
  /** × the jets' price for the same step: gun levels, equipment, weapons. */
  price: number;
  maxGun: number;
  gunDef: (level: number) => GunLevelDef;
  /** The gun's hangar picture (src/assets/items/). */
  gunPicture: 'chaingun' | 'harpoon';
}

export const FLEET: Readonly<Record<FleetKitId, FleetDef>> = Object.freeze({
  heli: {
    kit: 'heli', campaign: 3, craft: HELI_IDS, starter: 'ah64', price: HELI_PRICE,
    maxGun: MAX_HELI_GUN_LEVEL, gunDef: heliGunDef, gunPicture: 'chaingun',
  },
  sub: {
    kit: 'sub', campaign: 5, craft: SUB_IDS, starter: 'u212', price: SUB_PRICE,
    maxGun: MAX_SUB_GUN_LEVEL, gunDef: subGunDef, gunPicture: 'harpoon',
  },
});

export const FLEET_KITS: readonly FleetKitId[] = Object.freeze(['heli', 'sub'] as const);

export const isFleet = (kit: string): kit is FleetKitId => kit === 'heli' || kit === 'sub';
