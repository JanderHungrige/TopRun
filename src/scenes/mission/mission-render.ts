import { harpoonBolt, plasmaBolt, sinkingMine, sonarRing, torpedo } from '../../render/shots';
import { mortarShell, plasmaLance, railBeam, stompRing } from '../../render/mech-shots';
import { TAU } from '../../core/math';
import { drawEnemy, drawWreck } from '../../render/draw-enemies';
import { drawPlaneOutline, drawPlaneTop } from '../../render/draw-planes';
import { armourGlow, drawNuke, muzzleFlash } from '../../render/special-fx';
import { flame } from '../../render/shapes';
import { drawTankFx } from '../../render/tanks/tank-fx';
import { drawDefenceGround, drawTowers } from '../../render/defence-field';
import { padAt } from './defence-input';
import type { Player } from './player';
import { drawPickups } from './pickups';
import { hidden } from './projectiles';
import { isMiniBoss } from '../../data/reinforcements';
import { PF_H, PF_W, type Bullet, type Enemy, type World } from './world';
import { drawCanyon } from './canyon-run';
import { drawHeliFx } from '../../render/heli-fx';
import { drawShip } from '../../render/ship';
import { liveryLook } from '../../render/livery-art';
import type { ShipStats } from '../../game/ship';

const SHADOW_DX = 16;
const SHADOW_DY = 26;

function drawEnemyUnit(ctx: CanvasRenderingContext2D, e: Enemy, t: number, alpha = 1): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  drawEnemy(ctx, e.kind, e.x, e.y, { t: t + e.phase, flash: e.flash > 0, heading: e.heading, aim: e.aim, bank: Math.max(-1, Math.min(1, -e.vx / 200)) });
  ctx.restore();
}

/** A cloaked stealth fighter is only a faint shimmer (doc 44). */
const veil = (e: Enemy, p: Player, t: number): number => (hidden(e, p) ? 0.14 + 0.06 * Math.sin(t * 9 + e.phase) : 1);

/** A thin red health bar over every mini-boss (doc 44). */
function miniBossBars(ctx: CanvasRenderingContext2D, world: World): void {
  for (const e of world.enemies) {
    if (e.dead || !isMiniBoss(e.kind) || e.y < -e.radius) continue;
    const w = e.radius * 1.6;
    const x = e.x - w / 2;
    const y = e.y - e.radius - 14;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - 1, y - 1, w + 2, 6);
    ctx.fillStyle = '#ff5a48';
    ctx.fillRect(x, y, w * Math.max(0, e.hp / e.maxHp), 4);
  }
}

/** Glow and core colours of the loaded rounds: uranium white-green in green (doc 43), incendiary orange in red (doc 45);
 *  the helicopters' tracer a hot red streak, HEDP yellow (doc 99). */
const ROUNDS_GLOW = {
  uranium: ['130,255,150', '#b4ffc4', '#eaffd8'], incendiary: ['255,110,40', '#ffd27a', '#fff0c8'],
  tracer: ['255,40,40', '#ff9a8a', '#ffe0d8'], hedp: ['255,210,60', '#fff09a', '#fffbe0'],
  explosive: ['255,150,50', '#ffc070', '#fff0d0'], electric: ['90,170,255', '#a8dcff', '#eef8ff'], cavitation: ['200,235,255', '#e0f6ff', '#ffffff'],
} as const;

/** A gun round; loaded ammo burns inside a glow that flickers round by round. */
function tracer(ctx: CanvasRenderingContext2D, b: Bullet, t: number): void {
  if (b.harpoon) return harpoonBolt(ctx, b.x, b.y, b.rounds ? ROUNDS_GLOW[b.rounds][1] : undefined);
  if (b.laser) {
    ctx.fillStyle = 'rgba(110,220,255,0.35)';
    ctx.fillRect(b.x - 3, b.y - 12, 6, 22);
    ctx.fillStyle = '#e8fbff';
    ctx.fillRect(b.x - 1, b.y - 10, 2, 18);
    return;
  }
  if (b.rounds) {
    const [glow, hot, core] = ROUNDS_GLOW[b.rounds];
    const k = 0.5 + 0.5 * Math.sin(t * 40 + b.x * 0.7 + b.y * 0.13); // each round flickers on its own
    ctx.fillStyle = `rgba(${glow},${(0.3 + 0.45 * k).toFixed(2)})`;
    ctx.fillRect(b.x - 2.5 - 1.5 * k, b.y - 9, 5 + 3 * k, 16);
    ctx.fillStyle = k > 0.75 ? hot : core;
  } else ctx.fillStyle = '#fff6b0';
  ctx.fillRect(b.x - 1.5, b.y - 7, 3, 12);
}

/** A Bofors 40 mm shell (doc 46): a fat orange round with a hot tip. */
function shell(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = 'rgba(255,150,60,0.35)';
  ctx.fillRect(x - 4, y - 8, 8, 18);
  ctx.fillStyle = '#e07a2e';
  ctx.fillRect(x - 2.5, y - 5, 5, 12);
  ctx.fillStyle = '#ffe6a8';
  ctx.fillRect(x - 1.5, y - 7, 3, 4);
}

function drawShots(ctx: CanvasRenderingContext2D, world: World): void {
  for (const s of world.shells) shell(ctx, s.x, s.y);
  for (const b of world.bullets) {
    if (b.kind === 'gun' || b.kind === 'wingman' || b.kind === 'door') tracer(ctx, b, world.t);
    else if (b.kind === 'cannon') {
      ctx.fillStyle = '#ffb347';
      ctx.fillRect(b.x - 2, b.y - 9, 4, 16);
      ctx.fillStyle = '#fff3c4';
      ctx.fillRect(b.x - 1, b.y - 8, 2, 8);
    } else if (b.kind === 'flak') {
      ctx.fillStyle = '#ffd36b';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = '#ff5a3c';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffe0a0';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2, 0, TAU);
      ctx.fill();
    }
  }
  for (const m of world.missiles) {
    if (m.kind === 'drone' || m.kind === 'minitorp') continue; // the swarms are drawn by heli-fx (docs 99, 101)
    if (m.kind === 'torpedo') {
      plasmaBolt(ctx, m.x, m.y, m.ttl);
      continue;
    }
    if (m.kind === 'mk48' || (m.kind === 'enemy' && world.particles.underwater)) {
      torpedo(ctx, m.x, m.y, m.heading, m.kind === 'enemy');
      continue;
    }
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.heading);
    ctx.fillStyle = m.kind === 'enemy' ? '#c94a3a' : m.kind === 'aim54' || m.kind === 'aim120' ? '#f0f0f0' : '#d8dde2';
    ctx.fillRect(-2, -8, 4, 14);
    ctx.fillStyle = '#555';
    ctx.fillRect(-4, 4, 8, 2);
    flame(ctx, 0, 6, 4, 0.5, m.ttl * 10);
    ctx.restore();
  }
  for (const f of world.flares) {
    ctx.fillStyle = `rgba(255,220,120,${Math.min(1, f.ttl)})`;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 4 + Math.sin(f.ttl * 30) * 1.5, 0, TAU);
    ctx.fill();
  }
}

function drawBombs(ctx: CanvasRenderingContext2D, world: World): void {
  for (const b of world.bombs) {
    const s = 1 - b.t * 0.9;
    if (world.particles.underwater) {
      sinkingMine(ctx, b.x, b.y, s);
      continue;
    }
    if (b.lob) {
      mortarShell(ctx, b); // the mechs' mortar (doc 79)
      continue;
    }
    ctx.fillStyle = '#4c5340';
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, 3.5 * s + 1, 8 * s + 2, 0, 0, TAU);
    ctx.fill();
  }
}

/** The spacecraft (doc 54): drawn from its modules, a shadow below, the shield as a glow around it. */
function drawShipPlayer(ctx: CanvasRenderingContext2D, p: Player, ship: ShipStats, t: number): void {
  const look = liveryLook('starship', p.stats.livery); // its paint job (doc 100)
  const blink = p.invuln > 0 && p.invuln < 0.6 && Math.floor(t * 20) % 2 === 0;
  ctx.save();
  ctx.translate(p.x + SHADOW_DX, p.y + SHADOW_DY);
  drawShip(ctx, ship.modules, look, { solid: 'rgba(0,0,0,0.28)' });
  ctx.restore();
  ctx.save();
  ctx.translate(p.x, p.y);
  if (!blink) drawShip(ctx, ship.modules, look, { t, throttle: 0.4 + p.forward * 0.6 });
  if (p.shield > 0) {
    const r = Math.max(...ship.cells.map((c) => Math.hypot(c.dx, c.dy))) + 16;
    ctx.strokeStyle = `rgba(140,210,255,${(0.25 + 0.45 * (p.shield / Math.max(1, p.shieldMax))).toFixed(2)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, t: number): void {
  if (!p.alive) return;
  if (p.stats.ship) return drawShipPlayer(ctx, p, p.stats.ship, t);
  const blink = p.invuln > 0 && p.invuln < 0.6 && Math.floor(t * 20) % 2 === 0;
  const special = p.stats.plane.special;
  const rolling = special === 'roll' && p.specialActive > 0;
  const bank = rolling ? Math.cos((1 - p.specialActive / 0.7) * TAU) : p.bank;
  const dash = special === 'dash' && p.specialActive > 0;
  const opts = {
    bank, t, throttle: dash ? 1 : 0.4 + p.forward * 0.5, sweep: 0.2 + p.forward * 0.8, livery: p.stats.livery, stride: p.stride, leap: p.leap, paint: p.stats.paint,
    yaw: p.yaw, turret: p.turret - p.yaw, driven: p.driven, // a tank or buggy (doc 104)
  };
  ctx.globalAlpha = p.stealthed ? 0.3 : 1;
  drawPlaneTop(ctx, p.stats.plane.id, p.x + SHADOW_DX * (1 + p.leap * 3), p.y + SHADOW_DY * (1 + p.leap * 3), 1, { ...opts, shadow: true });
  ctx.globalAlpha = 1;
  if (p.wingman) {
    drawPlaneTop(ctx, 'f14', p.wingman.x + SHADOW_DX, p.wingman.y + SHADOW_DY, 0.9, { shadow: true });
    drawPlaneTop(ctx, 'f14', p.wingman.x, p.wingman.y, 0.9, { t, throttle: 0.5 });
  }
  if (!blink) {
    // F-35 stealth: see-through, a pulsing outline so the pilot still finds the jet (doc 36)
    ctx.globalAlpha = p.stealthed ? 0.45 : 1;
    drawPlaneTop(ctx, p.stats.plane.id, p.x, p.y + p.bob, 1, opts);
    ctx.globalAlpha = 1;
    if (p.stealthed) drawPlaneOutline(ctx, p.stats.plane.id, p.x, p.y, 1, `rgba(150,235,255,${(0.55 + Math.sin(t * 9) * 0.25).toFixed(2)})`, opts.sweep);
  }
  if (special === 'cannon' && p.specialActive > 0 && Math.floor(t * 30) % 2 === 0) muzzleFlash(ctx, p.x - 1, p.y - 36);
  if (special === 'armour' && p.specialActive > 0) armourGlow(ctx, p.x, p.y, t); // Hind Flying Tank (doc 51)
  if (dash) {
    ctx.strokeStyle = 'rgba(180,220,255,0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const lx = p.x - 40 + ((i * 37) % 80);
      ctx.beginPath();
      ctx.moveTo(lx, p.y + 20 + ((t * 900 + i * 53) % 120));
      ctx.lineTo(lx, p.y + 60 + ((t * 900 + i * 53) % 120));
      ctx.stroke();
    }
  }
}

export function renderWorld(ctx: CanvasRenderingContext2D, world: World, p: Player, t: number): void {
  world.terrain.renderGround(ctx);
  if (world.defence) drawDefenceGround(ctx, world.defence, p.alive ? padAt(world.defence, p.x, p.y) : -1, t); // doc 106
  drawCanyon(ctx, world);
  for (const w of world.wrecks) drawWreck(ctx, w.kind, w.x, w.y, t);
  for (const e of world.enemies) if (e.layer === 'ground') drawEnemyUnit(ctx, e, t);
  if (world.defence) drawTowers(ctx, world.defence, t);
  if (world.boss?.def.layer === 'ground') world.boss.render(ctx);
  drawBombs(ctx, world);
  for (const e of world.enemies) {
    if (e.layer === 'air' && !hidden(e, p)) drawEnemy(ctx, e.kind, e.x + SHADOW_DX, e.y + SHADOW_DY, { t, shadow: true, heading: e.heading });
  }
  drawPickups(ctx, world);
  for (const e of world.enemies) if (e.layer === 'air') drawEnemyUnit(ctx, e, t, veil(e, p, t));
  miniBossBars(ctx, world);
  if (world.boss?.def.layer === 'air') world.boss.render(ctx);
  drawShots(ctx, world);
  drawTankFx(ctx, world.sentry, world.mines, t);
  drawPlayer(ctx, p, t);
  world.particles.render(ctx);
  if (world.sonar) sonarRing(ctx, world.sonar.x, world.sonar.y, world.sonar.t);
  mechShots(ctx, world, t);
  drawHeliFx(ctx, world, t);
  world.terrain.renderSky(ctx, t);
  drawNuke(ctx, world, t);
}

/** The mechs' stomp ring, lance bolts and rail beams (docs 79, 80). */
function mechShots(ctx: CanvasRenderingContext2D, world: World, t: number): void {
  if (world.stomp) stompRing(ctx, world.stomp.x, world.stomp.y, world.stomp.t);
  for (const l of world.lances) plasmaLance(ctx, l, t);
  for (const b of world.beams) railBeam(ctx, b);
}

export function clipPlayfield(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.rect(0, 0, PF_W, PF_H);
  ctx.clip();
}
