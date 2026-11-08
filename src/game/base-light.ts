// The base's light (docs 91, 92): the carrier lounge (maps 1–2) and the helicopter base (map 3) come as day, evening and
// night. A new one is drawn at random after every played mission of maps 1–3; the other maps leave it as it is.

import type { CampaignId } from '../data/types';

export type BaseLight = 'day' | 'evening' | 'night';

export const BASE_LIGHTS: readonly BaseLight[] = Object.freeze(['day', 'evening', 'night'] as const);

/** A light at random; `r` in [0, 1). */
export const randomLight = (r: number): BaseLight => BASE_LIGHTS[Math.min(BASE_LIGHTS.length - 1, Math.max(0, Math.floor(r * BASE_LIGHTS.length)))] ?? 'night';

/** The light after a played mission of `campaign`: drawn anew on maps 1–3 (it may come out the same), kept elsewhere. */
export const lightAfterMission = (campaign: CampaignId, current: BaseLight, r: number): BaseLight =>
  campaign <= 3 ? randomLight(r) : current;
