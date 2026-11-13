import {
  DOOR_GUN_LEVELS, GATLING_LEVELS, HEDP, HELI_INCENDIARY, MAX_HELI_LEVEL, TRACER, TURRET_LEVELS, type HeliMod, type HeliRounds,
} from '../data/heli-arms';
import type { ShopItem } from '../game/economy';
import { canLoadHeliRounds, heliArmsOnSale } from '../game/heli-arms';
import type { SaveData } from '../game/save';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import type { ItemId } from '../render/items';
import { priceText } from './hangar-mech';

// The helicopters' new goods in their hangar (doc 99): the Gatling Drive, the Turret Link, the door guns and the three
// ammo types — their words, list status, level rows, pictures and the LOAD button.

export type HeliItem = Extract<ShopItem, { type: 'heliMod' | 'heliRounds' }>;

interface Words { name: UiKey; desc: UiKey; sub: UiKey; picture: ItemId & ('gatling' | 'turret' | 'doorguns' | 'tracer' | 'hedp' | 'incendiary') }

const WORDS: Readonly<Record<HeliMod | HeliRounds, Words>> = {
  gatling: { name: 'heliarms.gatlingName', desc: 'heliarms.gatlingDesc', sub: 'heliarms.gatlingSub', picture: 'gatling' },
  turret: { name: 'heliarms.turretName', desc: 'heliarms.turretDesc', sub: 'heliarms.turretSub', picture: 'turret' },
  doorGuns: { name: 'heliarms.doorName', desc: 'heliarms.doorDesc', sub: 'heliarms.doorSub', picture: 'doorguns' },
  tracer: { name: 'heliarms.tracerName', desc: 'heliarms.tracerDesc', sub: 'heliarms.tracerSub', picture: 'tracer' },
  hedp: { name: 'heliarms.hedpName', desc: 'heliarms.hedpDesc', sub: 'heliarms.hedpSub', picture: 'hedp' },
  incendiary: { name: 'heliarms.incName', desc: 'heliarms.incDesc', sub: 'heliarms.incSub', picture: 'incendiary' },
};

/** The WEAPONS tab's new rows, after the chain gun: upgrades, then the ammo types, then the door guns. */
export const heliGear = (save: SaveData): HeliItem[] => (heliArmsOnSale(save) ? [
  { type: 'heliMod', id: 'gatling' }, { type: 'heliMod', id: 'turret' }, { type: 'heliRounds', id: 'tracer' },
  { type: 'heliRounds', id: 'hedp' }, { type: 'heliRounds', id: 'incendiary' }, { type: 'heliMod', id: 'doorGuns' },
] : []);

export const heliName = (item: HeliItem): string => t(WORDS[item.id].name);
export const heliDescription = (item: HeliItem): string => t(WORDS[item.id].desc);
export const heliSubtitle = (item: HeliItem): string => t(WORDS[item.id].sub);
export const heliPicture = (item: HeliItem): Words['picture'] => WORDS[item.id].picture;
export const heliLevel = (save: SaveData, item: HeliItem): number => save.heliArms[item.id];
export const heliMax = (item: HeliItem): number => MAX_HELI_LEVEL[item.id];

/** The list row's status: LOADED first for the loaded ammo type, then the level and the next price. */
export function heliStatus(save: SaveData, item: HeliItem, price: number | null): string {
  const level = heliLevel(save, item);
  const loaded = item.type === 'heliRounds' && level > 0 && save.heliArms.loaded === item.id ? `${t('arsenal.loaded')} · ` : '';
  if (price === null) return loaded + t('hangar.maxLevel', { level });
  return loaded + (level === 0 ? priceText(save, price) : t('hangar.levelPrice', { level, price: priceText(save, price) }));
}

const pct = (v: number): number => Math.round(v * 100);

/** One line per level for the detail panel. */
export function heliRows(item: HeliItem): string[] {
  const id = item.id;
  switch (id) {
    case 'gatling': return GATLING_LEVELS.map((l) => t('heliarms.gatlingRow', { mul: l.mul.toFixed(2), spin: l.spinUp }));
    case 'turret': return TURRET_LEVELS.map((l) => t('heliarms.turretRow', { deg: Math.round((l.swivel * 180) / Math.PI) }));
    case 'doorGuns': return DOOR_GUN_LEVELS.map((l) => t('heliarms.doorRow', { range: l.range, damage: l.damage }));
    case 'tracer': return TRACER.bonus.map((b) => t('heliarms.tracerRow', { bonus: pct(b) }));
    case 'hedp': return HEDP.share.map((s, i) => t('heliarms.hedpRow', { share: pct(s), radius: HEDP.radius[i] ?? 0 }));
    case 'incendiary': return HELI_INCENDIARY.burn.map((b) => t('heliarms.incRow', { burn: pct(b) }));
    default: throw new Error(`unhandled: ${id satisfies never}`);
  }
}

/** The side button of an ammo type: LOAD THIS AMMO, or LOADED; null before its first level. */
export function heliLoadAction(save: SaveData, id: HeliRounds): { label: string; enabled: boolean } | null {
  if (save.heliArms[id] === 0) return null;
  return canLoadHeliRounds(save, id) ? { label: t('arsenal.load'), enabled: true } : { label: t('arsenal.loaded'), enabled: false };
}
