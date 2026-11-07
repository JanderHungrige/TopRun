import type { CampaignId } from '../data/types';
import type { CharacterId } from '../render/portraits/types';
import type { Kit } from './kit';

// The crew in each world's outfit (doc 76): Chief "Wrench" Kowalski and Lt. "Shooter" Reyes keep their faces, but under
// the sea they wear submariners' clothes and in space station clothes. Maps 1–3 are the carrier's. Pure.

export type CrewLook = 'carrier' | 'sea' | 'space';

const LOOK_OF: Readonly<Record<CampaignId, CrewLook>> = { 1: 'carrier', 2: 'carrier', 3: 'carrier', 4: 'sea', 5: 'space' };
const KIT_LOOK: Readonly<Record<Kit, CrewLook>> = { jet: 'carrier', heli: 'carrier', sub: 'sea', ship: 'space' };

/** The outfit of a world's crew. */
export const crewLook = (world: CampaignId): CrewLook => LOOK_OF[world];

/** The outfit of the crew in a kit's hangar. */
export const kitCrewLook = (kit: Kit): CrewLook => KIT_LOOK[kit];

/** The portrait file of a character in an outfit: the chief and Shooter have one per world, the others only theirs. */
export function portraitKey(id: CharacterId, look: CrewLook): string {
  return look !== 'carrier' && (id === 'chief' || id === 'shooter') ? `${id}-${look}` : id;
}
