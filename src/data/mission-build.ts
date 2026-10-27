import { THEATERS } from './theaters';
import type { CampaignId, EnemyKind, MissionDef, Objective, TheaterId } from './types';

// How a campaign map's missions are built from their seeds (docs 03, 35): ids, numbers, rewards, lengths and the
// node positions along each theater's route. Pure.

export interface MissionSeed {
  name: string;
  objective: Objective;
  pool: readonly EnemyKind[];
  briefing: string;
}

export const patrol: Objective = { type: 'patrol' };
export const intercept = (count: number): Objective => ({ type: 'intercept', count });
export const strike = (target: EnemyKind, count: number): Objective => ({ type: 'strike', target, count });

export const round100 = (v: number): number => Math.round(v / 100) * 100;

function nodePosition(theater: TheaterId, k: number): { x: number; y: number } {
  const { route, index } = THEATERS[theater];
  const f = k / 5;
  const dx = route.x1 - route.x0;
  const dy = route.y1 - route.y0;
  const len = Math.hypot(dx, dy) || 1;
  const wiggle = Math.sin(k * 1.9 + index * 1.3) * 22;
  return {
    x: Math.round(route.x0 + dx * f + (-dy / len) * wiggle),
    y: Math.round(route.y0 + dy * f + (dx / len) * wiggle),
  };
}

export interface CampaignSpec {
  campaign: CampaignId;
  /** Number of the first mission (1 on map 1, 31 on map 2). */
  first: number;
  /** Theaters in route order, six seeds each. */
  seeds: readonly (readonly [TheaterId, readonly MissionSeed[]])[];
  /** Mission length in seconds. */
  length(n: number, boss: boolean): number;
}

export function buildCampaign(spec: CampaignSpec): MissionDef[] {
  const list: MissionDef[] = [];
  for (const [theater, seeds] of spec.seeds) {
    seeds.forEach((seed, k) => {
      const n = spec.first + list.length;
      const isBoss = seed.objective.type === 'boss';
      const baseReward = round100(1200 + (n - 1) * 380);
      list.push({
        id: `m${String(n).padStart(2, '0')}`,
        number: n,
        campaign: spec.campaign,
        name: seed.name,
        theater,
        briefing: seed.briefing,
        objective: seed.objective,
        difficulty: n,
        reward: isBoss ? round100(baseReward * 1.5) : baseReward,
        length: spec.length(n, isBoss),
        pool: Object.freeze([...seed.pool]),
        map: nodePosition(theater, k),
      });
    });
  }
  return list;
}
