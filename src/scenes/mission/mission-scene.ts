import { approach } from '../../core/math';
import type { Scene } from '../../core/scene';
import type { MissionDef, MissionResult, TakeoffRating } from '../../data/types';
import { isMiniBoss } from '../../data/reinforcements';
import { holdsScroll, jamming, MINI_HOLD_SCROLL } from '../../game/adversaries';
import { missionTuning } from '../../game/challenge';
import { hitScale } from '../../game/combat';
import { mapTwoHit, mapTwoHp, payScale } from '../../game/map-two';
import { canSwitch, derivePlayerStats } from '../../game/loadout';
import { isMissionOver, objectiveMet } from '../../game/objectives';
import type { GameContext } from '../../game/state';
import { bossTitle, enemyName, missionName, objectiveText } from '../../i18n/content';
import { getLang, t } from '../../i18n/i18n';
import { COLORS, text } from '../../render/text';
import { pilotContext } from '../../ui/speech';
import { ButtonGroup, drawPanel, hit } from '../../ui/widgets';
import { Boss } from './boss';
import { spawnEnemy, updateEnemies } from './enemy-ai';
import { drawLeftConsole, drawRightConsole } from '../../render/cockpit';
import { LEFT, RIGHT, type Rect } from '../../render/cockpit/layout';
import { cockpitButtons, cockpitKeys, cockpitLabels, leftView, rightView } from './cockpit-view';
import { clipPlayfield, renderWorld } from './mission-render';
import { updatePickups } from './pickups';
import { Player } from './player';
import { WingmanRadio } from './radio';
import { activateSpecial, tickSpecials } from './specials';
import { updateCombat } from './projectiles';
import { drawSwitchCallout, switchGroundWeapon } from './weapon-switch';
import { dropFlare, fireSecondary, firePlayerGun, fireWingman } from './weapons-fire';
import { PF_H, PF_W, PF_X, World } from './world';

interface Banner {
  title: string;
  sub: string;
  color: string;
  time: number;
}

const PLAYFIELD = { x: PF_X, y: 0, w: PF_W, h: PF_H };

export class MissionScene implements Scene {
  private readonly world: World;
  private readonly player: Player;
  private t = 0;
  private paused = false;
  private pauseMenu = new ButtonGroup([
    { id: 'resume', label: t('mission.resume'), x: 520, y: 330, w: 240, h: 48, primary: true },
    { id: 'abort', label: t('mission.abort'), x: 520, y: 392, w: 240, h: 48 },
  ]);
  private readonly radio: WingmanRadio;
  /** Stable per language: the cockpit caches its painted plates by label identity. */
  private labels = cockpitLabels();
  private labelsLang = getLang();
  private banner: Banner | null = null;
  private ending: { success: boolean; timer: number } | null = null;
  private left = false;

  constructor(private readonly game: GameContext, private readonly mission: MissionDef, private readonly takeoff: TakeoffRating) {
    const tuning = missionTuning(game.save);
    this.world = new World({ ...mission, difficulty: mission.difficulty + tuning.difficulty }, tuning.ease);
    this.player = new Player(derivePlayerStats(game.save));
    this.banner = { title: missionName(mission).toUpperCase(), sub: objectiveText(mission.objective), color: COLORS.ink, time: 3 };
    this.radio = new WingmanRadio(game.audio, pilotContext(game));
  }

  enter(): void {
    this.game.music.play('mission');
  }

  exit(): void {
    this.game.audio.setJet(0);
  }

  onBlur(): void {
    if (!this.ending) this.paused = true;
    this.game.audio.setJet(0);
  }

  /** A cockpit button was clicked/tapped this tick (any device). */
  private clicked(r: Rect): boolean {
    return this.game.input.taps.some((p) => hit(p, r));
  }

  update(dt: number): void {
    this.t += dt;
    const input = this.game.input;
    if (!this.ending && (input.pressed('pause') || this.clicked(RIGHT.pauseBtn))) {
      this.paused = !this.paused;
      this.game.audio.play(this.paused ? 'uiBack' : 'uiSelect');
      return;
    }
    if (this.paused) return this.updatePause();
    this.game.audio.setJet(this.player.alive ? 0.22 : 0);
    if (this.banner) this.banner.time -= dt;
    if (this.ending) this.updateEnding(dt);
    else this.handleInput(dt);
    this.simulate(dt);
    if (!this.ending) this.checkEnd();
  }

  private updatePause(): void {
    const id = this.pauseMenu.update(this.game.input);
    if (id === 'resume') this.paused = false;
    if (id === 'abort') this.finish(false, true);
  }

  private handleInput(dt: number): void {
    const input = this.game.input;
    const p = this.player;
    if (!p.alive) return;
    const touch = input.device === 'touch';
    p.move(input.moveVector(), input.dragDelta(PLAYFIELD), dt);
    const autofire = this.game.settings.autofire || (touch && input.touchingIn(PLAYFIELD));
    if (input.held('fire') || autofire) firePlayerGun(this.world, p, this.game.audio);
    if (input.held('secondary')) fireSecondary(this.world, p, this.game.audio, 'air');
    if (input.held('groundWeapon')) fireSecondary(this.world, p, this.game.audio, 'ground');
    if (input.pressed('weaponSwitch')) switchGroundWeapon(p, this.game.audio);
    if (input.pressed('flare')) dropFlare(this.world, p, this.game.audio);
    if (input.pressed('special')) this.activateSpecial();
    this.cockpitClicks();
  }

  /** Lit cockpit buttons act on click/tap; dark ones answer with the "denied" buzz (doc 05). */
  private cockpitClicks(): void {
    const p = this.player;
    const b = cockpitButtons(p);
    const a = this.game.audio;
    const press = (r: Rect, ready: boolean, act: () => void): void => {
      if (!this.clicked(r)) return;
      if (ready) act();
      else a.play('denied');
    };
    press(LEFT.airBtn, b.air === 'ready', () => fireSecondary(this.world, p, a, 'air'));
    press(LEFT.groundBtn, b.ground === 'ready', () => fireSecondary(this.world, p, a, 'ground'));
    press(LEFT.stores, canSwitch(p.secondaries, 'ground'), () => switchGroundWeapon(p, a));
    press(RIGHT.flareBtn, b.flare === 'ready', () => dropFlare(this.world, p, a));
    press(RIGHT.specialBtn, b.special.state === 'ready', () => this.activateSpecial());
  }

  private activateSpecial(): void {
    activateSpecial(this.world, this.player, this.game.audio, this.radio);
  }

  private simulate(dt: number): void {
    const w = this.world;
    const p = this.player;
    w.t += dt;
    p.tick(dt);
    tickSpecials(w, p, dt, this.game.audio);
    fireWingman(w, p, dt);
    const dashing = p.specialActive > 0 && p.stats.plane.special === 'dash';
    const holdForBoss = w.boss?.def.id === 'sandstorm' && w.boss.phase !== 'enter';
    const hold = holdForBoss ? 0 : holdsScroll(w.enemies, PF_H, isMiniBoss) ? MINI_HOLD_SCROLL : 1;
    w.scrollMul = approach(w.scrollMul, dashing ? 3 : hold, dt * 3);
    w.jammed = jamming(w.enemies, PF_H);
    this.spawnEvents();
    w.terrain.update(dt, w.scrollSpeed);
    for (const wr of w.wrecks) wr.y += w.scrollSpeed * dt;
    updateEnemies(w, p, dt, this.game.audio);
    w.boss?.update(dt, w, p, this.game.audio);
    updateCombat(w, p, dt, { audio: this.game.audio, onPlayerHit: (n) => this.playerHit(n) });
    updatePickups(w, p, dt, this.game.audio);
    w.particles.update(dt, w.scrollSpeed);
    w.shake = Math.max(0, w.shake - dt * 25);
    w.sweep();
    this.radio.update(dt, w, p, this.game.input);
  }

  private spawnEvents(): void {
    const w = this.world;
    for (let ev = w.timeline[w.nextEvent]; ev && ev.t <= w.t; ev = w.timeline[++w.nextEvent]) {
      if (ev.type === 'enemy') {
        spawnEnemy(w, ev.kind, ev.x, ev.behavior);
        if (isMiniBoss(ev.kind)) this.warn(t('mission.miniBoss', { name: enemyName(ev.kind) }), enemyName(ev.kind));
      } else {
        w.boss = new Boss(ev.boss, w.mission.difficulty, w.ease, mapTwoHp(w.mission.number));
        this.warn(t('mission.bossApproaching', { boss: w.boss.def.name, title: bossTitle(w.boss.def.id) }), w.boss.def.name);
        this.game.music.play('boss');
      }
    }
  }

  /** WARNING banner, siren and the wingman's call: a boss or a mini-boss (doc 44) is coming. */
  private warn(sub: string, name: string): void {
    this.banner = { title: t('mission.warning'), sub, color: COLORS.red, time: 3 };
    this.game.audio.play('warning');
    this.radio.bossWarning(name);
  }

  /** Every enemy hit lands here; its damage grows with the mission's difficulty (doc 43). */
  private playerHit(base: number): void {
    const p = this.player;
    const w = this.world;
    if (!p.alive || p.invulnerable) return;
    const amount = base * hitScale(w.mission.difficulty) * mapTwoHit(w.mission.number);
    w.perf.damage += amount;
    const died = p.damage(amount);
    w.particles.sparks(p.x, p.y, 8, '#ffb070', 200);
    if (died) {
      w.particles.explosion(p.x, p.y, 'huge');
      this.game.audio.play('explosionHuge');
      w.addShake(14);
    } else {
      this.game.audio.play('playerHit');
      w.addShake(4);
    }
  }

  private checkEnd(): void {
    const w = this.world;
    const p = this.player;
    const bossMission = this.mission.objective.type === 'boss';
    if (w.boss?.phase === 'gone' && !w.tally.bossKilled) {
      w.tally.bossKilled = true;
      w.tally.kills += 1;
      const bounty = Math.round(w.boss.def.bounty * payScale(w.mission.number));
      w.collected += bounty;
      w.particles.popup(w.boss.x, w.boss.y, `+$${bounty}`, '#5be37d');
    }
    const over = isMissionOver({
      playerDead: !p.alive, bossMission, bossKilled: w.tally.bossKilled, t: w.t, length: this.mission.length,
      enemiesOnScreen: w.liveEnemies(), overtime: Math.max(0, w.t - this.mission.length),
    });
    if (!over) return;
    const success = objectiveMet(this.mission.objective, w.tally, p.alive);
    this.ending = { success, timer: 0 };
    p.invuln = 99;
    this.game.music.play(success ? 'victory' : 'defeat');
    const reason = t(!p.alive ? 'mission.shotDown' : 'mission.objectiveMissed');
    this.banner = success
      ? { title: t('mission.complete'), sub: t('mission.returnToCarrier'), color: COLORS.gold, time: 99 }
      : { title: t('mission.failed'), sub: reason, color: COLORS.red, time: 99 };
    if (success) this.radio.victory();
  }

  private updateEnding(dt: number): void {
    const e = this.ending;
    if (!e) return;
    e.timer += dt;
    if (e.success && this.player.alive) {
      this.player.exitY += dt * 260 * Math.min(1, e.timer);
      this.player.y -= this.player.exitY * dt * 3;
    }
    if (e.timer > 3.2) this.finish(e.success, false);
  }

  private finish(success: boolean, aborted: boolean): void {
    if (this.left) return;
    this.left = true;
    const w = this.world;
    const result: MissionResult = {
      missionId: this.mission.id, success, aborted, takeoff: this.takeoff, kills: w.tally.kills,
      spawned: w.spawned + (w.boss ? 1 : 0), objectiveDone: objectiveMet(this.mission.objective, w.tally, this.player.alive),
      hullRatio: this.player.hullRatio, collected: w.collected, bossKilled: w.tally.bossKilled,
      usedSecondaries: this.player.firedSecondary,
      perf: { ...w.perf, damage: w.perf.damage / this.player.maxHull },
    };
    this.game.go({ to: 'debrief', mission: this.mission, result });
  }

  render(ctx: CanvasRenderingContext2D): void {
    const w = this.world;
    ctx.save();
    ctx.translate(PF_X, 0);
    clipPlayfield(ctx);
    if (w.shake > 0) ctx.translate((Math.random() - 0.5) * w.shake, (Math.random() - 0.5) * w.shake);
    renderWorld(ctx, w, this.player, this.t);
    drawSwitchCallout(ctx, this.player);
    ctx.restore();
    this.renderBanner(ctx);
    this.radio.render(ctx);
    if (this.labelsLang !== getLang()) {
      this.labels = cockpitLabels();
      this.labelsLang = getLang();
    }
    const keys = cockpitKeys(this.game.input.device, this.game.settings.joystick);
    drawLeftConsole(ctx, leftView(w, this.player, this.game.profile?.callsign ?? 'PILOT', this.labels, keys), this.t);
    drawRightConsole(ctx, rightView(w, this.player, this.labels, keys), this.t);
    if (this.paused) this.renderPause(ctx);
  }

  private renderBanner(ctx: CanvasRenderingContext2D): void {
    const b = this.banner;
    if (!b || b.time <= 0) return;
    const alpha = Math.min(1, b.time * 2);
    if (b.color === COLORS.red && b.time > 0 && b.title === t('mission.warning') && Math.sin(this.t * 14) < 0) return;
    text(ctx, b.title, 640, 300, { size: 46, display: true, italic: true, align: 'center', color: b.color, stroke: '#000', strokeWidth: 7, alpha });
    text(ctx, b.sub, 640, 336, { size: 18, align: 'center', color: COLORS.ink, stroke: '#000', strokeWidth: 4, alpha });
  }

  private renderPause(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, 1280, 720);
    drawPanel(ctx, { x: 500, y: 230, w: 280, h: 240 });
    text(ctx, t('mission.paused'), 640, 290, { size: 34, display: true, italic: true, align: 'center', color: COLORS.gold });
    this.pauseMenu.render(ctx, this.t);
    text(ctx, t('mission.abortNote'), 640, 462, { size: 12, align: 'center', color: COLORS.dim });
  }
}
