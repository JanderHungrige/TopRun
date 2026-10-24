import type { EnemyKind, Objective } from '../data/types';

export interface MissionTally {
  kills: number;
  airKills: number;
  killsByKind: Partial<Record<EnemyKind, number>>;
  bossKilled: boolean;
}

export const emptyTally = (): MissionTally => ({ kills: 0, airKills: 0, killsByKind: {}, bossKilled: false });

export function objectiveProgress(o: Objective, tally: MissionTally): { current: number; required: number } {
  switch (o.type) {
    case 'patrol': return { current: 0, required: 0 };
    case 'intercept': return { current: tally.airKills, required: o.count };
    case 'strike': return { current: tally.killsByKind[o.target] ?? 0, required: o.count };
    case 'boss': return { current: tally.bossKilled ? 1 : 0, required: 1 };
    default: throw new Error(`unhandled: ${o satisfies never}`);
  }
}

/** Whether the objective is fulfilled. Patrol is fulfilled by surviving. */
export function objectiveMet(o: Objective, tally: MissionTally, alive: boolean): boolean {
  if (!alive) return false;
  if (o.type === 'patrol') return true;
  const p = objectiveProgress(o, tally);
  return p.current >= p.required;
}

export interface EndCheck {
  playerDead: boolean;
  bossMission: boolean;
  bossKilled: boolean;
  t: number;
  length: number;
  enemiesOnScreen: number;
  overtime: number;
}

export const MAX_OVERTIME = 8;

export function isMissionOver(c: EndCheck): boolean {
  if (c.playerDead) return true;
  if (c.bossMission) return c.bossKilled;
  return c.t >= c.length && (c.enemiesOnScreen === 0 || c.overtime >= MAX_OVERTIME);
}
