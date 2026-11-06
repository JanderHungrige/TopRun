import { maxEquipmentLevel } from '../data/equipment';
import { MAX_HELI_GUN_LEVEL } from '../data/heli-kit';
import { PLANES } from '../data/planes';
import { EQUIPMENT_IDS, HELI_IDS, type CampaignId, type EquipmentId, type GunLevel, type PlaneId } from '../data/types';
import type { SaveData } from './save';
import type { Route } from './state';

// One wallet, two kits (doc 49): the jets fly maps 1–2, the helicopters map 3 with a kit of their own that starts
// from zero. The scenes see a kit view of the save — for the helicopters the jet-kit fields are swapped for the
// helicopter ones — so the hangar, the shop and the loadout code work unchanged on either kit. Pure.

export type Kit = 'jet' | 'heli';

/** What only the helicopters have of their own; their weapons are separate ids, so they need no copy. */
export interface HeliKit {
  selectedPlane: PlaneId;
  gunLevel: GunLevel;
  equipment: Record<EquipmentId, number>;
}

export const kitOf = (c: CampaignId): Kit => (c === 3 ? 'heli' : 'jet');

const noEquipment = (): Record<EquipmentId, number> =>
  Object.fromEntries(EQUIPMENT_IDS.map((id) => [id, 0])) as Record<EquipmentId, number>;

export const freshHeliKit = (): HeliKit => ({ selectedPlane: 'ah64', gunLevel: 1, equipment: noEquipment() });

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const level = (v: unknown, hi: number, lo = 0): number =>
  (typeof v === 'number' && Number.isFinite(v) ? Math.floor(Math.min(hi, Math.max(lo, v))) : lo);

/** The helicopter kit from storage: missing or broken parts fresh; a jet (or unknown) selection → the Apache. */
export function parseHeliKit(v: unknown): HeliKit {
  if (!isRecord(v)) return freshHeliKit();
  const eq = isRecord(v.equipment) ? v.equipment : {};
  const selected = HELI_IDS.find((id) => id === v.selectedPlane) ?? 'ah64';
  return {
    selectedPlane: selected,
    gunLevel: level(v.gunLevel, MAX_HELI_GUN_LEVEL, 1) as GunLevel,
    equipment: Object.fromEntries(EQUIPMENT_IDS.map((id) => [id, level(eq[id], maxEquipmentLevel(id))])) as Record<EquipmentId, number>,
  };
}

/** The save as the scenes of a kit see it. The Apache is free, so the helicopter view always owns it. */
export function kitView(save: SaveData, kit: Kit): SaveData {
  if (kit === 'jet') return save;
  const h = save.heli;
  const owned: PlaneId[] = save.ownedPlanes.includes('ah64') ? save.ownedPlanes : [...save.ownedPlanes, 'ah64'];
  return {
    ...save, kit, ownedPlanes: owned, selectedPlane: h.selectedPlane, gunLevel: h.gunLevel, equipment: h.equipment,
    gun2Level: 0, ammoLevel: 0, incendiaryLevel: 0, heLevel: 0, twinSecondaries: [],
  };
}

/** A view written back: the helicopter fields go into `heli`, the jet fields keep their stored values. */
export function fromKitView(stored: SaveData, view: SaveData): SaveData {
  if (view.kit === 'jet') return view;
  const heli: HeliKit = { selectedPlane: view.selectedPlane, gunLevel: view.gunLevel, equipment: view.equipment };
  return {
    ...view, kit: 'jet', heli, selectedPlane: stored.selectedPlane, gunLevel: stored.gunLevel, equipment: stored.equipment,
    gun2Level: stored.gun2Level, ammoLevel: stored.ammoLevel, incendiaryLevel: stored.incendiaryLevel,
    ammoType: stored.ammoType, heLevel: stored.heLevel, twinSecondaries: stored.twinSecondaries,
  };
}

/** The kit a plane belongs to. */
export const kitOfPlane = (id: PlaneId): Kit => (PLANES[id].kind === 'heli' ? 'heli' : 'jet');

/** The kit a route shows: a mission's own (takeoff, mission, debrief); the hangar keeps the kit it was opened from and
 *  the campaign map sets its own; every other scene shows the jets. */
export function routeKit(route: Route, current: Kit): Kit {
  if (route.to === 'takeoff' || route.to === 'mission' || route.to === 'debrief') return kitOf(route.mission.campaign);
  if (route.to === 'hangar' || route.to === 'map') return current;
  return 'jet';
}
