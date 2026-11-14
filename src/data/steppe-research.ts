import type { TowerId } from './towers';
import type { SecondaryId } from './types';

// The steppe lab's projects (doc 107): the tank weapons not known at the landing, the towers the defences don't know from
// the start, every weapon's Mk II / Mk III and the towers' marks. Each costs research points, needs a lab level and maybe
// an earlier project.

export type SteppeProjectId =
  | 'aarocket' | 'atgm' | 'mines' | 'flamer' | 'tesla'
  | 't-mortarpit' | 't-jammer' | 't-tesla' | 't-rockets'
  | 'grenade2' | 'grenade3' | 'aarocket2' | 'aarocket3' | 'atgm2' | 'atgm3' | 'mines2' | 'mines3'
  | 'flamer2' | 'flamer3' | 'tesla2' | 'tesla3' | 'towers2' | 'towers3';

/** What a project gives: a weapon (or its mark), a tower, or the towers' mark. */
export type SteppeInvention =
  | { kind: 'weapon'; weapon: SecondaryId; mark: 1 | 2 | 3 }
  | { kind: 'tower'; tower: TowerId }
  | { kind: 'towers'; mark: 2 | 3 };

export interface SteppeProjectDef {
  id: SteppeProjectId;
  gives: SteppeInvention;
  cost: number;
  lab: 1 | 2 | 3;
  needs: SteppeProjectId | null;
}

const weapon = (id: SteppeProjectId, w: SecondaryId, mark: 1 | 2 | 3, cost: number, lab: 1 | 2 | 3, needs: SteppeProjectId | null = null): SteppeProjectDef =>
  ({ id, gives: { kind: 'weapon', weapon: w, mark }, cost, lab, needs });
const tower = (id: SteppeProjectId, t: TowerId, cost: number, lab: 1 | 2 | 3, needs: SteppeProjectId | null = null): SteppeProjectDef =>
  ({ id, gives: { kind: 'tower', tower: t }, cost, lab, needs });

export const STEPPE_PROJECTS: Readonly<Record<SteppeProjectId, SteppeProjectDef>> = Object.freeze({
  aarocket: weapon('aarocket', 'aarocket', 1, 50, 1),
  atgm: weapon('atgm', 'atgm', 1, 80, 1),
  mines: weapon('mines', 'mines', 1, 110, 1),
  flamer: weapon('flamer', 'flamer', 1, 140, 2),
  tesla: weapon('tesla', 'tesla', 1, 180, 2),
  't-mortarpit': tower('t-mortarpit', 'mortarpit', 70, 1),
  't-jammer': tower('t-jammer', 'jammer', 90, 1),
  't-tesla': tower('t-tesla', 'tesla', 150, 2),
  't-rockets': tower('t-rockets', 'rockets', 220, 3, 't-mortarpit'),
  grenade2: weapon('grenade2', 'grenade', 2, 60, 1),
  grenade3: weapon('grenade3', 'grenade', 3, 140, 2, 'grenade2'),
  aarocket2: weapon('aarocket2', 'aarocket', 2, 70, 1, 'aarocket'),
  aarocket3: weapon('aarocket3', 'aarocket', 3, 150, 2, 'aarocket2'),
  atgm2: weapon('atgm2', 'atgm', 2, 90, 1, 'atgm'),
  atgm3: weapon('atgm3', 'atgm', 3, 180, 2, 'atgm2'),
  mines2: weapon('mines2', 'mines', 2, 90, 1, 'mines'),
  mines3: weapon('mines3', 'mines', 3, 170, 2, 'mines2'),
  flamer2: weapon('flamer2', 'flamer', 2, 140, 2, 'flamer'),
  flamer3: weapon('flamer3', 'flamer', 3, 240, 3, 'flamer2'),
  tesla2: weapon('tesla2', 'tesla', 2, 160, 2, 'tesla'),
  tesla3: weapon('tesla3', 'tesla', 3, 260, 3, 'tesla2'),
  towers2: { id: 'towers2', gives: { kind: 'towers', mark: 2 }, cost: 160, lab: 2, needs: null },
  towers3: { id: 'towers3', gives: { kind: 'towers', mark: 3 }, cost: 260, lab: 3, needs: 'towers2' },
});

/** In the lab's list order: the weapons, the towers, then the marks. */
export const STEPPE_PROJECT_IDS: readonly SteppeProjectId[] = Object.freeze(Object.keys(STEPPE_PROJECTS) as SteppeProjectId[]);

/** The lab's levels: what each costs (money) and the research it makes per won sortie. */
export const STEPPE_LAB_LEVELS: readonly { price: number; research: number }[] = Object.freeze([
  { price: 150_000, research: 40 }, { price: 500_000, research: 80 }, { price: 1_200_000, research: 130 },
]);
