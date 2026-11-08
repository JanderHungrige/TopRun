import { bossPal, HULLS_2, LIGHTS_2, PALS_2 } from './bosses-2';
import { HULLS_3, LIGHTS_3, PALS_3 } from './bosses-3';
import { HULLS_4, LIGHTS_4, PALS_4 } from './bosses-4';
import { HULLS_5, LIGHTS_5, ORGANIC as ORGANIC_5, organPart, PALS_5 } from './bosses-5';
import { HULLS_6, LIGHTS_6, ORGANIC_6, PALS_6 } from './bosses-6';
import type { BossId } from '../data/types';

// The bosses of maps 2–6 (docs 35, 48, 56, 65, 81) as one set of tables for the shared boss renderer (draw-bosses.ts).

/** The bosses whose parts are organs, not guns: the sea monsters and the jungle's creatures. */
export const ORGANIC: ReadonlySet<BossId> = new Set<BossId>([...ORGANIC_5, ...ORGANIC_6]);
export { bossPal, organPart };
export const PALS_LATER = { ...PALS_2, ...PALS_3, ...PALS_4, ...PALS_5, ...PALS_6 };
export const LIGHTS_LATER = { ...LIGHTS_2, ...LIGHTS_3, ...LIGHTS_4, ...LIGHTS_5, ...LIGHTS_6 };
export const HULLS_LATER = { ...HULLS_2, ...HULLS_3, ...HULLS_4, ...HULLS_5, ...HULLS_6 };
