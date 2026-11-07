import { MARKS, toMark } from '../data/arsenal';
import { CELL_PX, GRID, MAX_SHIP_MARK, MODULES, PLACEABLE, SHIELD, SHIP_MARK_FAMILIES, type ModuleId, type ShipMarkFamily } from '../data/ship-modules';

// The spacecraft (doc 54): modules placed on a 7 × 9 grid around a fixed core. Placement rules, the layout's stats,
// its hitbox and barrels. Pure.

export interface Placed { id: ModuleId; col: number; row: number }

export interface ShipKit {
  /** Placed modules, the core excluded (it is always there). */
  modules: Placed[];
  /** Bought but not placed. */
  stock: Record<ModuleId, number>;
  /** Laser power, 1–10 (doc 55). */
  laserLevel: number;
  /** Mk I–V per module family (doc 57). */
  marks: Record<ShipMarkFamily, number>;
}

export const freshMarks = (): Record<ShipMarkFamily, number> =>
  Object.fromEntries(SHIP_MARK_FAMILIES.map((f) => [f, 1])) as Record<ShipMarkFamily, number>;

/** What a family's mark multiplies (hull per plate, thrust per engine, shield, rocket and torpedo damage). */
export const markGain = (mark: number): number => MARKS[toMark(Math.min(MAX_SHIP_MARK, mark))].damageMul;

export const CORE: Placed = { id: 'core', col: GRID.core.col, row: GRID.core.row };

/** A new ship: the core with a laser on each side and an engine behind (doc 54) — enough to fly the first sortie. */
export const STARTER: readonly Placed[] = Object.freeze([
  { id: 'laser', col: GRID.core.col - 1, row: GRID.core.row },
  { id: 'laser', col: GRID.core.col + 1, row: GRID.core.row },
  { id: 'engine', col: GRID.core.col, row: GRID.core.row + 1 },
]);

export const freshShip = (): ShipKit =>
  ({ modules: [...STARTER], stock: Object.fromEntries(PLACEABLE.map((id) => [id, 0])) as Record<ModuleId, number>, laserLevel: 1, marks: freshMarks() });

/** Every module on the ship, the core first. */
export const allModules = (s: Pick<ShipKit, 'modules'>): Placed[] => [CORE, ...s.modules];

const at = (list: readonly Placed[], col: number, row: number): Placed | undefined => list.find((m) => m.col === col && m.row === row);
const inGrid = (col: number, row: number): boolean => col >= 0 && col < GRID.cols && row >= 0 && row < GRID.rows;

/** Nothing in front (rows above) in the same column. */
const clearAhead = (list: readonly Placed[], m: Placed): boolean => !list.some((o) => o !== m && o.col === m.col && o.row < m.row);
/** Nothing behind (rows below) in the same column. */
const clearBehind = (list: readonly Placed[], m: Placed): boolean => !list.some((o) => o !== m && o.col === m.col && o.row > m.row);
const openSide = (list: readonly Placed[], m: Placed): boolean => !at(list, m.col - 1, m.row) || !at(list, m.col + 1, m.row);

/** Each module's placement rule against the rest of the layout. */
function placementOk(list: readonly Placed[], m: Placed): boolean {
  const rule = MODULES[m.id].placement;
  switch (rule) {
    case 'fixed':
    case 'any': return true;
    case 'front': return clearAhead(list, m);
    case 'rear': return clearBehind(list, m);
    case 'side': return openSide(list, m);
    default: throw new Error(`unhandled: ${rule satisfies never}`);
  }
}

/** Every module reaches the core through side-by-side neighbours. */
function connected(list: readonly Placed[]): boolean {
  const seen = new Set<Placed>([CORE]);
  const queue: Placed[] = [CORE];
  for (let m = queue.shift(); m; m = queue.shift()) {
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const n = at(list, m.col + dc, m.row + dr);
      if (n && !seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
    }
  }
  return seen.size === list.length;
}

/** Every side-by-side pair of modules, once each: the struts the art draws between them (doc 54). */
export function moduleLinks(list: readonly Placed[]): [Placed, Placed][] {
  const links: [Placed, Placed][] = [];
  for (const m of list) {
    for (const [dc, dr] of [[1, 0], [0, 1]] as const) {
      const n = at(list, m.col + dc, m.row + dr);
      if (n) links.push([m, n]);
    }
  }
  return links;
}

/** Which way a rocket wing sweeps: to its open side; with both sides open, away from the core (right when in line). */
export function wingSide(m: Placed, list: readonly Placed[]): -1 | 1 {
  const left = !!at(list, m.col - 1, m.row);
  const right = !!at(list, m.col + 1, m.row);
  if (left !== right) return left ? 1 : -1;
  return m.col < CORE.col ? -1 : 1;
}

export const powerBalance = (list: readonly Placed[]): number => list.reduce((sum, m) => sum + MODULES[m.id].power, 0);

/** A whole layout (core included) keeps every rule. */
export function isValidLayout(list: readonly Placed[]): boolean {
  const cells = new Set(list.map((m) => `${m.col},${m.row}`));
  if (cells.size !== list.length || !list.every((m) => inGrid(m.col, m.row))) return false;
  for (const id of PLACEABLE) {
    const max = MODULES[id].max;
    if (max > 0 && list.filter((m) => m.id === id).length > max) return false;
  }
  return connected(list) && powerBalance(list) >= 0 && list.every((m) => placementOk(list, m));
}

export type PlaceFailure = 'no-stock' | 'occupied' | 'invalid';

export function canPlace(s: ShipKit, id: ModuleId, col: number, row: number): { ok: true } | { ok: false; reason: PlaceFailure } {
  if (id === 'core' || (s.stock[id] ?? 0) <= 0) return { ok: false, reason: 'no-stock' };
  const list = allModules(s);
  if (!inGrid(col, row) || at(list, col, row)) return { ok: false, reason: 'occupied' };
  return isValidLayout([...list, { id, col, row }]) ? { ok: true } : { ok: false, reason: 'invalid' };
}

export function place(s: ShipKit, id: ModuleId, col: number, row: number): ShipKit {
  if (!canPlace(s, id, col, row).ok) return s;
  return { ...s, modules: [...s.modules, { id, col, row }], stock: { ...s.stock, [id]: s.stock[id] - 1 } };
}

/** Takes the module at a cell off, back into stock — only if what is left still holds together. */
export function remove(s: ShipKit, col: number, row: number): ShipKit {
  const m = at(s.modules, col, row);
  if (!m) return s;
  const rest = s.modules.filter((o) => o !== m);
  if (!isValidLayout([CORE, ...rest])) return s;
  return { ...s, modules: rest, stock: { ...s.stock, [m.id]: s.stock[m.id] + 1 } };
}

/** A stored layout cut back to its valid part (a forged save): modules are kept in order while the layout holds. */
export function trimLayout(modules: readonly Placed[]): Placed[] {
  const kept: Placed[] = [];
  for (const m of modules) if (isValidLayout([CORE, ...kept, m])) kept.push(m);
  return kept;
}

export interface ShipStats {
  hull: number;
  shield: number;
  speed: number;
  mass: number;
  thrust: number;
  power: number;
  /** Occupied cells relative to the core, in mission pixels (x right, y down). */
  cells: { dx: number; dy: number }[];
  /** Laser barrels: x offsets in mission pixels, front-most cell of their column. */
  barrels: { dx: number; dy: number }[];
  /** Shield regrowth per second once quiet (doc 57: grows with the shield's mark). */
  shieldRegen: number;
  rocketWings: number;
  torpedoBays: number;
  /** Point-defence turrets (doc 60). */
  pointDefence: number;
  radar: boolean;
  /** The placed modules (core excluded), for drawing. */
  modules: Placed[];
}

const offset = (m: Placed): { dx: number; dy: number } => ({ dx: (m.col - CORE.col) * CELL_PX, dy: (m.row - CORE.row) * CELL_PX });

/** A module's hull and thrust at its family's mark: plates and engines grow with theirs (doc 57). */
function markedValue(id: ModuleId, marks: Partial<Record<ShipMarkFamily, number>>): { hull: number; thrust: number } {
  const def = MODULES[id];
  if (id === 'plate') return { hull: Math.round(def.hull * markGain(marks.plate ?? 1)), thrust: 0 };
  if (id === 'engine') return { hull: def.hull, thrust: def.thrust * markGain(marks.engine ?? 1) };
  return { hull: def.hull, thrust: def.thrust };
}

export function shipStats(s: Pick<ShipKit, 'modules'> & { marks?: Partial<Record<ShipMarkFamily, number>> }): ShipStats {
  const list = allModules(s);
  const marks = s.marks ?? {};
  const sum = (f: (id: ModuleId) => number): number => list.reduce((acc, m) => acc + f(m.id), 0);
  const count = (id: ModuleId): number => list.filter((m) => m.id === id).length;
  const mass = sum((id) => MODULES[id].mass);
  const thrust = sum((id) => markedValue(id, marks).thrust);
  const shieldGain = markGain(marks.shield ?? 1);
  return {
    hull: sum((id) => markedValue(id, marks).hull), shield: Math.round(SHIELD.points * shieldGain) * count('shield'),
    shieldRegen: SHIELD.regen * shieldGain,
    speed: Math.min(420, Math.round(160 + (260 * thrust) / mass)), mass, thrust, power: powerBalance(list),
    cells: list.map(offset), barrels: list.filter((m) => m.id === 'laser' || m.id === 'core').map(offset),
    rocketWings: count('rockets'), torpedoBays: count('torpedo'), pointDefence: count('pointdef'), radar: count('capsule') > 0,
    modules: [...s.modules],
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const whole = (v: unknown, lo: number, hi: number, fallback: number): number =>
  (typeof v === 'number' && Number.isFinite(v) ? Math.floor(Math.min(hi, Math.max(lo, v))) : fallback);

/** The ship from storage: unknown modules dropped, the layout trimmed to its valid part, counts clamped. */
export function parseShip(v: unknown): ShipKit {
  if (!isRecord(v)) return freshShip();
  const raw = Array.isArray(v.modules) ? v.modules : [];
  const modules: Placed[] = [];
  for (const m of raw) {
    const id = isRecord(m) ? PLACEABLE.find((x) => x === m.id) : undefined;
    if (id && isRecord(m) && Number.isInteger(m.col) && Number.isInteger(m.row)) modules.push({ id, col: Number(m.col), row: Number(m.row) });
  }
  const stock = isRecord(v.stock) ? v.stock : {};
  const marks = isRecord(v.marks) ? v.marks : {};
  return {
    modules: trimLayout(modules),
    stock: Object.fromEntries(PLACEABLE.map((id) => [id, whole(stock[id], 0, 40, 0)])) as Record<ModuleId, number>,
    laserLevel: whole(v.laserLevel, 1, 10, 1),
    marks: Object.fromEntries(SHIP_MARK_FAMILIES.map((f) => [f, whole(marks[f], 1, MAX_SHIP_MARK, 1)])) as Record<ShipMarkFamily, number>,
  };
}
