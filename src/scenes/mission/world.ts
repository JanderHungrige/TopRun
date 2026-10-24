import type { EnemyDef } from '../../data/enemies';
import type { MissionDef, Behavior, EnemyKind, Layer } from '../../data/types';
import type { SecondaryHits } from '../../data/weapons';
import type { DropKind } from '../../game/combat';
import { emptyTally, type MissionTally } from '../../game/objectives';
import { generateTimeline, PF_H, PF_W, type SpawnEvent } from '../../game/waves';
import { Terrain } from '../../render/draw-terrain';
import { Particles } from '../../render/particles';
import { THEATERS } from '../../data/theaters';
import type { Boss } from './boss';

export { PF_W, PF_H };
export const PF_X = 320;
export const BASE_SCROLL = 70;

export interface Enemy {
  id: number;
  kind: EnemyKind;
  def: EnemyDef;
  layer: Layer;
  behavior: Behavior;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  hp: number;
  maxHp: number;
  radius: number;
  t: number;
  phase: number;
  fireT: number;
  fire2T: number;
  period: number;
  period2: number;
  bulletSpeedMul: number;
  bounty: number;
  flash: number;
  heading: number;
  aim: number;
  targetX: number;
  targetY: number;
  dead: boolean;
  counted: boolean;
}

export type BulletKind = 'gun' | 'enemy' | 'flak' | 'wingman';

export interface Bullet {
  kind: BulletKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  ttl: number;
  dead: boolean;
}

export type MissileKind = 'aim9' | 'aim54' | 'agm65' | 'rocket' | 'enemy';

export interface Missile {
  kind: MissileKind;
  x: number;
  y: number;
  heading: number;
  speed: number;
  maxSpeed: number;
  turnRate: number;
  damage: number;
  hits: SecondaryHits;
  target: Enemy | 'boss' | 'player' | null;
  decoy: Flare | null;
  ttl: number;
  dead: boolean;
}

export interface Bomb {
  x: number;
  y: number;
  t: number;
  damage: number;
  radius: number;
  dead: boolean;
}

export interface Flare {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl: number;
}

export interface Pickup {
  kind: DropKind;
  x: number;
  y: number;
  value: number;
  t: number;
  dead: boolean;
}

export interface Wreck {
  kind: EnemyKind;
  x: number;
  y: number;
}

/** All mutable state of a running mission (playfield-local coordinates). */
export class World {
  readonly timeline: SpawnEvent[];
  readonly terrain: Terrain;
  readonly particles = new Particles();
  enemies: Enemy[] = [];
  bullets: Bullet[] = [];
  missiles: Missile[] = [];
  bombs: Bomb[] = [];
  flares: Flare[] = [];
  pickups: Pickup[] = [];
  wrecks: Wreck[] = [];
  boss: Boss | null = null;
  tally: MissionTally = emptyTally();
  t = 0;
  nextEvent = 0;
  spawned = 0;
  collected = 0;
  scrollMul = 1;
  shake = 0;
  private ids = 0;

  constructor(readonly mission: MissionDef) {
    this.timeline = generateTimeline(mission);
    this.terrain = new Terrain(THEATERS[mission.theater], mission.number * 31 + 7);
  }

  nextId(): number {
    return ++this.ids;
  }

  get scrollSpeed(): number {
    return BASE_SCROLL * this.scrollMul;
  }

  addShake(amount: number): void {
    this.shake = Math.min(14, this.shake + amount);
  }

  /** Enemies still in play (on screen or about to enter). */
  liveEnemies(): number {
    return this.enemies.filter((e) => !e.dead && e.y > -60 && e.y < PF_H + 40).length;
  }

  sweep(): void {
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.bullets = this.bullets.filter((b) => !b.dead);
    this.missiles = this.missiles.filter((m) => !m.dead);
    this.bombs = this.bombs.filter((b) => !b.dead);
    this.flares = this.flares.filter((f) => f.ttl > 0);
    this.pickups = this.pickups.filter((p) => !p.dead);
    this.wrecks = this.wrecks.filter((w) => w.y < PF_H + 60);
  }
}
