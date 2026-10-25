import type { LiveryId } from '../data/liveries';

/** German paint-job names (doc 09); English lives in src/data/liveries.ts. */
export const LIVERIES_DE: Readonly<Record<LiveryId, string>> = {
  standard: 'Werkslackierung',
  gullgray: 'Siebziger-Navy',
  blackflag: 'Schwarze Flagge',
  desert: 'Wüstentarnung',
  sunburst: 'Sonnenaufgang',
  arctic: 'Arktis-Splitter',
  aggressor: 'Aggressor-Blau',
  woodland: 'Waldtarnung',
  tiger: 'Tigerstreifen',
  airshow: 'Flugshow',
  blackgold: 'Schwarz-Gold',
};
