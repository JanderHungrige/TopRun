import type { MinigameId } from '../../data/minigames';
import { gameText } from '../minigame-text';

/** The ten minigame names (doc 10); the hub shows locked and unbuilt games too. */
export const MINIGAME_NAMES = gameText<MinigameId>({
  pushups: 'Push-up Challenge',
  flyby: 'Tower Flyby',
  formation: 'Formation Flying',
  volleyball: 'Beach Volleyball',
  refuel: 'Air Refuelling',
  motorbike: 'Motorbike vs. Jet',
  evasion: 'Missile Evasion',
  piano: 'Piano Bar',
  landing: 'Carrier Landing',
  tactics: 'Dogfight Tactics',
}, {
  pushups: 'Liegestütz-Duell',
  flyby: 'Tower-Überflug',
  formation: 'Formationsflug',
  volleyball: 'Beachvolleyball',
  refuel: 'Luftbetankung',
  motorbike: 'Motorrad gegen Jet',
  evasion: 'Raketen ausweichen',
  piano: 'Klavierbar',
  landing: 'Trägerlandung',
  tactics: 'Luftkampf-Taktik',
});
