import type { TheaterDef } from './theaters';

// Map 4's theaters (doc 56): space. Low Orbit opens it (wave 5); the rest follow in wave 6.

export const THEATERS_4 = {
  orbit: {
    id: 'orbit', campaign: 4, index: 15, name: 'Low Orbit', tagline: 'Above the blue', terrain: 'space', base: 'land',
    palette: {
      sea: '#05070f', seaDeep: '#020309', land: '#2a3352', landDark: '#151a2c', detail: '#c9d6ff',
      accent: '#7fb4ff', cloud: 'rgba(170,150,255,0.1)',
    },
    route: { x0: 110, y0: 600, x1: 400, y1: 520 },
  },
} as const satisfies Record<string, TheaterDef>;
