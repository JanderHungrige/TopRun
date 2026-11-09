import type { CampaignId } from '../data/types';
import type { CharacterId } from '../render/portraits/types';
import type { Kit } from './kit';

// The crew in each world's outfit (doc 76): Chief "Wrench" Kowalski and Lt. "Shooter" Reyes keep their faces, but under
// the sea they wear submariners' clothes, in space station clothes and on the jungle planet jungle kit (doc 86). Maps 1–2
// are the carrier's; map 3's mountain look is Duke's alone so far (doc 97), the others wear the carrier's there. Pure.

export type CrewLook = 'carrier' | 'mountain' | 'sea' | 'space' | 'jungle';

const LOOK_OF: Readonly<Record<CampaignId, CrewLook>> = { 1: 'carrier', 2: 'carrier', 3: 'mountain', 4: 'sea', 5: 'space', 6: 'jungle' };
const KIT_LOOK: Readonly<Record<Kit, CrewLook>> = { jet: 'carrier', heli: 'carrier', sub: 'sea', ship: 'space', mech: 'jungle' };

/** The outfit of a world's crew. */
export const crewLook = (world: CampaignId): CrewLook => LOOK_OF[world];

/** The outfit of the crew in a kit's hangar. */
export const kitCrewLook = (kit: Kit): CrewLook => KIT_LOOK[kit];

/** The portrait file of a character in an outfit: the chief, Shooter and Duke have one per world (doc 97), the others
 *  only theirs; a missing file falls back to the carrier's. */
export function portraitKey(id: CharacterId, look: CrewLook): string {
  return look !== 'carrier' && (id === 'chief' || id === 'shooter' || id === 'wingman') ? `${id}-${look}` : id;
}
