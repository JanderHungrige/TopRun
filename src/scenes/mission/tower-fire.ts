import type { AudioEngine } from '../../core/audio';
import type { TowerId, TowerLevel } from '../../data/towers';
import { TOWERS } from '../../data/towers';
import { headingTo } from '../../game/combat';
import { towerStats } from '../../game/defence';
import type { Defence } from './defence-mission';
import { damageEnemy } from './projectiles';
import { GUN_SPEED } from './weapons-fire';
import { PF_W, type Enemy, type World } from './world';

// The towers of a defence firing (doc 106): each picks the target nearest the outpost within its reach (the first in
// line), turns to it and fires its way — the MG nest's stream of rounds, the flak tower's bursts at fliers, the mortar's
// shells landing on the ground, the tesla's jumping zaps, the rocket battery's homing rockets; the jammer slows what is
// near it (defence-mission.ts). An overheated tower (a tripod's ray) holds fire.

export interface Tower {
  id: TowerId;
  pad: number;
  x: number;
  y: number;
  level: number;
  mark: number;
  stats: TowerLevel;
  cool: number;
  heat: number;
  aim: number;
}

/** What the towers leave in the air for a moment: tracer lines, zaps, a shell on its way, the jammer's pulse. */
export interface TowerFx { kind: 'zap' | 'flak' | 'shell' | 'pulse'; x0: number; y0: number; x1: number; y1: number; t: number }

const SHELL_TIME = 0.8;
const ZAP_JUMP = 70;

export function makeTower(id: TowerId, pad: number, at: { x: number; y: number }, mark: number): Tower {
  return { id, pad, x: at.x, y: at.y, level: 1, mark, stats: towerStats(id, 1, mark), cool: 0.3, heat: 0, aim: Math.PI };
}

const fits = (t: Tower, e: Enemy): boolean => {
  const reach = TOWERS[t.id].reach;
  return reach === 'any' || reach === e.layer;
};

function target(world: World, t: Tower): Enemy | null {
  let best: Enemy | null = null;
  const min = TOWERS[t.id].minRange ?? 0;
  for (const e of world.enemies) {
    if (e.dead || e.y < -10 || !fits(t, e)) continue;
    const d = Math.hypot(e.x - t.x, e.y - t.y);
    if (d > t.stats.range || d < min) continue;
    if (!best || e.y > best.y) best = e;
  }
  return best;
}

/** The boss, when no unit is in reach and it is. */
function bossInReach(world: World, t: Tower): { x: number; y: number } | null {
  const b = world.boss;
  if (!b?.active || TOWERS[t.id].reach === 'air') return null;
  return Math.hypot(b.x - t.x, b.y - t.y) <= t.stats.range + 60 ? { x: b.x, y: b.y } : null;
}

export function tickTowers(d: Defence, dt: number, audio: AudioEngine): void {
  const world = d.world;
  for (const t of d.towers) {
    if (!t) continue;
    t.heat = Math.max(0, t.heat - dt);
    t.cool -= dt;
    if (t.id === 'jammer') {
      if (t.cool <= 0) {
        t.cool = 1.4;
        d.fx.push({ kind: 'pulse', x0: t.x, y0: t.y, x1: t.x, y1: t.y, t: 0.6 });
      }
      continue;
    }
    if (t.heat > 0) continue;
    const e = target(world, t);
    const aimAt = e ?? bossInReach(world, t);
    if (!aimAt) continue;
    t.aim = headingTo(t.x, t.y, aimAt.x, aimAt.y);
    if (t.cool > 0) continue;
    t.cool = t.stats.period;
    fire(d, t, e, aimAt, audio);
  }
  for (const f of d.fx) f.t -= dt;
  landShells(d, audio);
  d.fx = d.fx.filter((f) => f.t > 0);
}

function fire(d: Defence, t: Tower, e: Enemy | null, at: { x: number; y: number }, audio: AudioEngine): void {
  const world = d.world;
  const pan = (t.x / PF_W) * 2 - 1;
  switch (t.id) {
    case 'mgnest':
      world.bullets.push({
        kind: 'wingman', x: t.x + Math.sin(t.aim) * 12, y: t.y - Math.cos(t.aim) * 12, vx: Math.sin(t.aim) * GUN_SPEED,
        vy: -Math.cos(t.aim) * GUN_SPEED, damage: t.stats.damage, ttl: 1, dead: false, ground: 1,
      });
      return;
    case 'flak':
      burst(world, at, t.stats, 'air', audio);
      d.fx.push({ kind: 'flak', x0: t.x, y0: t.y, x1: at.x, y1: at.y, t: 0.12 });
      return;
    case 'mortarpit':
      d.fx.push({ kind: 'shell', x0: t.x, y0: t.y, x1: at.x, y1: at.y, t: SHELL_TIME });
      audio.play('bofors', { volume: 0.4, pan });
      return;
    case 'tesla':
      zap(d, t, e, at, audio);
      return;
    case 'rockets':
      for (let k = 0; k < (t.stats.rockets ?? 2); k++) {
        world.missiles.push({
          kind: 'seeker', x: t.x + (k - 1) * 5, y: t.y - 8, heading: t.aim + (k - 1) * 0.25, speed: 160, maxSpeed: 470, turnRate: 3.6,
          damage: t.stats.damage, hits: 'any', target: e ?? 'boss', decoy: null, ttl: 3, dead: false,
        });
      }
      audio.play('missile', { volume: 0.4, pan });
      return;
    case 'jammer':
      return;
    default:
      throw new Error(`unhandled: ${t.id satisfies never}`);
  }
}

/** A blast at a point: every enemy of the layer within the radius, and the boss. */
function burst(world: World, at: { x: number; y: number }, s: TowerLevel, layer: 'air' | 'ground', audio: AudioEngine): void {
  const r = s.radius ?? 40;
  for (const e of world.enemies) if (!e.dead && e.layer === layer && Math.hypot(e.x - at.x, e.y - at.y) <= r + e.radius * 0.5) damageEnemy(world, e, s.damage, audio);
  if (layer === 'ground') world.boss?.hitAt(at.x, at.y, r, s.damage, world, audio);
  world.particles.explosion(at.x, at.y, 'small', layer === 'ground');
}

function zap(d: Defence, t: Tower, first: Enemy | null, at: { x: number; y: number }, audio: AudioEngine): void {
  const world = d.world;
  let from = { x: t.x, y: t.y - 18 };
  if (!first) {
    world.boss?.hitAt(at.x, at.y, 12, t.stats.damage, world, audio);
    d.fx.push({ kind: 'zap', x0: from.x, y0: from.y, x1: at.x, y1: at.y, t: 0.15 });
    return;
  }
  const hit: Enemy[] = [first];
  for (let k = 1; k < (t.stats.jumps ?? 3); k++) {
    const last = hit[hit.length - 1]!;
    const next = world.enemies.find((e) => !e.dead && !hit.includes(e) && Math.hypot(e.x - last.x, e.y - last.y) <= ZAP_JUMP);
    if (!next) break;
    hit.push(next);
  }
  for (const e of hit) {
    d.fx.push({ kind: 'zap', x0: from.x, y0: from.y, x1: e.x, y1: e.y, t: 0.15 });
    from = { x: e.x, y: e.y };
    damageEnemy(world, e, t.stats.damage, audio);
  }
  audio.play('hit', { volume: 0.35 });
}

/** Mortar shells come down where they were aimed. */
function landShells(d: Defence, audio: AudioEngine): void {
  for (const f of d.fx) {
    if (f.kind !== 'shell' || f.t > 0) continue;
    const t = d.towers.find((x) => x?.id === 'mortarpit' && x.x === f.x0 && x.y === f.y0);
    burst(d.world, { x: f.x1, y: f.y1 }, t?.stats ?? towerStats('mortarpit', 1), 'ground', audio);
    audio.play('explosionSmall', { volume: 0.4, pan: (f.x1 / PF_W) * 2 - 1 });
  }
}
