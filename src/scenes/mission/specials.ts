import type { AudioEngine } from '../../core/audio';
import { ENEMIES } from '../../data/enemies';
import { SECONDARIES } from '../../data/weapons';
import { weaponStats } from '../../game/arsenal';
import { longbowTargets } from '../../game/heli-flight';
import { SONAR, sonarHits, sonarRadius } from '../../game/sub-flight';
import { ageDrain, agingJet, CANNON, cannonDamage, NUKE } from '../../game/jets';
import type { Player } from './player';
import { damageEnemy, killEnemy } from './projectiles';
import type { WingmanRadio } from './radio';
import { GUN_SPEED, playerMissile } from './weapons-fire';
import { PF_H, type World } from './world';

// Every jet's E ability (docs 05, 36) — activation and what it does each tick — and the Tornado's age drain.

/** E pressed: starts the jet's special if it is charged. */
export function activateSpecial(world: World, p: Player, audio: AudioEngine, radio: WingmanRadio): void {
  const plane = p.stats.plane;
  if (!p.alive || p.specialCooldown > 0 || p.specialActive > 0) return;
  p.specialCooldown = plane.specialCooldown;
  p.specialActive = plane.specialDuration;
  switch (plane.special) {
    case 'roll':
      p.dashVX = (p.bank >= 0 ? 1 : -1) * 620;
      audio.play('special');
      break;
    case 'wingman':
      p.wingman = { x: p.x + 90, y: PF_H + 40, fireT: 0.5 };
      radio.special();
      audio.play('special');
      break;
    case 'dash':
      world.addShake(6);
      audio.play('special');
      break;
    case 'cannon':
      p.cannonT = 0;
      audio.play('cannon');
      break;
    case 'stealth':
      audio.play('stealth');
      break;
    case 'nuke':
      world.nuke = { x: p.x, y: p.y - 30, t: 0 };
      audio.play('nukeLaunch');
      break;
    case 'longbow':
      longbowSalvo(world, p, audio);
      break;
    case 'gunpods':
      p.powerTimer = Math.max(p.powerTimer, plane.specialDuration); // one gun level up, like a power-up (doc 51)
      audio.play('special');
      break;
    case 'armour':
    case 'jumpjet': // the leap runs in tickMech (doc 80)
      audio.play('special');
      break;
    case 'sonar':
      world.sonar = { x: p.x, y: p.y, t: 0 };
      audio.play('sonar');
      break;
    default:
      throw new Error(`unhandled: ${plane.special satisfies never}`);
  }
}

/** Apache Longbow Salvo (doc 50): a Hellfire for each of the nearest ground targets on screen, not from the stations;
 *  the mark of mounted Hellfires counts. No target: nothing fires and the special stays charged. */
function longbowSalvo(world: World, p: Player, audio: AudioEngine): void {
  const ground = world.enemies.filter((e) => !e.dead && ENEMIES[e.kind].layer === 'ground' && e.y > 0 && e.y < PF_H);
  const targets = longbowTargets(ground, p);
  if (targets.length === 0) {
    p.specialCooldown = 0;
    p.specialActive = 0;
    audio.play('denied');
    return;
  }
  const weapon = p.secondaries.find((s) => s.id === 'hellfire')?.weapon ?? weaponStats(SECONDARIES.hellfire, 1);
  targets.forEach((e, i) => {
    const m = playerMissile(p, 'hellfire', weapon, (i - (targets.length - 1) / 2) * 7, 0);
    world.missiles.push({ ...m, target: e });
  });
  audio.play('missile');
}

/** One tick of the running specials, the nuke in flight, the Tornado's age and a sub's bubble wake. */
export function tickSpecials(world: World, p: Player, dt: number, audio: AudioEngine): void {
  if (p.alive && p.stats.plane.kind === 'sub') wake(world, p, dt);
  if (p.wingman && p.specialActive <= 0) p.wingman = null;
  if (p.alive && p.specialActive > 0 && p.stats.plane.special === 'cannon') fireCannon(world, p, dt);
  flyNuke(world, dt, audio);
  runSonar(world, dt, audio);
  if (world.blast) {
    world.blast.t += dt;
    if (world.blast.t >= NUKE.burstSec) world.blast = null;
  }
  if (p.alive && agingJet(p.stats.plane.id)) p.hull = ageDrain(p.hull, p.maxHull, dt);
}

/** A-10 GAU-8: rounds straight ahead at its own rate, gun key or not, with a little recoil shake. */
function fireCannon(world: World, p: Player, dt: number): void {
  const damage = cannonDamage(p.stats.gunDamageMul);
  p.cannonT -= dt;
  while (p.cannonT <= 0) {
    p.cannonT += 1 / CANNON.roundsPerSec;
    const a = (Math.random() * 2 - 1) * CANNON.jitter;
    const v = GUN_SPEED * 1.15;
    world.bullets.push({ kind: 'cannon', x: p.x - 1, y: p.y - 34, vx: Math.sin(a) * v, vy: -Math.cos(a) * v, damage, ttl: 1, dead: false, burn: p.stats.gunBurn });
    if (world.targetsInView()) world.perf.shots += 1;
  }
  world.shake = Math.max(world.shake, 1.8);
}

/** Bubbles streaming from the sub's screw (doc 67), thicker when it pushes forward. */
function wake(world: World, p: Player, dt: number): void {
  if (Math.random() > dt * (14 + p.forward * 26)) return;
  world.particles.add({
    kind: 'smoke', x: p.x + (Math.random() - 0.5) * 5, y: p.y + 34, vx: (Math.random() - 0.5) * 16,
    vy: world.scrollSpeed * 0.7 + 50, max: 0.7 + Math.random() * 0.4, size: 2 + Math.random() * 3, grow: 2, drag: 0.6, color: '#fff',
  });
}

/** Type 212 Sonar Burst (doc 67): the ring wipes out the enemy shots it passes and hurts every enemy and boss part it
 *  reaches, once. */
function runSonar(world: World, dt: number, audio: AudioEngine): void {
  const s = world.sonar;
  if (!s) return;
  const r0 = sonarRadius(s.t);
  s.t += dt;
  const r1 = sonarRadius(s.t);
  for (const e of sonarHits(world.enemies.filter((x) => !x.dead), s, r0, r1)) damageEnemy(world, e, SONAR.damage, audio);
  for (const b of sonarHits(world.bullets, s, 0, r1)) if (b.kind === 'enemy' || b.kind === 'flak') b.dead = true;
  for (const m of sonarHits(world.missiles, s, 0, r1)) if (m.kind === 'enemy') m.dead = true;
  const boss = world.boss;
  if (boss && r1 > r0) {
    const at = boss.aimPoint();
    if (sonarHits([at], s, r0, r1).length > 0) boss.hitAt(at.x, at.y, 8, SONAR.damage, world, audio);
  }
  if (s.t >= SONAR.time + 0.25) world.sonar = null;
}

function flyNuke(world: World, dt: number, audio: AudioEngine): void {
  const n = world.nuke;
  if (!n) return;
  n.t += dt;
  n.y -= NUKE.climb * dt;
  world.particles.sparks(n.x, n.y + 12, 1, '#ffd38a', 60);
  if (n.t < NUKE.flightSec) return;
  world.nuke = null;
  detonate(world, n.x, n.y, audio);
}

/** The burst: every enemy on screen goes, every enemy shot with it; the boss loses a fifth (doc 36). */
function detonate(world: World, x: number, y: number, audio: AudioEngine): void {
  world.blast = { x, y, t: 0 };
  world.addShake(14);
  audio.play('nuke');
  world.particles.explosion(x, y, 'huge');
  for (const e of world.enemies) if (!e.dead && e.y > -40 && e.y < PF_H + 20) killEnemy(world, e, audio, true);
  for (const b of world.bullets) if (b.kind === 'enemy' || b.kind === 'flak') b.dead = true;
  for (const m of world.missiles) if (m.kind === 'enemy') m.dead = true;
  world.boss?.blast(world, audio);
}
