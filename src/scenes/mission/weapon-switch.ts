import type { AudioEngine } from '../../core/audio';
import { SECONDARIES } from '../../data/weapons';
import { canSwitch, nextPick, slotFor } from '../../game/loadout';
import { t } from '../../i18n/i18n';
import { text } from '../../render/text';
import type { Player } from './player';

// SWITCH for the ground weapon (doc 05): picks the next one with ammo and shows "<WEAPON> READY" over the jet.

export const SWITCH_FLASH = 1.2;

/** False, with the "denied" buzz, when there is no second ground weapon with ammo to switch to. */
export function switchGroundWeapon(p: Player, audio: AudioEngine): boolean {
  if (!p.alive || !canSwitch(p.secondaries, 'ground')) {
    audio.play('denied');
    return false;
  }
  p.groundPick = nextPick(p.secondaries, 'ground', p.groundPick);
  p.switchFlash = SWITCH_FLASH;
  audio.play('uiMove');
  return true;
}

/** The callout in playfield coordinates: rises a little over the jet and fades out. */
export function drawSwitchCallout(ctx: CanvasRenderingContext2D, p: Player): void {
  if (p.switchFlash <= 0 || !p.alive) return;
  const slot = p.secondaries[slotFor(p.secondaries, 'ground', p.groundPick)];
  if (!slot) return;
  const rise = (1 - p.switchFlash / SWITCH_FLASH) * 14;
  text(ctx, t('cockpit.ready', { weapon: SECONDARIES[slot.id].short }), p.x, p.y - 58 - rise, {
    size: 17, weight: 800, align: 'center', color: '#62f08a', stroke: '#000', strokeWidth: 5, alpha: Math.min(1, p.switchFlash * 3),
  });
}
