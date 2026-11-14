import { bossPal, HULLS_2, LIGHTS_2, PALS_2 } from './bosses-2';
import { HULLS_3, LIGHTS_3, PALS_3 } from './bosses-3';
import { LIGHTS_4, PALS_4 } from './bosses-4';
import { HULLS_4 } from './bosses-4b';
import { LIGHTS_5, ORGANIC as ORGANIC_5, organPart, PALS_5 } from './bosses-5';
import { HULLS_5 } from './bosses-5b';
import { LIGHTS_6, ORGANIC_6, PALS_6 } from './bosses-6';
import { HULLS_6 } from './bosses-6c';
import { LIGHTS_7, ORGANIC_7, PALS_7 } from './bosses-7';
import { HULLS_7 } from './bosses-7b';
import type { BossId } from '../data/types';
import { MOUNTS_7, type MountFn } from './boss-mounts';
import { MOUNTS_4 } from './boss-mounts-4';
import { MOUNTS_5 } from './boss-mounts-5';
import { MOUNTS_6 } from './boss-mounts-6';

// The bosses of maps 2–7 (docs 35, 48, 56, 65, 81, 105) as one set of tables for the shared boss renderer (draw-bosses.ts).

/** The bosses whose parts are organs, not guns: the sea monsters and the jungle's creatures. */
export const ORGANIC: ReadonlySet<BossId> = new Set<BossId>([...ORGANIC_5, ...ORGANIC_6, ...ORGANIC_7]);
export { bossPal, organPart };
export const PALS_LATER = { ...PALS_2, ...PALS_3, ...PALS_4, ...PALS_5, ...PALS_6, ...PALS_7 };
export const LIGHTS_LATER = { ...LIGHTS_2, ...LIGHTS_3, ...LIGHTS_4, ...LIGHTS_5, ...LIGHTS_6, ...LIGHTS_7 };
export const HULLS_LATER = { ...HULLS_2, ...HULLS_3, ...HULLS_4, ...HULLS_5, ...HULLS_6, ...HULLS_7 };

/** Detailed weapon mounts by boss (docs 116–120); the others keep the shared mounts. */
export const CUSTOM_MOUNTS: Readonly<Partial<Record<BossId, MountFn>>> = { ...MOUNTS_4, ...MOUNTS_5, ...MOUNTS_6, ...MOUNTS_7 };
