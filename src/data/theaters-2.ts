import type { TheaterDef } from './theaters';

// The five theaters of map 2 (doc 35): a new region, generic names. They reuse the map-1 terrain styles in new
// palettes; routes mirror map 1's left-to-right, so map 2 starts bottom right and ends bottom left.

export const THEATERS_2 = {
  northsea: {
    id: 'northsea', campaign: 2, index: 5, name: 'North Sea Rigs', tagline: 'Storm over the rigs', terrain: 'storm', base: 'sea',
    palette: {
      sea: '#2c4a55', seaDeep: '#1f3741', land: '#6b7069', landDark: '#474c47', detail: '#a9c0c4',
      accent: '#9fe0d0', cloud: 'rgba(200,210,215,0.55)',
    },
    route: { x0: 791, y0: 640, x1: 586, y1: 470 },
  },
  himalaya: {
    id: 'himalaya', campaign: 2, index: 6, name: 'Roof of the World', tagline: 'Thin air, high stakes', terrain: 'ice', base: 'land',
    palette: {
      sea: '#8d97a3', seaDeep: '#6f7a87', land: '#f2f5f8', landDark: '#bcc6d1', detail: '#ffffff',
      accent: '#b7d4ff', cloud: 'rgba(245,248,252,0.6)',
    },
    route: { x0: 711, y0: 390, x1: 556, y1: 175 },
  },
  jungle: {
    id: 'jungle', campaign: 2, index: 7, name: 'Green Hell', tagline: 'Under the canopy', terrain: 'canyon', base: 'land',
    palette: {
      sea: '#2f5d34', seaDeep: '#24492a', land: '#3f7a3a', landDark: '#1f4422', detail: '#7fbf5a',
      accent: '#c6ff5a', cloud: 'rgba(225,240,225,0.45)',
    },
    route: { x0: 461, y0: 135, x1: 186, y1: 175 },
  },
  nightfall: {
    id: 'nightfall', campaign: 2, index: 8, name: 'Desert Night', tagline: 'Into the dark', terrain: 'desert', base: 'land',
    palette: {
      sea: '#2b3550', seaDeep: '#1e263b', land: '#5a5470', landDark: '#3d3852', detail: '#8d86a8',
      accent: '#b28cff', cloud: 'rgba(160,160,200,0.35)',
    },
    route: { x0: 171, y0: 285, x1: 416, y1: 455 },
  },
  thunderhead: {
    id: 'thunderhead', campaign: 2, index: 9, name: 'Operation Thunderhead', tagline: 'End it for good', terrain: 'storm', base: 'sea',
    palette: {
      sea: '#2a1f2a', seaDeep: '#1a1219', land: '#4b3a3a', landDark: '#2e2222', detail: '#a07d8a',
      accent: '#ff3b5c', cloud: 'rgba(150,120,140,0.5)',
    },
    route: { x0: 341, y0: 565, x1: 70, y1: 640 },
  },
} as const satisfies Record<string, TheaterDef>;
