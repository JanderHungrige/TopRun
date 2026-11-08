import {
  BUILDING_IDS, BUILDINGS, MAX_BUILDING_LEVEL, ROUND_BATCH, ROUND_COST, ROUNDS_IDS, START_ALLOY, START_BUILDINGS, START_MAGAZINE,
  type BuildingId, type RoundsId,
} from '../data/outpost';
import { PROJECT_IDS, type ProjectId } from '../data/research';
import type { SaveData } from './save';

// The ground base on the jungle planet (doc 82): what is built, the alloy, the research, the magazine; the power grid,
// building with money, building rounds with alloy, and the mech kit's purse (alloy, doc 79). Pure.

export interface Outpost {
  /** Level 0–3 of every building. */
  buildings: Record<BuildingId, number>;
  alloy: number;
  /** Research points the lab made while no project was running; the next project starts with them. */
  research: number;
  /** The lab's active project and the points it has (doc 83). */
  project: ProjectId | null;
  progress: number;
  done: ProjectId[];
  magazine: Record<RoundsId, number>;
  /** Sorties flown from the base. */
  days: number;
}

export const freshOutpost = (): Outpost => ({
  buildings: { ...START_BUILDINGS }, alloy: START_ALLOY, research: 0, project: null, progress: 0, done: [],
  magazine: { ...START_MAGAZINE }, days: 0,
});

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const count = (v: unknown, hi: number, lo = 0): number =>
  (typeof v === 'number' && Number.isFinite(v) ? Math.floor(Math.min(hi, Math.max(lo, v))) : lo);

/** The base from storage: missing or broken parts fresh, numbers clamped, unknown projects dropped. */
export function parseOutpost(v: unknown): Outpost {
  const fresh = freshOutpost();
  if (!isRecord(v)) return fresh;
  const b = isRecord(v.buildings) ? v.buildings : {};
  const m = isRecord(v.magazine) ? v.magazine : {};
  const buildings = Object.fromEntries(BUILDING_IDS.map((id) => [id, count(b[id] ?? START_BUILDINGS[id], MAX_BUILDING_LEVEL, START_BUILDINGS[id])])) as Record<BuildingId, number>;
  const done = Array.isArray(v.done) ? PROJECT_IDS.filter((id) => (v.done as unknown[]).includes(id)) : [];
  const project = PROJECT_IDS.find((id) => id === v.project && !done.includes(id)) ?? null;
  return {
    buildings,
    alloy: count(v.alloy ?? fresh.alloy, 1e9),
    research: count(v.research, 1e7),
    project,
    progress: project ? count(v.progress, 1e7) : 0,
    done,
    magazine: Object.fromEntries(ROUNDS_IDS.map((r) => [r, count(m[r] ?? START_MAGAZINE[r], 1e5)])) as Record<RoundsId, number>,
    days: count(v.days, 1e7),
  };
}

// ── Power ────────────────────────────────────────────────────────────────

export const powerSupply = (o: Outpost): number => BUILDINGS.generator.output[o.buildings.generator] ?? 0;

/** What the built buildings draw from the grid. */
export const powerDemand = (o: Outpost): number =>
  BUILDING_IDS.reduce((sum, id) => sum + (o.buildings[id] > 0 ? BUILDINGS[id].draw[o.buildings[id] - 1] ?? 0 : 0), 0);

/** Share of the refinery's and the lab's output the grid allows: 1 with enough power. */
export function powerShare(o: Outpost): number {
  const demand = powerDemand(o);
  return demand === 0 ? 1 : Math.min(1, powerSupply(o) / demand);
}

export const alloyPerDay = (o: Outpost): number => Math.round((BUILDINGS.refinery.output[o.buildings.refinery] ?? 0) * powerShare(o));
export const researchPerDay = (o: Outpost): number => Math.round((BUILDINGS.lab.output[o.buildings.lab] ?? 0) * powerShare(o));
/** Rounds of each kind the magazine holds. */
export const magazineCap = (o: Outpost): number => BUILDINGS.factory.output[o.buildings.factory] ?? 0;
/** The mech bay's level caps the autocannon (doc 79). */
export const bayGunCap = (o: Outpost): number => BUILDINGS.mechbay.output[o.buildings.mechbay] ?? 0;
/** …and the equipment: level 2, 3 or 4 (the map-1 caps). */
export const bayEquipmentCap = (o: Outpost): number => Math.max(0, o.buildings.mechbay + 1);

// ── Buildings (money) ────────────────────────────────────────────────────

/** Money for a building's next level, or null at the top. */
export function buildingPrice(o: Outpost, id: BuildingId): number | null {
  const lvl = o.buildings[id];
  return lvl >= MAX_BUILDING_LEVEL ? null : BUILDINGS[id].prices[lvl] ?? null;
}

export type BuildFailure = 'max-level' | 'insufficient-funds';

export function canBuild(save: SaveData, id: BuildingId): { ok: true } | { ok: false; reason: BuildFailure } {
  const price = buildingPrice(save.outpost, id);
  if (price === null) return { ok: false, reason: 'max-level' };
  return save.money < price ? { ok: false, reason: 'insufficient-funds' } : { ok: true };
}

/** A new save with the building one level up, paid in money. Throws if canBuild fails — call it first. */
export function build(save: SaveData, id: BuildingId): SaveData {
  const check = canBuild(save, id);
  if (!check.ok) throw new Error(`cannot build: ${check.reason}`);
  const o = save.outpost;
  return { ...save, money: save.money - (buildingPrice(o, id) ?? 0), outpost: { ...o, buildings: { ...o.buildings, [id]: o.buildings[id] + 1 } } };
}

// ── Rounds (alloy) ───────────────────────────────────────────────────────

export type RoundsFailure = 'no-factory' | 'full' | 'insufficient-alloy';

/** How many rounds one order builds now: a batch, no more than fits or than the alloy pays for. */
export function roundsOrder(o: Outpost, r: RoundsId): number {
  if (o.buildings.factory <= 0) return 0;
  return Math.max(0, Math.min(ROUND_BATCH, magazineCap(o) - o.magazine[r], Math.floor(o.alloy / ROUND_COST[r])));
}

export function canBuildRounds(o: Outpost, r: RoundsId): { ok: true } | { ok: false; reason: RoundsFailure } {
  if (o.buildings.factory <= 0) return { ok: false, reason: 'no-factory' };
  if (o.magazine[r] >= magazineCap(o)) return { ok: false, reason: 'full' };
  return roundsOrder(o, r) <= 0 ? { ok: false, reason: 'insufficient-alloy' } : { ok: true };
}

/** The base with one order of rounds built and paid in alloy (nothing changes when the order is empty). */
export function buildRounds(o: Outpost, r: RoundsId): Outpost {
  const n = roundsOrder(o, r);
  if (n <= 0) return o;
  return { ...o, alloy: o.alloy - n * ROUND_COST[r], magazine: { ...o.magazine, [r]: o.magazine[r] + n } };
}

// ── The mech kit's purse ─────────────────────────────────────────────────

/** What the kit on show pays with: alloy in the mech kit (doc 79), money everywhere else. */
export const wallet = (save: SaveData): number => (save.kit === 'mech' ? save.outpost.alloy : save.money);

/** The save with `n` taken from the kit's purse. */
export function spend(save: SaveData, n: number): SaveData {
  if (save.kit !== 'mech') return { ...save, money: save.money - n };
  return { ...save, outpost: { ...save.outpost, alloy: save.outpost.alloy - n } };
}
