import type { TheaterDef } from './theaters';

// Map 6's theaters (doc 78): the jungle planet — the Landing Zone, the Rainforest Canopy, the Mangrove Swamp, the Temple
// Ruins, the Hive. The whole planet is jungle: the map's "sea" is the canopy, the land each theater's clearings.

export const THEATERS_6 = {
  landing: {
    id: 'landing', campaign: 6, index: 25, name: 'Landing Zone', tagline: 'Boots on the ground', terrain: 'clearing', base: 'land',
    palette: {
      sea: '#5a3a24', seaDeep: '#3f2818', land: '#8a5a34', landDark: '#4e7a32', detail: '#c99a62',
      accent: '#ffd25a', cloud: 'rgba(210,255,190,0.12)',
    },
    route: { x0: 120, y0: 618, x1: 400, y1: 556 },
  },
  canopy: {
    id: 'canopy', campaign: 6, index: 26, name: 'Rainforest Canopy', tagline: 'Under the green roof', terrain: 'rainforest', base: 'land',
    palette: {
      sea: '#1f3a1c', seaDeep: '#132612', land: '#2f5a26', landDark: '#1c3a18', detail: '#6fae4a',
      accent: '#c8ff6a', cloud: 'rgba(160,230,140,0.12)',
    },
    route: { x0: 478, y0: 616, x1: 800, y1: 556 },
  },
  swamp: {
    id: 'swamp', campaign: 6, index: 27, name: 'Mangrove Swamp', tagline: 'Mud to the knees', terrain: 'swamp', base: 'land',
    palette: {
      sea: '#1d2a22', seaDeep: '#101a14', land: '#3d4a2c', landDark: '#26301c', detail: '#7d8f5a',
      accent: '#9effd2', cloud: 'rgba(200,230,210,0.16)',
    },
    route: { x0: 812, y0: 466, x1: 690, y1: 296 },
  },
  ruins: {
    id: 'ruins', campaign: 6, index: 28, name: 'Temple Ruins', tagline: 'Stones that shoot back', terrain: 'ruins', base: 'land',
    palette: {
      sea: '#3a4a2a', seaDeep: '#26321c', land: '#8c8a74', landDark: '#5c5a48', detail: '#c4c0a0',
      accent: '#ffb84a', cloud: 'rgba(230,240,200,0.1)',
    },
    route: { x0: 592, y0: 246, x1: 262, y1: 300 },
  },
  hive: {
    id: 'hive', campaign: 6, index: 29, name: 'The Hive', tagline: 'Into the nest', terrain: 'hive', base: 'land',
    palette: {
      sea: '#2a1a2a', seaDeep: '#180e18', land: '#5a3450', landDark: '#3a2034', detail: '#a06a90',
      accent: '#ff7ad2', cloud: 'rgba(255,170,220,0.1)',
    },
    route: { x0: 150, y0: 220, x1: 470, y1: 120 },
  },
} as const satisfies Record<string, TheaterDef>;
