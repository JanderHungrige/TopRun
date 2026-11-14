import type { TheaterDef } from './theaters';

// Map 7's theaters (doc 102): the alien steppe of Kharsa — the Sea of Grass, the Salt Flats, the Red Badlands, the Barrow
// Fields, the Crater. The whole planet is steppe: the map's "sea" is the dry grass, the land each theater's ground.

export const THEATERS_7 = {
  grass: {
    id: 'grass', campaign: 7, index: 30, name: 'Sea of Grass', tagline: 'Waves of gold', terrain: 'grass', base: 'land',
    palette: {
      sea: '#b08a3e', seaDeep: '#8a6a2c', land: '#c9a24e', landDark: '#7c8a3a', detail: '#ecd27e',
      accent: '#ffe27a', cloud: 'rgba(255,240,200,0.14)',
    },
    route: { x0: 110, y0: 600, x1: 400, y1: 632 },
  },
  saltflats: {
    id: 'saltflats', campaign: 7, index: 31, name: 'Salt Flats', tagline: 'White and blinding', terrain: 'salt', base: 'land',
    palette: {
      sea: '#c8c4b4', seaDeep: '#a6a294', land: '#e8e4d8', landDark: '#b4b0a2', detail: '#ffffff',
      accent: '#7ad8ff', cloud: 'rgba(255,255,255,0.18)',
    },
    route: { x0: 486, y0: 616, x1: 806, y1: 540 },
  },
  badlands: {
    id: 'badlands', campaign: 7, index: 32, name: 'Red Badlands', tagline: 'Mesas and gullies', terrain: 'badlands', base: 'land',
    palette: {
      sea: '#8a4a2e', seaDeep: '#6a3420', land: '#b4643a', landDark: '#7a3e24', detail: '#e09a62',
      accent: '#ffb35a', cloud: 'rgba(255,210,170,0.12)',
    },
    route: { x0: 820, y0: 450, x1: 650, y1: 300 },
  },
  barrows: {
    id: 'barrows', campaign: 7, index: 33, name: 'Barrow Fields', tagline: 'Dust over the old mounds', terrain: 'barrows', base: 'land',
    palette: {
      sea: '#6e6a3e', seaDeep: '#55522e', land: '#8c8a52', landDark: '#5e6236', detail: '#bcb880',
      accent: '#e8d070', cloud: 'rgba(230,220,180,0.18)',
    },
    route: { x0: 570, y0: 240, x1: 250, y1: 290 },
  },
  impact: {
    id: 'impact', campaign: 7, index: 34, name: 'The Crater', tagline: 'Where they came down', terrain: 'impact', base: 'land',
    palette: {
      sea: '#2e2634', seaDeep: '#1c1622', land: '#463a4e', landDark: '#2a2230', detail: '#9a7ab4',
      accent: '#c77dff', cloud: 'rgba(200,160,255,0.12)',
    },
    route: { x0: 150, y0: 210, x1: 470, y1: 116 },
  },
} as const satisfies Record<string, TheaterDef>;
