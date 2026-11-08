import { HELI_PRICE, heliGunDef, MAX_HELI_GUN_LEVEL } from './heli-kit';
import { MAX_MECH_GUN_LEVEL, MECH_PRICE, mechGunDef } from './mech-kit';
import { MAX_SUB_GUN_LEVEL, SUB_PRICE, subGunDef } from './sub-kit';
import { HELI_IDS, MECH_IDS, SUB_IDS, type CampaignId, type PlaneId } from './types';
import type { GunLevelDef } from './weapons';

// The fleet kits (docs 66, 79): the helicopters of map 3 (doc 49), the subs of map 4 and the mechs of map 6 — a few
// craft to buy, one gun table, their own weapons, the seven equipment items at their own price factor. The gates that
// knew only the helicopters read this table. The mechs pay in alloy, not money (doc 79).

export type FleetKitId = 'heli' | 'sub' | 'mech';

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
  gunPicture: 'chaingun' | 'harpoon' | 'autocannon';
}

export const FLEET: Readonly<Record<FleetKitId, FleetDef>> = Object.freeze({
  heli: {
    kit: 'heli', campaign: 3, craft: HELI_IDS, starter: 'ah64', price: HELI_PRICE,
    maxGun: MAX_HELI_GUN_LEVEL, gunDef: heliGunDef, gunPicture: 'chaingun',
  },
  sub: {
    kit: 'sub', campaign: 4, craft: SUB_IDS, starter: 'u212', price: SUB_PRICE,
    maxGun: MAX_SUB_GUN_LEVEL, gunDef: subGunDef, gunPicture: 'harpoon',
  },
  mech: {
    kit: 'mech', campaign: 6, craft: MECH_IDS, starter: 'strider', price: MECH_PRICE,
    maxGun: MAX_MECH_GUN_LEVEL, gunDef: mechGunDef, gunPicture: 'autocannon',
  },
});

export const FLEET_KITS: readonly FleetKitId[] = Object.freeze(['heli', 'sub', 'mech'] as const);

export const isFleet = (kit: string): kit is FleetKitId => kit === 'heli' || kit === 'sub' || kit === 'mech';
