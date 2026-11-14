import { STEPPE_LAB_LEVELS, STEPPE_PROJECT_IDS, STEPPE_PROJECTS, type SteppeProjectId } from '../data/steppe-research';
import { TOWER_STARTERS, type TowerId } from '../data/towers';
import type { MissionDef, MissionResult, SecondaryId } from '../data/types';
import type { SaveData } from './save';

// The steppe lab (doc 107): its level (bought with money), one project at a time fed by the research points of every
// map-7 sortie, the inventions — tank weapons, towers, marks. The jungle lab's rules (doc 83). Pure.

export interface SteppeLab {
  /** 0 = not bought yet, 1–3. */
  level: number;
  project: SteppeProjectId | null;
  progress: number;
  /** Points made while nothing ran; the next project starts with them. */
  research: number;
  done: SteppeProjectId[];
}

export const freshSteppeLab = (): SteppeLab => ({ level: 0, project: null, progress: 0, research: 0, done: [] });

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const count = (v: unknown, hi: number): number => (typeof v === 'number' && Number.isFinite(v) ? Math.floor(Math.min(hi, Math.max(0, v))) : 0);
const isProject = (v: unknown): v is SteppeProjectId => typeof v === 'string' && (STEPPE_PROJECT_IDS as readonly string[]).includes(v);

/** The lab from untrusted storage: unknown projects dropped, numbers clamped. */
export function parseSteppeLab(v: unknown): SteppeLab {
  if (!isRecord(v)) return freshSteppeLab();
  const done = Array.isArray(v.done) ? [...new Set(v.done.filter(isProject))] : [];
  const project = isProject(v.project) && !done.includes(v.project) ? v.project : null;
  return { level: count(v.level, 3), project, progress: project ? count(v.progress, 1e6) : 0, research: count(v.research, 1e7), done };
}

/** The tank weapon known at the landing (doc 103). */
export const TANK_STARTER_WEAPONS: readonly SecondaryId[] = Object.freeze(['grenade'] as const);

/** The tank weapons the pilot knows: the grenade launcher, then every one invented. */
export function tankKnownWeapons(save: SaveData): SecondaryId[] {
  const invented = save.steppeLab.done.flatMap((id) => {
    const g = STEPPE_PROJECTS[id].gives;
    return g.kind === 'weapon' && g.mark === 1 ? [g.weapon] : [];
  });
  return [...TANK_STARTER_WEAPONS, ...invented];
}

/** A tank weapon's mark: 1, or the highest invented. */
export function tankMark(save: SaveData, weapon: SecondaryId): number {
  return save.steppeLab.done.reduce((best, id) => {
    const g = STEPPE_PROJECTS[id].gives;
    return g.kind === 'weapon' && g.weapon === weapon ? Math.max(best, g.mark) : best;
  }, 1);
}

/** The towers a defence can build (doc 106): the MG nest and the flak tower, then every one invented. */
export function knownTowers(save: SaveData): TowerId[] {
  const invented = save.steppeLab.done.flatMap((id) => {
    const g = STEPPE_PROJECTS[id].gives;
    return g.kind === 'tower' ? [g.tower] : [];
  });
  return [...TOWER_STARTERS, ...invented];
}

/** Every tower's mark (1–3): the towers' Mk II / Mk III when invented. */
export function towerMark(save: SaveData, id: TowerId): number {
  void id;
  return save.steppeLab.done.reduce((best, p) => {
    const g = STEPPE_PROJECTS[p].gives;
    return g.kind === 'towers' ? Math.max(best, g.mark) : best;
  }, 1);
}

export type SteppeProjectState = 'done' | 'active' | 'open' | 'needs' | 'lab';

export function steppeProjectState(lab: SteppeLab, id: SteppeProjectId): SteppeProjectState {
  if (lab.done.includes(id)) return 'done';
  if (lab.project === id) return 'active';
  const def = STEPPE_PROJECTS[id];
  if (def.needs && !lab.done.includes(def.needs)) return 'needs';
  return lab.level < def.lab ? 'lab' : 'open';
}

/** The list: projects not invented yet first (in their order), then the inventions. */
export const steppeLabList = (lab: SteppeLab): SteppeProjectId[] =>
  [...STEPPE_PROJECT_IDS.filter((id) => !lab.done.includes(id)), ...STEPPE_PROJECT_IDS.filter((id) => lab.done.includes(id))];

/** Points into the running project; one that reaches its cost is invented and the rest kept. */
export function addSteppeResearch(lab: SteppeLab, points: number): { lab: SteppeLab; invented: SteppeProjectId | null } {
  if (!lab.project) return { lab: { ...lab, research: lab.research + points }, invented: null };
  const cost = STEPPE_PROJECTS[lab.project].cost;
  const progress = lab.progress + points;
  if (progress < cost) return { lab: { ...lab, progress }, invented: null };
  const invented = lab.project;
  return { lab: { ...lab, project: null, progress: 0, research: lab.research + progress - cost, done: [...lab.done, invented] }, invented };
}

/** Starts an open project with the kept points; a project switched away from gives its points back. */
export function startSteppeProject(lab: SteppeLab, id: SteppeProjectId): { lab: SteppeLab; invented: SteppeProjectId | null } {
  if (steppeProjectState(lab, id) !== 'open') return { lab, invented: null };
  return addSteppeResearch({ ...lab, project: id, progress: 0, research: 0 }, lab.research + lab.progress);
}

/** The next lab level's price, null at the top. */
export const labLevelPrice = (lab: SteppeLab): number | null => STEPPE_LAB_LEVELS[lab.level]?.price ?? null;

/** Research per won sortie at the lab's level. */
export const labResearch = (lab: SteppeLab): number => (lab.level > 0 ? STEPPE_LAB_LEVELS[lab.level - 1]?.research ?? 0 : 0);

/** Returns a new save with the next lab level bought, or null when it can't be. */
export function buySteppeLab(save: SaveData): SaveData | null {
  const price = labLevelPrice(save.steppeLab);
  if (price === null || save.money < price) return null;
  return { ...save, money: save.money - price, steppeLab: { ...save.steppeLab, level: save.steppeLab.level + 1 } };
}

/** What the lab made during a sortie, for the debrief. */
export interface SteppeDayReport { research: number; invented: SteppeProjectId | null }

/** The lab after a map-7 sortie: full research on a won one, half on a lost one, none when aborted or on other maps. */
export function steppeDay(lab: SteppeLab, mission: MissionDef, result: MissionResult): { lab: SteppeLab; research: number; invented: SteppeProjectId | null } | null {
  if (mission.campaign !== 7) return null;
  const research = Math.round(labResearch(lab) * (result.aborted ? 0 : result.success ? 1 : 0.5));
  const r = addSteppeResearch(lab, research);
  return { lab: r.lab, research, invented: r.invented };
}
