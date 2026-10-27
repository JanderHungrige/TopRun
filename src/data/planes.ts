import { PLANE_IDS, type CampaignId, type PlaneId, type SpecialId } from './types';

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
  /** 1 = sold from the start; 2 = sold once map 2 is open (doc 36). */
  campaign: CampaignId;
}

export const PLANES: Readonly<Record<PlaneId, PlaneDef>> = Object.freeze({
  f16: {
    id: 'f16', name: 'F-16 Fighting Falcon', short: 'F-16', nickname: 'Viper',
    price: 0, hull: 100, speed: 330, hardpoints: 2, gunDamageMul: 1.0,
    special: 'roll', specialName: 'Barrel Roll', specialCooldown: 5, specialDuration: 0.7,
    description: 'Light, agile multirole fighter. Two hardpoints and a quick evasive barrel roll.', campaign: 1,
  },
  f14: {
    id: 'f14', name: 'F-14 Tomcat', short: 'F-14', nickname: 'Tomcat',
    price: 22000, hull: 160, speed: 290, hardpoints: 4, gunDamageMul: 1.2,
    special: 'wingman', specialName: 'Wingman', specialCooldown: 25, specialDuration: 8,
    description: 'Heavy swing-wing fleet defender. Four hardpoints, carries the AIM-54 Phoenix and calls in a wingman.', campaign: 1,
  },
  sr71: {
    id: 'sr71', name: 'SR-71 Blackbird', short: 'SR-71', nickname: 'Blackbird',
    price: 65000, hull: 130, speed: 400, hardpoints: 3, gunDamageMul: 1.4,
    special: 'dash', specialName: 'Mach 3 Dash', specialCooldown: 20, specialDuration: 3,
    description: 'The fastest jet ever built, refitted for combat. Mach 3 Dash rams through anything in its path.', campaign: 1,
  },
  a10: {
    id: 'a10', name: 'A-10 Warthog', short: 'A-10', nickname: 'Warthog',
    price: 90000, hull: 220, speed: 270, hardpoints: 4, gunDamageMul: 1.5,
    special: 'cannon', specialName: 'GAU-8 Burst', specialCooldown: 16, specialDuration: 3,
    description: 'Armoured tank killer built around its 30 mm cannon. Slow and nearly indestructible; the GAU-8 burst shreds ground and air alike.',
    campaign: 2,
  },
  f35: {
    id: 'f35', name: 'F-35 Lightning II', short: 'F-35', nickname: 'Lightning',
    price: 140000, hull: 170, speed: 360, hardpoints: 4, gunDamageMul: 1.3,
    special: 'stealth', specialName: 'Stealth', specialCooldown: 18, specialDuration: 8,
    description: 'Stealth multirole fighter. Goes invisible to radar: while stealthed, the enemy holds fire.',
    campaign: 2,
  },
  tornado: {
    id: 'tornado', name: 'Tornado', short: 'Tornado', nickname: 'Tornado',
    price: 75000, hull: 190, speed: 350, hardpoints: 4, gunDamageMul: 1.3,
    special: 'nuke', specialName: 'Nuclear Strike', specialCooldown: 55, specialDuration: 1.2,
    description: 'Veteran swing-wing striker for hardcore pilots: so old it slowly loses hull every mission. Carries a nuclear missile.',
    campaign: 2,
  },
});

/** A record with one entry per jet, built from PLANE_IDS. */
export function perPlane<T>(make: (id: PlaneId) => T): Record<PlaneId, T> {
  return Object.fromEntries(PLANE_IDS.map((id) => [id, make(id)])) as Record<PlaneId, T>;
}
