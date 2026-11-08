import type { SecondaryId } from './types';

// The lab's projects (doc 83): the mech weapons not known at the landing, and the Mk II / Mk III of every mech weapon.
// Each costs research points, needs a lab level and maybe an earlier project.

export type ProjectId =
  | 'seeker' | 'mortar' | 'plasma' | 'rail'
  | 'pod2' | 'pod3' | 'seeker2' | 'seeker3' | 'mortar2' | 'mortar3' | 'plasma2' | 'plasma3' | 'rail2' | 'rail3';

export interface ProjectDef {
  id: ProjectId;
  weapon: SecondaryId;
  /** 1 = the weapon itself, 2 / 3 = its Mk II / Mk III. */
  mark: 1 | 2 | 3;
  /** Research points. */
  cost: number;
  /** Lab level needed to start it. */
  lab: 1 | 2 | 3;
  needs: ProjectId | null;
}

const p = (id: ProjectId, weapon: SecondaryId, mark: 1 | 2 | 3, cost: number, lab: 1 | 2 | 3, needs: ProjectId | null = null): ProjectDef =>
  ({ id, weapon, mark, cost, lab, needs });

export const PROJECTS: Readonly<Record<ProjectId, ProjectDef>> = Object.freeze({
  seeker: p('seeker', 'seeker', 1, 60, 1),
  mortar: p('mortar', 'mortar', 1, 90, 1),
  plasma: p('plasma', 'plasma', 1, 160, 2),
  rail: p('rail', 'rail', 1, 260, 3, 'plasma'),
  pod2: p('pod2', 'pod', 2, 70, 1),
  pod3: p('pod3', 'pod', 3, 150, 2, 'pod2'),
  seeker2: p('seeker2', 'seeker', 2, 90, 1, 'seeker'),
  seeker3: p('seeker3', 'seeker', 3, 180, 2, 'seeker2'),
  mortar2: p('mortar2', 'mortar', 2, 100, 1, 'mortar'),
  mortar3: p('mortar3', 'mortar', 3, 200, 2, 'mortar2'),
  plasma2: p('plasma2', 'plasma', 2, 160, 2, 'plasma'),
  plasma3: p('plasma3', 'plasma', 3, 260, 3, 'plasma2'),
  rail2: p('rail2', 'rail', 2, 220, 3, 'rail'),
  rail3: p('rail3', 'rail', 3, 320, 3, 'rail2'),
});

/** In the lab's list order: the four inventions, then the marks weapon by weapon. */
export const PROJECT_IDS: readonly ProjectId[] = Object.freeze([
  'seeker', 'mortar', 'plasma', 'rail', 'pod2', 'pod3', 'seeker2', 'seeker3', 'mortar2', 'mortar3', 'plasma2', 'plasma3', 'rail2', 'rail3',
] as const);

/** The mech weapon known from the landing. */
export const KNOWN_WEAPONS: readonly SecondaryId[] = Object.freeze(['pod'] as const);
