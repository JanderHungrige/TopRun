import { maxEquipmentLevel } from '../data/equipment';
import { FLEET, isFleet, type FleetKitId } from '../data/fleet';
import { PLANES } from '../data/planes';
import { EQUIPMENT_IDS, type CampaignId, type EquipmentId, type GunLevel, type PlaneId } from '../data/types';
import { knownWeapons, researchedMark } from './lab';
import type { SaveData } from './save';
import type { Route } from './state';

// One wallet, several kits (docs 49, 66, 74, 79): the jets fly maps 1–2, the helicopters map 3, the subs map 4, the ship
// map 5, the mechs map 6; the helicopters, the subs and the mechs are fleet kits of their own that start from zero. The
// scenes see a kit view of the save — for a fleet kit the jet-kit fields are swapped for the fleet's — so the hangar, the
// shop and the loadout code work unchanged on every kit. The mechs' weapons and marks come from the lab (doc 83). Pure.

export type Kit = 'jet' | FleetKitId | 'ship';

/** What only a fleet kit has of its own; its weapons are separate ids, so they need no copy. */
export interface FleetKit {
  selectedPlane: PlaneId;
  gunLevel: GunLevel;
  equipment: Record<EquipmentId, number>;
}

const KIT_OF: Readonly<Record<CampaignId, Kit>> = { 1: 'jet', 2: 'jet', 3: 'heli', 4: 'sub', 5: 'ship', 6: 'mech' };

export const kitOf = (c: CampaignId): Kit => KIT_OF[c];

const noEquipment = (): Record<EquipmentId, number> =>
  Object.fromEntries(EQUIPMENT_IDS.map((id) => [id, 0])) as Record<EquipmentId, number>;

export const freshFleetKit = (kit: FleetKitId): FleetKit => ({ selectedPlane: FLEET[kit].starter, gunLevel: 1, equipment: noEquipment() });

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const level = (v: unknown, hi: number, lo = 0): number =>
  (typeof v === 'number' && Number.isFinite(v) ? Math.floor(Math.min(hi, Math.max(lo, v))) : lo);

/** A fleet kit from storage: missing or broken parts fresh; a craft of another kit (or unknown) → the free one. */
export function parseFleetKit(kit: FleetKitId, v: unknown): FleetKit {
  if (!isRecord(v)) return freshFleetKit(kit);
  const f = FLEET[kit];
  const eq = isRecord(v.equipment) ? v.equipment : {};
  const selected = f.craft.find((id) => id === v.selectedPlane) ?? f.starter;
  return {
    selectedPlane: selected,
    gunLevel: level(v.gunLevel, f.maxGun, 1) as GunLevel,
    equipment: Object.fromEntries(EQUIPMENT_IDS.map((id) => [id, level(eq[id], maxEquipmentLevel(id))])) as Record<EquipmentId, number>,
  };
}

const owning = (save: SaveData, id: PlaneId): PlaneId[] => (save.ownedPlanes.includes(id) ? save.ownedPlanes : [...save.ownedPlanes, id]);

/** The save as the scenes of a kit see it. A fleet's free craft and the ship always count as owned. */
export function kitView(save: SaveData, kit: Kit): SaveData {
  if (kit === 'jet') return save;
  const jetOnly = { gun2Level: 0, ammoLevel: 0, incendiaryLevel: 0, heLevel: 0, twinSecondaries: [] };
  if (kit === 'ship') {
    return {
      ...save, ...jetOnly, kit, ownedPlanes: owning(save, 'starship'), selectedPlane: 'starship',
      gunLevel: save.ship.laserLevel as GunLevel, equipment: noEquipment(),
    };
  }
  const k = save[kit];
  const view = { ...save, ...jetOnly, kit, ownedPlanes: owning(save, FLEET[kit].starter), selectedPlane: k.selectedPlane, gunLevel: k.gunLevel, equipment: k.equipment };
  return kit === 'mech' ? withLab(view) : view;
}

/** The mech kit's weapons are the lab's: every known one owned, each at its invented mark (doc 83). */
function withLab(view: SaveData): SaveData {
  const known = knownWeapons(view.outpost);
  const weaponLevels = { ...view.weaponLevels };
  for (const id of known) weaponLevels[id] = researchedMark(view.outpost, id);
  return { ...view, ownedSecondaries: [...view.ownedSecondaries.filter((id) => !known.includes(id)), ...known], weaponLevels };
}

/** A view written back: a fleet kit's fields go into its own entry, the jet fields keep their stored values. */
export function fromKitView(stored: SaveData, view: SaveData): SaveData {
  if (view.kit === 'jet') return view;
  const own = (kit: FleetKitId): FleetKit =>
    (view.kit === kit ? { selectedPlane: view.selectedPlane, gunLevel: view.gunLevel, equipment: view.equipment } : view[kit]);
  return {
    ...view, kit: 'jet', heli: own('heli'), sub: own('sub'), mech: own('mech'), selectedPlane: stored.selectedPlane, gunLevel: stored.gunLevel,
    equipment: stored.equipment, gun2Level: stored.gun2Level, ammoLevel: stored.ammoLevel, incendiaryLevel: stored.incendiaryLevel,
    ammoType: stored.ammoType, heLevel: stored.heLevel, twinSecondaries: stored.twinSecondaries,
  };
}

/** The fleet table of the kit on show, or null for the jets and the ship. */
export const fleetOf = (save: SaveData): (typeof FLEET)[FleetKitId] | null => (isFleet(save.kit) ? FLEET[save.kit] : null);

/** The kit a plane belongs to. */
export const kitOfPlane = (id: PlaneId): Kit => PLANES[id].kind;

/** The kit a route shows: a mission's own (takeoff, mission, debrief); the hangar the kit of the world the pilot is on
 *  (`home`: from the base too, doc 76); the campaign map sets its own; every other scene shows the jets. */
export function routeKit(route: Route, current: Kit, home: CampaignId): Kit {
  if (route.to === 'takeoff' || route.to === 'mission' || route.to === 'debrief') return kitOf(route.mission.campaign);
  if (route.to === 'hangar') return kitOf(home);
  if (route.to === 'map') return current;
  return 'jet';
}
