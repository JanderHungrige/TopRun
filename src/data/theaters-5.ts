import type { TheaterDef } from './theaters';

// Map 5's theaters (docs 65, 70): under the sea — the Coral Reef, the Kelp Forest, the Wreck Field, the Trench, the
// Abyss; the deeper the map goes, the darker the water.

export const THEATERS_5 = {
  reef: {
    id: 'reef', campaign: 5, index: 20, name: 'Coral Reef', tagline: 'Bright water, sharp teeth', terrain: 'reef', base: 'land',
    palette: {
      sea: '#0f6a7c', seaDeep: '#073a4a', land: '#d8d6aa', landDark: '#a49c72', detail: '#ff8a78',
      accent: '#5ff0e0', cloud: 'rgba(190,255,245,0.08)',
    },
    route: { x0: 120, y0: 610, x1: 420, y1: 540 },
  },
  kelp: {
    id: 'kelp', campaign: 5, index: 21, name: 'Kelp Forest', tagline: 'Lost in the green', terrain: 'kelp', base: 'land',
    palette: {
      sea: '#0e5a52', seaDeep: '#06302c', land: '#9fae84', landDark: '#5e6e4a', detail: '#c8d86a',
      accent: '#8ff07a', cloud: 'rgba(170,255,200,0.07)',
    },
    route: { x0: 500, y0: 600, x1: 800, y1: 520 },
  },
  wrecks: {
    id: 'wrecks', campaign: 5, index: 22, name: 'Wreck Field', tagline: 'Ghost ships', terrain: 'wreck', base: 'land',
    palette: {
      sea: '#0f4660', seaDeep: '#06263a', land: '#a6a89a', landDark: '#6c6e64', detail: '#b8743e',
      accent: '#ffb46b', cloud: 'rgba(200,220,255,0.06)',
    },
    route: { x0: 800, y0: 440, x1: 640, y1: 280 },
  },
  trench: {
    id: 'trench', campaign: 5, index: 23, name: 'The Trench', tagline: 'Into the dark', terrain: 'trench', base: 'land',
    palette: {
      sea: '#0a2a4a', seaDeep: '#04142a', land: '#5f6a78', landDark: '#2c3440', detail: '#8a9aac',
      accent: '#7fb4ff', cloud: 'rgba(160,200,255,0.05)',
    },
    route: { x0: 560, y0: 240, x1: 260, y1: 300 },
  },
  abyss: {
    id: 'abyss', campaign: 5, index: 24, name: 'The Abyss', tagline: 'Where the light ends', terrain: 'abyss', base: 'land',
    palette: {
      sea: '#05101c', seaDeep: '#01060c', land: '#2a2e36', landDark: '#15181e', detail: '#4a5260',
      accent: '#5ff0e0', cloud: 'rgba(95,240,224,0.06)',
    },
    route: { x0: 140, y0: 220, x1: 460, y1: 120 },
  },
} as const satisfies Record<string, TheaterDef>;
