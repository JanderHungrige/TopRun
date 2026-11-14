import type { EquipmentId, SecondaryId } from '../data/types';
import { EQUIPMENT_IDS, SECONDARY_IDS } from '../data/types';

// The hangar's item pictures (doc 02): generated pixel art, a 192 × 192 picture for the detail panel and a 72 × 40
// icon for the list rows, both transparent. Drawn at their own size, centred and never smoothed; callers fall back
// to the vector icons (icons.ts) while a picture loads or where none exists.

/** `ammo`: the uranium ammo (doc 43); `incendiary` (doc 45, the helicopters' too); `he`: the Bofors 40 mm (doc 46);
 *  `chaingun`: the helicopters' M230 (doc 49); `harpoon`: the subs' harpoon gun (doc 66); `autocannon`: the mechs' gun
 *  (doc 79); `turretgun`: the tanks' turret cannon (doc 103); the fleets' gun upgrades and ammo types (docs 99, 101). */
/** The fleets' gun upgrades and ammo types (docs 99, 101). */
export type GearPicture = 'gatling' | 'turret' | 'doorguns' | 'tracer' | 'hedp' | 'incendiary'
  | 'loader' | 'homing' | 'sidetubes' | 'explosive' | 'electric' | 'cavitation'
  | 'autoloader' | 'stabiliser' | 'coaxmg' | 'apds' | 'hefrag' | 'thermite';
/** The defences' towers (doc 106), for the steppe lab (doc 107). */
export type TowerPicture = 'mgnest' | 'flaktower' | 'mortarpit' | 'teslatower' | 'jammer' | 'rocketbattery';
export type ItemId = SecondaryId | EquipmentId | 'gun' | 'ammo' | 'he' | 'chaingun' | 'harpoon' | 'autocannon' | 'turretgun' | GearPicture | TowerPicture;
export const ITEM_IDS: readonly ItemId[] = Object.freeze([
  ...SECONDARY_IDS, 'gun', 'ammo', 'incendiary', 'he', 'chaingun', 'harpoon', 'autocannon', 'turretgun', ...EQUIPMENT_IDS,
  'gatling', 'turret', 'doorguns', 'tracer', 'hedp', 'loader', 'homing', 'sidetubes', 'explosive', 'electric', 'cavitation',
  'autoloader', 'stabiliser', 'coaxmg', 'apds', 'hefrag', 'thermite',
  'mgnest', 'flaktower', 'mortarpit', 'teslatower', 'jammer', 'rocketbattery',
]);

const FILES = import.meta.glob<string>('../assets/items/*.png', { eager: true, query: '?url', import: 'default' });

/** The URL of an item's picture (`small`: the list icon), undefined while it doesn't exist. */
export const itemPictureUrl = (id: ItemId, small: boolean): string | undefined => FILES[`../assets/items/${id}${small ? '-small' : ''}.png`];

const images = new Map<string, HTMLImageElement>();

function loaded(url: string): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  let img = images.get(url);
  if (!img) {
    img = new Image();
    img.decoding = 'async';
    img.src = url;
    images.set(url, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

/** Draws the picture centred on (cx, cy) at its own size; false when there is none (yet), so the caller can fall back. */
export function drawItemPicture(ctx: CanvasRenderingContext2D, id: ItemId, cx: number, cy: number, small: boolean): boolean {
  const url = itemPictureUrl(id, small);
  const img = url === undefined ? null : loaded(url);
  if (!img) return false;
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, Math.round(cx - w / 2), Math.round(cy - h / 2), w, h);
  ctx.restore();
  return true;
}
