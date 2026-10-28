import type { AudioEngine } from '../../core/audio';
import { ENEMIES, SEA_KINDS } from '../../data/enemies';
import type { Behavior, EnemyKind } from '../../data/types';
import { LOITER, loiter, STEALTH } from '../../game/adversaries';
import { scaleEnemy, steerHoming } from '../../game/combat';
import type { Player } from './player';
import { fireEnemyWeapon } from './weapons-fire';
import { PF_H, PF_W, type Enemy, type World } from './world';

export function spawnEnemy(world: World, kind: EnemyKind, x: number, behavior: Behavior, y = -50): Enemy {
  const def = ENEMIES[kind];
  const sc = scaleEnemy(def, world.mission.difficulty);
  const e: Enemy = {
    id: world.nextId(), kind, def, layer: def.layer, behavior, x, y, vx: 0, vy: def.speed * 0.7, baseX: x,
    hp: sc.hp, maxHp: sc.hp, radius: def.radius, t: 0, phase: Math.random() * Math.PI * 2,
    fireT: 0.8 + Math.random() * sc.period, fire2T: 1.5 + Math.random() * Math.max(1, sc.period2),
    period: sc.period / world.ease, period2: sc.period2 / world.ease, bulletSpeedMul: sc.bulletSpeedMul * world.ease, bounty: sc.bounty,
    flash: 0, heading: 0, aim: Math.PI, targetX: x, targetY: 160 + Math.random() * 120, dead: false, counted: false,
    revealT: 0, escortT: 3,
  };
  if (def.layer === 'ground') {
    e.y = y - def.radius;
    if (!SEA_KINDS.includes(kind)) world.terrain.addIsland(x, e.y, def.radius * 2.2 + 14);
  }
  world.enemies.push(e);
  world.spawned += 1;
  return e;
}

/** Dive: line up on the player for 0.9 s, then swoop through where they were. */
function dive(e: Enemy, p: Player, sp: number, dt: number): void {
  if (e.t < 0.9) {
    e.vx = 0;
    e.vy = sp * 0.55;
    e.targetX = p.x;
    e.targetY = p.y;
    return;
  }
  const h = steerHoming(Math.atan2(e.vx, -e.vy), e.x, e.y, e.targetX, e.targetY + 400, 1.4, dt);
  e.vx = Math.sin(h) * sp * 1.15;
  e.vy = -Math.cos(h) * sp * 1.15;
}

/** Strafe / hover: follow the player across the top of the screen for a while, then leave. */
function holdAndFollow(e: Enemy, p: Player, sp: number): void {
  const leaving = e.t > (e.behavior === 'strafe' ? 6 : 8);
  const follow = e.behavior === 'strafe' ? 0.9 : 0.5;
  e.vx = leaving ? 0 : (p.x - e.x) * follow;
  e.vy = leaving ? sp * 1.1 : (e.targetY - e.y) * 1.5;
  e.vx = Math.max(-sp, Math.min(sp, e.vx + Math.sin(e.t * 1.7 + e.phase) * 30));
}

function moveAir(e: Enemy, dt: number, p: Player): void {
  const sp = e.def.speed;
  switch (e.behavior) {
    case 'straight':
      e.vx = 0;
      e.vy = sp * 0.8;
      break;
    case 'sine':
      e.vy = sp * 0.65;
      e.vx = Math.cos(e.t * 2.2 + e.phase) * 2.2 * 70;
      break;
    case 'dive':
      dive(e, p, sp, dt);
      break;
    case 'swoop': {
      const side = e.baseX < PF_W / 2 ? 1 : -1;
      e.vy = sp * 0.75;
      e.vx = side * Math.sin(e.t * 1.3) * sp * 0.9;
      break;
    }
    case 'strafe':
    case 'hover':
      holdAndFollow(e, p, sp);
      break;
    case 'kamikaze': {
      if (p.stealthed) break; // lost the target: keeps flying straight (doc 36)
      const h = steerHoming(Math.atan2(e.vx, -e.vy || 1), e.x, e.y, p.x, p.y, 2.2, dt);
      e.vx = Math.sin(h) * sp;
      e.vy = -Math.cos(h) * sp;
      break;
    }
    case 'ground':
      e.vx = 0;
      e.vy = sp;
      break;
    case 'loiter':
      ({ vx: e.vx, vy: e.vy } = loiter(e.t, e.x, e.y, Math.min(e.targetY, 170), PF_W, sp, e.phase));
      break;
    default:
      throw new Error(`unhandled: ${e.behavior satisfies never}`);
  }
}

function fire(e: Enemy, dt: number, world: World, p: Player, audio: AudioEngine): void {
  const onScreen = e.y > 10 && e.y < PF_H - 120 && p.alive && !p.stealthed;
  e.fireT -= dt;
  if (e.def.weapon !== 'none' && e.fireT <= 0) {
    e.fireT = e.period * (0.8 + Math.random() * 0.4);
    if (onScreen) shoot(e, e.def.weapon, world, p, audio);
  }
  if (e.def.weapon2 !== 'none') {
    e.fire2T -= dt;
    if (e.fire2T <= 0) {
      e.fire2T = e.period2 * (0.8 + Math.random() * 0.4);
      if (onScreen) shoot(e, e.def.weapon2, world, p, audio);
    }
  }
}

/** Firing gives a stealth fighter away for a moment (doc 44). */
function shoot(e: Enemy, weapon: Enemy['def']['weapon'], world: World, p: Player, audio: AudioEngine): void {
  fireEnemyWeapon(world, e, weapon, p, audio);
  if (e.def.stealth) e.revealT = STEALTH.reveal;
}

/** The Backfire launches a drone every few seconds while it holds the top of the screen (doc 44). */
function launchEscort(e: Enemy, dt: number, world: World): void {
  if (e.behavior !== 'loiter' || e.t > LOITER.hold || e.y < 0) return;
  e.escortT -= dt;
  if (e.escortT > 0) return;
  e.escortT = LOITER.escortEvery;
  spawnEnemy(world, 'drone', e.x + (Math.random() < 0.5 ? -30 : 30), 'kamikaze', e.y + 20);
}

export function updateEnemies(world: World, p: Player, dt: number, audio: AudioEngine): void {
  const scroll = world.scrollSpeed;
  for (const e of world.enemies) {
    if (e.dead) continue;
    e.t += dt;
    e.flash = Math.max(0, e.flash - dt);
    if (e.layer === 'ground') {
      const drift = e.def.speed > 0 ? e.def.speed * 0.4 : 0;
      e.y += (scroll + drift) * dt;
      e.x += Math.sin(e.t * 0.6 + e.phase) * drift * 0.3 * dt;
      e.aim = Math.atan2(p.x - e.x, -(p.y - e.y));
    } else {
      moveAir(e, dt, p);
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      // A loitering bomber keeps its nose down while it drifts sideways (doc 44).
      e.heading = Math.atan2(-e.vx, e.behavior === 'loiter' ? Math.max(e.vy, 160) : e.vy);
    }
    e.revealT = Math.max(0, e.revealT - dt);
    fire(e, dt, world, p, audio);
    launchEscort(e, dt, world);
    if (e.y > PF_H + 80 || e.x < -120 || e.x > PF_W + 120 || e.y < -400) e.dead = true;
  }
}
