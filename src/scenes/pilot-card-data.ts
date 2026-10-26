import { PLANES } from '../data/planes';
import { earnedMedals } from '../game/medals';
import { profileSummary, type Profile } from '../game/profiles';
import { getLang } from '../i18n/i18n';
import { pilotFace } from '../render/avatars';
import type { PilotCardData } from '../render/pilot-card';
import { goldCount } from './minigames/registry';
import { pilotStanding } from './pilot-rating';

/** What the pilot ID card shows for a pilot (doc 08): face, callsign, rank, rating, progress, jet, medals. */
export function pilotCardData(p: Profile, now = new Date()): PilotCardData {
  const s = profileSummary(p);
  const standing = pilotStanding(p.save);
  return {
    face: pilotFace(p), callsign: p.callsign, rank: standing.rank, rating: standing.rating,
    cleared: s.cleared, stars: s.stars, money: s.money, plane: PLANES[p.save.selectedPlane].name,
    medals: earnedMedals(p.save, goldCount(p.save)),
    issued: now.toLocaleDateString(getLang() === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
  };
}
