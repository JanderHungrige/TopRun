// The world order (doc 74): under the sea became map 4 (m91–m120) and space map 5 (m121–m150). A save written before
// that has space at m91–m120 and the sea at m121–m150; it is moved once, when it is read (parseSave). Pure.

/** The order a save's mission ids are in; a save without the field is in the first one. */
export const WORLD_ORDER = 2;

const FIRST = 91;
const SPAN = 30;

/** A mission id of the first order → the same mission's id now: m91–m120 ↔ m121–m150; every other id stays. */
export function movedId(id: string): string {
  const match = /^m(\d+)$/.exec(id);
  const n = match ? Number(match[1]) : 0;
  if (n < FIRST || n >= FIRST + 2 * SPAN) return id;
  return `m${n < FIRST + SPAN ? n + SPAN : n - SPAN}`;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** An untrusted raw save with its progress keys and its sorties' missions moved to the current order — unless it is
 *  in it already. Everything else is passed through for parseSave to check. */
export function reorderWorlds(raw: Record<string, unknown>): Record<string, unknown> {
  if (raw.worlds === WORLD_ORDER) return raw;
  const progress = isRecord(raw.progress)
    ? Object.fromEntries(Object.entries(raw.progress).map(([id, entry]) => [movedId(id), entry]))
    : raw.progress;
  const sorties = Array.isArray(raw.sorties)
    ? raw.sorties.map((e: unknown) => (isRecord(e) && typeof e.mission === 'string' ? { ...e, mission: movedId(e.mission) } : e))
    : raw.sorties;
  return { ...raw, progress, sorties };
}
