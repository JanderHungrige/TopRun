import type { Input } from '../../core/input';
import { facingOf, TEAM_OF, type AthleteId } from '../../game/minigames/volleyball-athlete';
import { landingX } from '../../game/minigames/volleyball-ball';
import { hardBall } from '../../game/minigames/volleyball-hit';
import { createVolleyball, stepVolleyball, VB_MEDALS, type VbInput, type VbState } from '../../game/minigames/volleyball';
import { matchPoint, vbScore } from '../../game/minigames/volleyball-score';
import { serverOf } from '../../game/minigames/volleyball-state';
import type { GameContext } from '../../game/state';
import type { PersonLook } from '../../render/people';
import { drawBanterBox } from '../../render/minigames/volleyball-box';
import {
  drawBall, drawBallShadow, drawCourt, drawMarker, drawNetBack, drawNetFront, drawPuffs, sx, sy,
} from '../../render/minigames/volleyball-court';
import {
  drawBanner, drawBoard, drawHint, drawPopups, drawTouchStrip, drawYouMarker, STRIP_Y, TEAM_COLOR,
} from '../../render/minigames/volleyball-hud';
import { drawVolleyballIcon } from '../../render/minigames/volleyball-icon';
import { athleteLook } from '../../render/minigames/volleyball-looks';
import { drawAthlete, drawAthleteShadow, drawCrowd } from '../../render/minigames/volleyball-players';
import { drawBeach } from '../../render/minigames/volleyball-set';
import { COLORS } from '../../render/text';
import type { MinigameModule, MinigameRound } from './contract';
import { Banter } from './volleyball-banter';
import { VolleyFx, tx } from './volleyball-fx';

// Beach Volleyball (doc 21): maps keys / pad / touch onto VbInput, steps the pure rules, turns their events
// into sounds, pop-ups, sand puffs and banter, and draws the beach. Outcomes live in game/minigames/volleyball*.

const END_HOLD = 3.6;
/** Touch: drag in the sand strip to run; taps above it hit or jump. */
const DRAG = { x: 0, y: STRIP_Y, w: 1280, h: 720 - STRIP_Y } as const;
const ORDER: readonly AthleteId[] = ['breaker', 'riptide', 'duke', 'you'];
const PHASE: Readonly<Record<AthleteId, number>> = { you: 0, duke: 1.7, breaker: 3.1, riptide: 4.4 };
const MARK: Readonly<Record<AthleteId, string>> = { you: COLORS.cyan, duke: COLORS.gold, breaker: TEAM_COLOR.away, riptide: TEAM_COLOR.away };

class VolleyballRound implements MinigameRound {
  private s: VbState;
  private t = 0;
  private hold = 0;
  private spin = 0;
  private dragX: number | null = null;
  private readonly looks: Readonly<Record<AthleteId, PersonLook>>;
  private readonly banter: Banter;
  private readonly fx: VolleyFx;
  private readonly you: string;

  constructor(private readonly game: GameContext, seed: number) {
    this.s = createVolleyball(seed);
    const avatar = game.profile?.avatar ?? 'pilot1';
    const look = (id: AthleteId): PersonLook => athleteLook(id, avatar);
    this.looks = { you: look('you'), duke: look('duke'), breaker: look('breaker'), riptide: look('riptide') };
    this.you = game.profile?.callsign ?? tx('you');
    this.banter = new Banter(game.audio, game.profile?.callsign ?? 'pilot', { duke: this.looks.duke, breaker: this.looks.breaker, riptide: this.looks.riptide });
    this.fx = new VolleyFx(game.audio);
  }

  update(dt: number, input: Input): number | null {
    this.t += dt;
    this.s = stepVolleyball(this.s, this.read(input), dt);
    this.fx.onEvents(this.s.events, this.s);
    this.banter.onEvents(this.s.events, this.s);
    this.banter.update(dt);
    this.fx.update(dt);
    this.spin += this.s.ball.vx * dt * 2.4;
    if (this.s.phase !== 'over') return null;
    this.hold += dt;
    return this.hold >= END_HOLD ? vbScore(this.s.score) : null;
  }

  private read(input: Input): VbInput {
    let move = input.moveVector().x;
    if (input.touchingIn(DRAG)) {
      const you = sx(this.s.athletes.you.x);
      this.dragX = (this.dragX ?? you) + input.dragDelta(DRAG).x;
      move = Math.max(-1, Math.min(1, (this.dragX - you) / 36));
    } else {
      this.dragX = null;
    }
    const tapped = input.taps.some((p) => p.y > 56 && p.y < DRAG.y);
    return { move, jump: input.pressed('up'), act: input.pressed('fire') || tapped };
  }

  liveScore(): string {
    return `${this.s.score.home} : ${this.s.score.away}`;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const s = this.s;
    drawBeach(ctx, this.t);
    drawCrowd(ctx, this.fx.cheer, this.t);
    drawCourt(ctx);
    if (s.phase === 'live' && s.ball.y > 0.5) drawMarker(ctx, landingX(s.ball), s.assigned ? MARK[s.assigned] : 'rgba(255,255,255,0.45)', this.t);
    drawBallShadow(ctx, s.ball);
    for (const id of ORDER) drawAthleteShadow(ctx, s.athletes[id]);
    drawNetBack(ctx);
    for (const id of ORDER) this.drawOne(ctx, id);
    drawNetFront(ctx);
    drawBall(ctx, { ball: s.ball, spin: this.spin, trail: s.phase === 'live' && hardBall(s.ball) });
    drawPuffs(ctx, this.fx.puffs);
    const you = s.athletes.you;
    if (s.phase !== 'over') drawYouMarker(ctx, sx(you.x), sy(you.y) - 160, this.t);
    this.renderHud(ctx);
  }

  private drawOne(ctx: CanvasRenderingContext2D, id: AthleteId): void {
    const s = this.s;
    const a = s.athletes[id];
    const facing = facingOf(TEAM_OF[id]);
    const serving = s.phase === 'serve' && serverOf(s.order) === id;
    drawAthlete(ctx, this.looks[id], a, facing, {
      live: s.phase === 'live' || (s.phase === 'serve' && !serving), holding: serving && s.held, tossing: serving && !s.held,
      ballUp: s.ball.y - a.y, ballAhead: (s.ball.x - a.x) * facing, t: this.t,
    }, PHASE[id]);
  }

  private renderHud(ctx: CanvasRenderingContext2D): void {
    const s = this.s;
    const mp = s.phase !== 'over' && (matchPoint(s.score, 'home') || matchPoint(s.score, 'away'));
    drawBoard(ctx, {
      home: `${this.you} · ${tx('duke')}`, away: `${tx('breaker')} · ${tx('riptide')}`, score: s.score, serving: s.order.team,
      touches: s.phase === 'live' && s.touches.team && s.lastHit?.kind !== 'serve' ? { team: s.touches.team, count: s.touches.count } : null,
      matchPoint: mp ? tx('matchPoint') : null, t: this.t,
    });
    const box = this.banter.view(this.t);
    if (box) drawBanterBox(ctx, box);
    drawPopups(ctx, this.fx.popups);
    if (this.fx.banner) drawBanner(ctx, this.fx.banner);
    if (s.phase === 'serve' && serverOf(s.order) === 'you') {
      const x = sx(s.athletes.you.x) + 150;
      drawHint(ctx, tx(s.held ? 'serveToss' : 'serveHit'), x, 470, this.t);
      drawHint(ctx, tx('aim'), x, 510, this.t, false);
    }
    if (this.game.input.device === 'touch') drawTouchStrip(ctx, tx('drag'), tx('tap'), this.dragX !== null);
  }
}

export const VOLLEYBALL: MinigameModule = {
  id: 'volleyball',
  medals: VB_MEDALS,
  higherIsBetter: true,
  formatScore: (n) => tx('score', { n: n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0' }),
  rules: () => ({
    lines: [tx('rule1'), tx('rule2'), tx('rule3'), tx('rule4')],
    controls: [tx('ctrlKeys'), tx('ctrlPad'), tx('ctrlTouch')],
  }),
  drawIcon: drawVolleyballIcon,
  create: (game) => new VolleyballRound(game, Math.floor(Math.random() * 0x7fffffff)),
};
