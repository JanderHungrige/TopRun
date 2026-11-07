import type { TheaterDef } from './theaters';

// Map 5's theaters (doc 65): under the sea — the Coral Reef first; the other four come in wave 2.

export const THEATERS_5 = {
  reef: {
    id: 'reef', campaign: 5, index: 20, name: 'Coral Reef', tagline: 'Bright water, sharp teeth', terrain: 'reef', base: 'land',
    palette: {
      sea: '#0f6a7c', seaDeep: '#073a4a', land: '#d8d6aa', landDark: '#a49c72', detail: '#ff8a78',
      accent: '#5ff0e0', cloud: 'rgba(190,255,245,0.08)',
    },
    route: { x0: 120, y0: 610, x1: 420, y1: 540 },
  },
} as const satisfies Record<string, TheaterDef>;
