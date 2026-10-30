import type { AudioEngine } from '../../core/audio';
import { isAir } from '../../data/enemies';
import type { SecondaryHits } from '../../data/weapons';
import { isMiniBoss } from '../../data/reinforcements';
import { cloaked, JAM } from '../../game/adversaries';
import { applyDamage, circleHit, COLLISION_DAMAGE_TO_ENEMY, PLAYER_DAMAGE, rollDrop, steerHoming } from '../../game/combat';
import { setAlight, updateBurns } from './burn';
import { updateShells } from './shells';
import { PLAYER_RADIUS, type Player } from './player';
import { PF_H, PF_W, type Enemy, type Missile, type World } from './world';

export interface CombatHooks {
  audio: AudioEngine;
  onPlayerHit(amount: number): void;
}

const canHit = (hits: SecondaryHits, e: Enemy): boolean => hits === 'any' || (hits === 'air') === (e.layer === 'air');

/** `quiet`: no sound or shake of its own (the nuke kills the whole screen under one blast, doc 36). */
export function killEnemy(world: World, e: Enemy, audio: AudioEngine, quiet = false): void {
  if (e.dead) return;
  e.dead = true;
  const size = e.radius < 20 ? 'small' : e.radius < 45 ? 'large' : 'huge';
  world.particles.explosion(e.x, e.y, size, e.layer === 'ground');
  if (!quiet) {
    audio.play(size === 'small' ? 'explosionSmall' : 'explosionLarge', { pan: (e.x / PF_W) * 2 - 1 });
    world.addShake(size === 'small' ? 1.5 : 4);
  }
  world.collected += e.bounty;
  world.particles.popup(e.x, e.y - e.radius, `+$${e.bounty}`, '#5be37d');
  world.tally.kills += 1;
  if (isAir(e.kind)) world.tally.airKills += 1;
  world.tally.killsByKind[e.kind] = (world.tally.killsByKind[e.kind] ?? 0) + 1;
  if (e.layer === 'ground') world.wrecks.push({ kind: e.kind, x: e.x, y: e.y });
  const drop = rollDrop(Math.random());
  if (drop) world.perf.drops += 1;
  if (drop) world.pickups.push({ kind: drop, x: e.x, y: e.y, value: Math.max(25, Math.round(e.bounty * 0.5)), t: 0, dead: false });
  // A downed mini-boss always leaves a repair kit and a power-up (doc 44).
  if (isMiniBoss(e.kind)) for (const [kind, dx] of [['repair', -18], ['power', 18]] as const) world.pickups.push({ kind, x: e.x + dx, y: e.y, value: 0, t: 0, dead: false });
}

/** A stealth fighter the player cannot see: no missile lock, no radar contact (doc 44). */
export const hidden = (e: Enemy, p: Player): boolean => cloaked(!!e.def.stealth, e.revealT, Math.hypot(e.x - p.x, e.y - p.y));

export function damageEnemy(world: World, e: Enemy, amount: number, audio: AudioEngine): void {
  e.hp -= amount;
  e.flash = 0.06;
  if (e.hp <= 0) killEnemy(world, e, audio);
  else audio.play('hit', { volume: 0.25 });
}

function updatePlayerBullets(world: World, dt: number, audio: AudioEngine): void {
  for (const b of world.bullets) {
    if (b.dead || b.kind === 'enemy' || b.kind === 'flak') continue;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.y < -20 || b.x < -20 || b.x > PF_W + 20) {
      b.dead = true;
      continue;
    }
    for (const e of world.enemies) {
      if (e.dead || !circleHit(b.x, b.y, 4, e.x, e.y, e.radius)) continue;
      const dealt = applyDamage(b.damage, { source: b.kind === 'cannon' ? 'cannon' : 'gun', targetLayer: e.layer, ground: b.ground, armor: e.def.armor });
      damageEnemy(world, e, dealt, audio);
      setAlight(e, dealt, b.burn ?? 0);
      if (b.kind !== 'wingman') world.perf.hits += 1;
      world.particles.sparks(b.x, b.y, 2, '#fff2a8', 120);
      b.dead = true;
      break;
    }
    const boss = world.boss;
    const source = b.kind === 'cannon' ? 'cannon' : 'gun';
    if (!b.dead && boss && boss.hitAt(b.x, b.y, 4, applyDamage(b.damage, { source, targetLayer: boss.def.layer, ground: b.ground }), world, audio)) {
      if (b.kind !== 'wingman') world.perf.hits += 1;
      world.particles.sparks(b.x, b.y, 2, '#fff2a8', 120);
      b.dead = true;
    }
  }
}

function updateEnemyBullets(world: World, p: Player, dt: number, hooks: CombatHooks): void {
  for (const b of world.bullets) {
    if (b.dead || (b.kind !== 'enemy' && b.kind !== 'flak')) continue;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.ttl -= dt;
    if (b.kind === 'flak' && b.ttl <= 0) {
      b.dead = true;
      world.particles.explosion(b.x, b.y, 'small');
      hooks.audio.play('explosionSmall', { volume: 0.4 });
      if (p.alive && Math.hypot(p.x - b.x, p.y - b.y) < 42) hooks.onPlayerHit(applyDamage(PLAYER_DAMAGE.flak, { source: 'flak', ecm: p.stats.ecmBullet }));
      continue;
    }
    if (b.y > PF_H + 20 || b.y < -40 || b.x < -20 || b.x > PF_W + 20 || b.ttl <= 0) {
      b.dead = true;
      continue;
    }
    if (b.kind === 'enemy' && p.alive && circleHit(b.x, b.y, 4, p.x, p.y, PLAYER_RADIUS - 3)) {
      b.dead = true;
      hooks.onPlayerHit(applyDamage(PLAYER_DAMAGE.bullet, { source: 'enemyBullet', ecm: p.stats.ecmBullet }));
    }
  }
}

function pickTarget(world: World, m: Missile, p: Player): Missile['target'] {
  let best: Enemy | null = null;
  let bestD = Infinity;
  for (const e of world.enemies) {
    if (e.dead || !canHit(m.hits, e) || e.y > p.y || e.y < -20 || hidden(e, p)) continue;
    const d = Math.hypot(e.x - m.x, e.y - m.y);
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  const boss = world.boss;
  if (boss?.active && (m.hits === 'any' || (m.hits === 'air') === (boss.def.layer === 'air'))) {
    const a = boss.aimPoint();
    if (Math.hypot(a.x - m.x, a.y - m.y) < bestD) return 'boss';
  }
  return best;
}

function steerMissile(world: World, m: Missile, p: Player, dt: number): void {
  let tx: number | null = null;
  let ty = 0;
  if (m.decoy) {
    tx = m.decoy.x;
    ty = m.decoy.y;
  } else if (m.target === 'player') {
    if (p.alive && !p.stealthed) {
      tx = p.x;
      ty = p.y;
    }
  } else if (m.target === 'boss') {
    if (world.boss?.active) ({ x: tx, y: ty } = world.boss.aimPoint());
  } else if (m.target && !m.target.dead && !hidden(m.target, p)) {
    tx = m.target.x;
    ty = m.target.y;
  } else if (m.kind !== 'rocket') {
    m.target = pickTarget(world, m, p);
  }
  // Jamming confuses the player's seekers, not the enemy's (doc 44).
  const turn = m.kind !== 'enemy' && world.jammed ? m.turnRate * JAM.missileTurn : m.turnRate;
  if (tx !== null && turn > 0) m.heading = steerHoming(m.heading, m.x, m.y, tx, ty, turn, dt);
}

function updateMissiles(world: World, p: Player, dt: number, hooks: CombatHooks): void {
  for (const m of world.missiles) {
    if (m.dead) continue;
    m.ttl -= dt;
    m.speed = Math.min(m.maxSpeed, m.speed + 600 * dt);
    steerMissile(world, m, p, dt);
    m.x += Math.sin(m.heading) * m.speed * dt;
    m.y -= Math.cos(m.heading) * m.speed * dt;
    if (Math.random() < 0.7) world.particles.trail(m.x - Math.sin(m.heading) * 8, m.y + Math.cos(m.heading) * 8, m.kind === 'enemy' ? 'rgba(255,190,160,1)' : 'rgba(225,225,225,1)');
    if (m.ttl <= 0 || m.y < -60 || m.y > PF_H + 60 || m.x < -60 || m.x > PF_W + 60) {
      m.dead = true;
      continue;
    }
    if (m.kind === 'enemy') {
      if (m.decoy && Math.hypot(m.decoy.x - m.x, m.decoy.y - m.y) < 12) {
        m.dead = true;
        world.particles.explosion(m.x, m.y, 'small');
      } else if (p.alive && circleHit(m.x, m.y, 5, p.x, p.y, PLAYER_RADIUS)) {
        m.dead = true;
        world.particles.explosion(m.x, m.y, 'small');
        hooks.onPlayerHit(PLAYER_DAMAGE.missile);
      }
      continue;
    }
    missileHits(world, m, hooks.audio);
  }
}

function missileHits(world: World, m: Missile, audio: AudioEngine): void {
  for (const e of world.enemies) {
    if (e.dead || !canHit(m.hits, e) || !circleHit(m.x, m.y, 6, e.x, e.y, e.radius)) continue;
    m.dead = true;
    world.particles.explosion(m.x, m.y, 'small', e.layer === 'ground');
    damageEnemy(world, e, m.damage, audio);
    return;
  }
  const boss = world.boss;
  if (boss && (m.hits === 'any' || (m.hits === 'air') === (boss.def.layer === 'air')) && boss.hitAt(m.x, m.y, 6, m.damage, world, audio)) {
    m.dead = true;
    world.particles.explosion(m.x, m.y, 'large', boss.def.layer === 'ground');
    audio.play('explosionSmall');
  }
}

function updateBombs(world: World, dt: number, audio: AudioEngine): void {
  for (const b of world.bombs) {
    b.t += dt;
    b.y += (world.scrollSpeed - 110) * dt;
    if (b.t < 0.6) continue;
    b.dead = true;
    world.particles.explosion(b.x, b.y, 'large', true);
    audio.play('explosionLarge');
    world.addShake(5);
    for (const e of world.enemies) {
      if (!e.dead && e.layer === 'ground' && circleHit(b.x, b.y, b.radius, e.x, e.y, e.radius)) damageEnemy(world, e, b.damage, audio);
    }
    if (world.boss?.def.layer === 'ground') world.boss.hitAt(b.x, b.y, b.radius * 0.6, b.damage, world, audio);
  }
}

function playerCollisions(world: World, p: Player, hooks: CombatHooks): void {
  if (!p.alive) return;
  const ramming = p.specialActive > 0 && p.stats.plane.special === 'dash';
  for (const e of world.enemies) {
    if (e.dead || e.layer !== 'air' || !circleHit(p.x, p.y, PLAYER_RADIUS, e.x, e.y, e.radius * 0.8)) continue;
    if (ramming) {
      damageEnemy(world, e, 220, hooks.audio);
      continue;
    }
    if (p.invulnerable) continue;
    damageEnemy(world, e, COLLISION_DAMAGE_TO_ENEMY, hooks.audio);
    hooks.onPlayerHit(PLAYER_DAMAGE.collision);
  }
}

export function updateCombat(world: World, p: Player, dt: number, hooks: CombatHooks): void {
  updatePlayerBullets(world, dt, hooks.audio);
  updateEnemyBullets(world, p, dt, hooks);
  updateMissiles(world, p, dt, hooks);
  updateBombs(world, dt, hooks.audio);
  updateShells(world, dt, hooks.audio, (e, n) => damageEnemy(world, e, n, hooks.audio));
  updateBurns(world, dt, (e) => killEnemy(world, e, hooks.audio));
  for (const f of world.flares) {
    f.ttl -= dt;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.vx *= 1 - dt * 1.5;
  }
  playerCollisions(world, p, hooks);
}
