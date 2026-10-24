import { approach } from '../../core/math';
import type { Scene } from '../../core/scene';
import { objectiveText } from '../../data/missions';
import type { MissionDef, MissionResult, TakeoffRating } from '../../data/types';
import { derivePlayerStats } from '../../game/loadout';
import { isMissionOver, objectiveMet } from '../../game/objectives';
import type { GameContext } from '../../game/state';
import { COLORS, text } from '../../render/text';
import { ButtonGroup, drawPanel, hit } from '../../ui/widgets';
import { Boss } from './boss';
import { spawnEnemy, updateEnemies } from './enemy-ai';
import { drawLeftHud, drawRightHud, TOUCH_BUTTONS, type TouchAction } from './hud';
import { clipPlayfield, renderWorld } from './mission-render';
import { updatePickups } from './pickups';
import { Player } from './player';
import { updateCombat } from './projectiles';
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
    { id: 'resume', label: 'RESUME', x: 540, y: 330, w: 200, h: 48, primary: true },
    { id: 'abort', label: 'ABORT MISSION', x: 540, y: 392, w: 200, h: 48 },
  ]);
  private banner: Banner | null = null;
  private ending: { success: boolean; timer: number } | null = null;
  private left = false;

  constructor(private readonly game: GameContext, private readonly mission: MissionDef, private readonly takeoff: TakeoffRating) {
    this.world = new World(mission);
    this.player = new Player(derivePlayerStats(game.save));
    this.banner = { title: mission.name.toUpperCase(), sub: objectiveText(mission.objective), color: COLORS.ink, time: 3 };
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

  private touched(action: TouchAction): boolean {
    const b = TOUCH_BUTTONS.find((x) => x.id === action);
    return !!b && (action === 'pause' || this.game.input.device === 'touch') && this.game.input.taps.some((p) => hit(p, b));
  }

  update(dt: number): void {
    this.t += dt;
    const input = this.game.input;
    if (!this.ending && (input.pressed('pause') || this.touched('pause'))) {
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
    const autofire = this.game.save.settings.autofire || (touch && input.touchingIn(PLAYFIELD));
    if (input.held('fire') || autofire) firePlayerGun(this.world, p, this.game.audio);
    if (input.held('secondary') || this.touched('secondary')) fireSecondary(this.world, p, this.game.audio);
    if ((input.pressed('switchWeapon') || this.touched('switchWeapon')) && p.switchSecondary()) this.game.audio.play('uiMove');
    if (input.pressed('flare') || this.touched('flare')) dropFlare(this.world, p, this.game.audio);
    if (input.pressed('special') || this.touched('special')) this.activateSpecial();
  }

  private activateSpecial(): void {
    const p = this.player;
    const plane = p.stats.plane;
    if (p.specialCooldown > 0 || p.specialActive > 0) return;
    p.specialCooldown = plane.specialCooldown;
    p.specialActive = plane.specialDuration;
    this.game.audio.play('special');
    if (plane.special === 'roll') p.dashVX = (p.bank >= 0 ? 1 : -1) * 620;
    if (plane.special === 'wingman') p.wingman = { x: p.x + 90, y: PF_H + 40, fireT: 0.5 };
    if (plane.special === 'dash') this.world.addShake(6);
  }

  private simulate(dt: number): void {
    const w = this.world;
    const p = this.player;
    w.t += dt;
    p.tick(dt);
    if (p.wingman && p.specialActive <= 0) p.wingman = null;
    fireWingman(w, p, dt);
    const dashing = p.specialActive > 0 && p.stats.plane.special === 'dash';
    const holdForBoss = w.boss?.def.id === 'sandstorm' && w.boss.phase !== 'enter';
    w.scrollMul = approach(w.scrollMul, dashing ? 3 : holdForBoss ? 0 : 1, dt * 3);
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
  }

  private spawnEvents(): void {
    const w = this.world;
    for (let ev = w.timeline[w.nextEvent]; ev && ev.t <= w.t; ev = w.timeline[++w.nextEvent]) {
      if (ev.type === 'enemy') spawnEnemy(w, ev.kind, ev.x, ev.behavior);
      else {
        w.boss = new Boss(ev.boss, this.mission.difficulty);
        this.banner = { title: 'WARNING', sub: `${w.boss.def.name} — ${w.boss.def.title} approaching`, color: COLORS.red, time: 3 };
        this.game.audio.play('warning');
        this.game.music.play('boss');
      }
    }
  }

  private playerHit(amount: number): void {
    const p = this.player;
    const w = this.world;
    if (!p.alive || p.invulnerable) return;
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
      w.collected += w.boss.def.bounty;
      w.particles.popup(w.boss.x, w.boss.y, `+$${w.boss.def.bounty}`, '#5be37d');
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
    const reason = !p.alive ? 'You were shot down' : 'Objective not completed';
    this.banner = success
      ? { title: 'MISSION COMPLETE', sub: 'Return to the carrier', color: COLORS.gold, time: 99 }
      : { title: 'MISSION FAILED', sub: reason, color: COLORS.red, time: 99 };
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
    ctx.restore();
    this.renderBanner(ctx);
    const touch = this.game.input.device === 'touch';
    drawLeftHud(ctx, this.player, this.t, touch);
    drawRightHud(ctx, w, this.t, touch);
    if (this.paused) this.renderPause(ctx);
  }

  private renderBanner(ctx: CanvasRenderingContext2D): void {
    const b = this.banner;
    if (!b || b.time <= 0) return;
    const alpha = Math.min(1, b.time * 2);
    if (b.title === 'WARNING' && Math.sin(this.t * 14) < 0) return;
    text(ctx, b.title, 640, 300, { size: 46, display: true, italic: true, align: 'center', color: b.color, stroke: '#000', strokeWidth: 7, alpha });
    text(ctx, b.sub, 640, 336, { size: 18, align: 'center', color: COLORS.ink, stroke: '#000', strokeWidth: 4, alpha });
  }

  private renderPause(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, 1280, 720);
    drawPanel(ctx, { x: 500, y: 230, w: 280, h: 240 });
    text(ctx, 'PAUSED', 640, 290, { size: 34, display: true, italic: true, align: 'center', color: COLORS.gold });
    this.pauseMenu.render(ctx, this.t);
    text(ctx, 'Aborting keeps 50% of the cash earned', 640, 462, { size: 12, align: 'center', color: COLORS.dim });
  }
}
