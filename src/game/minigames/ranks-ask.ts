import type { Rng } from '../../core/rng';
import { FORCES, QUIZ_RANKS, type Force, type QuizRank } from '../../data/rank-quiz';

// Rank Quiz (doc 41): one question of each kind, built from the rank tables with a seeded generator. Wrong options
// never share the right one's order, pay grade or NATO code, so every question has exactly one right answer. Pure.

export type QuestionKind = 'higher' | 'next' | 'grade' | 'usEquiv' | 'natoEquiv' | 'code';

/** A rank by its force and place (0 = lowest). */
export interface QuizRef { force: Force; index: number }

export interface Question {
  kind: QuestionKind;
  /** The rank asked about ('higher': the first of the two). */
  subject: QuizRef;
  /** 'higher': the other rank; 'next': the next one; equivalents: the matching rank; else null. */
  partner: QuizRef | null;
  /** Equivalents: the force the answer comes from; else null. */
  target: Force | null;
  /** Shown as they are: rank names, pay grades and NATO codes are not translated. */
  options: string[];
  answer: number;
}

export function rankAt(ref: QuizRef): QuizRank {
  const rank = QUIZ_RANKS[ref.force][ref.index];
  if (!rank) throw new Error(`no rank ${ref.force}[${ref.index}]`);
  return rank;
}

export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    const a = out[i];
    const b = out[j];
    if (a === undefined || b === undefined) continue;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

/** The question with the right option and n − 1 wrong ones drawn from `wrong`; null when there are too few. */
function build(rng: Rng, base: Omit<Question, 'options' | 'answer'>, right: string, wrong: readonly string[], n: number): Question | null {
  const pool = shuffle(rng, [...new Set(wrong)].filter((w) => w !== right)).slice(0, n - 1);
  if (pool.length < n - 1) return null;
  const options = shuffle(rng, [right, ...pool]);
  return { ...base, options, answer: options.indexOf(right) };
}

/** Enlisted or officer: 'E' / 'O' of a pay grade (E-4, O-10). */
const gradeGroup = (g: string): string => g.charAt(0);
/** Enlisted or officer: 'OR' / 'OF' of a NATO code (OR-4, OF-9). */
const codeGroup = (c: string): string => c.slice(0, 2);
const ALL_CODES = [...Array.from({ length: 9 }, (_, i) => `OR-${i + 1}`), ...Array.from({ length: 9 }, (_, i) => `OF-${i + 1}`)];

function coded(force: Force): number[] {
  return QUIZ_RANKS[force].flatMap((r, i) => (r.nato ? [i] : []));
}

export function askHigher(rng: Rng, force: Force): Question | null {
  const list = QUIZ_RANKS[force];
  const i = rng.int(0, list.length - 1);
  const j = i + rng.pick([-8, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 8]);
  const a = list[i];
  const b = list[j];
  if (!a || !b) return null;
  const right = j > i ? b.name : a.name;
  const base = { kind: 'higher' as const, subject: { force, index: i }, partner: { force, index: j }, target: null };
  return build(rng, base, right, [right === a.name ? b.name : a.name], 2);
}

export function askNext(rng: Rng, force: Force): Question | null {
  const list = QUIZ_RANKS[force];
  const i = rng.int(0, list.length - 2);
  const next = list[i + 1];
  if (!next) return null;
  const near = list.flatMap((r, k) => (k !== i && k !== i + 1 && k >= i - 3 && k <= i + 5 ? [r.name] : []));
  const base = { kind: 'next' as const, subject: { force, index: i }, partner: { force, index: i + 1 }, target: null };
  return build(rng, base, next.name, near, 4);
}

export function askGrade(rng: Rng, force: Force): Question | null {
  const list = QUIZ_RANKS[force];
  const i = rng.int(0, list.length - 1);
  const grade = list[i]?.grade;
  if (!grade) return null;
  const wrong = list.flatMap((r) => (r.grade && r.grade !== grade && gradeGroup(r.grade) === gradeGroup(grade) ? [r.grade] : []));
  return build(rng, { kind: 'grade', subject: { force, index: i }, partner: null, target: null }, grade, wrong, 4);
}

export function askUsEquiv(rng: Rng, force: Force): Question | null {
  const target: Force = force === 'usn' ? 'usa' : 'usn';
  const i = rng.int(0, QUIZ_RANKS[force].length - 1);
  const grade = QUIZ_RANKS[force][i]?.grade;
  const others = QUIZ_RANKS[target];
  const k = others.findIndex((r) => r.grade === grade);
  const match = others[k];
  if (!grade || !match) return null;
  const wrong = others.flatMap((r) => (r.grade && r.grade !== grade && gradeGroup(r.grade) === gradeGroup(grade) ? [r.name] : []));
  return build(rng, { kind: 'usEquiv', subject: { force, index: i }, partner: { force: target, index: k }, target }, match.name, wrong, 4);
}

export function askNatoEquiv(rng: Rng, force: Force): Question | null {
  const i = rng.pick(coded(force));
  const code = QUIZ_RANKS[force][i]?.nato;
  const target = rng.pick(FORCES.filter((f) => f !== force));
  const others = QUIZ_RANKS[target];
  const matches = coded(target).filter((k) => others[k]?.nato === code);
  if (!code || matches.length === 0) return null;
  const k = rng.pick(matches);
  const right = others[k]?.name ?? '';
  const wrong = others.flatMap((r) => (r.nato && r.nato !== code && codeGroup(r.nato) === codeGroup(code) ? [r.name] : []));
  return build(rng, { kind: 'natoEquiv', subject: { force, index: i }, partner: { force: target, index: k }, target }, right, wrong, 4);
}

export function askCode(rng: Rng, force: Force): Question | null {
  const i = rng.pick(coded(force));
  const code = QUIZ_RANKS[force][i]?.nato;
  if (!code) return null;
  const wrong = ALL_CODES.filter((c) => c !== code && codeGroup(c) === codeGroup(code));
  return build(rng, { kind: 'code', subject: { force, index: i }, partner: null, target: null }, code, wrong, 4);
}
