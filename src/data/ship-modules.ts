// The spacecraft's modules (doc 54): what each weighs, draws or supplies in power, adds to the hull, and where it may
// sit on the 7 × 9 grid. Prices are the shipyard's (doc 55).

export type ModuleId = 'core' | 'capsule' | 'plate' | 'engine' | 'laser' | 'rockets' | 'torpedo' | 'shield' | 'pointdef' | 'reactor';
export const MODULE_IDS: readonly ModuleId[] = Object.freeze(['core', 'capsule', 'plate', 'engine', 'laser', 'rockets', 'torpedo', 'shield', 'pointdef', 'reactor'] as const);
/** What the pilot can buy and place (the core comes with the ship). */
export const PLACEABLE: readonly ModuleId[] = Object.freeze(['capsule', 'plate', 'engine', 'laser', 'rockets', 'torpedo', 'shield', 'pointdef', 'reactor'] as const);

/** Where a module may sit: `front` nothing in front of it, `rear` nothing behind it, `side` an open side. */
export type Placement = 'fixed' | 'front' | 'rear' | 'side' | 'any';

export interface ModuleDef {
  id: ModuleId;
  name: string;
  mass: number;
  /** + supplies, − draws. */
  power: number;
  hull: number;
  thrust: number;
  placement: Placement;
  /** At most this many on the ship (0 = no limit). */
  max: number;
  price: number;
  description: string;
}

export const MODULES: Readonly<Record<ModuleId, ModuleDef>> = Object.freeze({
  core: { id: 'core', name: 'Core', mass: 4, power: 4, hull: 80, thrust: 2, placement: 'fixed', max: 1, price: 0, description: 'Cockpit, a small reactor and one laser. Everything else hangs on it.' },
  capsule: { id: 'capsule', name: 'Front Capsule', mass: 3, power: 0, hull: 40, thrust: 0, placement: 'front', max: 1, price: 60000, description: 'An armoured nose with the radar in it. Nothing may sit in front of it.' },
  plate: { id: 'plate', name: 'Armour Plate', mass: 3, power: 0, hull: 25, thrust: 0, placement: 'any', max: 0, price: 30000, description: 'A block of armour: more hull, more mass, a bigger target.' },
  engine: { id: 'engine', name: 'Engine', mass: 2, power: -1, hull: 6, thrust: 3, placement: 'rear', max: 0, price: 45000, description: 'Thrust. Needs room behind it for the exhaust.' },
  laser: { id: 'laser', name: 'Laser Cannon', mass: 2, power: -1, hull: 6, thrust: 0, placement: 'front', max: 0, price: 55000, description: 'One more barrel, firing straight ahead from where it sits. Needs a clear line in front.' },
  rockets: { id: 'rockets', name: 'Rocket Wing', mass: 2, power: 0, hull: 6, thrust: 0, placement: 'side', max: 0, price: 40000, description: 'A wing with six homing space rockets. Needs an open side.' },
  torpedo: { id: 'torpedo', name: 'Torpedo Bay', mass: 3, power: -1, hull: 8, thrust: 0, placement: 'front', max: 0, price: 70000, description: 'Two homing plasma torpedoes for warships, stations and bosses. The tube needs a clear line in front.' },
  shield: { id: 'shield', name: 'Shield Generator', mass: 2, power: -2, hull: 6, thrust: 0, placement: 'any', max: 0, price: 75000, description: '25 shield points that take hits first and grow back after two quiet seconds.' },
  pointdef: { id: 'pointdef', name: 'Point Defence', mass: 2, power: -1, hull: 6, thrust: 0, placement: 'any', max: 0, price: 50000, description: 'A small turret that shoots down an incoming missile near the ship every few seconds.' },
  reactor: { id: 'reactor', name: 'Reactor', mass: 3, power: 4, hull: 10, thrust: 0, placement: 'any', max: 0, price: 65000, description: 'Four more units of power for engines, lasers and shields.' },
});

export const GRID = Object.freeze({ cols: 7, rows: 9, core: { col: 3, row: 5 } });

/** Shield points per generator, their regrowth per second, and the quiet time before it starts. */
export const SHIELD = Object.freeze({ points: 25, regen: 6, delay: 2 });
/** Point defence (doc 60): how near a missile must come, and each turret's reload. */
export const POINT_DEFENCE = Object.freeze({ range: 150, cooldown: 2.5 });
/** Mission pixels per grid cell. */
export const CELL_PX = 13;

/** The module families with Mk I–V marks (doc 57): each mark upgrades every copy of the module. */
export type ShipMarkFamily = 'plate' | 'engine' | 'shield' | 'rockets' | 'torpedo';
export const SHIP_MARK_FAMILIES: readonly ShipMarkFamily[] = Object.freeze(['plate', 'engine', 'shield', 'rockets', 'torpedo'] as const);
export const MAX_SHIP_MARK = 5;

/** Laser power, levels 1–10 (doc 55): every barrel (the core's and each laser module) fires at this rate and damage. */
export const LASER_LEVELS: readonly { level: number; price: number; shotsPerSec: number; damage: number }[] = Object.freeze([
  { level: 1, price: 0, shotsPerSec: 5, damage: 12 },
  { level: 2, price: 20000, shotsPerSec: 5.5, damage: 14 },
  { level: 3, price: 48000, shotsPerSec: 6, damage: 16 },
  { level: 4, price: 110000, shotsPerSec: 6.5, damage: 18 },
  { level: 5, price: 200000, shotsPerSec: 7, damage: 21 },
  { level: 6, price: 340000, shotsPerSec: 7.5, damage: 24 },
  { level: 7, price: 520000, shotsPerSec: 8, damage: 27 },
  { level: 8, price: 800000, shotsPerSec: 8.5, damage: 30 },
  { level: 9, price: 1150000, shotsPerSec: 9, damage: 33 },
  { level: 10, price: 1600000, shotsPerSec: 9.5, damage: 37 },
]);
export const MAX_LASER_LEVEL = 10;
