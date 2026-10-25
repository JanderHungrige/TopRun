import type { Action, Input } from '../../core/input';
import { clamp } from '../../core/math';
import type { SectionId } from '../../data/piano-song';
import {
  bandLevel, createPiano, crowdSize, multiplier, PIANO_MEDALS, PIANO_RULES as R, stepPiano, verdict,
  type Lanes, type PianoState, type Verdict,
} from '../../game/minigames/piano';
import { beatAt, pianoChart, sectionAt } from '../../game/minigames/piano-chart';
import type { GameContext } from '../../game/state';
import type { Params } from '../../i18n/i18n';
import { mt } from '../../i18n/minigame-text';
import { PIANO_TEXT, pianoNum, type PianoKey } from '../../i18n/minigames/piano';
import { drawBanter } from '../../render/minigames/piano-banter';
import { drawCrowd } from '../../render/minigames/piano-crowd';
import { drawHighway, HWY } from '../../render/minigames/piano-highway';
import { drawCombo, drawEndBanner, drawGroove, drawPops, drawSection, drawSparks, drawToast } from '../../render/minigames/piano-hud';
import { drawPianoIcon } from '../../render/minigames/piano-icon';
import { faceOf, playerPerson } from '../../render/avatars/person';
import { pianoPlayer } from '../../render/minigames/piano-looks';
import { drawPianoPilot } from '../../render/minigames/piano-pilot';
import { drawLampLight, drawPianoRoom } from '../../render/minigames/piano-room';
import { drawStool, drawUprightBack, drawUprightFront } from '../../render/minigames/piano-upright';
import type { PersonLook } from '../../render/people';
import { COLORS } from '../../render/text';
import type { MinigameModule, MinigameRound } from './contract';
import { PianoDeck } from './piano-audio';
import { PianoBanter, type BanterId } from './piano-banter';
import { PianoFx } from './piano-fx';

// Piano Bar (doc 23): maps input onto the pure rules, plays the tune, animates the club, holds the banner.

const END_HOLD = 3;
const tx = (k: PianoKey, p?: Params): string => mt(PIANO_TEXT, k, p);

/** Lane ← ↓ ↑ →: arrows / WASD / d-pad, or the gamepad face buttons X A Y B (F, Space / J, E, R / K). */
const LANE_ACTIONS: readonly (readonly Action[])[] = [['left', 'flare'], ['down', 'fire'], ['up', 'special'], ['right', 'secondary']];
const ARROWS = ['←', '↓', '↑', '→'] as const;

const SECTION_KEY: Readonly<Record<SectionId, PianoKey>> = {
  intro: 'secIntro', bandIn: 'secBandIn', chorus1: 'secChorus1', break: 'secBreak', chorus2: 'secChorus2',
  stopTime: 'secStopTime', finale: 'secFinale', ending: 'secEnding', final: 'secFinal',
};
const VERDICT: Readonly<Record<Verdict, { key: PianoKey; color: string; line: BanterId }>> = {
  encore: { key: 'encore', color: COLORS.gold, line: 'encore' },
  nice: { key: 'nice', color: COLORS.cyan, line: 'nice' },
  tough: { key: 'tough', color: COLORS.red, line: 'tough' },
};
const LAYER_TOAST: readonly (readonly [PianoKey, PianoKey])[] = [['inKit', 'outKit'], ['inBass', 'outBass'], ['inClaps', 'outClaps']];

function readLanes(input: Input): Lanes {
  const taps = input.taps.filter((p) => p.y > 56 && p.x >= 760).map((p) => clamp(Math.floor((p.x - HWY.x) / HWY.lane), 0, 3));
  const on = (i: number): boolean => (LANE_ACTIONS[i] ?? []).some((a) => input.pressed(a)) || taps.includes(i);
  return [on(0), on(1), on(2), on(3)];
}

class PianoRound implements MinigameRound {
  private readonly chart = pianoChart();
  private s: PianoState;
  private readonly deck: PianoDeck;
  private readonly banter: PianoBanter;
  private readonly look: PersonLook;
  private readonly fx = new PianoFx();
  private t = 0;
  private hold = 0;
  private section = -1;
  private beatHint = 0;
  private groanCool = 0;
  private said = new Set<BanterId>();

  constructor(private readonly game: GameContext) {
    this.s = createPiano(this.chart);
    this.deck = new PianoDeck(game.audio, this.chart);
    this.banter = new PianoBanter(game.audio, game.profile?.callsign ?? tx('pilot'));
    this.look = pianoPlayer(playerPerson(faceOf(game.profile)));
    game.music.stop();
  }

  update(dt: number, input: Input): number | null {
    this.t += dt;
    this.groanCool = Math.max(0, this.groanCool - dt);
    const prev = this.s;
    const lanes = readLanes(input);
    this.s = stepPiano(this.chart, prev, lanes, dt);
    this.fx.pressed(lanes);
    this.events();
    this.sections();
    this.layers(prev);
    this.deck.sync(this.s.time, bandLevel(this.s.groove));
    this.banter.update(dt);
    this.fx.update(dt, crowdSize(this.s), this.s.combo / 30 + (this.s.groove - 0.5));
    if (!this.s.over) return null;
    if (this.hold === 0) this.finish();
    this.hold += dt;
    return this.hold >= END_HOLD ? this.s.score : null;
  }

  private events(): void {
    for (const e of this.s.events) {
      switch (e.kind) {
        case 'hit': {
          const n = this.chart.notes[e.note];
          if (!n) break;
          this.deck.hit(n, e.grade);
          this.fx.hit(n.lane, e.grade, tx(n.gliss ? 'gliss' : e.grade));
          if (e.combo % 10 === 0) this.milestone(e.combo);
          break;
        }
        case 'miss': this.broken(this.chart.notes[e.note]?.lane ?? 0, e.broke, false); break;
        case 'wrong':
          this.deck.wrong(e.lane);
          this.broken(e.lane, e.broke, true);
          break;
        default: throw new Error(`unhandled: ${e satisfies never}`);
      }
    }
  }

  private milestone(combo: number): void {
    this.fx.toast = 1;
    this.deck.crowd('cheer', Math.min(1.2, 0.6 + combo / 60));
    if (combo === 50) this.sayOnce('combo');
  }

  private broken(lane: number, broke: number, wrong: boolean): void {
    if (wrong) this.fx.wrongKey(lane, tx('wrong'), broke);
    else this.fx.miss(lane, tx('miss'), broke);
    if (broke >= 8 && this.groanCool === 0) {
      this.deck.crowd('groan', Math.min(1.2, 0.5 + broke / 40));
      this.groanCool = 1.5;
    }
  }

  private sayOnce(id: BanterId): void {
    if (this.said.has(id)) return;
    this.said.add(id);
    this.banter.say(id);
  }

  private sections(): void {
    const i = sectionAt(this.chart, this.s.time);
    if (i === this.section || this.s.time < 0) return;
    this.section = i;
    const cue = this.chart.sections[i]?.banter;
    if (cue) this.sayOnce(cue);
  }

  /** Band layers coming and going (only where the band plays) get a toast; the first drop a line. */
  private layers(prev: PianoState): void {
    if (!this.chart.sections[this.section]?.band) return;
    const was = bandLevel(prev.groove);
    const now = bandLevel(this.s.groove);
    if (was === now) return;
    const up = now > was;
    const pair = LAYER_TOAST[(up ? now : was) - 1];
    if (pair) this.fx.say(tx(up ? pair[0] : pair[1]), up);
    if (!up && now === 0) this.sayOnce('drums');
  }

  private finish(): void {
    const v = verdict(this.chart, this.s);
    this.banter.say(VERDICT[v].line, true);
    this.deck.crowd(v === 'tough' ? 'groan' : 'applause', v === 'encore' ? 1.2 : 0.8);
  }

  liveScore(): string {
    return tx('live', { n: pianoNum(this.s.score), m: multiplier(this.s.combo) });
  }

  render(ctx: CanvasRenderingContext2D): void {
    const s = this.s;
    const beat = beatAt(this.chart, s.time, this.beatHint);
    this.beatHint = Math.max(0, beat.index);
    const phase = s.time < 0 ? 0 : beat.phase;
    const playing = s.time >= 0 && !s.over;
    drawPianoRoom(ctx, { neon: tx('neon'), glow: s.groove, beat: phase, t: this.t });
    const crowd = this.fx.crowdView(phase, s.groove, this.t);
    drawCrowd(ctx, crowd, false);
    drawUprightBack(ctx, { rh: this.fx.glow, lh: playing ? (1 - ((phase * 2) % 1)) ** 2 : 0, glow: s.groove });
    drawStool(ctx);
    drawPianoPilot(ctx, this.look, {
      beat: phase, eighth: (phase * 2) % 1, lane: this.fx.lane, strike: this.fx.strike, groove: playing ? s.groove : 0,
      expression: this.fx.wince > 0.3 ? 'strain' : s.combo >= 10 || s.over ? 'grin' : 'calm', t: this.t,
    });
    drawUprightFront(ctx);
    drawCrowd(ctx, crowd, true);
    drawLampLight(ctx, s.groove);
    this.renderHud(ctx);
    const b = this.banter.view(this.t);
    if (b) drawBanter(ctx, b);
    if (s.over) {
      const v = VERDICT[verdict(this.chart, s)];
      const stats = tx('stats', { p: s.perfect, g: s.good, m: s.miss, c: s.maxCombo });
      drawEndBanner(ctx, tx(v.key), stats, v.color, this.hold);
    }
  }

  private renderHud(ctx: CanvasRenderingContext2D): void {
    const s = this.s;
    const device = this.game.input.device;
    const sub = device === 'touch' || device === 'mouse' ? [tx('tap'), tx('tap'), tx('tap'), tx('tap')]
      : device === 'gamepad' || device === 'joystick' ? ['X', 'A', 'Y', 'B'] : ['A', 'S', 'W', 'D'];
    drawHighway(ctx, {
      time: s.time, notes: this.chart.notes, results: s.results, first: s.first, beats: this.chart.beats,
      press: this.fx.press, glow: this.fx.glow, wrong: this.fx.wrong, labels: ARROWS, sub, t: this.t,
    });
    const sec = this.chart.sections[Math.max(0, this.section)];
    drawSection(ctx, tx(SECTION_KEY[sec?.id ?? 'intro']), tx('song'), s.time / this.chart.last);
    drawCombo(ctx, s.combo, multiplier(s.combo), tx('combo'), this.fx.bump);
    drawGroove(ctx, {
      groove: s.groove, level: bandLevel(s.groove), label: tx('groove'), t: this.t,
      marks: R.layers.map((at, i) => ({ at, label: tx((['layerKit', 'layerBass', 'layerClaps'] as const)[i] ?? 'layerKit') })),
    });
    drawSparks(ctx, this.fx.sparks);
    drawPops(ctx, this.fx.pops);
    const toast = this.fx.banner;
    if (toast) drawToast(ctx, toast.text, toast.age, toast.good);
  }

  dispose(): void {
    this.deck.stop();
  }
}

export const PIANO: MinigameModule = {
  id: 'piano',
  medals: PIANO_MEDALS,
  higherIsBetter: true,
  formatScore: (n) => tx('score', { n: pianoNum(n) }),
  rules: () => ({
    lines: [tx('rule1'), tx('rule2'), tx('rule3'), tx('rule4')],
    controls: [tx('ctrlKeys'), tx('ctrlPad'), tx('ctrlTouch')],
  }),
  drawIcon: drawPianoIcon,
  create: (game) => new PianoRound(game),
};
