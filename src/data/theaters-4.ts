import type { TheaterDef } from './theaters';

// Map 4's theaters (docs 56, 58): space — Low Orbit, the Asteroid Belt, the Lunar Front, the Ring Giant, Deep Space.

export const THEATERS_4 = {
  orbit: {
    id: 'orbit', campaign: 4, index: 15, name: 'Low Orbit', tagline: 'Above the blue', terrain: 'space', base: 'land',
    palette: {
      sea: '#05070f', seaDeep: '#020309', land: '#2a3352', landDark: '#151a2c', detail: '#c9d6ff',
      accent: '#7fb4ff', cloud: 'rgba(170,150,255,0.1)',
    },
    route: { x0: 110, y0: 600, x1: 400, y1: 520 },
  },
  belt: {
    id: 'belt', campaign: 4, index: 16, name: 'Asteroid Belt', tagline: 'Rocks with guns', terrain: 'belt', base: 'land',
    palette: {
      sea: '#07080d', seaDeep: '#030407', land: '#5a4a3c', landDark: '#3b3029', detail: '#9c8a74',
      accent: '#ffb46b', cloud: 'rgba(255,180,120,0.07)',
    },
    route: { x0: 480, y0: 610, x1: 800, y1: 560 },
  },
  moon: {
    id: 'moon', campaign: 4, index: 17, name: 'Lunar Front', tagline: 'Dust and craters', terrain: 'lunar', base: 'land',
    palette: {
      sea: '#0a0b10', seaDeep: '#05060a', land: '#8a8d94', landDark: '#5d6068', detail: '#c4c7ce',
      accent: '#e6edf7', cloud: 'rgba(255,255,255,0.05)',
    },
    route: { x0: 810, y0: 460, x1: 700, y1: 290 },
  },
  rings: {
    id: 'rings', campaign: 4, index: 18, name: 'Ring Giant', tagline: 'Ice in the rings', terrain: 'belt', base: 'land',
    palette: {
      sea: '#070a14', seaDeep: '#03050b', land: '#9fb4c8', landDark: '#60758c', detail: '#e8f2ff',
      accent: '#ffd27a', cloud: 'rgba(255,210,140,0.08)',
    },
    route: { x0: 580, y0: 250, x1: 260, y1: 300 },
  },
  deep: {
    id: 'deep', campaign: 4, index: 19, name: 'Deep Space', tagline: 'Past the last star', terrain: 'space', base: 'land',
    palette: {
      sea: '#090410', seaDeep: '#040108', land: '#3a2440', landDark: '#2a1a30', detail: '#7a6488',
      accent: '#ff6a8a', cloud: 'rgba(255,90,140,0.1)',
    },
    route: { x0: 140, y0: 220, x1: 460, y1: 120 },
  },
} as const satisfies Record<string, TheaterDef>;
