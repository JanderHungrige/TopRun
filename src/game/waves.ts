import { createRng, type Rng } from '../core/rng';
import { lerp } from '../core/math';
import { ENEMIES, isAir } from '../data/enemies';
import type { Behavior, BossId, CampaignId, EnemyKind, MissionDef } from '../data/types';

/** Playfield size in world units; world x is local to the playfield. */
export const PF_W = 640;
export const PF_H = 720;
const X_MIN = 40;
const X_MAX = PF_W - 40;

export type SpawnEvent =
  | { type: 'enemy'; t: number; kind: EnemyKind; x: number; behavior: Behavior }
  | { type: 'boss'; t: number; boss: BossId };

type EnemyEvent = Extract<SpawnEvent, { type: 'enemy' }>;

const WEIGHT: Readonly<Partial<Record<EnemyKind, number>>> = { bear: 0.35, flanker: 0.6, destroyer: 0.35, depot: 0.7, radar: 0.7 };

function weightedPick(rng: Rng, kinds: readonly EnemyKind[]): EnemyKind {
  const total = kinds.reduce((s, k) => s + (WEIGHT[k] ?? 1), 0);
  let roll = rng.next() * total;
  for (const k of kinds) {
    roll -= WEIGHT[k] ?? 1;
    if (roll <= 0) return k;
  }
  return rng.pick(kinds);
}

const enemy = (t: number, kind: EnemyKind, x: number, behavior: Behavior): EnemyEvent =>
  ({ type: 'enemy', t, kind, x: Math.round(Math.min(X_MAX, Math.max(X_MIN, x))), behavior });

function airFormation(rng: Rng, t: number, kind: EnemyKind, extra: number): EnemyEvent[] {
  const behaviors = ENEMIES[kind].behaviors;
  const behavior = rng.pick(behaviors);
  if (kind === 'bear' || kind === 'flanker') {
    return Array.from({ length: 1 + (extra > 1 ? 1 : 0) }, (_, i) => enemy(t + i * 1.2, kind, rng.range(120, 520), behavior));
  }
  if (kind === 'drone') {
    const n = 5 + extra * 2;
    return Array.from({ length: n }, (_, i) => enemy(t + i * 0.22, kind, rng.range(X_MIN, X_MAX), behavior));
  }
  const shape = rng.pick(['line', 'v', 'column'] as const);
  const n = 3 + rng.int(0, 1) + extra;
  const cx = rng.range(160, 480);
  return Array.from({ length: n }, (_, i) => {
    switch (shape) {
      case 'line': return enemy(t, kind, cx + (i - (n - 1) / 2) * 62, behavior);
      case 'v': return enemy(t + Math.abs(i - (n - 1) / 2) * 0.28, kind, cx + (i - (n - 1) / 2) * 52, behavior);
      case 'column': return enemy(t + i * 0.45, kind, cx, behavior);
      default: throw new Error(`unhandled: ${shape satisfies never}`);
    }
  });
}

/** Heavy ground units come alone; a wave of three destroyers is a wall, not a fight. */
const HEAVY: readonly EnemyKind[] = ['destroyer'];

function groundCluster(rng: Rng, t: number, kinds: readonly EnemyKind[], extra: number): EnemyEvent[] {
  const n = 1 + rng.int(0, 1) + (extra > 1 ? 1 : 0);
  const cx = rng.range(120, 520);
  const out: EnemyEvent[] = [];
  for (let i = 0; i < n; i++) {
    const kind = weightedPick(rng, kinds);
    if (HEAVY.includes(kind) && out.length > 0) continue;
    out.push(enemy(t + i * 0.6, kind, cx + rng.range(-110, 110), 'ground'));
    if (HEAVY.includes(kind)) break;
  }
  return out;
}

function addWave(out: SpawnEvent[], rng: Rng, m: MissionDef, t: number): void {
  const air = m.pool.filter(isAir);
  const ground = m.pool.filter((k) => !isAir(k));
  const extra = Math.floor(m.difficulty / 10);
  const onlyHeavy = ground.length > 0 && ground.every((k) => HEAVY.includes(k));
  const useAir = ground.length === 0 || (air.length > 0 && rng.chance(onlyHeavy ? 0.85 : 0.62));
  if (useAir) out.push(...airFormation(rng, t, weightedPick(rng, air), extra));
  else out.push(...groundCluster(rng, t, ground, extra));
}

function countEnemies(events: readonly SpawnEvent[], match: (k: EnemyKind) => boolean): number {
  return events.filter((e) => e.type === 'enemy' && match(e.kind)).length;
}

/** Strike targets a timeline guarantees: two spare on map 1; map 2 adds half the count again, because its tougher
 *  heavy targets (destroyers) slip past half-dead (doc 35). */
export function strikeSpawns(count: number, campaign: CampaignId): number {
  return campaign === 1 ? count + 2 : Math.ceil(count * 1.5) + 2;
}

/** Inserts guaranteed spawns so the objective is always achievable. */
function ensureObjective(out: SpawnEvent[], rng: Rng, m: MissionDef): void {
  const o = m.objective;
  const lastT = m.length - 6;
  if (o.type === 'strike') {
    const missing = strikeSpawns(o.count, m.campaign) - countEnemies(out, (k) => k === o.target);
    for (let i = 0; i < missing; i++) {
      const t = lerp(6, lastT, (i + 0.5) / missing);
      out.push(enemy(t, o.target, rng.range(X_MIN + 40, X_MAX - 40), rng.pick(ENEMIES[o.target].behaviors)));
    }
  }
  if (o.type === 'intercept') {
    const air = m.pool.filter(isAir);
    const need = Math.ceil(o.count * 1.3);
    while (countEnemies(out, isAir) < need && air.length > 0) {
      out.push(...airFormation(rng, rng.range(5, lastT), weightedPick(rng, air), 0));
    }
  }
}

/** Deterministic spawn timeline for a mission. */
/** Seconds between waves: unchanged up to difficulty 30, then down to a floor of 1.1 at 60 (doc 35). */
export function waveGap(difficulty: number): number {
  return difficulty <= 30 ? lerp(3.2, 1.5, (difficulty - 1) / 29) : lerp(1.5, 1.1, Math.min(1, (difficulty - 30) / 30));
}

export function generateTimeline(m: MissionDef): SpawnEvent[] {
  const rng = createRng(m.number * 7919 + 13);
  const events: SpawnEvent[] = [];
  const gap = waveGap(m.difficulty);
  const end = m.length - 4;
  for (let t = 2.5; t < end; t += gap * rng.range(0.75, 1.25)) addWave(events, rng, m, t);
  ensureObjective(events, rng, m);
  const capped = events.filter((e) => e.t < m.length);
  if (m.objective.type === 'boss') capped.push({ type: 'boss', t: m.length, boss: m.objective.boss });
  return capped.sort((a, b) => a.t - b.t);
}
