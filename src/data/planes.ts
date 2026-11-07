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
  /** 1 = sold from the start; 2 = sold once map 2 is open (doc 36); 3 = a map-3 helicopter (doc 49); 5 = a sub (doc 66). */
  campaign: CampaignId;
  /** Jets fly maps 1–2, helicopters map 3 (doc 49), the spacecraft map 4 (doc 54), the subs map 5 (doc 66). */
  kind: 'jet' | 'heli' | 'ship' | 'sub';
}

export const PLANES: Readonly<Record<PlaneId, PlaneDef>> = Object.freeze({
  f16: {
    id: 'f16', name: 'F-16 Fighting Falcon', short: 'F-16', nickname: 'Viper',
    price: 0, hull: 100, speed: 330, hardpoints: 2, gunDamageMul: 1.0,
    special: 'roll', specialName: 'Barrel Roll', specialCooldown: 5, specialDuration: 0.7,
    description: 'Light, agile multirole fighter. Two hardpoints and a quick evasive barrel roll.', campaign: 1, kind: 'jet',
  },
  f14: {
    id: 'f14', name: 'F-14 Tomcat', short: 'F-14', nickname: 'Tomcat',
    price: 22000, hull: 160, speed: 290, hardpoints: 4, gunDamageMul: 1.2,
    special: 'wingman', specialName: 'Wingman', specialCooldown: 25, specialDuration: 8,
    description: 'Heavy swing-wing fleet defender. Four hardpoints, carries the AIM-54 Phoenix and calls in a wingman.', campaign: 1, kind: 'jet',
  },
  sr71: {
    id: 'sr71', name: 'SR-71 Blackbird', short: 'SR-71', nickname: 'Blackbird',
    price: 65000, hull: 130, speed: 400, hardpoints: 3, gunDamageMul: 1.4,
    special: 'dash', specialName: 'Mach 3 Dash', specialCooldown: 20, specialDuration: 3,
    description: 'The fastest jet ever built, refitted for combat. Mach 3 Dash rams through anything in its path.', campaign: 1, kind: 'jet',
  },
  a10: {
    id: 'a10', name: 'A-10 Warthog', short: 'A-10', nickname: 'Warthog',
    price: 90000, hull: 220, speed: 270, hardpoints: 4, gunDamageMul: 1.5,
    special: 'cannon', specialName: 'GAU-8 Burst', specialCooldown: 16, specialDuration: 3,
    description: 'Armoured tank killer built around its 30 mm cannon. Slow and nearly indestructible; the GAU-8 burst shreds ground and air alike.',
    campaign: 2, kind: 'jet',
  },
  f35: {
    id: 'f35', name: 'F-35 Lightning II', short: 'F-35', nickname: 'Lightning',
    price: 140000, hull: 170, speed: 360, hardpoints: 4, gunDamageMul: 1.3,
    special: 'stealth', specialName: 'Stealth', specialCooldown: 18, specialDuration: 8,
    description: 'Stealth multirole fighter. Goes invisible to radar: while stealthed, the enemy holds fire.',
    campaign: 2, kind: 'jet',
  },
  tornado: {
    id: 'tornado', name: 'Tornado', short: 'Tornado', nickname: 'Tornado',
    price: 75000, hull: 190, speed: 350, hardpoints: 4, gunDamageMul: 1.3,
    special: 'nuke', specialName: 'Nuclear Strike', specialCooldown: 55, specialDuration: 1.2,
    description: 'Veteran swing-wing striker for hardcore pilots: so old it slowly loses hull every mission. Carries a nuclear missile.',
    campaign: 2, kind: 'jet',
  },
  // Map 3 (doc 49): the helicopters; the Apache is free.
  ah64: {
    id: 'ah64', name: 'AH-64 Apache', short: 'AH-64', nickname: 'Apache',
    price: 0, hull: 140, speed: 240, hardpoints: 4, gunDamageMul: 1.0,
    special: 'longbow', specialName: 'Longbow Salvo', specialCooldown: 14, specialDuration: 0.4,
    description: 'Armoured attack helicopter. A 30 mm chain gun under the nose, four stations and the Longbow radar.',
    campaign: 3, kind: 'heli',
  },
  // Doc 51: the rest of the fleet, bought in the helicopters' hangar.
  tiger: {
    id: 'tiger', name: 'Eurocopter Tiger', short: 'TIGER', nickname: 'Tiger',
    price: 1200000, hull: 125, speed: 265, hardpoints: 4, gunDamageMul: 1.2,
    special: 'gunpods', specialName: 'Gun Pods', specialCooldown: 15, specialDuration: 8,
    description: 'Nimble European attack helicopter. Hard-hitting gun, four stations, and gun pods that add a level of firepower.',
    campaign: 3, kind: 'heli',
  },
  rah66: {
    id: 'rah66', name: 'RAH-66 Comanche', short: 'RAH-66', nickname: 'Comanche',
    price: 1800000, hull: 115, speed: 285, hardpoints: 4, gunDamageMul: 1.0,
    special: 'stealth', specialName: 'Low Observable', specialCooldown: 18, specialDuration: 6,
    description: 'Stealth scout helicopter. The fastest rotor in the hangar; going low-observable makes the enemy hold fire.',
    campaign: 3, kind: 'heli',
  },
  mi24: {
    id: 'mi24', name: 'Mi-24 Hind', short: 'MI-24', nickname: 'Hind',
    price: 2800000, hull: 220, speed: 215, hardpoints: 6, gunDamageMul: 1.1,
    special: 'armour', specialName: 'Flying Tank', specialCooldown: 16, specialDuration: 3,
    description: 'The flying tank. Heavy armour, six stations and a few seconds where nothing gets through. Slow to turn.',
    campaign: 3, kind: 'heli',
  },
  // Map 4 (doc 54): one ship; hull, speed, guns and stations come from its modules.
  starship: {
    id: 'starship', name: 'Spacecraft', short: 'SHIP', nickname: 'Ship',
    price: 0, hull: 60, speed: 290, hardpoints: 0, gunDamageMul: 1.0,
    special: 'gunpods', specialName: 'Overcharge', specialCooldown: 16, specialDuration: 6,
    description: 'One ship that grows with you: every module you place changes its shape, hull, speed and guns.',
    campaign: 4, kind: 'ship',
  },
  // Map 5 (doc 66): the attack subs; the Type 212 is free.
  u212: {
    id: 'u212', name: 'Type 212', short: 'U212', nickname: 'Type 212',
    price: 0, hull: 150, speed: 230, hardpoints: 4, gunDamageMul: 1.0,
    special: 'sonar', specialName: 'Sonar Burst', specialCooldown: 12, specialDuration: 0.6,
    description: 'Quiet German attack sub with fuel-cell drive. Four tubes, a harpoon gun and an active sonar that clears the water around it.',
    campaign: 5, kind: 'sub',
  },
  // Doc 69: the rest of the fleet, bought in the SUB PEN.
  seawolf: {
    id: 'seawolf', name: 'Seawolf', short: 'SEAWOLF', nickname: 'Seawolf',
    price: 2600000, hull: 135, speed: 270, hardpoints: 4, gunDamageMul: 1.2,
    special: 'dash', specialName: 'Supercavitation', specialCooldown: 18, specialDuration: 2.5,
    description: 'The fastest hunter in the pen. Hard-hitting gun, and a burst of speed in a bubble sheath that rams through anything.',
    campaign: 5, kind: 'sub',
  },
  virginia: {
    id: 'virginia', name: 'Virginia', short: 'VIRGINIA', nickname: 'Virginia',
    price: 4000000, hull: 140, speed: 250, hardpoints: 4, gunDamageMul: 1.0,
    special: 'stealth', specialName: 'Silent Running', specialCooldown: 18, specialDuration: 6,
    description: 'Quiet modern attack sub. Running silent, she slips off every sonar: the enemy holds fire and torpedoes lose her.',
    campaign: 5, kind: 'sub',
  },
  akula: {
    id: 'akula', name: 'Akula', short: 'AKULA', nickname: 'Akula',
    price: 6400000, hull: 230, speed: 205, hardpoints: 6, gunDamageMul: 1.1,
    special: 'armour', specialName: 'Double Hull', specialCooldown: 16, specialDuration: 3,
    description: 'Big, broad and built twice over. Six tubes and a few seconds where nothing gets through. Slow to turn.',
    campaign: 5, kind: 'sub',
  },
});

/** A record with one entry per plane (jets, helicopters, the ship and the subs), built from PLANE_IDS. */
export function perPlane<T>(make: (id: PlaneId) => T): Record<PlaneId, T> {
  return Object.fromEntries(PLANE_IDS.map((id) => [id, make(id)])) as Record<PlaneId, T>;
}
