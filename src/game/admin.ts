import { UNLIMITED_MONEY } from '../core/math';
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

/** What the scenes see of the admin's save: every gate open, the purse always full. */
export function adminView(save: SaveData): SaveData {
  return { ...save, money: ADMIN_MONEY, admin: true };
}

/** What is stored for the admin: no admin flag (it is never read back), a full purse, never shared on the ladder. */
export function adminStored(save: SaveData): SaveData {
  const link = save.ladder;
  return { ...save, money: ADMIN_MONEY, admin: false, ladder: link ? { ...link, share: false } : null };
}
