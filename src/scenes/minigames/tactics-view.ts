import { medalFor } from '../../game/minigames/core';
import {
  POINTS, TACTICS_MEDALS, TACTICS_RULES as R, viewOf, type Engagement, type Outcome, type Situation, type TurnResult,
} from '../../game/minigames/tactics';
import { CARDS, EFFECTS, type Geo } from '../../game/minigames/tactics-moves';
import type { Params } from '../../i18n/i18n';
import { mt } from '../../i18n/minigame-text';
import { GEO_KEY, hintKey, MOVE_KEY, SKILL_KEY, TACTICS_TEXT, type TacticsKey } from '../../i18n/minigames/tactics';
import { END_LINE, INTRO_LINE, TACTICS_LINES, type LineKey } from '../../i18n/minigames/tactics-lines';
import type { BoardSnap, MeterLabels, NoteLine, SketchView, SummaryRow } from '../../render/minigames/tactics-board';
import type { CardView } from '../../render/minigames/tactics-cards';
import { INK } from '../../render/minigames/tactics-marker';
import { lerpPose, posesFor, type Pose } from '../../render/minigames/tactics-paths';

// Dogfight Tactics (doc 19): turns the pure state into what the board, the cards and the instructor show
// (localized strings, colours). No outcome logic.

export const tx = (k: TacticsKey, p?: Params): string => mt(TACTICS_TEXT, k, p);
export const say = (k: LineKey, callsign: string): string => mt(TACTICS_LINES, k, { callsign });

export const cardViews = (geo: Geo): CardView[] =>
  CARDS[geo].map((move) => ({ move, title: tx(MOVE_KEY[move]), hint: tx(hintKey(geo, move)), energy: EFFECTS[move].energy, alt: EFFECTS[move].alt }));

const RANGE_KEY: readonly TacticsKey[] = ['rangeClose', 'rangeMedium', 'rangeFar'];

/** The notes column: geometry, range, energy, altitude, the circled energy edge. */
export function notesFor(s: Situation): NoteLine[] {
  const e = viewOf(s, 'you').edge;
  const alt: TacticsKey = s.alt > 0 ? 'altAbove' : s.alt < 0 ? 'altBelow' : 'altLevel';
  const edge = e > 0 ? tx('edgeYou', { n: e }) : e < 0 ? tx('edgeHim', { n: -e }) : tx('edgeEven');
  return [
    { text: tx(GEO_KEY[s.geo]), color: s.geo === 'defensive' ? INK.red : s.geo === 'offensive' ? INK.blue : INK.black },
    { text: tx(RANGE_KEY[s.range] ?? 'rangeMedium'), color: INK.black },
    { text: tx('energy', { you: s.you, him: s.him }), color: INK.black },
    { text: tx(alt), color: INK.black },
    { text: edge, color: e > 0 ? INK.blue : e < 0 ? INK.red : INK.black, circled: true },
  ];
}

const RANGE_WORD: readonly TacticsKey[] = ['rClose', 'rMedium', 'rFar'];
/** Short range word for the sketch's dimension line. */
export const rangeWord = (s: Situation): string => tx(RANGE_WORD[s.range] ?? 'rMedium');

/** Board header; `turn` = the turn number to show (1-based). */
export function headerFor(e: Engagement, turn: number): [string, string] {
  const left = `${tx('engagement', { n: e.index + 1, total: R.engagements })}   ${tx('turn', { n: Math.max(1, Math.min(R.turns, turn)), max: R.turns })}   ${tx('par', { n: e.par })}`;
  return [left, tx('skill', { skill: tx(SKILL_KEY[e.index] ?? 'ace') })];
}

export const meterLabels = (): MeterLabels => ({
  lose: tx('meterLose'), def: tx('meterDef'), neutral: tx('meterNeutral'), off: tx('meterOff'), win: tx('meterWin'),
});

const STAMP: Readonly<Record<Outcome, { title: TacticsKey; pts: TacticsKey; color: string }>> = {
  fastKill: { title: 'stampKill', pts: 'ptsFast', color: INK.blue },
  kill: { title: 'stampKill', pts: 'ptsKill', color: INK.blue },
  separated: { title: 'stampDraw', pts: 'ptsDraw', color: INK.black },
  shotDown: { title: 'stampLoss', pts: 'ptsLoss', color: INK.red },
};

export function stampFor(o: Outcome): { title: string; sub: string; color: string } {
  const st = STAMP[o];
  return { title: tx(st.title), sub: tx(st.pts, { n: POINTS[o] }), color: st.color };
}

const OUTCOME_WORD: Readonly<Record<Outcome, TacticsKey>> = { fastKill: 'oFast', kill: 'oKill', separated: 'oDraw', shotDown: 'oLoss' };

export const summaryRows = (outcomes: readonly Outcome[]): SummaryRow[] => outcomes.map((o) => ({
  label: tx(OUTCOME_WORD[o]), points: `+${POINTS[o]}`, color: STAMP[o].color,
}));

/** The bandit's card and an overshoot, written under the notes after a turn. */
export function playedNote(last: TurnResult): NoteLine {
  if (last.overshoot !== 0) return { text: tx('stampOvershoot'), color: last.overshoot > 0 ? INK.blue : INK.red };
  return { text: tx('banditPlayed', { move: tx(MOVE_KEY[last.his]) }), color: INK.red };
}

/** The instructor's debrief after a turn (plus the outcome line when the engagement ended). */
export function debriefLine(last: TurnResult, callsign: string): string {
  const verdict = say(last.note, callsign);
  return last.outcome ? `${verdict} ${say(END_LINE[last.outcome], callsign)}` : verdict;
}

export const introLine = (geo: Geo, callsign: string): string => say(INTRO_LINE[geo], callsign);

export interface SnapInput {
  eng: Engagement;
  /** The turn being shown (resolve phase), else null. */
  last: TurnResult | null;
  age: number;
  meter: number;
  from: { you: Pose; him: Pose } | null;
  /** Eased 0 … 1 glide from `from` to the current poses. */
  glide: number;
  at: { overshoot: number; meter: number; stamp: number };
  his: number;
  draw: number;
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

function sketchOf(i: SnapInput): SketchView {
  const sit = i.last ? i.last.before : i.eng.sit;
  const now = posesFor(sit.geo, sit.range);
  const you = i.from ? lerpPose(i.from.you, now.you, i.glide) : now.you;
  const him = i.from ? lerpPose(i.from.him, now.him, i.glide) : now.him;
  const paths = i.last
    ? { mine: i.last.mine, his: i.last.his, you, him, pMine: clamp01(i.age / i.draw), pHis: clamp01((i.age - i.his) / i.draw) }
    : null;
  return {
    you: { pose: you, energy: sit.you }, him: { pose: him, energy: sit.him }, alt: sit.alt, range: sit.range,
    rangeLabel: rangeWord(sit), labels: { you: tx('you'), bandit: tx('bandit'), high: tx('high'), low: tx('low') }, paths,
  };
}

/** Everything on the board this frame. */
export function buildSnap(i: SnapInput): BoardSnap {
  const { eng, last, age } = i;
  const d = last?.delta ?? 0;
  const outcome = last?.outcome;
  return {
    header: headerFor(eng, last ? eng.turn : eng.turn + 1),
    meter: i.meter,
    labels: meterLabels(),
    delta: last && age >= i.at.meter ? { text: d > 0 ? `+${d}` : String(d), color: d >= 0 ? INK.blue : INK.red, alpha: 1 } : null,
    sketch: sketchOf(i),
    notes: notesFor(last ? last.before : eng.sit),
    extra: last && age >= i.at.overshoot ? playedNote(last) : null,
    stamp: outcome && age >= i.at.stamp ? { ...stampFor(outcome), age: age - i.at.stamp } : null,
  };
}

export function finalLine(points: number, callsign: string): string {
  const medal = medalFor(points, TACTICS_MEDALS, true);
  return say(medal === 'gold' ? 'finalGreat' : medal ? 'finalGood' : 'finalBad', callsign);
}
