import { bossPal, HULLS_2, LIGHTS_2, PALS_2 } from './bosses-2';
import { HULLS_3, LIGHTS_3, PALS_3 } from './bosses-3';
import { HULLS_4, LIGHTS_4, PALS_4 } from './bosses-4';
import { HULLS_5, LIGHTS_5, ORGANIC, organPart, PALS_5 } from './bosses-5';

// The bosses of maps 2, 3, 4 and 5 (docs 35, 48, 56, 65) as one set of tables for the shared boss renderer (draw-bosses.ts).

export { bossPal, ORGANIC, organPart };
export const PALS_LATER = { ...PALS_2, ...PALS_3, ...PALS_4, ...PALS_5 };
export const LIGHTS_LATER = { ...LIGHTS_2, ...LIGHTS_3, ...LIGHTS_4, ...LIGHTS_5 };
export const HULLS_LATER = { ...HULLS_2, ...HULLS_3, ...HULLS_4, ...HULLS_5 };
