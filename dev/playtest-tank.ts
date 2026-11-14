// Dev-only balance playtest for map 7 (docs 102–107): the tank kit of a pilot who buys as the money comes in, driven
// through a mission by the invulnerable bot of playtest.ts; in a defence the bot also builds towers. From the console:
//   const pk = await import('/dev/playtest-tank.ts');
//   pk.tankKitAt(186)            → { save, bought, cash }
//   await pk.flyTank('m186', 2)  → two runs: hulls of damage per minute, kill share, objective, boss time, the outpost
// Each mission before `n` counts as won with its first-clear money (playtest.ts `income`).
import { ENEMIES } from '../src/data/enemies';
import { missionById } from '../src/data/missions';
import { PLANES } from '../src/data/planes';
import { TOWERS, type TowerId } from '../src/data/towers';
import type { EquipmentId, PlaneId, SecondaryId } from '../src/data/types';
import { secondaryAllowedOn } from '../src/data/weapons';
import { callBonus, upgradeCost } from '../src/game/defence';
import { buy, canBuy, mount, type ShopItem } from '../src/game/economy';
import { fromKitView, kitView } from '../src/game/kit';
import { buySteppeLab, labLevelPrice, startSteppeProject, steppeDay, steppeProjectState } from '../src/game/steppe-lab';
import type { SteppeProjectId } from '../src/data/steppe-research';
import type { MissionResult } from '../src/data/types';
import { objectiveMet } from '../src/game/objectives';
import { defaultSave, type SaveData } from '../src/game/save';
import type { GameContext, Route } from '../src/game/state';
import { build, upgrade } from '../src/scenes/mission/defence-input';
import type { Defence } from '../src/scenes/mission/defence-mission';
import type { MissionScene } from '../src/scenes/mission/mission-scene';
import { decide, income, type Bot, type RunResult } from './playtest';

interface Hook { game: GameContext; scene(): unknown; step(frames?: number): void; go(r: Route): void }
const hook = (): Hook => (window as unknown as { __toprun: Hook }).__toprun;

type Step = ShopItem | 'lab';
const gun: Step = { type: 'gun', fleet: 'tank' };
const eq = (id: EquipmentId): Step => ({ type: 'equipment', id });
const vehicle = (id: PlaneId): Step => ({ type: 'plane', id });
const mod = (id: 'autoloader' | 'stabiliser' | 'coaxmg'): Step => ({ type: 'mod', id });
const ammo = (id: 'apds' | 'hefrag' | 'thermite'): Step => ({ type: 'rounds', id });
export const TANK_ORDER: readonly Step[] = [
  gun, gun, 'lab', eq('armor'), gun, eq('flares'), vehicle('lynx'), ammo('hefrag'), gun, eq('armor'), gun, 'lab', mod('autoloader'),
  eq('ecm'), gun, eq('damageControl'), mod('stabiliser'), eq('armor'), vehicle('bison'), ammo('hefrag'), gun, mod('coaxmg'), eq('engine'),
  'lab', gun, mod('autoloader'), eq('radar'), gun, ammo('hefrag'), eq('flares'), eq('ecm'), eq('damageControl'), mod('stabiliser'),
  mod('coaxmg'), eq('magnet'), mod('autoloader'), vehicle('viper'), eq('engine'), eq('radar'), eq('magnet'),
];

/** What the lab works down, in order (doc 107). */
export const LAB_ORDER: readonly SteppeProjectId[] = [
  'aarocket', 't-mortarpit', 'atgm', 'grenade2', 't-jammer', 'mines', 'aarocket2', 'towers2', 'atgm2', 't-tesla', 'flamer', 'tesla',
  'grenade3', 't-rockets', 'towers3', 'atgm3', 'aarocket3', 'mines2', 'tesla2', 'flamer2', 'mines3', 'tesla3', 'flamer3',
];

function nextProject(save: SaveData): SaveData {
  if (save.steppeLab.project) return save;
  const id = LAB_ORDER.find((p) => steppeProjectState(save.steppeLab, p) === 'open');
  return id ? { ...save, steppeLab: startSteppeProject(save.steppeLab, id).lab } : save;
}

const won = (id: string): MissionResult => ({
  missionId: id, success: true, aborted: false, takeoff: 'good', kills: 0, spawned: 0, objectiveDone: true, hullRatio: 1, collected: 0, bossKilled: true,
});

function tryStep(save: SaveData, s: Step): SaveData | null {
  if (s === 'lab') return labLevelPrice(save.steppeLab) === null ? save : buySteppeLab(save);
  return canBuy(save, s).ok ? buy(save, s) : null;
}

const WEAPONS: readonly SecondaryId[] = ['atgm', 'aarocket', 'tesla', 'flamer', 'mines', 'grenade'];
const best = (save: SaveData): PlaneId => (['bison', 'lynx', 'viper', 'jackal'] as const).find((id) => save.ownedPlanes.includes(id)) ?? 'jackal';

function loadOut(save: SaveData): SaveData {
  let s = { ...save, selectedPlane: best(save) };
  const owned = WEAPONS.filter((id) => s.ownedSecondaries.includes(id) && secondaryAllowedOn(id, s.selectedPlane));
  for (let slot = 0; slot < PLANES[s.selectedPlane].hardpoints && owned.length > 0; slot++) {
    const id = owned[slot % owned.length];
    if (id) s = mount(s, s.selectedPlane, id, slot);
  }
  return s;
}

/** The tank kit at the start of mission `n` (181–210), money from map 7 only, spent down TANK_ORDER in order. */
export function tankKitAt(n: number): { save: SaveData; bought: string[]; cash: number } {
  const cleared = Object.fromEntries(Array.from({ length: n - 1 }, (_, i) => [`m${String(i + 1).padStart(2, '0')}`, { stars: 2 }]));
  let save = kitView({ ...defaultSave(), money: 0, progress: cleared }, 'tank');
  let next = 0;
  const bought: string[] = [];
  for (let k = 181; k < n; k++) {
    const m = missionById(`m${k}`);
    if (!m) break;
    save = { ...save, money: save.money + income(m) };
    for (let s = TANK_ORDER[next]; s; s = TANK_ORDER[next]) {
      const after = tryStep(save, s);
      if (!after) break;
      save = nextProject(after);
      bought.push(s === 'lab' ? 'lab' : s.type === 'equipment' || s.type === 'plane' || s.type === 'mod' || s.type === 'rounds' ? s.id : s.type);
      next += 1;
    }
    save = nextProject(save);
    const day = steppeDay(save.steppeLab, m, won(m.id));
    if (day) save = nextProject({ ...save, steppeLab: day.lab });
  }
  return { save: loadOut(kitView(fromKitView(save, save), 'tank')), bought, cash: save.money }; // the lab's inventions in the view
}

/** The bot's builder: an MG nest, a flak tower when fliers come, then whatever it knows, on the free pad nearest the
 *  outpost; once eight towers stand, upgrades; calls the wave early when it can't afford anything. */
function builder(d: Defence): void {
  const audio = hook().game.audio;
  const fliers = d.world.mission.pool.some((k) => ENEMIES[k].layer === 'air');
  const built = d.towers.filter(Boolean).length;
  const want: TowerId = built === 1 && fliers && d.known.includes('flak') ? 'flak' : d.known[built % d.known.length] ?? 'mgnest';
  const free = d.layout.pads.map((p, i) => ({ p, i })).filter((x) => !d.towers[x.i]).sort((a, b) => b.p.y - a.p.y)[0];
  if (free && built < 8 && d.supply >= TOWERS[want].cost[0]) return void build(d, free.i, want, audio);
  const low = d.towers.filter((t) => t && upgradeCost(t.id, t.level) !== null).sort((a, b) => (a?.level ?? 0) - (b?.level ?? 0))[0];
  const cost = low ? upgradeCost(low.id, low.level) : null;
  if (low && cost !== null && d.supply >= cost) return void upgrade(d, low.pad, audio);
  if (free && built >= 8 && d.supply >= TOWERS[want].cost[0]) return void build(d, free.i, want, audio);
  if (d.countdown !== null && d.countdown > 3 && d.supply < 50) d.callNow(callBonus(d.countdown));
}

export interface TankResult extends RunResult { outpost: number | null; leaks: number; held: string }

/** Drives one run of mission `id` with the kit `save`; resolves when it ends. */
export async function runTank(id: string, save: SaveData, towers = true): Promise<TankResult> {
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
    for (let f = 0; f < 60 * 600 && T.scene() === sc; f++) {
      (sc as unknown as { paused: boolean }).paused = false;
      bot = decide(sc);
      if (sc.world.defence && towers && f % 30 === 0) builder(sc.world.defence);
      T.step(1);
      if (sc.world.boss && bossIn === null) bossIn = sc.world.t;
      if (sc.world.tally.bossKilled && bossOut === null) bossOut = sc.world.t;
      if (f % 600 === 0) await new Promise((r) => setTimeout(r, 0));
    }
  } finally {
    for (const k of ['moveVector', 'dragDelta', 'held', 'pressed']) delete input[k];
  }
  const w = sc.world;
  const d = w.defence;
  const minutes = w.t / 60;
  return {
    hullsPerMin: +(w.perf.damage / p.maxHull / minutes).toFixed(2), killShare: +(w.tally.kills / Math.max(1, w.spawned)).toFixed(2),
    objective: objectiveMet(w.mission.objective, w.tally, true), bossSec: bossIn !== null && bossOut !== null ? +(bossOut - bossIn).toFixed(1) : null,
    minutes: +minutes.toFixed(2), crashed: w.crashed, outpost: d ? Math.round(d.health) : null, leaks: d?.leaks ?? 0,
    held: d ? `${w.tally.wavesHeld}/${d.total}` : '',
  };
}

/** `runs` runs of `id` with the kit a buying pilot owns at that mission. */
export async function flyTank(id: string, runs = 2, towers = true): Promise<{ kit: string; results: TankResult[] }> {
  const s = tankKitAt(Number(id.slice(1))).save;
  const results: TankResult[] = [];
  for (let i = 0; i < runs; i++) results.push(await runTank(id, s, towers));
  return { kit: `${s.selectedPlane}, gun ${s.gunLevel}, armour ${s.equipment.armor}`, results };
}
