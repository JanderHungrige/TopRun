import type { AudioEngine } from '../../core/audio';
import { BOSSES, type BossDef, type BossPartDef } from '../../data/bosses';
import type { BossId } from '../../data/types';
import { circleHit, headingTo, scaleBossHp } from '../../game/combat';
import { nukeBossDamage, nukePartDamage } from '../../game/jets';
import { drawBoss } from '../../render/draw-bosses';
import { spawnEnemy } from './enemy-ai';
import type { Player } from './player';
import { fireEnemyWeapon } from './weapons-fire';
import { PF_W, type World } from './world';

interface PartState {
  def: BossPartDef;
  hp: number;
  readonly max: number;
  alive: boolean;
  fireT: number;
  aim: number;
  flash: number;
}

export type BossPhase = 'enter' | 'fight' | 'dying' | 'gone';

export class Boss {
  readonly def: BossDef;
  x = PF_W / 2;
  y = -260;
  hp: number;
  readonly maxHp: number;
  phase: BossPhase = 'enter';
  t = 0;
  fightT = 0;
  flash = 0;
  coreFireT = 2;
  escortT = 3;
  dyingT = 0;
  readonly parts: PartState[];
  private readonly bulletSpeedMul: number;

  /** `ease` < 1: Rookie — slower bullets, less fire (doc 38); `tough`: map 2's extra HP (wave 3, doc 43). */
  constructor(id: BossId, difficulty: number, private readonly ease = 1, tough = 1) {
    this.def = BOSSES[id];
    this.maxHp = Math.round(scaleBossHp(this.def.coreHp, difficulty) * tough);
    this.hp = this.maxHp;
    this.bulletSpeedMul = (1 + 0.015 * (difficulty - 1)) * ease;
    this.parts = this.def.parts.map((def, i) => {
      const hp = Math.round(scaleBossHp(def.hp, difficulty) * tough);
      return { def, hp, max: hp, alive: true, fireT: 1.5 + i * 0.37, aim: Math.PI, flash: 0 };
    });
  }

  get enraged(): boolean {
    return this.hp < this.maxHp * 0.5;
  }

  get active(): boolean {
    return this.phase === 'fight' || this.phase === 'enter';
  }

  update(dt: number, world: World, p: Player, audio: AudioEngine): void {
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt);
    if (this.phase === 'enter') {
      this.y += 70 * dt;
      if (this.y >= this.def.settleY) this.phase = 'fight';
    } else if (this.phase === 'fight') {
      this.fightT += dt;
      this.x = PF_W / 2 + Math.sin(this.fightT * this.def.swaySpeed) * this.def.sway;
      this.fight(dt, world, p, audio);
    } else if (this.phase === 'dying') {
      this.dyingT += dt;
      this.y += 18 * dt;
      if (Math.random() < dt * 14) {
        const hb = this.def.hitboxes[Math.floor(Math.random() * this.def.hitboxes.length)];
        if (hb) world.particles.explosion(this.x + hb.dx + (Math.random() - 0.5) * hb.r, this.y + hb.dy + (Math.random() - 0.5) * hb.r, 'large', this.def.layer === 'ground');
        audio.play('explosionLarge', { volume: 0.6 });
      }
      if (this.dyingT > 2.6) {
        this.phase = 'gone';
        world.particles.explosion(this.x, this.y, 'huge');
        audio.play('explosionHuge');
        world.addShake(14);
      }
    }
    for (const part of this.parts) {
      part.flash = Math.max(0, part.flash - dt);
      part.aim = headingTo(this.x + part.def.dx, this.y + part.def.dy, p.x, p.y);
    }
  }

  private fight(dt: number, world: World, p: Player, audio: AudioEngine): void {
    const rage = this.enraged ? 1.45 : 1;
    for (const part of this.parts) {
      if (!part.alive) continue;
      part.fireT -= dt * rage;
      if (part.fireT <= 0) {
        part.fireT = (part.def.period / this.ease) * (0.85 + Math.random() * 0.3);
        if (p.stealthed) continue; // F-35 stealth: nothing to shoot at (doc 36)
        fireEnemyWeapon(world, { x: this.x + part.def.dx, y: this.y + part.def.dy, bulletSpeedMul: this.bulletSpeedMul }, part.def.weapon, p, audio);
      }
    }
    this.coreFireT -= dt * rage;
    if (this.coreFireT <= 0 && !p.stealthed) {
      this.coreFireT = this.def.corePeriod / this.ease;
      fireEnemyWeapon(world, { x: this.x, y: this.y + 40, bulletSpeedMul: this.bulletSpeedMul }, this.def.coreWeapon, p, audio);
      if (this.enraged) fireEnemyWeapon(world, { x: this.x, y: this.y + 40, bulletSpeedMul: this.bulletSpeedMul }, 'spread3', p, audio);
    }
    const escort = this.def.escort;
    if (escort) {
      this.escortT -= dt;
      if (this.escortT <= 0) {
        this.escortT = escort.every * (this.enraged ? 0.7 : 1);
        const e = spawnEnemy(world, escort.kind, this.x + (Math.random() - 0.5) * 160, 'straight', this.y);
        e.behavior = e.def.behaviors[0] ?? 'straight';
      }
    }
  }

  /** Damage at a point with radius r: hits a part if one is there, otherwise the hull. Returns true if anything was hit. */
  hitAt(x: number, y: number, r: number, amount: number, world: World, audio: AudioEngine): boolean {
    if (this.phase !== 'fight' && this.phase !== 'enter') return false;
    for (const part of this.parts) {
      if (!part.alive) continue;
      if (circleHit(x, y, r, this.x + part.def.dx, this.y + part.def.dy, part.def.r)) {
        this.hitPart(part, amount, world, audio);
        return true;
      }
    }
    const onHull = this.def.hitboxes.some((h) => circleHit(x, y, r, this.x + h.dx, this.y + h.dy, h.r));
    if (!onHull) return false;
    this.hitHull(amount, audio);
    return true;
  }

  /** Tornado nuke (doc 36): the core loses a share of its maximum HP, every part a share of its own. */
  blast(world: World, audio: AudioEngine): void {
    if (!this.active) return;
    for (const part of this.parts) if (part.alive) this.hitPart(part, nukePartDamage(part.max), world, audio);
    this.hitHull(nukeBossDamage(this.maxHp), audio);
  }

  private hitPart(part: PartState, amount: number, world: World, audio: AudioEngine): void {
    part.hp -= amount;
    part.flash = 0.06;
    if (part.hp > 0) return;
    part.alive = false;
    world.particles.explosion(this.x + part.def.dx, this.y + part.def.dy, 'large', this.def.layer === 'ground');
    audio.play('explosionLarge');
    world.addShake(4);
    world.collected += 100;
    world.particles.popup(this.x + part.def.dx, this.y + part.def.dy - 20, '+$100', '#5be37d');
  }

  private hitHull(amount: number, audio: AudioEngine): void {
    this.hp -= amount;
    this.flash = 0.05;
    if (this.hp > 0) return;
    this.hp = 0;
    this.phase = 'dying';
    audio.play('explosionHuge');
  }

  /** Nearest point of the boss to aim homing missiles at. */
  aimPoint(): { x: number; y: number } {
    const alive = this.parts.find((p) => p.alive);
    return alive ? { x: this.x + alive.def.dx, y: this.y + alive.def.dy } : { x: this.x, y: this.y };
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.phase === 'gone') return;
    drawBoss(ctx, this.def.id, this.x, this.y, {
      t: this.t, flash: this.flash > 0, damage: 1 - this.hp / this.maxHp, enraged: this.enraged,
      parts: this.parts.map((p) => ({ id: p.def.id, alive: p.alive, aim: p.aim, flash: p.flash > 0 })),
    });
  }
}
