// Medals (doc 24): the catalogue. Generic names and original designs — no real decorations.

export type MedalId =
  | 'pacific' | 'gulf' | 'arctic' | 'canyon' | 'leviathan' | 'victory' | 'allstars'
  | 'ace' | 'topace' | 'giant' | 'untouchable' | 'gunslinger' | 'catapult'
  | 'offduty5' | 'offduty10' | 'sorties25' | 'sorties100' | 'triple';

export const MEDAL_IDS: readonly MedalId[] = Object.freeze([
  'pacific', 'gulf', 'arctic', 'canyon', 'leviathan', 'victory', 'allstars',
  'ace', 'topace', 'giant', 'untouchable', 'gunslinger', 'catapult',
  'offduty5', 'offduty10', 'sorties25', 'sorties100', 'triple',
] as const);

export type MedalGroup = 'campaign' | 'combat' | 'offduty' | 'dedication';
export type MedalShape = 'ribbon' | 'star' | 'cross' | 'disc' | 'wings' | 'pin';
export type MedalMetal = 'gold' | 'silver' | 'bronze';

export interface MedalLook {
  /** Ribbon stripes, outside to centre (mirrored), as hex colours. */
  ribbon: readonly string[];
  shape: MedalShape;
  metal: MedalMetal;
}

export interface MedalDef {
  id: MedalId;
  group: MedalGroup;
  name: string;
  citation: string;
  look: MedalLook;
}

const m = (id: MedalId, group: MedalGroup, name: string, citation: string, ribbon: readonly string[], shape: MedalShape, metal: MedalMetal): MedalDef =>
  ({ id, group, name, citation, look: { ribbon, shape, metal } });

export const MEDALS: Readonly<Record<MedalId, MedalDef>> = Object.freeze({
  pacific: m('pacific', 'campaign', 'Pacific Campaign Ribbon', 'For sinking the battleship IRONCLAD and clearing the Pacific Training Range.', ['#1d6596', '#ffd25a', '#f2f2ee'], 'ribbon', 'bronze'),
  gulf: m('gulf', 'campaign', 'Gulf Campaign Ribbon', 'For bringing down the SANDSTORM fortress over the Persian Gulf.', ['#b48f55', '#2a9aa8', '#f1dcaa'], 'ribbon', 'bronze'),
  arctic: m('arctic', 'campaign', 'Arctic Campaign Ribbon', 'For intercepting the BLACKJACK bomber above the Arctic Shield.', ['#22486a', '#e9f2f7', '#7fe3ff'], 'ribbon', 'silver'),
  canyon: m('canyon', 'campaign', 'Canyon Campaign Ribbon', 'For downing the TYPHOON flying wing over the Red Canyon.', ['#863f22', '#ff6b3d', '#e0956a'], 'ribbon', 'silver'),
  leviathan: m('leviathan', 'campaign', 'Leviathan Campaign Ribbon', 'For sinking the supercarrier LEVIATHAN and ending the war at sea.', ['#101f2e', '#ff5a1f', '#7d96ab'], 'ribbon', 'gold'),
  victory: m('victory', 'campaign', 'Victory Medal', 'For flying all thirty missions of the campaign to victory.', ['#b8202a', '#f2f2ee', '#1d3a8a'], 'star', 'gold'),
  allstars: m('allstars', 'campaign', 'Golden Star', 'For three stars on every single mission of the campaign. Flawless.', ['#ffd25a', '#1d3a8a', '#ffd25a'], 'star', 'gold'),
  ace: m('ace', 'combat', 'Ace Wings', 'For fifty enemies destroyed in combat.', ['#2f3f66', '#c9d2dc'], 'wings', 'silver'),
  topace: m('topace', 'combat', 'Top Ace', 'For two hundred and fifty enemies destroyed. The best of the best.', ['#1a1a1a', '#ffd25a', '#b8202a'], 'wings', 'gold'),
  giant: m('giant', 'combat', 'Giant Slayer', 'For destroying three enemy capital threats.', ['#5b2a86', '#ffd25a'], 'cross', 'gold'),
  untouchable: m('untouchable', 'combat', 'Untouchable', 'For completing a mission without a scratch on the airframe.', ['#f2f2ee', '#5fd4ff', '#f2f2ee'], 'disc', 'silver'),
  gunslinger: m('gunslinger', 'combat', 'Gunslinger', 'For winning a mission with the cannon alone. No missiles, no bombs.', ['#5d3a1a', '#d08a4e'], 'cross', 'bronze'),
  catapult: m('catapult', 'combat', 'Catapult Star', 'For five perfect carrier launches in a row.', ['#2a6a3a', '#ffd25a', '#2a6a3a'], 'star', 'silver'),
  offduty5: m('offduty5', 'offduty', 'Off-Duty Star', 'For gold in five different off-duty challenges at the home base.', ['#ff9d2e', '#f2f2ee'], 'star', 'bronze'),
  offduty10: m('offduty10', 'offduty', 'Base Legend', 'For gold in every off-duty challenge. The whole base knows your name.', ['#ff9d2e', '#5b2a86', '#ffd25a'], 'disc', 'gold'),
  sorties25: m('sorties25', 'dedication', 'Sortie Pin', 'For twenty-five sorties flown.', ['#3d4450'], 'pin', 'bronze'),
  sorties100: m('sorties100', 'dedication', 'Iron Pilot', 'For one hundred sorties flown. Always ready.', ['#3d4450', '#9aa3ad', '#3d4450'], 'disc', 'silver'),
  triple: m('triple', 'dedication', 'Triple Threat', 'For flying sorties in all three of the squadron’s jets.', ['#b23a3a', '#f2f2ee', '#262a31'], 'pin', 'silver'),
});
