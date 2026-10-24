import type { PlaneId, SpecialId } from './types';

export interface PlaneDef {
  id: PlaneId;
  name: string;
  short: string;
  nickname: string;
  price: number;
  hull: number;
  speed: number;
  hardpoints: number;
  gunDamageMul: number;
  special: SpecialId;
  specialName: string;
  specialCooldown: number;
  specialDuration: number;
  description: string;
}

export const PLANES: Readonly<Record<PlaneId, PlaneDef>> = Object.freeze({
  f16: {
    id: 'f16', name: 'F-16 Fighting Falcon', short: 'F-16', nickname: 'Viper',
    price: 0, hull: 100, speed: 330, hardpoints: 2, gunDamageMul: 1.0,
    special: 'roll', specialName: 'Barrel Roll', specialCooldown: 5, specialDuration: 0.7,
    description: 'Light, agile multirole fighter. Two hardpoints and a quick evasive barrel roll.',
  },
  f14: {
    id: 'f14', name: 'F-14 Tomcat', short: 'F-14', nickname: 'Tomcat',
    price: 22000, hull: 160, speed: 290, hardpoints: 4, gunDamageMul: 1.2,
    special: 'wingman', specialName: 'Wingman', specialCooldown: 25, specialDuration: 8,
    description: 'Heavy swing-wing fleet defender. Four hardpoints, carries the AIM-54 Phoenix and calls in a wingman.',
  },
  sr71: {
    id: 'sr71', name: 'SR-71 Blackbird', short: 'SR-71', nickname: 'Blackbird',
    price: 65000, hull: 130, speed: 400, hardpoints: 3, gunDamageMul: 1.4,
    special: 'dash', specialName: 'Mach 3 Dash', specialCooldown: 20, specialDuration: 3,
    description: 'The fastest jet ever built, refitted for combat. Mach 3 Dash rams through anything in its path.',
  },
});
