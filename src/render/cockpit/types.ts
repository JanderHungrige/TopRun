import type { WeaponRole } from '../../data/weapons';
import type { PlaneId, SecondaryId } from '../../data/types';
import type { ButtonStates, Contact, WarningLights } from '../../game/cockpit';

/** Every word painted on the consoles, already translated by the scene (doc 07). */
export interface CockpitLabels {
  radar: string;
  early: string;
  hull: string;
  cannon: string;
  power: string;
  stores: string;
  noStores: string;
  air: string;
  ground: string;
  flare: string;
  special: string;
  pause: string;
  objective: string;
  kills: string;
  cash: string;
  route: string;
  empty: string;
  none: string;
  warnMissile: string;
  warnLowHull: string;
  warnBoss: string;
  warnPower: string;
  warnEcm: string;
  warnDmgCtrl: string;
}

export interface LeftConsoleView {
  plane: PlaneId;
  planeName: string;
  callsign: string;
  radar: { contacts: readonly Contact[]; early: boolean };
  hull: { ratio: number; value: number; max: number };
  cannon: { level: number; powered: boolean; powerRatio: number };
  /** Mounted weapons; `role` A/G tag, `next` = the one the AIR / GROUND key fires next. */
  stores: ReadonlyArray<{ id: SecondaryId; short: string; ammo: number; role: WeaponRole; next: boolean }>;
  buttons: { air: ButtonStates['air']; ground: ButtonStates['ground'] };
  /** Key caps on the buttons for the current input device ('' = none, e.g. touch). */
  keys: { air: string; ground: string };
  labels: CockpitLabels;
}

export interface RightConsoleView {
  missionNumber: number;
  missionName: string;
  objective: string;
  progress: { current: number; required: number } | null;
  kills: number;
  cash: string;
  route: number;
  boss: { name: string; title: string; ratio: number; enraged: boolean } | null;
  warnings: WarningLights;
  flare: { state: ButtonStates['flare']; count: number };
  special: ButtonStates['special'] & { name: string };
  /** Plane attitude for the artificial horizon: bank −1..1, forward 0..1 (nose-down pitch while pushing ahead). */
  attitude: { bank: number; forward: number };
  /** Key caps for the current input device ('' = none). */
  keys: { flare: string; special: string; pause: string };
  labels: CockpitLabels;
}
