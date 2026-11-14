import { DOOR_GUN_LEVELS, GATLING_LEVELS, HEDP, HELI_INCENDIARY, TRACER, TURRET_LEVELS } from '../data/heli-arms';
import { CAVITATION, ELECTRIC, EXPLOSIVE, HOMING_LEVELS, LOADER_LEVELS, SIDE_TUBE_LEVELS } from '../data/sub-arms';
import { APDS, AUTOLOADER_LEVELS, COAX_LEVELS, HEFRAG, STABILISER_LEVELS, THERMITE } from '../data/tank-arms';
import type { ShopItem } from '../game/economy';
import { canLoadGear, gearLevel, gearMax, gearOnSale, type GearId, type GearKit, type GearMod, type GearRounds } from '../game/gear';
import type { SaveData } from '../game/save';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import type { GearPicture } from '../render/items';
import { priceText } from './hangar-mech';

// The fleets' gun upgrades and ammo types in their hangars (docs 99, 101, 108): the helicopters' Gatling Drive, Turret
// Link, door guns, tracer, HEDP and incendiary; the subs' Rapid Loader, Homing Tips, Side Tubes, explosive, electric and
// cavitation bolts; the tanks' Autoloader, Gun Stabiliser, Coax MG, APDS, HE-Frag and Thermite — their words, list status,
// level rows, pictures and the LOAD button.

export type GearItem = Extract<ShopItem, { type: 'mod' | 'rounds' }>;

interface Words { name: UiKey; desc: UiKey; sub: UiKey; picture: GearPicture }

const WORDS: Readonly<Record<GearId, Words>> = {
  gatling: { name: 'heliarms.gatlingName', desc: 'heliarms.gatlingDesc', sub: 'heliarms.gatlingSub', picture: 'gatling' },
  turret: { name: 'heliarms.turretName', desc: 'heliarms.turretDesc', sub: 'heliarms.turretSub', picture: 'turret' },
  doorGuns: { name: 'heliarms.doorName', desc: 'heliarms.doorDesc', sub: 'heliarms.doorSub', picture: 'doorguns' },
  tracer: { name: 'heliarms.tracerName', desc: 'heliarms.tracerDesc', sub: 'heliarms.tracerSub', picture: 'tracer' },
  hedp: { name: 'heliarms.hedpName', desc: 'heliarms.hedpDesc', sub: 'heliarms.hedpSub', picture: 'hedp' },
  incendiary: { name: 'heliarms.incName', desc: 'heliarms.incDesc', sub: 'heliarms.incSub', picture: 'incendiary' },
  loader: { name: 'subarms.loaderName', desc: 'subarms.loaderDesc', sub: 'subarms.loaderSub', picture: 'loader' },
  homing: { name: 'subarms.homingName', desc: 'subarms.homingDesc', sub: 'subarms.homingSub', picture: 'homing' },
  sideTubes: { name: 'subarms.tubesName', desc: 'subarms.tubesDesc', sub: 'subarms.tubesSub', picture: 'sidetubes' },
  explosive: { name: 'subarms.explosiveName', desc: 'subarms.explosiveDesc', sub: 'subarms.explosiveSub', picture: 'explosive' },
  electric: { name: 'subarms.electricName', desc: 'subarms.electricDesc', sub: 'subarms.electricSub', picture: 'electric' },
  cavitation: { name: 'subarms.cavName', desc: 'subarms.cavDesc', sub: 'subarms.cavSub', picture: 'cavitation' },
  autoloader: { name: 'tankarms.loaderName', desc: 'tankarms.loaderDesc', sub: 'tankarms.loaderSub', picture: 'autoloader' },
  stabiliser: { name: 'tankarms.stabName', desc: 'tankarms.stabDesc', sub: 'tankarms.stabSub', picture: 'stabiliser' },
  coaxmg: { name: 'tankarms.coaxName', desc: 'tankarms.coaxDesc', sub: 'tankarms.coaxSub', picture: 'coaxmg' },
  apds: { name: 'tankarms.apdsName', desc: 'tankarms.apdsDesc', sub: 'tankarms.apdsSub', picture: 'apds' },
  hefrag: { name: 'tankarms.fragName', desc: 'tankarms.fragDesc', sub: 'tankarms.fragSub', picture: 'hefrag' },
  thermite: { name: 'tankarms.thermName', desc: 'tankarms.thermDesc', sub: 'tankarms.thermSub', picture: 'thermite' },
};

const mod = (id: GearItem['id'] & GearMod): GearItem => ({ type: 'mod', id });
const rounds = (id: GearRounds): GearItem => ({ type: 'rounds', id });

/** The WEAPONS tab's rows after the kit's gun: upgrades, the ammo types, then the side guns. */
const LISTS: Readonly<Record<GearKit, readonly GearItem[]>> = {
  heli: [mod('gatling'), mod('turret'), rounds('tracer'), rounds('hedp'), rounds('incendiary'), mod('doorGuns')],
  sub: [mod('loader'), mod('homing'), rounds('explosive'), rounds('electric'), rounds('cavitation'), mod('sideTubes')],
  tank: [mod('autoloader'), mod('stabiliser'), rounds('apds'), rounds('hefrag'), rounds('thermite'), mod('coaxmg')],
};

export const gearItems = (save: SaveData): GearItem[] =>
  (save.kit === 'heli' || save.kit === 'sub' || save.kit === 'tank' ? LISTS[save.kit].filter((i) => gearOnSale(save, i.id)) : []);

export const gearName = (item: GearItem): string => t(WORDS[item.id].name);
export const gearDescription = (item: GearItem): string => t(WORDS[item.id].desc);
export const gearSubtitle = (item: GearItem): string => t(WORDS[item.id].sub);
export const gearPicture = (item: GearItem): GearPicture => WORDS[item.id].picture;
export const gearLevelOf = (save: SaveData, item: GearItem): number => gearLevel(save, item.id);
export const gearMaxOf = (item: GearItem): number => gearMax(item.id);

/** The list row's status: LOADED first for the loaded ammo type, then the level and the next price. */
export function gearStatus(save: SaveData, item: GearItem, price: number | null): string {
  const level = gearLevel(save, item.id);
  const loaded = item.type === 'rounds' && level > 0 && !canLoadGear(save, item.id) ? `${t('arsenal.loaded')} · ` : '';
  if (price === null) return loaded + t('hangar.maxLevel', { level });
  return loaded + (level === 0 ? priceText(save, price) : t('hangar.levelPrice', { level, price: priceText(save, price) }));
}

const pct = (v: number): number => Math.round(v * 100);
const degs = (r: number): number => Math.round((r * 180) / Math.PI);

/** One line per level for the detail panel. */
export function gearRows(item: GearItem): string[] {
  const id = item.id;
  switch (id) {
    case 'gatling': return GATLING_LEVELS.map((l) => t('heliarms.gatlingRow', { mul: l.mul.toFixed(2), spin: l.spinUp }));
    case 'turret': return TURRET_LEVELS.map((l) => t('heliarms.turretRow', { deg: degs(l.swivel) }));
    case 'doorGuns': return DOOR_GUN_LEVELS.map((l) => t('heliarms.doorRow', { range: l.range, damage: l.damage }));
    case 'tracer': return TRACER.bonus.map((b) => t('heliarms.tracerRow', { bonus: pct(b) }));
    case 'hedp': return HEDP.share.map((s, i) => t('heliarms.hedpRow', { share: pct(s), radius: HEDP.radius[i] ?? 0 }));
    case 'incendiary': return HELI_INCENDIARY.burn.map((b) => t('heliarms.incRow', { burn: pct(b) }));
    case 'loader': return LOADER_LEVELS.map((l) => t('subarms.loaderRow', { mul: l.mul.toFixed(2), spin: l.spinUp }));
    case 'homing': return HOMING_LEVELS.map((l) => t('subarms.homingRow', { deg: degs(l.swivel) }));
    case 'sideTubes': return SIDE_TUBE_LEVELS.map((l) => t('subarms.tubesRow', { range: l.range, damage: l.damage }));
    case 'explosive': return EXPLOSIVE.share.map((s, i) => t('heliarms.hedpRow', { share: pct(s), radius: EXPLOSIVE.radius[i] ?? 0 }));
    case 'electric': return ELECTRIC.targets.map((n, i) => t('subarms.electricRow', { n, share: pct(ELECTRIC.share[i] ?? 0), stun: ELECTRIC.stun[i] ?? 0 }));
    case 'cavitation': return CAVITATION.pierce.map((n) => t('subarms.cavRow', { n, speed: pct(CAVITATION.speed - 1) }));
    case 'autoloader': return AUTOLOADER_LEVELS.map((l) => t('tankarms.loaderRow', { mul: l.mul.toFixed(2) }));
    case 'stabiliser': return STABILISER_LEVELS.map((l) => t('tankarms.stabRow', { deg: degs(l.swivel) }));
    case 'coaxmg': return COAX_LEVELS.map((l) => t('subarms.tubesRow', { range: l.range, damage: l.damage }));
    case 'apds': return APDS.pierce.map((n) => t('tankarms.apdsRow', { n }));
    case 'hefrag': return HEFRAG.share.map((s, i) => t('heliarms.hedpRow', { share: pct(s), radius: HEFRAG.radius[i] ?? 0 }));
    case 'thermite': return THERMITE.burn.map((b) => t('heliarms.incRow', { burn: pct(b) }));
    default: throw new Error(`unhandled: ${id satisfies never}`);
  }
}

/** The side button of an ammo type: LOAD THIS AMMO, or LOADED; null before its first level. */
export function gearLoadAction(save: SaveData, id: GearRounds): { label: string; enabled: boolean } | null {
  if (gearLevel(save, id) === 0) return null;
  return canLoadGear(save, id) ? { label: t('arsenal.load'), enabled: true } : { label: t('arsenal.loaded'), enabled: false };
}
