import { BOSSES } from '../data/bosses';
import { LIVERIES, type LiveryId } from '../data/liveries';
import { ALL_MISSIONS } from '../data/missions';
import { liveriesFor, liveryOnShow } from '../game/liveries';
import type { SaveData } from '../game/save';
import { theaterName } from '../i18n/content';
import { t } from '../i18n/i18n';
import type { Tab } from './hangar-items';

// The hangar's PAINT list (docs 09, 100): the jets', the helicopters' and the subs' paint jobs, and how each is earned.

/** The PAINT tab: the paint jobs the kit on show may wear, once their map is open (docs 09, 100). */
export const paintTab = (save: SaveData): Tab =>
  ({ name: 'hangar.tabPaint', items: liveriesFor(save.kit).filter((id) => liveryOnShow(save.progress, id)).map((id) => ({ type: 'livery', id })) });

/** How a paint job is earned: "Beat IRONCLAD — Pacific …" / "3★ on every … mission". */
export function unlockText(id: LiveryId): string {
  const u = LIVERIES[id].unlock;
  if (!u) return '';
  const theater = theaterName(u.theater);
  if (u.kind === 'stars') return t('hangar.unlockStars', { theater });
  if (u.kind === 'region') return t('hangar.unlockRegion', { theater });
  const o = ALL_MISSIONS.find((m) => m.theater === u.theater && m.objective.type === 'boss')?.objective;
  return t('hangar.unlockBoss', { boss: o?.type === 'boss' ? BOSSES[o.boss].name : '', theater });
}

