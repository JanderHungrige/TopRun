import { roundsOf, ROUNDS_IDS, SALVAGE, type RoundsId } from '../data/outpost';
import type { ProjectId } from '../data/research';
import { SECONDARY_IDS, type MissionDef, type MissionResult } from '../data/types';
import { addResearch } from './lab';
import { alloyPerDay, powerShare, researchPerDay, type Outpost } from './outpost';

// A day at the ground base (doc 82): every map-6 sortie that is not aborted runs the refinery and the lab (half on a
// lost sortie), brings salvage from the wrecks, and takes the rounds fired out of the magazine. Pure.

export interface DayReport {
  /** Alloy from the refinery and from salvage. */
  refined: number;
  salvage: number;
  research: number;
  /** Share of the base's output the power grid allowed. */
  power: number;
  invented: ProjectId | null;
  /** Rounds taken from the magazine. */
  spent: Record<RoundsId, number>;
}

/** The magazine after a sortie: the rounds fired (no more than were loaded from it) are gone. */
export function spendRounds(o: Outpost, result: MissionResult): { outpost: Outpost; spent: Record<RoundsId, number> } {
  const spent: Record<RoundsId, number> = { rockets: 0, missiles: 0, shells: 0 };
  for (const id of SECONDARY_IDS) {
    const r = roundsOf(id);
    const n = result.spent?.[id] ?? 0;
    if (r && Number.isFinite(n) && n > 0) spent[r] += Math.floor(n);
  }
  const magazine = { ...o.magazine };
  for (const r of ROUNDS_IDS) {
    spent[r] = Math.min(spent[r], magazine[r]);
    magazine[r] -= spent[r];
  }
  return { outpost: { ...o, magazine }, spent };
}

/** The base after a map-6 sortie, and what it made; null for other maps. */
export function runDay(o: Outpost, mission: MissionDef, result: MissionResult): { outpost: Outpost; report: DayReport } | null {
  if (mission.campaign !== 6) return null;
  const { outpost: afterRounds, spent } = spendRounds(o, result);
  const share = result.aborted ? 0 : result.success ? 1 : 0.5;
  const refined = Math.round(alloyPerDay(o) * share);
  const research = Math.round(researchPerDay(o) * share);
  const salvage = result.aborted ? 0 : Math.round(result.kills * SALVAGE.perKill * share) + (result.bossKilled ? SALVAGE.boss : 0);
  const lab = addResearch({ ...afterRounds, alloy: afterRounds.alloy + refined + salvage, days: o.days + (result.aborted ? 0 : 1) }, research);
  return { outpost: lab.outpost, report: { refined, salvage, research, power: powerShare(o), invented: lab.invented, spent } };
}
