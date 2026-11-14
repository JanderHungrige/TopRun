import type { AudioEngine } from '../../core/audio';
import { ENEMIES } from '../../data/enemies';
import type { TowerId } from '../../data/towers';
import type { Behavior, EnemyKind } from '../../data/types';
import {
  BOSS_SHELLING, COUNTDOWN, defenceWaves, killSupply, leakDamage, OUTPOST_HEALTH, startSupply, unitTime, waveSupply, type Wave,
} from '../../game/defence';
import { defenceLayout, distToLane, OUTPOST_Y, pointOnLane, type DefenceLayout } from '../../game/defence-layout';
import { mapTwoHp } from '../../game/map-two';
import { Boss } from './boss';
import { spawnEnemy } from './enemy-ai';
import { tickTowers, type Tower, type TowerFx } from './tower-fire';
import type { Enemy, World } from './world';

// A defence on map 7 (doc 106): the outpost's health and supply, the countdown and the waves, the army marching down its
// lanes, the units that get through, the boss after the last wave. The towers fire in tower-fire.ts, the controls are in
// defence-input.ts, the drawing in render/defence-*.ts.

export type DefenceEvent = 'wave' | 'lastWave' | 'held' | 'boss' | 'leak' | 'half' | 'quarter' | 'lost';

interface Pending { kind: EnemyKind; lane: number; t: number }
interface March { lane: number; s: number }

const RAY_REACH = 260;
/** A defence's boss comes down to here, into the towers' reach. */
const SIEGE_Y = 330;
const OVERHEAT = 3;

/** March speed down a lane (px/s). */
const marchSpeed = (e: Enemy): number => 0.35 * e.def.speed + 22;

export class Defence {
  readonly layout: DefenceLayout;
  readonly waves: readonly Wave[];
  readonly towers: (Tower | null)[];
  supply: number;
  health = OUTPOST_HEALTH;
  /** Waves started so far; the one running is `wave` (1-based) while `countdown` is null. */
  wave = 0;
  countdown: number | null = COUNTDOWN.first;
  waveT = 0;
  pick: TowerId = 'mgnest';
  /** A pad whose ring of buttons is open (mouse / touch), or −1. */
  menuPad = -1;
  /** The last supply gain, for the HUD's flash; the towers' shots in the air. */
  gain = { n: 0, t: 0 };
  fx: TowerFx[] = [];
  /** Units that got through (for the debrief's numbers and the playtest). */
  leaks = 0;
  private pending: Pending[] = [];
  private readonly marching = new Map<number, March>();
  private readonly counted: Partial<Record<EnemyKind, number>> = {};
  private bossDone = false;
  private warned = { half: false, quarter: false, lost: false };

  constructor(readonly world: World, readonly known: readonly TowerId[], readonly marks: (id: TowerId) => number) {
    this.layout = defenceLayout(world.mission);
    this.waves = defenceWaves(world.mission, this.layout.lanes.length);
    this.towers = this.layout.pads.map(() => null);
    this.supply = startSupply(world.mission.defend ?? 0);
    this.pick = known[0] ?? 'mgnest';
  }

  get total(): number {
    return this.waves.length;
  }

  /** Half the time a tripod's ray picks the nearest tower within reach (doc 106). */
  rayTarget(from: { x: number; y: number }): { x: number; y: number } | null {
    if (Math.random() < 0.5) return null;
    let best: Tower | null = null;
    for (const t of this.towers) if (t && Math.hypot(t.x - from.x, t.y - from.y) <= RAY_REACH && (!best || t.y > best.y)) best = t;
    return best;
  }

  marches(id: number): boolean {
    return this.marching.has(id);
  }

  earn(n: number): void {
    this.supply += n;
    this.gain = { n: this.gain.t > 0 ? this.gain.n + n : n, t: 1.2 };
  }

  /** Calls the next wave now: supply for every second left. */
  callNow(bonus: number): void {
    if (this.countdown === null) return;
    this.earn(bonus);
    this.countdown = 0;
  }

  tick(dt: number, audio: AudioEngine): DefenceEvent[] {
    const out: DefenceEvent[] = [];
    this.gain.t = Math.max(0, this.gain.t - dt);
    if (this.countdown !== null) {
      this.countdown -= dt;
      if (this.countdown <= 0) out.push(...this.startWave());
    } else {
      this.waveT += dt;
      this.spawnDue();
    }
    this.march(dt, out);
    this.overheat();
    this.payKills();
    tickTowers(this, dt, audio);
    if (this.countdown === null && this.cleared()) out.push(...this.hold());
    this.shelling(dt);
    this.alarms(out);
    return out;
  }

  private startWave(): DefenceEvent[] {
    this.countdown = null;
    this.wave += 1;
    this.waveT = 0;
    const w = this.waves[this.wave - 1];
    this.pending = (w?.groups ?? []).flatMap((g) => Array.from({ length: g.count }, (_, i) => ({ kind: g.kind, lane: g.lane, t: unitTime(g, i) })));
    return this.wave === this.total ? ['wave', 'lastWave'] : ['wave'];
  }

  private spawnDue(): void {
    while (this.pending.length > 0 && (this.pending[0]?.t ?? 0) <= this.waveT) {
      const u = this.pending.shift();
      if (!u) break;
      const lane = this.layout.lanes[u.lane] ?? this.layout.lanes[0];
      if (!lane) continue;
      const at = pointOnLane(lane, 0);
      const def = ENEMIES[u.kind];
      const behavior: Behavior = def.layer === 'ground' ? 'ground' : def.behaviors[0] ?? 'straight';
      const e = spawnEnemy(this.world, u.kind, at.x, behavior, def.layer === 'ground' ? 0 : -40);
      if (def.layer === 'ground') this.marching.set(e.id, { lane: u.lane, s: 0 });
    }
  }

  /** Ground units walk their lane (slowed by jammers), units through the gate hit the outpost. */
  private march(dt: number, out: DefenceEvent[]): void {
    for (const e of this.world.enemies) {
      if (e.dead) continue;
      if (e.layer === 'air') {
        if (e.y > OUTPOST_Y + 20) this.leak(e, out);
        continue;
      }
      const m = this.marching.get(e.id) ?? this.adopt(e);
      if (!m) continue;
      const lane = this.layout.lanes[m.lane];
      if (!lane) continue;
      m.s += marchSpeed(e) * this.slowAt(e) * dt;
      const at = pointOnLane(lane, m.s);
      e.x = at.x;
      e.y = at.y;
      e.heading = at.heading;
      if (m.s >= lane.length) this.leak(e, out);
    }
  }

  /** A unit on the ground that was let out by a spawner joins the nearest lane where it stands. */
  private adopt(e: Enemy): March | null {
    if (e.def.speed <= 0) return null;
    let best = 0;
    this.layout.lanes.forEach((l, i) => { if (distToLane(e, l) < distToLane(e, this.layout.lanes[best]!)) best = i; });
    const lane = this.layout.lanes[best];
    if (!lane) return null;
    let s = 0;
    let d = Infinity;
    for (let x = 0; x <= lane.length; x += 12) {
      const p = pointOnLane(lane, x);
      const dd = Math.hypot(p.x - e.x, p.y - e.y);
      if (dd < d) [d, s] = [dd, x];
    }
    const m = { lane: best, s };
    this.marching.set(e.id, m);
    return m;
  }

  private slowAt(e: Enemy): number {
    let k = 1;
    for (const t of this.towers) if (t && t.id === 'jammer' && t.heat <= 0 && Math.hypot(t.x - e.x, t.y - e.y) <= t.stats.range) k = Math.min(k, 1 - (t.stats.slow ?? 0));
    return k;
  }

  private leak(e: Enemy, out: DefenceEvent[]): void {
    e.dead = true;
    this.leaks += 1;
    this.marching.delete(e.id);
    this.health = Math.max(0, this.health - leakDamage(e.def));
    this.world.addShake(3);
    this.world.particles.explosion(e.x, Math.min(e.y, OUTPOST_Y + 10), 'small', true);
    out.push('leak');
  }

  /** A heat-ray bolt that hits a tower overheats it. */
  private overheat(): void {
    for (const b of this.world.bullets) {
      if (b.dead || !b.heat) continue;
      const t = this.towers.find((x) => x && Math.hypot(x.x - b.x, x.y - b.y) < 15);
      if (!t) continue;
      t.heat = OVERHEAT;
      b.dead = true;
    }
  }

  private payKills(): void {
    const by = this.world.tally.killsByKind;
    for (const k of Object.keys(by) as EnemyKind[]) {
      const n = (by[k] ?? 0) - (this.counted[k] ?? 0);
      if (n > 0) this.earn(n * killSupply(ENEMIES[k]));
      this.counted[k] = by[k] ?? 0;
    }
  }

  private cleared(): boolean {
    return this.pending.length === 0 && !this.world.enemies.some((e) => !e.dead) && this.world.brood.length === 0;
  }

  private hold(): DefenceEvent[] {
    const tally = this.world.tally;
    if (tally.wavesHeld >= this.wave) return [];
    tally.wavesHeld = this.wave;
    this.earn(waveSupply(this.wave));
    if (this.wave < this.total) {
      this.countdown = COUNTDOWN.between;
      return ['held'];
    }
    const boss = this.world.mission.objective.type === 'boss' ? this.world.mission.objective.boss : null;
    if (!boss || this.bossDone) return ['held'];
    this.bossDone = true;
    const w = this.world;
    w.boss = new Boss(boss, w.mission.difficulty, w.ease, mapTwoHp(w.mission.number));
    w.boss.settleY = SIEGE_Y;
    return ['held', 'boss'];
  }

  /** The boss shells the outpost while it fights. */
  private shelling(dt: number): void {
    const b = this.world.boss;
    if (b?.phase === 'fight') this.health = Math.max(0, this.health - BOSS_SHELLING * dt);
  }

  private alarms(out: DefenceEvent[]): void {
    if (!this.warned.half && this.health < OUTPOST_HEALTH / 2) {
      this.warned.half = true;
      out.push('half');
    }
    if (!this.warned.quarter && this.health < OUTPOST_HEALTH / 4) {
      this.warned.quarter = true;
      out.push('quarter');
    }
    if (!this.warned.lost && this.health <= 0) {
      this.warned.lost = true;
      this.world.tally.outpostLost = true;
      out.push('lost');
    }
  }
}
