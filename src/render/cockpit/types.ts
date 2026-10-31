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
  switch: string;
  switchTap: string;
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

/** A weapon a key fires next. */
export interface Armed {
  short: string;
  ammo: number;
}

export interface LeftConsoleView {
  plane: PlaneId;
  planeName: string;
  callsign: string;
  radar: { contacts: readonly Contact[]; early: boolean; jammed: boolean };
  hull: { ratio: number; value: number; max: number };
  /** `level` 1–8 (6–8 light cyan over the green row), `level2` the second gun, 0 = none (doc 37). */
  /** `he`: the Bofors 40 mm level, 0 = none (doc 46). */
  cannon: { level: number; level2: number; powered: boolean; powerRatio: number; he: number };
  /** Mounted weapons; `role` A/G tag, `next` = the one the AIR / GROUND key fires next. */
  stores: ReadonlyArray<{ id: SecondaryId; short: string; ammo: number; role: WeaponRole; next: boolean }>;
  buttons: { air: ButtonStates['air']; ground: ButtonStates['ground'] };
  /** What AIR / GROUND fire next, named on the buttons (doc 05); null when nothing of that role has ammo. */
  weapons: { air: Armed | null; ground: Armed | null };
  /** The ground-weapon SWITCH line on the STORES screen, bright when there is something to switch to. */
  swap: { text: string; ready: boolean } | null;
  /** Key caps on the buttons and the STORES bezel for the current input device ('' = none, e.g. touch). */
  keys: { air: string; ground: string; switch: string };
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
