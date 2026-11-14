// Dev-only balance playtest (docs 43, 48): the kit a pilot owns who buys as the money comes in, and an invulnerable
// bot that flies a mission with it. From the dev page's console:
//   const pt = await import('/dev/playtest.ts');
//   pt.heliKitAt(70)            → { kit: [...], cash, income }
//   await pt.fly('m70', 3)      → three runs: hulls of damage per minute, kill share, objective, boss time
//   await pt.flySub('m93', 3)   → the same on map 4 with the sub kit (docs 65, 74)
// The bot always fires, follows the boss or the nearest target, sidesteps rounds close above it, fires ground and air
// weapons at matching targets, drops flares at incoming missiles and uses E when charged. It cannot die: damage is
// counted (the mission's own perf.damage, i-frames included) but never taken off the hull.
import { ENEMIES } from '../src/data/enemies';
import { missionById } from '../src/data/missions';
import { PLANES } from '../src/data/planes';
import type { EquipmentId, MissionDef, PlaneId, SecondaryId } from '../src/data/types';
import { buyMark, canBuyMark } from '../src/game/arsenal';
import { objectiveMet } from '../src/game/objectives';
import { clampToChannel } from '../src/game/canyon';
import { scaleEnemy } from '../src/game/combat';
import { buy, canBuy, mount, type ShopItem } from '../src/game/economy';
import { kitView } from '../src/game/kit';
import { canPlace, place, shipStats } from '../src/game/ship';
import { buyLaser, buyModule, buyShipMark, canBuyLaser, canBuyModule, canBuyShipMark } from '../src/game/ship-shop';
import { GRID, SHIP_MARK_FAMILIES, type ModuleId, type ShipMarkFamily } from '../src/data/ship-modules';
import { payScale } from '../src/game/map-two';
import { defaultSave, type SaveData } from '../src/game/save';
import type { GameContext, Route } from '../src/game/state';
import { generateTimeline } from '../src/game/waves';
import { BOSSES } from '../src/data/bosses';
import { SECONDARIES, secondaryAllowedOn } from '../src/data/weapons';
import type { MissionScene } from '../src/scenes/mission/mission-scene';
import { PF_H, PF_W } from '../src/scenes/mission/world';

interface Hook { game: GameContext; scene(): unknown; step(frames?: number): void; go(r: Route): void }
const hook = (): Hook => (window as unknown as { __toprun: Hook }).__toprun;

type Step = ShopItem | { mark: SecondaryId };
const gun: Step = { type: 'gun', fleet: 'heli' };
const eq = (id: EquipmentId): Step => ({ type: 'equipment', id });
const sec = (id: SecondaryId): Step => ({ type: 'secondary', id });

/** A sensible helicopter shopping list (wave 2): firepower first, then armour and defences, in that order. */
export const HELI_ORDER: readonly Step[] = [
  gun, sec('hydra'), gun, eq('armor'), sec('hellfire'), eq('flares'), gun, eq('armor'), { mark: 'hydra' }, gun,
  { mark: 'hellfire' }, sec('stinger'), eq('armor'), eq('ecm'), gun, eq('flares'), eq('damageControl'), eq('armor'), gun,
  { mark: 'hydra' }, { mark: 'hellfire' }, eq('engine'), eq('engine'), gun, eq('ecm'), eq('damageControl'), gun, gun,
  eq('flares'), eq('flares'), eq('radar'), eq('magnet'), eq('engine'), eq('engine'), eq('radar'), eq('magnet'),
];

/** What a first clear of `m` pays: the reward on the map's scale and 65 % of the bounties on offer (doc 43 method). */
export function income(m: MissionDef): number {
  const pay = payScale(m.number);
  let bounties = 0;
  for (const e of generateTimeline(m)) {
    if (e.type === 'enemy') bounties += scaleEnemy(ENEMIES[e.kind], m.difficulty).bounty * pay;
    else bounties += BOSSES[e.boss].bounty * pay;
  }
  return Math.round(m.reward * pay + bounties * 0.65);
}

function tryStep(save: SaveData, s: Step): SaveData | null {
  if ('mark' in s) return canBuyMark(save, s.mark).ok ? buyMark(save, s.mark) : null;
  return canBuy(save, s).ok ? buy(save, s) : null;
}

/** A sensible sub shopping list (doc 65, wave 1): harpoon gun, torpedoes and mines, then armour and defences. */
const subGun: Step = { type: 'gun', fleet: 'sub' };
export const SUB_ORDER: readonly Step[] = [
  subGun, sec('mk48'), subGun, eq('armor'), sec('depthmine'), eq('flares'), subGun, eq('armor'), { mark: 'mk48' }, subGun,
  sec('shkval'), { mark: 'depthmine' }, eq('armor'), eq('ecm'), subGun, eq('flares'), eq('damageControl'), eq('armor'), subGun,
  { mark: 'mk48' }, { mark: 'shkval' }, { mark: 'depthmine' }, eq('engine'), eq('engine'), subGun, eq('ecm'), eq('damageControl'),
  { mark: 'shkval' }, subGun, subGun, eq('flares'), eq('flares'), eq('radar'), eq('magnet'), eq('engine'), eq('engine'), eq('radar'),
  eq('magnet'),
];

/** The helicopter kit at the start of mission `n` (61–90), money from map 3 only, spent down HELI_ORDER in order. */
export const heliKitAt = (n: number, list: readonly Step[] = HELI_ORDER): KitAt => fleetKitAt('heli', 61, n, list);

/** The sub kit at the start of mission `n` (91–120), money from map 4 only, spent down SUB_ORDER in order. */
export const subKitAt = (n: number, list: readonly Step[] = SUB_ORDER): KitAt => fleetKitAt('sub', 91, n, list);

interface KitAt { save: SaveData; bought: string[]; cash: number; earned: number }

function fleetKitAt(kit: 'heli' | 'sub', first: number, n: number, list: readonly Step[]): KitAt {
  const cleared = Object.fromEntries(Array.from({ length: n - 1 }, (_, i) => [`m${String(i + 1).padStart(2, '0')}`, { stars: 2 }]));
  let save = kitView({ ...defaultSave(), money: 0, progress: cleared }, kit);
  let next = 0;
  let earned = 0;
  const bought: string[] = [];
  for (let k = first; k < n; k++) {
    const m = missionById(`m${k}`);
    if (!m) break;
    const pay = income(m);
    earned += pay;
    save = { ...save, money: save.money + pay };
    for (let s = list[next]; s; s = list[next]) {
      const after = tryStep(save, s);
      if (!after) {
        if (save.money >= 1e9) next += 1; // not on sale at all: skip it
        break;
      }
      save = after;
      bought.push('mark' in s ? `${s.mark}+` : s.type === 'equipment' || s.type === 'secondary' ? s.id : s.type);
      next += 1;
    }
  }
  return { save: loadOut(save), bought, cash: save.money, earned };
}

/** Every station filled: the kit's own weapons in turn (Hydras, Hellfires, Stingers; MK48s and mines), whatever is owned. */
function loadOut(save: SaveData): SaveData {
  const owned = (['hydra', 'hellfire', 'stinger', 'mk48', 'depthmine', 'shkval'] as const)
    .filter((id) => save.ownedSecondaries.includes(id) && secondaryAllowedOn(id, save.selectedPlane));
  let s = save;
  for (let slot = 0; slot < PLANES[s.selectedPlane].hardpoints && owned.length > 0; slot++) {
    const id = owned[slot % owned.length];
    if (id) s = mount(s, s.selectedPlane, id, slot);
  }
  return s;
}

export interface RunResult { hullsPerMin: number; killShare: number; objective: boolean; bossSec: number | null; minutes: number; crashed: boolean }

interface Bot { dir: { x: number; y: number }; ground: boolean; air: boolean; special: boolean; flare: boolean }

function decide(sc: MissionScene): Bot {
  const w = sc.world;
  const p = sc.player;
  const seen = w.enemies.filter((e) => !e.dead && e.y > 20 && e.y < PF_H - 20);
  const ground = seen.filter((e) => ENEMIES[e.kind].layer === 'ground');
  const air = seen.filter((e) => ENEMIES[e.kind].layer === 'air');
  const o = w.mission.objective;
  const wanted = o.type === 'strike' ? ground.filter((e) => e.kind === o.target) : [];
  const near = (list: typeof seen): (typeof seen)[number] | undefined =>
    [...list].sort((a, b) => Math.abs(a.x - p.x) + Math.abs(a.y - p.y) * 0.3 - (Math.abs(b.x - p.x) + Math.abs(b.y - p.y) * 0.3))[0];
  const target = w.boss && w.boss.active ? { x: w.boss.x } : near(wanted) ?? near(seen);
  let tx = target ? target.x : PF_W / 2;
  const danger = w.bullets.find((b) => (b.kind === 'enemy' || b.kind === 'flak') && b.y < p.y && p.y - b.y < 110 && Math.abs(b.x - p.x) < 24);
  if (danger) tx = p.x + (danger.x > p.x ? -60 : 60);
  // Canyon runs (doc 52): stay well inside the walls of this row and the row ahead, whatever else it wants.
  for (const lane of [w.canyonAt(p.y), w.canyonAt(p.y - 60)]) if (lane) tx = clampToChannel(tx, lane, 55);
  const dx = Math.max(-1, Math.min(1, (tx - p.x) / 30));
  const dy = Math.max(-1, Math.min(1, (PF_H - 150 - p.y) / 40));
  const missile = w.missiles.some((m) => m.kind === 'enemy' && Math.hypot(m.x - p.x, m.y - p.y) < 160);
  const longbow = p.stats.plane.special === 'longbow';
  return {
    dir: { x: dx, y: dy }, ground: ground.length > 0 || !!w.boss, air: air.length > 0 && !w.decoy, flare: missile, // one decoy at a time (doc 101)
    special: p.specialCooldown <= 0 && p.specialActive <= 0 && (!longbow || ground.length > 0),
  };
}

/** Flies one run of mission `id` with the kit `save` (a helicopter or jet view); resolves when it ends. */
export async function run(id: string, save: SaveData): Promise<RunResult> {
  const T = hook();
  const m = missionById(id);
  if (!m) throw new Error(`no mission ${id}`);
  T.game.setSave(save);
  const before = T.scene();
  T.go({ to: 'mission', mission: m, takeoff: 'good' });
  let sc = T.scene() as MissionScene;
  for (let i = 0; i < 200 && (sc === before || sc.constructor.name !== 'MissionScene'); i++) { T.step(1); sc = T.scene() as MissionScene; }
  const input = T.game.input as unknown as Record<string, unknown>;
  let bot: Bot = { dir: { x: 0, y: 0 }, ground: false, air: false, special: false, flare: false };
  input.moveVector = () => bot.dir;
  input.dragDelta = () => ({ x: 0, y: 0 });
  input.held = (a: string) => a === 'fire' || (a === 'groundWeapon' && bot.ground) || (a === 'secondary' && bot.air);
  input.pressed = (a: string) => (a === 'special' && bot.special) || (a === 'flare' && bot.flare);
  const p = sc.player;
  p.damage = () => { p.invuln = 0.6; return false; };
  let bossIn: number | null = null;
  let bossOut: number | null = null;
  try {
    for (let f = 0; f < 60 * 400 && T.scene() === sc; f++) {
      (sc as unknown as { paused: boolean }).paused = false;
      bot = decide(sc);
      T.step(1);
      if (sc.world.boss && bossIn === null) bossIn = sc.world.t;
      if (sc.world.tally.bossKilled && bossOut === null) bossOut = sc.world.t;
      if (f % 600 === 0) await new Promise((r) => setTimeout(r, 0));
    }
  } finally {
    for (const k of ['moveVector', 'dragDelta', 'held', 'pressed']) delete input[k];
  }
  const w = sc.world;
  const minutes = w.t / 60;
  return {
    hullsPerMin: +(w.perf.damage / p.maxHull / minutes).toFixed(2), killShare: +(w.tally.kills / Math.max(1, w.spawned)).toFixed(2),
    objective: objectiveMet(w.mission.objective, w.tally, true), bossSec: bossIn !== null && bossOut !== null ? +(bossOut - bossIn).toFixed(1) : null,
    minutes: +minutes.toFixed(2), crashed: w.crashed,
  };
}

/** `runs` runs of `id` (61–90) with the kit a buying pilot owns at that mission, flown in `heli` (default: the
 *  helicopter the kit has). */
export async function fly(id: string, runs = 3, heli?: PlaneId): Promise<{ kit: string; results: RunResult[] }> {
  const n = Number(id.slice(1));
  const k = heliKitAt(n);
  const s = heli ? loadOut({ ...k.save, ownedPlanes: [...k.save.ownedPlanes, heli], selectedPlane: heli }) : k.save;
  const results: RunResult[] = [];
  for (let i = 0; i < runs; i++) results.push(await run(id, s));
  const kit = `${s.selectedPlane}, gun ${s.gunLevel}, ${s.ownedSecondaries.filter((x) => SECONDARIES[x].campaign === 3).join('/') || 'no weapons'}, armour ${s.equipment.armor}`;
  return { kit, results };
}

/** Doc 99: `runs` runs of `id` with the buying pilot's helicopter kit changed by `tweak` (gear, weapons, mounts). */
export async function flyHeliWith(id: string, runs: number, tweak: (s: SaveData) => SaveData): Promise<RunResult[]> {
  const s = tweak(heliKitAt(Number(id.slice(1))).save);
  const results: RunResult[] = [];
  for (let i = 0; i < runs; i++) results.push(await run(id, s));
  return results;
}

/** `runs` runs of `id` (91–120) with the sub kit a buying pilot owns at that mission (doc 65), steered in `sub` (default:
 *  the sub the kit has; doc 69). */
export async function flySub(id: string, runs = 3, sub?: PlaneId): Promise<{ kit: string; results: RunResult[] }> {
  const k = subKitAt(Number(id.slice(1))).save;
  const s = sub ? loadOut({ ...k, ownedPlanes: [...k.ownedPlanes, sub], selectedPlane: sub }) : k;
  const results: RunResult[] = [];
  for (let i = 0; i < runs; i++) results.push(await run(id, s));
  const kit = `${s.selectedPlane}, gun ${s.gunLevel}, ${s.ownedSecondaries.filter((x) => SECONDARIES[x].campaign === 4).join('/') || 'no weapons'}, armour ${s.equipment.armor}`;
  return { kit, results };
}

/** Doc 101: `runs` runs of `id` with the buying pilot's sub kit changed by `tweak` (gear, weapons, mounts). */
export async function flySubWith(id: string, runs: number, tweak: (s: SaveData) => SaveData): Promise<RunResult[]> {
  const s = tweak(subKitAt(Number(id.slice(1))).save);
  const results: RunResult[] = [];
  for (let i = 0; i < runs; i++) results.push(await run(id, s));
  return results;
}

// ---------- Map 5: the spacecraft (docs 54, 74) ----------

type ShipStep = ModuleId | 'power' | `mk:${ShipMarkFamily}`;

/** A sensible shipyard list on top of the starter ship: laser power first, then hull, a capsule, rockets, shields,
 *  point defence (doc 60), torpedoes, and the marks (doc 57) as the money grows. */
export const SHIP_ORDER: readonly ShipStep[] = [
  'power', 'power', 'plate', 'capsule', 'power', 'laser', 'rockets', 'reactor', 'pointdef', 'shield', 'power', 'torpedo',
  'engine', 'plate', 'mk:plate', 'rockets', 'laser', 'power', 'mk:rockets', 'reactor', 'pointdef', 'shield', 'torpedo', 'power', 'mk:shield',
  'plate', 'laser', 'mk:torpedo', 'power', 'mk:engine', 'mk:plate', 'mk:rockets', 'reactor', 'shield', 'power', 'power',
  'mk:torpedo', 'mk:shield', 'mk:plate', 'mk:rockets', 'mk:engine', 'power', 'mk:torpedo', 'mk:shield', 'mk:plate',
  'mk:rockets', 'mk:torpedo', 'mk:shield', 'mk:engine', 'mk:engine',
];

const markStep = (s: ShipStep): ShipMarkFamily | null => (s.startsWith('mk:') ? SHIP_MARK_FAMILIES.find((f) => `mk:${f}` === s) ?? null : null);

function canBuyStep(save: SaveData, s: ShipStep): boolean {
  const f = markStep(s);
  if (f) return canBuyShipMark(save, f).ok;
  return s === 'power' ? canBuyLaser(save).ok : canBuyModule(save, s as ModuleId).ok;
}

function buyStep(save: SaveData, s: ShipStep): SaveData {
  const f = markStep(s);
  if (f) return buyShipMark(save, f);
  if (s === 'power') return buyLaser(save);
  const next = buyModule(save, s as ModuleId);
  return { ...next, ship: autoPlace(next.ship, s as ModuleId) };
}

/** Where a module goes: the first valid cell, lasers and the capsule up front, engines aft, the rest beside the core. */
function autoPlace(ship: SaveData['ship'], id: ModuleId): SaveData['ship'] {
  const cells: { col: number; row: number }[] = [];
  for (let col = 0; col < GRID.cols; col++) for (let row = 0; row < GRID.rows; row++) cells.push({ col, row });
  const want = id === 'engine' || id === 'shield' || id === 'reactor' || id === 'pointdef' ? 1 : id === 'plate' || id === 'rockets' ? 0 : -1;
  const score = (c: { col: number; row: number }): number =>
    Math.abs(c.col - GRID.core.col) * 2 + Math.abs(c.row - GRID.core.row) + (Math.sign(c.row - GRID.core.row) === want ? 0 : 3);
  for (const c of cells.sort((a, b) => score(a) - score(b))) if (canPlace(ship, id, c.col, c.row).ok) return place(ship, id, c.col, c.row);
  return ship;
}

/** The ship at the start of mission `n` (121–150), money from map 5 only, bought down SHIP_ORDER and placed by autoPlace. */
export function shipKitAt(n: number): { save: SaveData; earned: number } {
  const cleared = Object.fromEntries(Array.from({ length: n - 1 }, (_, i) => [`m${String(i + 1).padStart(2, '0')}`, { stars: 2 }]));
  let save = kitView({ ...defaultSave(), money: 0, progress: cleared }, 'ship');
  let next = 0;
  let earned = 0;
  for (let k = 121; k < n; k++) {
    const m = missionById(`m${k}`);
    if (!m) break;
    earned += income(m);
    save = { ...save, money: save.money + income(m) };
    for (let s = SHIP_ORDER[next]; s; s = SHIP_ORDER[next]) {
      if (!canBuyStep(save, s)) break;
      save = buyStep(save, s);
      next += 1;
    }
  }
  return { save, earned };
}

export async function flyShip(id: string, runs = 3): Promise<{ kit: string; results: RunResult[] }> {
  const k = shipKitAt(Number(id.slice(1)));
  const results: RunResult[] = [];
  for (let i = 0; i < runs; i++) results.push(await run(id, k.save));
  const st = shipStats(k.save.ship);
  const marks = Object.values(k.save.ship.marks).join('');
  return { kit: `${st.cells.length} modules, laser ${k.save.ship.laserLevel}, marks ${marks}, hull ${st.hull}, ${st.barrels.length} barrels, ${st.rocketWings}R ${st.torpedoBays}T ${st.pointDefence}PD`, results };
}
