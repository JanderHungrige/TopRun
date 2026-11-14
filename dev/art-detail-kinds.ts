import { ALL_MISSIONS } from '../src/data/missions';
import type { BossId, CampaignId, EnemyKind } from '../src/data/types';

/** The enemy kinds and bosses a world's missions use, in first-seen order (dev previews only). */
export function MISSIONS_BY(world: CampaignId): { kinds: EnemyKind[]; bosses: BossId[] } {
  const kinds = new Set<EnemyKind>();
  const bosses = new Set<BossId>();
  for (const m of ALL_MISSIONS.filter((x) => x.campaign === world)) {
    for (const k of m.pool) kinds.add(k);
    if (m.objective.type === 'boss') bosses.add(m.objective.boss);
  }
  if (world === 7) kinds.add('wartripod'); // the mini-bosses join through reinforcements, not the pools
  if (world === 5) kinds.add('warden');
  if (world === 4) kinds.add('boomer');
  if (world === 6) kinds.add('brute');
  return { kinds: [...kinds], bosses: [...bosses] };
}
