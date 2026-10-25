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
  missile: string;
  switch: string;
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
  stores: ReadonlyArray<{ id: SecondaryId; short: string; ammo: number; selected: boolean }>;
  buttons: { missile: ButtonStates['missile']; switch: ButtonStates['switch'] };
  /** Keyboard hints engraved on the buttons. */
  keys: { missile: string; switch: string };
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
  keys: { flare: string; special: string; pause: string };
  labels: CockpitLabels;
}
