// Dev-only balance playtest for map 6 (docs 78, 79, 82, 83): the ground base and mech kit of a pilot who builds as the
// money and the alloy come in, walked through a mission by the invulnerable bot of playtest.ts. From the dev console:
//   const pm = await import('/dev/playtest-mech.ts');
//   pm.mechKitAt(165)            → { save, bought, base }
//   await pm.flyMech('m165', 3)  → three runs: hulls of damage per minute, kill share, objective, boss time
// Each mission before `n` counts as won: its first-clear money, a day at the base (refinery, lab, salvage from 80 % of
// the spawns, the boss's), every loaded round fired. Money builds the buildings down BUILD_ORDER, the lab works down
// LAB_ORDER, alloy refills the magazine to half, then builds down MECH_ORDER, then fills the magazine.
import { missionById } from '../src/data/missions';
import { BUILDING_IDS, ROUNDS_IDS, roundsOf, type BuildingId } from '../src/data/outpost';
import type { ProjectId } from '../src/data/research';
import type { EquipmentId, MissionResult, PlaneId, SecondaryId } from '../src/data/types';
import { SECONDARIES, secondaryAllowedOn } from '../src/data/weapons';
import { PLANES } from '../src/data/planes';
import { buy, canBuy, mount, type ShopItem } from '../src/game/economy';
import { fromKitView, kitView } from '../src/game/kit';
import { projectState, startProject } from '../src/game/lab';
import { build, buildRounds, canBuild, canBuildRounds, magazineCap, type Outpost } from '../src/game/outpost';
import { runDay } from '../src/game/outpost-day';
import { defaultSave, type SaveData } from '../src/game/save';
import { generateTimeline } from '../src/game/waves';
import { income, run, type RunResult } from './playtest';

const B = (id: BuildingId): BuildingId => id;
export const BUILD_ORDER: readonly BuildingId[] = [
  B('generator'), B('refinery'), B('factory'), B('lab'), B('generator'), B('refinery'), B('mechbay'), B('lab'), B('factory'),
  B('generator'), B('refinery'), B('mechbay'), B('lab'), B('factory'),
];

export const LAB_ORDER: readonly ProjectId[] = [
  'seeker', 'pod2', 'mortar', 'seeker2', 'plasma', 'mortar2', 'pod3', 'seeker3', 'plasma2', 'rail', 'mortar3', 'plasma3', 'rail2', 'rail3',
];

const gun: ShopItem = { type: 'gun', fleet: 'mech' };
const eq = (id: EquipmentId): ShopItem => ({ type: 'equipment', id });
const mech = (id: PlaneId): ShopItem => ({ type: 'plane', id });
export const MECH_ORDER: readonly ShopItem[] = [
  gun, eq('armor'), gun, eq('flares'), gun, mech('ranger'), eq('armor'), gun, eq('ecm'), gun, eq('damageControl'), gun,
  mech('titan'), eq('armor'), gun, eq('engine'), gun, eq('radar'), gun, eq('flares'), eq('ecm'), eq('damageControl'), eq('magnet'),
  mech('hornet'), eq('engine'), eq('radar'), eq('magnet'),
];

/** The mech weapons in loadout preference: rail and plasma never run dry. */
const WEAPONS: readonly SecondaryId[] = ['rail', 'plasma', 'mortar', 'seeker', 'pod'];

/** Every hardpoint filled with the best known weapons, one of each first. */
function loadOut(save: SaveData): SaveData {
  const owned = WEAPONS.filter((id) => save.ownedSecondaries.includes(id) && secondaryAllowedOn(id, save.selectedPlane));
  let s = save;
  for (let slot = 0; slot < PLANES[s.selectedPlane].hardpoints && owned.length > 0; slot++) {
    const id = owned[slot % owned.length];
    if (id) s = mount(s, s.selectedPlane, id, slot);
  }
  return s;
}

/** The best mech owned: the Titan, else the Ranger, else the Strider. */
const best = (save: SaveData): PlaneId => (['titan', 'ranger', 'hornet', 'strider'] as const).find((id) => save.ownedPlanes.includes(id)) ?? 'strider';

function nextProject(o: Outpost): Outpost {
  if (o.project) return o;
  const id = LAB_ORDER.find((p) => projectState(o, p) === 'open');
  return id ? startProject(o, id).outpost : o;
}

/** Magazine refills: batches of the rounds the mounted weapons fire until `share` of the magazine is full. */
function refill(save: SaveData, share: number): SaveData {
  let o = save.outpost;
  const wanted = ROUNDS_IDS.filter((r) => save.ownedSecondaries.some((id) => roundsOf(id) === r));
  for (let again = true; again;) {
    again = false;
    for (const r of wanted) {
      if (o.magazine[r] >= magazineCap(o) * share || !canBuildRounds(o, r).ok) continue;
      o = buildRounds(o, r);
      again = true;
    }
  }
  return { ...save, outpost: o };
}

function shop(save: SaveData, pending: ShopItem[], bought: string[]): SaveData {
  let s = save;
  for (let i = 0; i < pending.length;) {
    const item = pending[i];
    if (!item) break;
    const check = canBuy(s, item);
    if (check.ok) {
      s = buy(s, item);
      bought.push(item.type === 'equipment' || item.type === 'plane' ? item.id : item.type);
      pending.splice(i, 1);
    } else if (check.reason === 'insufficient-funds') break;
    else i += 1; // the mech bay is not there yet: try the next one
  }
  return s;
}

function builds(save: SaveData, order: BuildingId[], bought: string[]): SaveData {
  let s = save;
  for (let id = order[0]; id && canBuild(s, id).ok; id = order[0]) {
    s = build(s, id);
    bought.push(`${id}${s.outpost.buildings[id]}`);
    order.shift();
  }
  return s;
}

/** The sortie that won `id`: 80 % of the spawns and the boss killed, every loaded round fired. */
function won(id: string, save: SaveData): MissionResult {
  const m = missionById(id);
  const spawns = m ? generateTimeline(m).filter((e) => e.type === 'enemy').length : 0;
  const spent: Partial<Record<SecondaryId, number>> = {};
  for (const sl of save.loadout[save.selectedPlane] ?? []) if (sl) spent[sl] = (spent[sl] ?? 0) + SECONDARIES[sl].ammoPerSlot;
  return {
    missionId: id, success: true, aborted: false, takeoff: 'good', kills: Math.round(spawns * 0.8), spawned: spawns, objectiveDone: true,
    hullRatio: 0.6, collected: 0, bossKilled: !!m && generateTimeline(m).some((e) => e.type === 'boss'), spent,
  };
}

export interface MechKitAt { save: SaveData; bought: string[]; base: string }

/** The mech kit and the ground base at the start of mission `n` (151–180). */
export function mechKitAt(n: number): MechKitAt {
  const cleared = Object.fromEntries(Array.from({ length: n - 1 }, (_, i) => [`m${String(i + 1).padStart(2, '0')}`, { stars: 2 }]));
  let save = loadOut(kitView({ ...defaultSave(), money: 0, progress: cleared }, 'mech'));
  const order = [...BUILD_ORDER];
  const pending = [...MECH_ORDER];
  const bought: string[] = [];
  for (let k = 151; k < n; k++) {
    const m = missionById(`m${k}`);
    if (!m) break;
    const day = runDay(save.outpost, m, won(m.id, save));
    save = { ...save, money: save.money + income(m), outpost: nextProject(day ? day.outpost : save.outpost) };
    save = builds(save, order, bought);
    save = refill(save, 0.5);
    save = kitView(fromKitView(save, shop(save, pending, bought)), 'mech'); // the lab's new weapons owned
    save = refill(save, 1);
    save = loadOut({ ...save, selectedPlane: best(save) });
  }
  const o = save.outpost;
  const base = `${BUILDING_IDS.map((id) => `${id} ${o.buildings[id]}`).join(', ')}; ◆${o.alloy}, $${save.money}; ${JSON.stringify(o.magazine)}`;
  return { save, bought, base };
}

/** `runs` runs of `id` (151–180) with the kit a building pilot owns at that mission, walked in `craft` (default: the best). */
export async function flyMech(id: string, runs = 3, craft?: PlaneId): Promise<{ kit: string; results: RunResult[] }> {
  const k = mechKitAt(Number(id.slice(1))).save;
  const s = craft ? loadOut({ ...k, ownedPlanes: [...k.ownedPlanes, craft], selectedPlane: craft }) : k;
  const results: RunResult[] = [];
  for (let i = 0; i < runs; i++) results.push(await run(id, s));
  const weapons = (s.loadout[s.selectedPlane] ?? []).filter(Boolean).join('/') || 'no weapons';
  const kit = `${s.selectedPlane}, gun ${s.gunLevel}, ${weapons}, armour ${s.equipment.armor}, magazine ${JSON.stringify(s.outpost.magazine)}`;
  return { kit, results };
}
