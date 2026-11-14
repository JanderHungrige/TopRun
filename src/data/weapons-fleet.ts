import { HELI_PRICE } from './heli-kit';
import { SUB_PRICE } from './sub-kit';
import { HELI_IDS, SUB_IDS, type SecondaryId } from './types';
import type { SecondaryDef } from './weapons';

// The fleets' newer station weapons (docs 99, 101): the helicopters' pulse laser, sonic cannon and drone swarm, the subs'
// torpedo swarm, sonar pulse, decoy drone and drift net. Part of SECONDARIES (weapons.ts).

type FleetWeapon = 'pulselaser' | 'sonic' | 'drones' | 'torpswarm' | 'sonarpulse' | 'decoy' | 'net';

export const FLEET_SECONDARIES: Readonly<Record<FleetWeapon & SecondaryId, SecondaryDef>> = {
  // The helicopters' new station weapons (doc 99): the laser and the sonic cannon run on energy that recharges; for the
  // laser `damage` is one pulse's, for the sonic cannon `radius` is the wave's reach.
  pulselaser: {
    id: 'pulselaser', role: 'air', name: 'HEL Pulse Laser', short: 'LASER', price: 25000 * HELI_PRICE, ammoPerSlot: 5,
    damage: 25, radius: 0, hits: 'any', behavior: 'pulse', cooldown: 0.4, speed: 0,
    turnRate: 0, planes: HELI_IDS, description: 'Fires a burst of four laser pulses at the nearest target ahead. Never misses; runs on energy that recharges.', campaign: 3,
    recharge: 3.5,
  },
  sonic: {
    id: 'sonic', role: 'ground', name: 'Sonic Cannon', short: 'SONIC', price: 25000 * HELI_PRICE, ammoPerSlot: 4,
    damage: 40, radius: 260, hits: 'any', behavior: 'wave', cooldown: 0.6, speed: 0,
    turnRate: 0, planes: HELI_IDS, description: 'An ultrasonic wave that stuns everything ahead and wipes out enemy fire in its path. Recharges.', campaign: 3,
    recharge: 4,
  },
  drones: {
    id: 'drones', role: 'ground', name: 'Drone Swarm', short: 'DRONES', price: 20000 * HELI_PRICE, ammoPerSlot: 3,
    damage: 90, radius: 0, hits: 'any', behavior: 'swarm', cooldown: 0.6, speed: 270,
    turnRate: 5, planes: HELI_IDS, description: 'Launches three small drones that hunt down targets on their own, air or ground.', campaign: 3,
  },
  // Doc 101: the subs' new station weapons; the sonar pulse runs on energy, its `radius` is the pulse's reach, the net's
  // `radius` its size.
  torpswarm: {
    id: 'torpswarm', role: 'ground', name: 'Torpedo Swarm', short: 'SWARM', price: 20000 * SUB_PRICE, ammoPerSlot: 2,
    damage: 40, radius: 0, hits: 'any', behavior: 'torps', cooldown: 0.6, speed: 240,
    turnRate: 4.5, planes: SUB_IDS, description: 'Six small homing torpedoes per salvo that fan out and hunt anything in the water.', campaign: 4,
  },
  sonarpulse: {
    id: 'sonarpulse', role: 'ground', name: 'Sonar Pulse', short: 'PULSE', price: 25000 * SUB_PRICE, ammoPerSlot: 4,
    damage: 35, radius: 220, hits: 'any', behavior: 'wave', cooldown: 0.6, speed: 0,
    turnRate: 0, planes: SUB_IDS, description: 'A pressure wave all round the sub that stuns everything it passes and wipes out enemy torpedoes. Recharges.', campaign: 4,
    recharge: 4,
  },
  decoy: {
    id: 'decoy', role: 'air', name: 'Decoy Drone', short: 'DECOY', price: 15000 * SUB_PRICE, ammoPerSlot: 4,
    damage: 0, radius: 0, hits: 'any', behavior: 'decoy', cooldown: 0.8, speed: 0,
    turnRate: 0, planes: SUB_IDS, description: 'A small drone that swims ahead and sounds like a sub: enemy guns and torpedoes go for it instead of you.', campaign: 4,
  },
  net: {
    id: 'net', role: 'ground', name: 'Drift Net', short: 'NET', price: 18000 * SUB_PRICE, ammoPerSlot: 3,
    damage: 0, radius: 70, hits: 'any', behavior: 'net', cooldown: 0.8, speed: 0,
    turnRate: 0, planes: SUB_IDS, description: 'A net thrown ahead that drifts down slowly. Anything swimming into it is slowed right down.', campaign: 4,
  },
};
