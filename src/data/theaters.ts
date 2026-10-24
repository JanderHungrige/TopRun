import type { TheaterId } from './types';

export type TerrainStyle = 'ocean' | 'desert' | 'ice' | 'canyon' | 'storm';

export interface TheaterPalette {
  sea: string;
  seaDeep: string;
  land: string;
  landDark: string;
  detail: string;
  accent: string;
  cloud: string;
}

export interface TheaterDef {
  id: TheaterId;
  index: number;
  name: string;
  tagline: string;
  terrain: TerrainStyle;
  /** 'sea' base: land units get an island under them. 'land' base: no sea units allowed. */
  base: 'sea' | 'land';
  palette: TheaterPalette;
  /** Route segment for the six mission nodes on the campaign map. */
  route: { x0: number; y0: number; x1: number; y1: number };
}

export const THEATERS: Readonly<Record<TheaterId, TheaterDef>> = Object.freeze({
  pacific: {
    id: 'pacific', index: 0, name: 'Pacific Training Range', tagline: 'Earn your wings', terrain: 'ocean', base: 'sea',
    palette: {
      sea: '#1d6596', seaDeep: '#154d75', land: '#d9c48a', landDark: '#5e9a45', detail: '#9fd3f0',
      accent: '#ffd25a', cloud: 'rgba(255,255,255,0.55)',
    },
    route: { x0: 95, y0: 640, x1: 300, y1: 470 },
  },
  gulf: {
    id: 'gulf', index: 1, name: 'Persian Gulf', tagline: 'Desert storm rising', terrain: 'desert', base: 'land',
    palette: {
      sea: '#2a9aa8', seaDeep: '#1f7c88', land: '#dcbc7e', landDark: '#b48f55', detail: '#f1dcaa',
      accent: '#ff9d3a', cloud: 'rgba(255,248,230,0.45)',
    },
    route: { x0: 175, y0: 390, x1: 330, y1: 175 },
  },
  arctic: {
    id: 'arctic', index: 2, name: 'Arctic Shield', tagline: 'Cold war, hot skies', terrain: 'ice', base: 'sea',
    palette: {
      sea: '#22486a', seaDeep: '#183650', land: '#e9f2f7', landDark: '#b7cddb', detail: '#ffffff',
      accent: '#7fe3ff', cloud: 'rgba(240,248,255,0.6)',
    },
    route: { x0: 425, y0: 135, x1: 700, y1: 175 },
  },
  canyon: {
    id: 'canyon', index: 3, name: 'Red Canyon', tagline: 'Low and fast', terrain: 'canyon', base: 'land',
    palette: {
      sea: '#3d7896', seaDeep: '#2c5b73', land: '#b9603a', landDark: '#863f22', detail: '#e0956a',
      accent: '#ff6b3d', cloud: 'rgba(255,235,220,0.4)',
    },
    route: { x0: 715, y0: 285, x1: 470, y1: 455 },
  },
  leviathan: {
    id: 'leviathan', index: 4, name: 'Operation Leviathan', tagline: 'Finish the war', terrain: 'storm', base: 'sea',
    palette: {
      sea: '#1a3044', seaDeep: '#101f2e', land: '#4a403b', landDark: '#2e2724', detail: '#7d96ab',
      accent: '#ff5a1f', cloud: 'rgba(170,185,200,0.5)',
    },
    route: { x0: 545, y0: 565, x1: 835, y1: 645 },
  },
});
