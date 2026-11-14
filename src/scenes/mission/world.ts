import type { RoundsLook } from '../../data/heli-arms';
import type { Burn } from '../../game/ammo';
import type { EnemyDef } from '../../data/enemies';
import type { MissionDef, Behavior, EnemyKind, Layer } from '../../data/types';
import type { SecondaryHits } from '../../data/weapons';
import type { DropKind } from '../../game/combat';
import { emptyTally, type MissionTally } from '../../game/objectives';
import { generateTimeline, PF_H, PF_W, type SpawnEvent } from '../../game/waves';
import { Terrain } from '../../render/draw-terrain';
import { Particles } from '../../render/particles';
import { THEATERS, underwater } from '../../data/theaters';
import type { Boss } from './boss';
import { flightScroll } from '../../game/sub-flight';
import { canyonPlan, channel, type CanyonPlan, type Channel } from '../../game/canyon';
import type { Beam, Lance } from './mech-mission';
import type { Pulse, SonicWave, Zap } from './heli-arms';
import type { Decoy, Net } from './sub-arms';

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
  /** Stealth fighter: seconds it stays visible after firing (doc 44). */
  revealT: number;
  /** Incendiary burn still to deal (doc 45). */
  burn: Burn;
  /** Backfire: seconds to its next drone launch (doc 44). */
  escortT: number;
  /** Tracer rounds (doc 99): seconds it stays painted; stunned by the sonic wave: seconds it holds fire. */
  paintT: number;
  stun: number;
  /** Caught in a drift net (doc 101): seconds it stays slowed. */
  netT: number;
}

/** `cannon`: A-10 GAU-8 rounds (doc 36); `door`: the helicopters' door guns (doc 99). */
export type BulletKind = 'gun' | 'cannon' | 'enemy' | 'flak' | 'wingman' | 'door';

export interface Bullet {
  kind: BulletKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  ttl: number;
  dead: boolean;
  /** Player gun rounds: share of damage ground targets take (uranium ammo, doc 43); default 0.5. */
  ground?: number;
  /** Player gun rounds: share of a hit on a plane that burns on (incendiary ammo, doc 45). */
  burn?: number;
  /** Player gun rounds: the ammo loaded, for the tracer colour (docs 43, 45, 99). */
  rounds?: RoundsLook;
  /** The helicopters' rounds (doc 99): a hit burns ground targets too, paints the target, bursts onto others. */
  burnGround?: boolean;
  paint?: boolean;
  splash?: { share: number; radius: number } | null;
  /** The subs' bolts (doc 101): an electric hit arcs on; a cavitation bolt passes through `pierce` more, skipping `hit`. */
  chain?: { targets: number; reach: number; share: number; stun: number } | null;
  pierce?: number;
  hit?: number[];
  /** The spacecraft's laser bolts (doc 54). */
  laser?: boolean;
  /** The subs' harpoon bolts (doc 67). */
  harpoon?: boolean;
}

export type MissileKind =
  | 'aim9' | 'aim54' | 'aim120' | 'agm65' | 'hellfire' | 'stinger' | 'spacerocket' | 'torpedo' | 'mk48' | 'seeker' | 'rocket' | 'drone'
  | 'minitorp' | 'enemy';

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
  /** A mortar shell thrown ahead (px/s up the screen) instead of dropped (doc 79). */
  lob?: number;
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

/** A Bofors 40 mm HE shell (doc 46): flies straight up, bursts with `damage` over `radius`. */
export interface Shell {
  x: number;
  y: number;
  ttl: number;
  damage: number;
  radius: number;
  dead: boolean;
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
  shells: Shell[] = [];
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
  /** A jammer is on screen: radar static, player missiles turn slower (doc 44). */
  jammed = false;
  /** Tornado nuke climbing to its burst point, and the burst itself (doc 36); `t` counts up. */
  nuke: { x: number; y: number; t: number } | null = null;
  /** Mission-score measurements (doc 39): gun rounds fired / hitting, raw damage taken, pickups dropped / taken. */
  perf = { shots: 0, hits: 0, damage: 0, drops: 0, taken: 0 };
  blast: { x: number; y: number; t: number } | null = null;
  /** The Type 212's sonar ring running out from where it pinged (doc 67); `t` counts up. */
  sonar: { x: number; y: number; t: number } | null = null;
  /** The mechs (doc 80): the Strider's stomp ring, plasma lance bolts and rail beams. */
  stomp: { x: number; y: number; t: number } | null = null;
  lances: Lance[] = [];
  beams: Beam[] = [];
  /** The helicopters' arsenal (doc 99): laser bursts still firing, their beams' glow, sonic waves; the tracer's bonus and
   *  how long the boss stays painted. */
  pulses: Pulse[] = [];
  zaps: Zap[] = [];
  waves: SonicWave[] = [];
  /** The subs' decoy drone and drift nets (doc 101). */
  decoy: Decoy | null = null;
  nets: Net[] = [];
  paintBonus = 0;
  bossPaintT = 0;
  private ids = 0;

  /**
   * `mission` arrives with the pilot's challenge level already added to its difficulty; `ease` < 1 is Rookie: slower
   * enemy bullets and fire (doc 38).
   */
  /** A canyon run (doc 52): its plan, the scrolled distance where it began (null before), its length in px. */
  readonly canyon: CanyonPlan | null;
  canyonStart: number | null = null;
  canyonWarned = false;
  readonly canyonTotal: number;
  /** The helicopter hit a canyon wall (doc 52). */
  crashed = false;

  constructor(readonly mission: MissionDef, readonly ease = 1) {
    this.timeline = generateTimeline(mission);
    this.terrain = new Terrain(THEATERS[mission.theater], mission.number * 31 + 7);
    this.canyon = canyonPlan(mission);
    this.canyonTotal = (this.canyon?.seconds ?? 0) * BASE_SCROLL * flightScroll(mission.campaign);
    this.particles.underwater = underwater(THEATERS[mission.theater].terrain);
  }

  /** The canyon's channel at screen row `y`, or null where there is no gorge (doc 52). */
  canyonAt(y: number): Channel | null {
    if (this.canyonStart === null) return null;
    const d = this.terrain.travelled - y - this.canyonStart;
    return d < 0 || d > this.canyonTotal ? null : channel(d, this.canyonTotal);
  }

  nextId(): number {
    return ++this.ids;
  }

  /** Map 3 is flown low and slow by helicopters (doc 50), map 5 slower still by subs (doc 67). */
  get scrollSpeed(): number {
    return BASE_SCROLL * this.scrollMul * flightScroll(this.mission.campaign);
  }

  addShake(amount: number): void {
    this.shake = Math.min(14, this.shake + amount);
  }

  /** Something to shoot at is on screen: only then do fired rounds count against accuracy (doc 39). */
  targetsInView(): boolean {
    return !!this.boss?.active || this.enemies.some((e) => !e.dead && e.y > 0 && e.y < PF_H);
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
    this.shells = this.shells.filter((s) => !s.dead);
    this.flares = this.flares.filter((f) => f.ttl > 0);
    this.pickups = this.pickups.filter((p) => !p.dead);
    this.wrecks = this.wrecks.filter((w) => w.y < PF_H + 60);
  }
}
