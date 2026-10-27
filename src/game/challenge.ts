import { PLANES } from '../data/planes';
import type { MissionDef, MissionResult } from '../data/types';
import { gunCap } from './firepower';
import type { SaveData } from './save';

// Challenge level (doc 38): a per-pilot step above today's game for pilots who win convincingly, that only steps
// back after a long struggle despite upgrading; the sortie log it reads; and the Rookie switch. Pure.

export type SortieOutcome = 'win' | 'down' | 'abort';

export interface SortieEntry {
  mission: string;
  outcome: SortieOutcome;
  /** Hull left at the end, 0–1. */
  hull: number;
  /** Kills ÷ enemies spawned, 0–1. */
  kills: number;
  /** Kit score at take-off (`kitScore`). */
  kit: number;
  /** Challenge level the sortie was flown at. */
  level: number;
  at: number;
}

export interface ChallengeState {
  level: number;
  /** Convincing wins in a row. */
  wins: number;
  /** Times shot down in a row (aborts neither count nor reset). */
  fails: number;
  /** Kit score at the first of those failures. */
  failKit: number;
}

export const CHALLENGE = Object.freeze({
  max: 10, step: 2, winsUp: 3, failsDown: 7, hullConvincing: 0.7, killsConvincing: 0.6, log: 20,
  rookie: { hullMul: 1.5, ease: 0.8 },
});

export const freshChallenge = (): ChallengeState => ({ level: 0, wins: 0, fails: 0, failKit: 0 });

/** Everything bought raises it: guns, equipment, weapons, twin pods, a pricier jet. */
export function kitScore(save: SaveData): number {
  const equipment = Object.values(save.equipment).reduce((a, b) => a + b, 0);
  return save.gunLevel * 10 + save.gun2Level * 10 + equipment * 5 + save.ownedSecondaries.length * 4
    + save.twinSecondaries.length * 4 + Math.round(PLANES[save.selectedPlane].price / 10000);
}

export function sortieOf(mission: MissionDef, result: MissionResult, save: SaveData, now: number): SortieEntry {
  const outcome: SortieOutcome = result.success ? 'win' : result.aborted ? 'abort' : 'down';
  const kills = result.spawned > 0 ? Math.min(1, result.kills / result.spawned) : 1;
  return { mission: mission.id, outcome, hull: result.hullRatio, kills, kit: kitScore(save), level: save.challenge.level, at: now };
}

export const convincing = (s: SortieEntry): boolean =>
  s.outcome === 'win' && s.hull >= CHALLENGE.hullConvincing && s.kills >= CHALLENGE.killsConvincing;

/** The challenge after one sortie. `kitNow` / `gunMaxed` describe the pilot's kit now (doc 38). */
export function nextChallenge(c: ChallengeState, s: SortieEntry, kitNow: number, gunMaxed: boolean, rookie: boolean): ChallengeState {
  if (rookie) return { ...c, wins: 0, fails: 0 };
  if (s.outcome === 'abort') return { ...c, wins: 0 };
  if (s.outcome === 'win') {
    const wins = convincing(s) ? c.wins + 1 : 0;
    if (wins < CHALLENGE.winsUp) return { ...c, wins, fails: 0 };
    return { level: Math.min(CHALLENGE.max, c.level + 1), wins: 0, fails: 0, failKit: 0 };
  }
  const fails = c.fails + 1;
  const failKit = c.fails === 0 ? s.kit : c.failKit;
  const struggled = fails >= CHALLENGE.failsDown && c.level > 0 && (kitNow > failKit || gunMaxed);
  if (!struggled) return { ...c, wins: 0, fails, failKit };
  return { level: c.level - 1, wins: 0, fails: 0, failKit: 0 };
}

/** Records a finished sortie: the log (last 20) and the challenge step (doc 38). */
export function recordSortie(save: SaveData, mission: MissionDef, result: MissionResult, now: number): SaveData {
  const s = sortieOf(mission, result, save, now);
  const challenge = nextChallenge(save.challenge, s, kitScore(save), save.gunLevel >= gunCap(save), save.rookie);
  return { ...save, sorties: [...save.sorties, s].slice(-CHALLENGE.log), challenge };
}

export interface MissionTuning {
  /** Added to the mission's difficulty. */
  difficulty: number;
  /** Rookie: enemy bullet speed and fire rate multiplier (< 1 = easier). */
  ease: number;
  /** Rookie: hull multiplier. */
  hullMul: number;
}

export function missionTuning(save: Pick<SaveData, 'challenge' | 'rookie'>): MissionTuning {
  if (save.rookie) return { difficulty: 0, ease: CHALLENGE.rookie.ease, hullMul: CHALLENGE.rookie.hullMul };
  return { difficulty: save.challenge.level * CHALLENGE.step, ease: 1, hullMul: 1 };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, lo: number, hi: number, d: number): number =>
  (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
const OUTCOMES: readonly SortieOutcome[] = ['win', 'down', 'abort'];

export function parseChallenge(v: unknown): ChallengeState {
  if (!isRecord(v)) return freshChallenge();
  return {
    level: Math.round(num(v.level, 0, CHALLENGE.max, 0)), wins: Math.round(num(v.wins, 0, 99, 0)),
    fails: Math.round(num(v.fails, 0, 99, 0)), failKit: num(v.failKit, 0, 1e6, 0),
  };
}

export function parseSorties(v: unknown): SortieEntry[] {
  if (!Array.isArray(v)) return [];
  const out: SortieEntry[] = [];
  for (const e of v.slice(-CHALLENGE.log)) {
    if (!isRecord(e) || typeof e.mission !== 'string' || e.mission.length > 8) continue;
    const outcome = OUTCOMES.find((o) => o === e.outcome);
    if (!outcome) continue;
    out.push({
      mission: e.mission, outcome, hull: num(e.hull, 0, 1, 0), kills: num(e.kills, 0, 1, 0), kit: num(e.kit, 0, 1e6, 0),
      level: Math.round(num(e.level, 0, CHALLENGE.max, 0)), at: num(e.at, 0, 1e15, 0),
    });
  }
  return out;
}
