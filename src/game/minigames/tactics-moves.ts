// Dogfight Tactics (doc 19): the ten basic fighter manoeuvres, the four cards per geometry, what each
// card does to the jet that flies it, and how good it is in a situation (the rules table). Pure.

export type Geo = 'defensive' | 'offensive' | 'merge' | 'abeam';
/** 0 = close (guns range), 1 = medium, 2 = far. */
export type Range = 0 | 1 | 2;
/** Relative altitude: −1 below, 0 level, +1 above. */
export type Alt = -1 | 0 | 1;
export type MoveId =
  | 'break' | 'scissors' | 'extend' | 'splitS' | 'leadPursuit' | 'lagPursuit' | 'highYoyo' | 'lowYoyo' | 'leadTurn' | 'immelmann';

export const GEOS: readonly Geo[] = ['defensive', 'offensive', 'merge', 'abeam'];
export const MOVE_IDS: readonly MoveId[] = [
  'break', 'scissors', 'extend', 'splitS', 'leadPursuit', 'lagPursuit', 'highYoyo', 'lowYoyo', 'leadTurn', 'immelmann',
];

/** The instructor's verdict on a card (one line each, src/i18n/minigames/tactics-lines.ts). */
export const NOTE_IDS = [
  'stall', 'breakGood', 'breakEarly', 'scissorsFar', 'scissorsGood', 'scissorsFast', 'extendGuns', 'extendGood',
  'extendEven', 'extendSlow', 'extendFar', 'splitLow', 'splitClose', 'splitGood', 'splitEven', 'guns', 'overshootFast',
  'leadGood', 'leadFar', 'lagGood', 'lagSafe', 'lagFar', 'highGood', 'highSlow', 'highMid', 'highFar', 'lowGood', 'lowMid',
  'lowClose', 'leadTurnEarly', 'leadTurnFast', 'leadTurnGood', 'vertGood', 'vertEven', 'vertSlow', 'resetGood', 'resetEven',
  'breakAbeam', 'breakAbeamFast', 'overshoot', 'overshot',
] as const;
export type NoteId = (typeof NOTE_IDS)[number];

export type Hand = readonly [MoveId, MoveId, MoveId, MoveId];
export const CARDS: Readonly<Record<Geo, Hand>> = {
  defensive: ['break', 'scissors', 'extend', 'splitS'],
  offensive: ['leadPursuit', 'lagPursuit', 'highYoyo', 'lowYoyo'],
  merge: ['leadTurn', 'immelmann', 'splitS', 'extend'],
  abeam: ['scissors', 'extend', 'immelmann', 'break'],
};

export interface MoveEffect {
  energy: number;
  alt: number;
  range: number;
}
const fx = (energy: number, alt = 0, range = 0): MoveEffect => ({ energy, alt, range });
export const EFFECTS: Readonly<Record<MoveId, MoveEffect>> = {
  break: fx(-2), scissors: fx(-1), extend: fx(2, 0, 1), splitS: fx(1, -1, 1), leadPursuit: fx(-1, 0, -1),
  lagPursuit: fx(1), highYoyo: fx(-1, 1), lowYoyo: fx(1, -1, -1), leadTurn: fx(-1, 0, -1), immelmann: fx(-2, 1),
};

/** The situation as one jet sees it. `edge` = own energy − the other's + own altitude. */
export interface View {
  geo: Geo;
  range: Range;
  edge: number;
  energy: number;
  alt: Alt;
}
export interface Quality {
  q: number;
  note: NoteId;
}
const Q = (q: number, note: NoteId): Quality => ({ q, note });

export const mirrorGeo = (g: Geo): Geo => (g === 'defensive' ? 'offensive' : g === 'offensive' ? 'defensive' : g);

// One rule per card (each card is only asked about the geometries whose hand holds it).

function breakTurn({ geo, range: r, edge: e }: View): Quality {
  if (geo === 'abeam') return e <= 0 ? Q(1, 'breakAbeam') : Q(0, 'breakAbeamFast');
  return r === 0 ? Q(2, 'breakGood') : Q(r === 1 ? 0 : -1, 'breakEarly');
}

/** Defensive and abeam (abeam is always close). */
function scissors({ range: r, edge: e }: View): Quality {
  if (r > 0) return Q(-2, 'scissorsFar');
  return e <= 0 ? Q(2, 'scissorsGood') : Q(-1, 'scissorsFast');
}

function extend({ geo, range: r, edge: e }: View): Quality {
  if (geo === 'merge') return e < 0 ? Q(1, 'resetGood') : Q(0, 'resetEven');
  if (geo === 'abeam') return e >= 1 ? Q(1, 'extendGood') : e === 0 ? Q(-1, 'extendEven') : Q(-2, 'extendSlow');
  if (r === 0) return Q(-3, 'extendGuns');
  if (r === 2) return e >= 0 ? Q(2, 'extendGood') : Q(0, 'extendFar');
  return e >= 1 ? Q(2, 'extendGood') : e === 0 ? Q(0, 'extendEven') : Q(-2, 'extendSlow');
}

function splitS({ geo, range: r, alt }: View): Quality {
  if (alt < 0) return Q(-2, 'splitLow');
  if (geo === 'merge') return alt > 0 ? Q(1, 'splitGood') : Q(0, 'splitEven');
  return r === 0 ? Q(0, 'splitClose') : Q(1, 'splitGood');
}

function immelmann({ geo, edge: e }: View): Quality {
  if (geo === 'abeam') return e >= 2 ? Q(2, 'vertGood') : e === 1 ? Q(1, 'vertGood') : Q(-2, 'vertSlow');
  return e >= 1 ? Q(2, 'vertGood') : e === 0 ? Q(0, 'vertEven') : Q(-2, 'vertSlow');
}

function pursuitRule(m: 'leadPursuit' | 'lagPursuit' | 'highYoyo' | 'lowYoyo', { range: r, edge: e }: View): Quality {
  switch (m) {
    case 'leadPursuit':
      if (r === 0) return e >= 2 ? Q(-2, 'overshootFast') : Q(3, 'guns');
      return r === 1 ? Q(1, 'leadGood') : Q(-1, 'leadFar');
    case 'lagPursuit':
      if (r === 0 && e >= 2) return Q(1, 'lagGood');
      return r === 2 ? Q(-1, 'lagFar') : Q(0, 'lagSafe');
    case 'highYoyo':
      if (r === 0) return e >= 1 ? Q(2, 'highGood') : Q(-1, 'highSlow');
      return r === 1 ? Q(0, 'highMid') : Q(-2, 'highFar');
    case 'lowYoyo': return r === 2 ? Q(2, 'lowGood') : r === 1 ? Q(0, 'lowMid') : Q(-2, 'lowClose');
    default: throw new Error(`unhandled: ${m satisfies never}`);
  }
}

/** How good card `m` is in the situation `v` (of the jet flying it). A card not in the hand scores as a stall. */
export function quality(m: MoveId, v: View): Quality {
  if (-EFFECTS[m].energy > v.energy || !CARDS[v.geo].includes(m)) return Q(-3, 'stall');
  switch (m) {
    case 'break': return breakTurn(v);
    case 'scissors': return scissors(v);
    case 'extend': return extend(v);
    case 'splitS': return splitS(v);
    case 'immelmann': return immelmann(v);
    case 'leadTurn':
      if (v.range === 2) return Q(-1, 'leadTurnEarly');
      return v.edge >= 2 ? Q(0, 'leadTurnFast') : Q(2, 'leadTurnGood');
    case 'leadPursuit':
    case 'lagPursuit':
    case 'highYoyo':
    case 'lowYoyo': return pursuitRule(m, v);
    default: throw new Error(`unhandled: ${m satisfies never}`);
  }
}

/** What a defender gains when the attacker pulls lead pursuit with too much closure up close. */
const OVERSHOOT_BONUS: Partial<Record<MoveId, number>> = { break: 3, scissors: 2 };

/**
 * Overshoot at close range, from the player's side (`edge` = the player's energy edge): positive when the
 * player defends with a break / scissors against the bandit's lead pursuit while he has the edge, negative
 * when the player pulls lead with the edge into the bandit's break / scissors, otherwise 0.
 */
export function overshoot(mine: MoveId, his: MoveId, range: Range, edge: number): number {
  if (range !== 0) return 0;
  if (his === 'leadPursuit' && edge <= -1) return OVERSHOOT_BONUS[mine] ?? 0;
  if (mine === 'leadPursuit' && edge >= 1) return -(OVERSHOOT_BONUS[his] ?? 0);
  return 0;
}

/** The bandit's tie-break order: he goes for the throat. */
export const DOCTRINE: readonly MoveId[] = [
  'leadPursuit', 'immelmann', 'break', 'highYoyo', 'scissors', 'lowYoyo', 'leadTurn', 'lagPursuit', 'splitS', 'extend',
];

/** The best card of the hand for this view (ties by doctrine). */
export function bestCard(v: View): MoveId {
  const hand = [...CARDS[v.geo]].sort((a, b) => DOCTRINE.indexOf(a) - DOCTRINE.indexOf(b));
  let pick: MoveId = hand[0] ?? 'break';
  let best = -Infinity;
  for (const m of hand) {
    const q = quality(m, v).q;
    if (q > best) [best, pick] = [q, m];
  }
  return pick;
}
