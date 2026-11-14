import { formatAlloy, formatMoney } from '../core/math';
import { MECH_BAY } from '../data/mech-kit';
import { roundsOf, type RoundsId } from '../data/outpost';
import { SECONDARIES, type SecondaryBehavior } from '../data/weapons';
import { MECH_IDS, type PlaneId, type SecondaryId } from '../data/types';
import { magazineCap } from '../game/outpost';
import type { SaveData } from '../game/save';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';

// The MECH BAY (doc 79): the hangar on map 6 builds with alloy, shows every mech and every mech weapon — a mech the bay
// can't build yet with the level it needs, a weapon not invented yet as the lab's — and the rounds in the magazine.

/** A price in the kit's purse: alloy in the mech bay, money everywhere else. */
export const priceText = (save: SaveData, v: number): string => (save.kit === 'mech' ? formatAlloy(v) : formatMoney(v));

/** BUY in the shops, BUILD in the mech bay. */
export const buyKey = (save: SaveData): UiKey => (save.kit === 'mech' ? 'mechbay.build' : 'hangar.buy');

/** The mech bay's lists: every mech, every mech weapon (doc 79). */
export const mechCraft = (): PlaneId[] => [...MECH_IDS];
export const mechWeapons = (): SecondaryId[] => (Object.keys(SECONDARIES) as SecondaryId[]).filter((id) => SECONDARIES[id].campaign === 6);

/** Why the mech bay can't build a mech yet: the level it needs; null when it can. */
export function bayShort(save: SaveData, id: PlaneId): number | null {
  const need = (MECH_IDS as readonly PlaneId[]).includes(id) ? MECH_BAY[id as (typeof MECH_IDS)[number]] : 0;
  return save.outpost.buildings.mechbay < need ? need : null;
}

const KIND_KEY: Readonly<Record<RoundsId, UiKey>> = { rockets: 'mechbay.kindRockets', missiles: 'mechbay.kindMissiles', shells: 'mechbay.kindShells' };

/** The rounds' name: rockets, missiles, shells. */
export const roundsName = (r: RoundsId): string => t(KIND_KEY[r]);

/** "ROUNDS 24 / 48" for a weapon firing the magazine's rounds, "ENERGY" for the plasma and the rail; null elsewhere. */
export function roundsLine(save: SaveData, id: SecondaryId): string | null {
  const recharge = SECONDARIES[id].recharge; // the helicopters' energy weapons (doc 99)
  if (recharge) return t('heliarms.energy', { s: recharge });
  if (SECONDARIES[id].campaign !== 6) return null;
  const r = roundsOf(id);
  if (!r) return t('mechbay.energy');
  return t('mechbay.rounds', { kind: roundsName(r), n: save.outpost.magazine[r], max: Math.max(magazineCap(save.outpost), save.outpost.magazine[r]) });
}

/** How a weapon flies, for the detail panel. */
export function guidanceKey(b: SecondaryBehavior): UiKey {
  switch (b) {
    case 'homing': return 'hangar.guided';
    case 'fan': return 'hangar.salvo';
    case 'bomb': return 'hangar.freefall';
    case 'lob': return 'mechbay.lobbed';
    case 'lance':
    case 'beam': return 'mechbay.straight';
    case 'pulse': return 'heliarms.aimed';
    case 'wave': return 'heliarms.wave';
    case 'swarm': return 'heliarms.swarm';
    case 'torps': return 'subarms.torps';
    case 'decoy': return 'subarms.decoy';
    case 'net': return 'subarms.net';
    default: throw new Error(`unhandled: ${b satisfies never}`);
  }
}
