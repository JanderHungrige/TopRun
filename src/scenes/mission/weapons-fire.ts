import type { AudioEngine } from '../../core/audio';
import type { EnemyWeapon, SecondaryId } from '../../data/types';
import { jetGunDef, SECONDARIES, type WeaponRole } from '../../data/weapons';
import { slotFor } from '../../game/loadout';
import { headingTo } from '../../game/combat';
import { RING_SPIN, RING_SPORES, ringHeadings } from '../../game/spores';
import { RAY } from '../../game/steppe-army';
import type { WeaponStats } from '../../game/arsenal';
import type { Player } from './player';
import { fireHe } from './shells';
import { fireBeam, fireLance, lobShell } from './mech-mission';
import { firePulse, gunRounds, gunSwivel, launchSwarm, roundSpeed } from './heli-arms';
import { fireWave } from './heli-waves';
import { aimTarget, launchDecoy, throwNet } from './sub-arms';
import { fireChain, fireFlame, layMine } from './tank-weapons';
import { spinRate } from '../../game/heli-combat';
import type { Missile, World } from './world';

export const GUN_SPEED = 900;

export function firePlayerGun(world: World, p: Player, audio: AudioEngine): void {
  p.triggered = true;
  fireSecondGun(world, p);
  fireHe(world, p, audio);
  if (p.gunCooldown > 0) return;
  const gun = p.gun;
  const gatling = p.stats.arms?.gatling; // the Gatling Drive fires faster as its barrels spin up (doc 99)
  p.gunCooldown = 1 / (gun.shotsPerSec * (gatling ? spinRate(p.spin, gatling.mul) : 1));
  const damage = gun.damage * p.stats.gunDamageMul;
  const swivel = gunSwivel(world, p);
  const speed = GUN_SPEED * roundSpeed(p);
  for (const b of gun.pattern) {
    const a = b.angle + swivel;
    world.bullets.push({
      kind: 'gun', x: p.x + b.dx, y: p.y - 24, vx: Math.sin(a) * speed, vy: -Math.cos(a) * speed,
      damage, ttl: 1, dead: false, ...gunRounds(p), laser: !!p.stats.ship,
    });
  }
  if (world.targetsInView()) world.perf.shots += gun.pattern.length;
  audio.play('gun', { volume: 0.5, pan: (p.x / 320 - 1) * 0.5, pitch: 1 + p.spin * 0.12 });
}

/** Second gun of the new jets (doc 37): its own level, from the wing roots, alternating left and right. */
function fireSecondGun(world: World, p: Player): void {
  const level = p.gun2Level;
  if (level <= 0 || p.gun2Cooldown > 0) return;
  const gun = jetGunDef(level, true);
  p.gun2Cooldown = 1 / gun.shotsPerSec;
  p.gun2Side *= -1;
  const damage = gun.damage * p.stats.gunDamageMul;
  for (const b of gun.pattern) {
    world.bullets.push({
      kind: 'gun', x: p.x + p.gun2Side * 13 + b.dx * 0.6, y: p.y - 12, vx: Math.sin(b.angle) * GUN_SPEED,
      vy: -Math.cos(b.angle) * GUN_SPEED, damage, ttl: 1, dead: false, ...gunRounds(p),
    });
  }
  if (world.targetsInView()) world.perf.shots += gun.pattern.length;
}

export function fireWingman(world: World, p: Player, dt: number): void {
  const w = p.wingman;
  if (!w) return;
  w.x += (p.x + 70 - w.x) * Math.min(1, dt * 4);
  w.y += (p.y + 30 - w.y) * Math.min(1, dt * 4);
  w.fireT -= dt;
  if (w.fireT > 0) return;
  w.fireT = 0.11;
  for (const dx of [-6, 6]) {
    world.bullets.push({ kind: 'wingman', x: w.x + dx, y: w.y - 22, vx: 0, vy: -GUN_SPEED, damage: 10, ttl: 1, dead: false });
  }
}

/** A player missile or rocket with the numbers of its weapon's mark (doc 43). */
export function playerMissile(p: Player, kind: Missile['kind'], w: WeaponStats, dx: number, heading: number): Missile {
  if (kind === 'enemy') throw new Error('not a player missile');
  const hits = SECONDARIES[kind === 'rocket' ? 'rockets' : kind === 'drone' ? 'drones' : kind === 'minitorp' ? 'torpswarm' : kind].hits;
  return {
    kind, x: p.x + dx, y: p.y - 6, heading, speed: kind === 'rocket' ? w.speed : 180, maxSpeed: w.speed,
    turnRate: w.turnRate, damage: w.damage, hits, target: null, decoy: null, ttl: 3.2, dead: false,
  };
}

const homingKind = (id: SecondaryId): Missile['kind'] | null =>
  (id === 'aim9' || id === 'aim54' || id === 'aim120' || id === 'agm65' || id === 'hellfire' || id === 'stinger' || id === 'spacerocket'
    || id === 'torpedo' || id === 'mk48' || id === 'seeker' || id === 'aarocket' || id === 'atgm' ? id : null);

/**
 * AIR or GROUND key: fires the picked ground weapon, else the first of that role with ammo (doc 05). Twin pods
 * (doc 37) launch both at once. False when nothing fired.
 */
export function fireSecondary(world: World, p: Player, audio: AudioEngine, role: WeaponRole): boolean {
  const slot = p.secondaries[slotFor(p.secondaries, role, role === 'ground' ? p.groundPick : -1)];
  if (!slot || slot.ammo <= 0 || p.secCooldown > 0) return false;
  const def = SECONDARIES[slot.id];
  const pods = slot.twin && slot.ammo >= 2 ? [-1, 1] : [0];
  slot.ammo -= pods.length;
  p.spent[slot.id] = (p.spent[slot.id] ?? 0) + pods.length;
  p.firedSecondary = true;
  p.secCooldown = def.cooldown;
  p.sideToggle *= -1;
  switch (def.behavior) {
    case 'homing': {
      const kind = homingKind(slot.id);
      for (const s of pods) if (kind) world.missiles.push(playerMissile(p, kind, slot.weapon, s === 0 ? 12 * p.sideToggle : 12 * s, 0));
      audio.play('missile');
      break;
    }
    case 'fan':
      for (const s of pods) for (let i = -2; i <= 2; i++) world.missiles.push(playerMissile(p, 'rocket', slot.weapon, s * 10 + i * 4, i * 0.09));
      audio.play('rocket');
      break;
    case 'bomb':
      for (const s of pods) world.bombs.push({ x: p.x + s * 16, y: p.y, t: 0, damage: slot.weapon.damage, radius: slot.weapon.radius, dead: false });
      audio.play('bombDrop');
      break;
    case 'lob':
      for (const s of pods) lobShell(world, p, slot.weapon, s * 14 + 10 * p.sideToggle);
      audio.play('cannon');
      break;
    case 'lance':
      for (const s of pods) fireLance(world, p, slot.weapon, s * 14 + 12 * p.sideToggle);
      audio.play('special');
      break;
    case 'beam':
      for (const s of pods) fireBeam(world, p, slot.weapon, s * 14 + 12 * p.sideToggle, audio);
      audio.play('nukeLaunch', { volume: 0.5 });
      break;
    case 'pulse':
      firePulse(world, slot.weapon, 8 * p.sideToggle);
      break;
    case 'wave':
      fireWave(world, p, slot.weapon, slot.id === 'sonarpulse');
      audio.play(slot.id === 'sonarpulse' ? 'sonar' : 'sonic', { volume: 0.7 });
      break;
    case 'swarm':
    case 'torps':
      launchSwarm(world, p, slot.weapon, 10 * p.sideToggle, def.behavior === 'torps');
      audio.play('drones');
      break;
    case 'decoy':
      launchDecoy(world, p);
      audio.play('drones', { pitch: 0.7 });
      break;
    case 'net':
      throwNet(world, p, slot.weapon);
      audio.play('splash', { volume: 0.5 });
      break;
    case 'mine': // the tanks' (doc 108)
      layMine(world, p, slot.weapon);
      audio.play('bombDrop', { volume: 0.6 });
      break;
    case 'flame':
      fireFlame(world, p, slot.weapon, audio);
      break;
    case 'chain':
      fireChain(world, p, slot.weapon, audio);
      break;
    default:
      throw new Error(`unhandled: ${def.behavior satisfies never}`);
  }
  return true;
}

export function dropFlare(world: World, p: Player, audio: AudioEngine): void {
  if (p.flares <= 0) return;
  p.flares -= 1;
  for (const side of [-1, 1]) world.flares.push({ x: p.x, y: p.y + 10, vx: side * 90, vy: 40, ttl: 2.5 });
  for (const m of world.missiles) {
    if (m.kind === 'enemy' && Math.hypot(m.x - p.x, m.y - p.y) < 260) m.decoy = world.flares[world.flares.length - 1] ?? null;
  }
  audio.play('flare');
}

export interface FireSource {
  x: number;
  y: number;
  bulletSpeedMul: number;
  /** The source's age (s): turns the spore ring (doc 96). */
  t?: number;
}

function enemyBullet(world: World, s: FireSource, heading: number, speed: number, damage: number, heat = false): void {
  world.bullets.push({
    kind: 'enemy', x: s.x, y: s.y, vx: Math.sin(heading) * speed * s.bulletSpeedMul, vy: -Math.cos(heading) * speed * s.bulletSpeedMul,
    damage, ttl: 5, dead: false, ...(heat ? { heat } : {}),
  });
}

/** A ring of n spores round the source, slower and weaker than a bullet (doc 96). */
export function fireRing(world: World, s: FireSource, n: number, turn: number): void {
  for (const h of ringHeadings(n, turn)) enemyBullet(world, s, h, 150, 6);
}

/** Fires an enemy weapon from a source at the player. */
export function fireEnemyWeapon(world: World, s: FireSource, weapon: EnemyWeapon, p: Player, audio: AudioEngine): void {
  const tower = weapon === 'ray' ? world.defence?.rayTarget(s) : null; // a tripod's ray goes for a tower half the time (doc 106)
  const at = tower ?? aimTarget(world, s, p); // the subs' decoy drone draws the aim (doc 101)
  const aim = headingTo(s.x, s.y, at.x, at.y);
  switch (weapon) {
    case 'none': return;
    case 'single': enemyBullet(world, s, Math.PI, 230, 8); break;
    case 'aimed': enemyBullet(world, s, aim, 250, 8); break;
    case 'spread3':
      for (const d of [-0.26, 0, 0.26]) enemyBullet(world, s, aim + d, 215, 8);
      break;
    case 'missile':
      world.missiles.push({
        kind: 'enemy', x: s.x, y: s.y, heading: aim, speed: 150, maxSpeed: 250 * s.bulletSpeedMul,
        turnRate: 1.7 * p.stats.ecmTurn, damage: 22, hits: 'air', target: 'player', decoy: null, ttl: 5, dead: false,
      });
      audio.play('enemyMissile', { volume: 0.6 });
      return;
    case 'ring':
      fireRing(world, s, RING_SPORES, (s.t ?? 0) * RING_SPIN);
      break;
    case 'ray': // a tripod's heat ray (doc 105): six bolts in a line, like a beam travelling
      for (let k = 0; k < RAY.bolts; k++) {
        enemyBullet(world, { ...s, x: s.x + Math.sin(aim) * k * RAY.gap, y: s.y - Math.cos(aim) * k * RAY.gap }, aim, RAY.speed, RAY.damage, true);
      }
      break;
    case 'flak': {
      const dist = Math.hypot(at.x - s.x, at.y - s.y);
      const speed = 300 * s.bulletSpeedMul;
      world.bullets.push({ kind: 'flak', x: s.x, y: s.y, vx: Math.sin(aim) * speed, vy: -Math.cos(aim) * speed, damage: 12, ttl: dist / speed, dead: false });
      break;
    }
    default:
      throw new Error(`unhandled: ${weapon satisfies never}`);
  }
  audio.play('enemyShot', { volume: 0.35 });
}
