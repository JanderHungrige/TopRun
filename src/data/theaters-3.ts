import type { TheaterDef } from './theaters';

// The five theaters of map 3 (doc 48): a new region flown with helicopters, generic names. They reuse the terrain
// styles in new palettes; the route snakes across the map — fjords top left, highlands top right, the delta down
// the right side, the mesas back across the middle, Ash Island along the bottom.

export const THEATERS_3 = {
  fjords: {
    id: 'fjords', campaign: 3, index: 10, name: 'Fjord Country', tagline: 'Between the walls', terrain: 'canyon', base: 'sea',
    palette: {
      sea: '#1a3a4b', seaDeep: '#132b38', land: '#3d6a7e', landDark: '#3b444d', detail: '#d6e2ea',
      accent: '#7fd6ff', cloud: 'rgba(214,224,232,0.5)',
    },
    route: { x0: 80, y0: 170, x1: 330, y1: 130 },
  },
  highlands: {
    id: 'highlands', campaign: 3, index: 11, name: 'Highland Passes', tagline: 'Hug the ridgeline', terrain: 'ice', base: 'land',
    palette: {
      sea: '#5d6670', seaDeep: '#454d56', land: '#e6eaee', landDark: '#9aa4ae', detail: '#ffffff',
      accent: '#ffd36b', cloud: 'rgba(240,244,248,0.55)',
    },
    route: { x0: 430, y0: 140, x1: 760, y1: 170 },
  },
  delta: {
    id: 'delta', campaign: 3, index: 12, name: 'River Delta', tagline: 'Follow the water', terrain: 'canyon', base: 'land',
    palette: {
      sea: '#6b5a3a', seaDeep: '#4f4329', land: '#4f7a3a', landDark: '#2f5226', detail: '#9ccf6a',
      accent: '#ffb347', cloud: 'rgba(230,236,220,0.45)',
    },
    route: { x0: 800, y0: 270, x1: 700, y1: 470 },
  },
  mesa: {
    id: 'mesa', campaign: 3, index: 13, name: 'Mesa Country', tagline: 'Red rock, long shadows', terrain: 'desert', base: 'land',
    palette: {
      sea: '#7a4630', seaDeep: '#5c3322', land: '#b0603c', landDark: '#7d3f26', detail: '#e2a06a',
      accent: '#ff8a3d', cloud: 'rgba(255,225,200,0.35)',
    },
    route: { x0: 590, y0: 420, x1: 250, y1: 380 },
  },
  ashfall: {
    id: 'ashfall', campaign: 3, index: 14, name: 'Ash Island', tagline: 'Fire under the ash', terrain: 'storm', base: 'sea',
    palette: {
      sea: '#2a2826', seaDeep: '#1b1918', land: '#4a4440', landDark: '#2c2826', detail: '#9a8e86',
      accent: '#ff4d1f', cloud: 'rgba(140,130,125,0.55)',
    },
    route: { x0: 130, y0: 500, x1: 470, y1: 640 },
  },
} as const satisfies Record<string, TheaterDef>;
