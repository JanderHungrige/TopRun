import { UNLIMITED_MONEY } from '../core/math';
import { BUILDING_IDS, MAX_BUILDING_LEVEL } from '../data/outpost';
import { PROJECT_IDS } from '../data/research';
import { normalizeCallsign } from './callsign';
import type { AvatarId } from './profiles';
import type { SaveData } from './save';

// The admin pilot (doc 47): preset pilot 4 called ADMIN opens every mission and never runs out of money. Pure.

export const ADMIN_CALLSIGN = 'ADMIN';
export const ADMIN_AVATAR: AvatarId = 'pilot4';
export const ADMIN_MONEY = UNLIMITED_MONEY;

/** The 4th preset card with the callsign ADMIN. A pilot's card and callsign never change, so neither does this. */
export function isAdminPilot(p: { callsign: string; avatar: AvatarId }): boolean {
  return p.avatar === ADMIN_AVATAR && normalizeCallsign(p.callsign) === ADMIN_CALLSIGN;
}

/** What the scenes see of the admin's save: every gate open, the purse always full — and on the jungle planet a finished
 *  base: every building at the top, everything invented, alloy without end (doc 82). */
export function adminView(save: SaveData): SaveData {
  const buildings = Object.fromEntries(BUILDING_IDS.map((id) => [id, MAX_BUILDING_LEVEL])) as SaveData['outpost']['buildings'];
  const outpost = { ...save.outpost, buildings, done: [...PROJECT_IDS], project: null, progress: 0, alloy: ADMIN_MONEY };
  return { ...save, money: ADMIN_MONEY, admin: true, outpost };
}

/** What is stored for the admin: no admin flag (it is never read back), a full purse, never shared on the ladder. */
export function adminStored(save: SaveData): SaveData {
  const link = save.ladder;
  return {
    ...save, money: ADMIN_MONEY, admin: false, ladder: link ? { ...link, share: false } : null, outpost: { ...save.outpost, alloy: ADMIN_MONEY },
  };
}
