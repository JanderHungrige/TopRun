import { KNOWN_WEAPONS, PROJECT_IDS, PROJECTS, type ProjectId } from '../data/research';
import type { SecondaryId } from '../data/types';
import type { Outpost } from './outpost';

// The lab (doc 83): one project at a time; after every sortie the lab's research points go into it, and when it has
// its cost the weapon or mark is invented. Points made while nothing runs are kept for the next project. Pure.

/** The mech weapons the pilot knows: the rocket pod from the landing, and every invented weapon. */
export function knownWeapons(o: Outpost): SecondaryId[] {
  const invented = o.done.map((id) => PROJECTS[id]).filter((p) => p.mark === 1).map((p) => p.weapon);
  return [...KNOWN_WEAPONS, ...invented];
}

/** A mech weapon's mark from the lab: 1, or the highest Mk invented. */
export function researchedMark(o: Outpost, weapon: SecondaryId): number {
  return o.done.reduce((best, id) => (PROJECTS[id].weapon === weapon ? Math.max(best, PROJECTS[id].mark) : best), 1);
}

export type ProjectState = 'done' | 'active' | 'open' | 'needs' | 'lab';

/** Where a project stands: invented, running, ready to start, or waiting for an earlier project / a better lab. */
export function projectState(o: Outpost, id: ProjectId): ProjectState {
  if (o.done.includes(id)) return 'done';
  if (o.project === id) return 'active';
  const def = PROJECTS[id];
  if (def.needs && !o.done.includes(def.needs)) return 'needs';
  return o.buildings.lab < def.lab ? 'lab' : 'open';
}

/** The lab's list: projects not invented yet first (in their order), then the inventions. */
export const labList = (o: Outpost): ProjectId[] =>
  [...PROJECT_IDS.filter((id) => !o.done.includes(id)), ...PROJECT_IDS.filter((id) => o.done.includes(id))];

/** Puts points into the active project; a project that reaches its cost is invented and the rest is kept. */
export function addResearch(o: Outpost, points: number): { outpost: Outpost; invented: ProjectId | null } {
  if (!o.project) return { outpost: { ...o, research: o.research + points }, invented: null };
  const cost = PROJECTS[o.project].cost;
  const progress = o.progress + points;
  if (progress < cost) return { outpost: { ...o, progress }, invented: null };
  const invented = o.project;
  return { outpost: { ...o, project: null, progress: 0, research: o.research + progress - cost, done: [...o.done, invented] }, invented };
}

/** Starts an open project, feeding it the kept points at once; switching projects gives the old one's points back to
 *  the pool, so nothing is lost. */
export function startProject(o: Outpost, id: ProjectId): { outpost: Outpost; invented: ProjectId | null } {
  if (projectState(o, id) !== 'open') return { outpost: o, invented: null };
  const pool = o.research + o.progress; // a project switched away from gives its points back
  return addResearch({ ...o, project: id, progress: 0, research: 0 }, pool);
}
