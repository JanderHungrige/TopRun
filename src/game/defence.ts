import { createRng } from '../core/rng';
import { ENEMIES, type EnemyDef } from '../data/enemies';
import { TOWER_MARKS, TOWERS, type TowerId, type TowerLevel } from '../data/towers';
import type { EnemyKind, MissionDef } from '../data/types';
import type { MissionTally } from './objectives';

// The rules of a defence (doc 106), pure: the waves a mission sends, what supply pays and costs, what a unit through the
// gate does to the outpost, a tower's numbers at its level and mark, when the defence is over.

export interface WaveGroup { kind: EnemyKind; count: number; lane: number; at: number }
export interface Wave { groups: readonly WaveGroup[] }

export const OUTPOST_HEALTH = 100;
/** Seconds before the first wave, and between a held wave and the next. */
export const COUNTDOWN = Object.freeze({ first: 15, between: 7 });
/** Supply for every second left when the next wave is called early. */
export const CALL_BONUS = 3;
/** The boss shells the outpost while it lives (health / s). */
export const BOSS_SHELLING = 1.5;
const GROUP_GAP = 2;
const UNIT_GAP = 0.5;
const WAR_TRIPOD_FROM = 188;

/** Wave points a unit costs: its toughness. */
export const unitCost = (def: EnemyDef): number => Math.max(2, Math.round(def.hp / 15));

/** What a unit through the gate takes off the outpost. */
export const leakDamage = (def: EnemyDef): number => Math.max(3, Math.round(def.hp / 15));

export const waveBudget = (k: number, difficulty: number): number => 60 * (1 + 0.4 * (k - 1)) * (1 + 0.02 * difficulty);

export const startSupply = (waves: number): number => 120 + 20 * waves;
export const killSupply = (def: EnemyDef): number => Math.max(2, Math.round(def.bounty / 6));
export const waveSupply = (k: number): number => 40 + 10 * k;
export const callBonus = (secondsLeft: number): number => Math.max(0, Math.floor(secondsLeft)) * CALL_BONUS;

/** The waves of a defence mission: each wave's budget spent on the pool (ground units three times as likely), in groups
 *  of a kind on the lanes in turn; the war tripod closes the last wave from the Salt Flats on. */
export function defenceWaves(m: MissionDef, lanes: number): Wave[] {
  const rng = createRng(m.number * 53 + 7);
  const pool = m.pool.filter((k) => ENEMIES[k].speed > 0); // nothing that stands still (pods, guns)
  const weighted = pool.flatMap((k) => (ENEMIES[k].layer === 'ground' ? [k, k, k] : [k]));
  const waves: Wave[] = [];
  let laneTurn = 0;
  for (let w = 1; w <= (m.defend ?? 0); w++) {
    let budget = waveBudget(w, m.difficulty);
    const groups: WaveGroup[] = [];
    let at = 0;
    while (budget >= 2 && weighted.length > 0) {
      const kind = weighted[Math.floor(rng.next() * weighted.length)] ?? 'crawler';
      const cost = unitCost(ENEMIES[kind]);
      const count = Math.max(1, Math.min(2 + Math.floor(rng.next() * 5), Math.floor(budget / cost)));
      if (cost > budget) break;
      groups.push({ kind, count, lane: laneTurn++ % lanes, at });
      budget -= cost * count;
      at += count * UNIT_GAP + GROUP_GAP;
    }
    if (w === m.defend && m.number >= WAR_TRIPOD_FROM) groups.push({ kind: 'wartripod', count: 1, lane: laneTurn++ % lanes, at: at + GROUP_GAP });
    waves.push({ groups });
  }
  return waves;
}

/** When each unit of a group comes on (s after the wave starts). */
export const unitTime = (g: WaveGroup, i: number): number => g.at + i * UNIT_GAP;

/** A tower's numbers at its level (1–3) and the mark the lab gave it (1–3). */
export function towerStats(id: TowerId, level: number, mark = 1): TowerLevel {
  const base = TOWERS[id].levels[Math.max(0, Math.min(2, level - 1))] ?? TOWERS[id].levels[0];
  const m = TOWER_MARKS[Math.max(0, Math.min(2, mark - 1))] ?? { damage: 1, range: 1 };
  return { ...base, damage: base.damage * m.damage, range: base.range * m.range };
}

/** Supply put into a tower up to its level, and what selling it gives back (60 %). */
export const towerSpent = (id: TowerId, level: number): number => TOWERS[id].cost.slice(0, level).reduce((s, c) => s + c, 0);
export const sellValue = (id: TowerId, level: number): number => Math.floor(towerSpent(id, level) * 0.6);

/** The next upgrade's price, null at level 3. */
export const upgradeCost = (id: TowerId, level: number): number | null => (level >= 3 ? null : TOWERS[id].cost[level] ?? null);

/** Over: lost when the player died or the outpost fell; won when every wave is held (and the boss killed). */
export function isDefenceOver(tally: MissionTally, waves: number, bossMission: boolean, playerDead: boolean): boolean {
  if (playerDead || tally.outpostLost) return true;
  return tally.wavesHeld >= waves && (!bossMission || tally.bossKilled);
}
