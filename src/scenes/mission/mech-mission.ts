import type { AudioEngine } from '../../core/audio';
import { clamp } from '../../core/math';
import { circleHit } from '../../game/combat';
import { footfall, gaitPhase, leapHeight, STOMP, stompRadius } from '../../game/mech-walk';
import { sonarHits } from '../../game/sub-flight';
import type { WeaponStats } from '../../game/arsenal';
import type { Player } from './player';
import { damageEnemy } from './projectiles';
import { PF_H, type World } from './world';

// The mechs in the mission (docs 79, 80): the gait and its footprints, the Strider's leap and stomp, and the three mech
// weapons that are neither missiles nor rockets — the mortar's lobbed shells (bombs thrown ahead), the plasma lance's
// bolts that burn through everything, the rail cannon's beam up the whole screen.

/** A plasma lance bolt: flies straight up, hurts each enemy it passes through once. */
export interface Lance { x: number; y: number; vy: number; damage: number; hit: number[]; boss: boolean; ttl: number; dead: boolean }
/** A rail beam's afterglow (the damage is dealt the moment it fires). */
export interface Beam { x: number; y: number; t: number }

/** The leap's forward travel (px over the whole jump) and the mortar shell's throw (px/s up the screen). */
const LEAP_TRAVEL = 150;
export const LOB_SPEED = 430;

/** One tick of a mech: the gait runs on with the floor walked, a foot coming down leaves a print; the leap carries the
 *  Strider forward and ends in a stomp. */
export function tickMech(world: World, p: Player, dt: number, audio: AudioEngine): void {
  runStomp(world, dt, audio);
  updateMechShots(world, dt, audio);
  if (!p.alive || p.stats.plane.kind !== 'mech') return;
  const leaping = p.specialActive > 0 && p.stats.plane.special === 'jumpjet';
  if (leaping) {
    const dur = p.stats.plane.specialDuration;
    p.leap = leapHeight(1 - p.specialActive / dur);
    p.y = clamp(p.y - (LEAP_TRAVEL / dur) * dt, 70, PF_H - 40);
    p.jumping = true;
    return;
  }
  p.leap = 0;
  if (p.jumping) {
    p.jumping = false;
    world.stomp = { x: p.x, y: p.y, t: 0 };
    world.addShake(7);
    world.particles.explosion(p.x, p.y + 6, 'large', true);
    audio.play('explosionLarge', { volume: 0.6 });
  }
  const before = gaitPhase(p.walked);
  p.walked += (world.scrollSpeed + Math.max(0, -p.drift.y) + Math.abs(p.drift.x) * 0.5) * dt;
  p.stride = gaitPhase(p.walked);
  if (!footfall(before, p.stride)) return;
  const side = Math.floor(p.stride) % 2 === 0 ? -1 : 1;
  const size = p.stats.plane.id === 'titan' ? 5 : p.stats.plane.id === 'hornet' ? 3 : 4;
  world.terrain.prints.add(p.x + side * size * 2.2, p.y + 8, size);
  if (p.stats.plane.id === 'titan') world.addShake(1.2);
}

/** The stomp's ring: everything it reaches takes the stomp's damage once, enemy shots in it are swept away. */
export function runStomp(world: World, dt: number, audio: AudioEngine): void {
  const s = world.stomp;
  if (!s) return;
  const r0 = stompRadius(s.t);
  s.t += dt;
  const r1 = stompRadius(s.t);
  for (const e of sonarHits(world.enemies.filter((x) => !x.dead), s, r0, r1)) damageEnemy(world, e, STOMP.damage, audio);
  for (const b of sonarHits(world.bullets, s, 0, r1)) if (b.kind === 'enemy' || b.kind === 'flak') b.dead = true;
  if (s.t >= STOMP.time + 0.3) world.stomp = null;
}

/** The mortar: a shell thrown ahead that bursts on the ground like a bomb. */
export function lobShell(world: World, p: Player, w: WeaponStats, dx: number): void {
  world.bombs.push({ x: p.x + dx, y: p.y - 18, t: 0, damage: w.damage, radius: w.radius, dead: false, lob: LOB_SPEED });
}

/** The plasma lance: a slow bolt from the arm. */
export function fireLance(world: World, p: Player, w: WeaponStats, dx: number): void {
  world.lances.push({ x: p.x + dx, y: p.y - 26, vy: -w.speed, damage: w.damage, hit: [], boss: false, ttl: 2.4, dead: false });
}

/** The rail cannon: everything in a column above the mech takes the hit at once; the beam glows a moment. */
export function fireBeam(world: World, p: Player, w: WeaponStats, dx: number, audio: AudioEngine): void {
  const x = p.x + dx;
  for (const e of world.enemies) {
    if (!e.dead && e.y < p.y && e.y > -20 && Math.abs(e.x - x) < e.radius + 6) damageEnemy(world, e, w.damage, audio);
  }
  const boss = world.boss;
  if (boss?.active) {
    for (let y = p.y - 30; y > 0; y -= 18) if (boss.hitAt(x, y, 8, w.damage, world, audio)) break;
  }
  world.beams.push({ x, y: p.y - 24, t: 0 });
  world.addShake(3);
}

/** Lance bolts flying and burning through; beams fading. */
export function updateMechShots(world: World, dt: number, audio: AudioEngine): void {
  for (const l of world.lances) {
    l.y += l.vy * dt;
    l.ttl -= dt;
    if (l.y < -40 || l.ttl <= 0) l.dead = true;
    for (const e of world.enemies) {
      if (e.dead || l.hit.includes(e.id) || !circleHit(l.x, l.y, 9, e.x, e.y, e.radius)) continue;
      l.hit.push(e.id);
      damageEnemy(world, e, l.damage, audio);
      world.particles.sparks(l.x, l.y, 4, '#9affb0', 140);
    }
    const boss = world.boss;
    if (!l.boss && boss && boss.hitAt(l.x, l.y, 9, l.damage, world, audio)) l.boss = true;
  }
  world.lances = world.lances.filter((l) => !l.dead);
  for (const b of world.beams) b.t += dt;
  world.beams = world.beams.filter((b) => b.t < 0.35);
}

