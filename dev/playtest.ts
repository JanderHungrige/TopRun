// Dev-only balance playtest (docs 43, 48): the kit a pilot owns who buys as the money comes in, and an invulnerable
// bot that flies a mission with it. From the dev page's console:
//   const pt = await import('/dev/playtest.ts');
//   pt.heliKitAt(70)            → { kit: [...], cash, income }
//   await pt.fly('m70', 3)      → three runs: hulls of damage per minute, kill share, objective, boss time
// The bot always fires, follows the boss or the nearest target, sidesteps rounds close above it, fires ground and air
// weapons at matching targets, drops flares at incoming missiles and uses E when charged. It cannot die: damage is
// counted (the mission's own perf.damage, i-frames included) but never taken off the hull.
import { ENEMIES } from '../src/data/enemies';
import { missionById } from '../src/data/missions';
import { PLANES } from '../src/data/planes';
import type { EquipmentId, MissionDef, SecondaryId } from '../src/data/types';
import { buyMark, canBuyMark } from '../src/game/arsenal';
import { objectiveMet } from '../src/game/objectives';
import { scaleEnemy } from '../src/game/combat';
import { buy, canBuy, mount, type ShopItem } from '../src/game/economy';
import { kitView } from '../src/game/kit';
import { payScale } from '../src/game/map-two';
import { defaultSave, type SaveData } from '../src/game/save';
import type { GameContext, Route } from '../src/game/state';
import { generateTimeline } from '../src/game/waves';
import { BOSSES } from '../src/data/bosses';
import type { MissionScene } from '../src/scenes/mission/mission-scene';
import { PF_H, PF_W } from '../src/scenes/mission/world';

interface Hook { game: GameContext; scene(): unknown; step(frames?: number): void; go(r: Route): void }
const hook = (): Hook => (window as unknown as { __toprun: Hook }).__toprun;

type Step = ShopItem | { mark: SecondaryId };
const gun: Step = { type: 'gun', heli: true };
const eq = (id: EquipmentId): Step => ({ type: 'equipment', id });
const sec = (id: SecondaryId): Step => ({ type: 'secondary', id });

/** A sensible helicopter shopping list (wave 2): firepower first, then armour and defences, in that order. */
export const HELI_ORDER: readonly Step[] = [
  gun, sec('hydra'), gun, eq('armor'), sec('hellfire'), eq('flares'), gun, eq('armor'), { mark: 'hydra' }, gun,
  { mark: 'hellfire' }, eq('armor'), eq('ecm'), gun, eq('flares'), eq('damageControl'), eq('armor'), gun,
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

/** The helicopter kit at the start of mission `n` (61–90), money from map 3 only, spent down HELI_ORDER in order. */
export function heliKitAt(n: number, list: readonly Step[] = HELI_ORDER): { save: SaveData; bought: string[]; cash: number; earned: number } {
  const cleared = Object.fromEntries(Array.from({ length: n - 1 }, (_, i) => [`m${String(i + 1).padStart(2, '0')}`, { stars: 2 }]));
  let save = kitView({ ...defaultSave(), money: 0, progress: cleared }, 'heli');
  let next = 0;
  let earned = 0;
  const bought: string[] = [];
  for (let k = 61; k < n; k++) {
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

/** Every station filled: Hydras and Hellfires alternating, whatever is owned. */
function loadOut(save: SaveData): SaveData {
  const owned = (['hydra', 'hellfire'] as const).filter((id) => save.ownedSecondaries.includes(id));
  let s = save;
  for (let slot = 0; slot < PLANES[s.selectedPlane].hardpoints && owned.length > 0; slot++) {
    const id = owned[slot % owned.length];
    if (id) s = mount(s, s.selectedPlane, id, slot);
  }
  return s;
}

export interface RunResult { hullsPerMin: number; killShare: number; objective: boolean; bossSec: number | null; minutes: number }

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
  const dx = Math.max(-1, Math.min(1, (tx - p.x) / 30));
  const dy = Math.max(-1, Math.min(1, (PF_H - 150 - p.y) / 40));
  const missile = w.missiles.some((m) => m.kind === 'enemy' && Math.hypot(m.x - p.x, m.y - p.y) < 160);
  const longbow = p.stats.plane.special === 'longbow';
  return {
    dir: { x: dx, y: dy }, ground: ground.length > 0 || !!w.boss, air: air.length > 0, flare: missile,
    special: p.specialCooldown <= 0 && p.specialActive <= 0 && (!longbow || ground.length > 0),
  };
}

/** Flies one run of mission `id` with the kit `save` (a helicopter or jet view); resolves when it ends. */
export async function run(id: string, save: SaveData): Promise<RunResult> {
  const T = hook();
  const m = missionById(id);
  if (!m) throw new Error(`no mission ${id}`);
  T.game.setSave(save);
  T.go({ to: 'mission', mission: m, takeoff: 'good' });
  let sc = T.scene() as MissionScene;
  for (let i = 0; i < 200 && sc.constructor.name !== 'MissionScene'; i++) { T.step(1); sc = T.scene() as MissionScene; }
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
    minutes: +minutes.toFixed(2),
  };
}

/** `runs` runs of `id` (61–90) with the kit a buying pilot owns at that mission. */
export async function fly(id: string, runs = 3): Promise<{ kit: string; results: RunResult[] }> {
  const n = Number(id.slice(1));
  const k = heliKitAt(n);
  const results: RunResult[] = [];
  for (let i = 0; i < runs; i++) results.push(await run(id, k.save));
  const s = k.save;
  const kit = `gun ${s.gunLevel}, ${s.ownedSecondaries.filter((x) => x === 'hydra' || x === 'hellfire').join('/') || 'no weapons'}, armour ${s.equipment.armor}`;
  return { kit, results };
}
