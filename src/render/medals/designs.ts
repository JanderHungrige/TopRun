import type { MedalId } from '../../data/medals';

// Medal art (doc 25): what sits on each medal beyond its data look (ribbon stripes, shape, metal). Original
// designs with generic award shapes — no real decoration's design, no national insignia.

export type EmblemId =
  | 'wave' | 'sun' | 'flake' | 'mesa' | 'trident' | 'star' | 'stars3' | 'jet' | 'palm' | 'sword' | 'reticle'
  | 'shield' | 'laurelStar' | 'helmet' | 'chevronJet' | 'trio'
  // The world medals (doc 62).
  | 'rig' | 'peak' | 'moon' | 'bolt' | 'volcano' | 'orbit' | 'rock' | 'planet' | 'rotor' | 'rocket'
  // Map 5's medals (doc 72).
  | 'coral' | 'kelp' | 'anchor' | 'chevron' | 'lure' | 'sub'
  // Map 6's medals (doc 85).
  | 'boot' | 'palmtree' | 'eye' | 'pyramid' | 'hive' | 'mech'
  // Map 7's medals (doc 110).
  | 'tuft' | 'crystal' | 'butte' | 'stone' | 'crater' | 'tank';

/** A paint for emblem parts: a hex colour or the medal's own metal. */
export type Paint = string | 'metal';

export interface Design {
  emblem: EmblemId;
  /** Enamel: the field of discs, seals and badges, the centre of stars and wings, the arms of crosses. */
  enamel: string;
  /** Crosses: the enamel field of the centre medallion. */
  field?: string;
  /** Main emblem colour. */
  mark: Paint;
  /** Second emblem colour (sun, dunes, chevrons, stars). */
  accent: Paint;
  /** Stars: number of points. */
  points?: number;
  /** Stars: short glory rays between the points / alternating long and short rays. */
  rays?: 'glory' | 'radiant';
  /** Wings: feather tiers (3 = the larger wings with a star above). */
  tiers?: number;
  /** Discs: rivets round the rim. */
  rivets?: boolean;
  /** Badges: outline. */
  badge?: 'shield' | 'triangle';
}

export const DESIGNS: Readonly<Record<MedalId, Design>> = {
  pacific: { emblem: 'wave', enamel: '#1d6596', mark: '#f2f2ee', accent: '#ffd25a' },
  gulf: { emblem: 'sun', enamel: '#2a9aa8', mark: '#ffd25a', accent: '#f1dcaa' },
  arctic: { emblem: 'flake', enamel: '#22486a', mark: '#e9f2f7', accent: '#7fe3ff' },
  canyon: { emblem: 'mesa', enamel: '#ff6b3d', mark: '#863f22', accent: '#ffd25a' },
  leviathan: { emblem: 'trident', enamel: '#101f2e', mark: 'metal', accent: '#ff5a1f' },
  victory: { emblem: 'star', enamel: '#b8202a', mark: '#f2f2ee', accent: '#f2f2ee', points: 5, rays: 'glory' },
  allstars: { emblem: 'stars3', enamel: '#1d3a8a', mark: 'metal', accent: 'metal', points: 8, rays: 'radiant' },
  // Maps 2–4 (doc 62).
  northsea: { emblem: 'rig', enamel: '#22303d', mark: '#c9d2dc', accent: '#ff9d2e' },
  himalaya: { emblem: 'peak', enamel: '#3b4a6b', mark: '#8a94a8', accent: '#f2f2ee' },
  jungle: { emblem: 'palm', enamel: '#1f4d2a', mark: '#8ad14a', accent: '#d9b44a' },
  nightfall: { emblem: 'moon', enamel: '#151a33', mark: '#e9dcb0', accent: '#ffd25a' },
  thunderhead: { emblem: 'bolt', enamel: '#2a2f3a', mark: '#9aa6b8', accent: '#ffd84a' },
  victory2: { emblem: 'sword', enamel: '#5b2a86', field: '#f2f2ee', mark: '#5b2a86', accent: '#c27bff' },
  allstars2: { emblem: 'stars3', enamel: '#5b2a86', mark: 'metal', accent: 'metal', points: 8, rays: 'radiant' },
  fjords: { emblem: 'wave', enamel: '#1d4d6e', mark: '#e9f2f7', accent: '#3f8a6a' },
  highlands: { emblem: 'peak', enamel: '#4a5a3a', mark: '#8a6a4a', accent: '#e9f2f7' },
  delta: { emblem: 'palm', enamel: '#2a5a4a', mark: '#b0a050', accent: '#6ab0c0' },
  mesa: { emblem: 'mesa', enamel: '#e0956a', mark: '#7a3a22', accent: '#ffd25a' },
  ashfall: { emblem: 'volcano', enamel: '#2a2624', mark: '#6a605a', accent: '#ff5a1f' },
  victory3: { emblem: 'rotor', enamel: '#3a4a2a', mark: 'metal', accent: '#ff8a3d', rivets: true },
  allstars3: { emblem: 'stars3', enamel: '#3a4a2a', mark: 'metal', accent: 'metal', points: 8, rays: 'radiant' },
  orbit: { emblem: 'orbit', enamel: '#0a1630', mark: '#7fb4ff', accent: '#e9f2f7' },
  belt: { emblem: 'rock', enamel: '#2a2018', mark: '#9c8a74', accent: '#ffb46b' },
  moon: { emblem: 'moon', enamel: '#3d4048', mark: '#e6edf7', accent: '#4f8cff' },
  rings: { emblem: 'planet', enamel: '#1a2a40', mark: '#9fb4c8', accent: '#ffd27a' },
  deep: { emblem: 'star', enamel: '#1a0a24', mark: '#ff6a8a', accent: '#ff6a8a' },
  victory4: { emblem: 'rocket', enamel: '#0a1630', mark: '#e9f2f7', accent: '#5fe3ff', points: 5, rays: 'glory' },
  allstars4: { emblem: 'stars3', enamel: '#0a1630', mark: 'metal', accent: 'metal', points: 8, rays: 'radiant' },
  reef: { emblem: 'coral', enamel: '#0f6a7c', mark: '#ff8a78', accent: '#ffd84a' },
  kelp: { emblem: 'kelp', enamel: '#0e3a34', mark: '#5a8f3c', accent: '#c8d86a' },
  wrecks: { emblem: 'anchor', enamel: '#1a3a50', mark: '#b8743e', accent: '#e9f2f7' },
  trench: { emblem: 'chevron', enamel: '#04142a', mark: '#7fb4ff', accent: '#e9f2f7' },
  abyss: { emblem: 'lure', enamel: '#05101c', mark: '#4a5260', accent: '#5ff0e0' },
  victory5: { emblem: 'sub', enamel: '#0b5a66', mark: 'metal', accent: '#5ff0e0', rivets: true },
  allstars5: { emblem: 'stars3', enamel: '#0b5a66', mark: 'metal', accent: 'metal', points: 8, rays: 'radiant' },
  landing: { emblem: 'boot', enamel: '#5a3a24', mark: '#c99a62', accent: '#3a2414' },
  canopy: { emblem: 'palmtree', enamel: '#1f3a1c', mark: '#6fae4a', accent: '#c8ff6a' },
  swamp: { emblem: 'eye', enamel: '#1d2a22', mark: '#7d8f5a', accent: '#ffd23a' },
  ruins: { emblem: 'pyramid', enamel: '#3a4a2a', mark: '#c4c0a0', accent: '#ffb84a' },
  hive: { emblem: 'hive', enamel: '#2a1a2a', mark: '#a06a90', accent: '#ff7ad2' },
  victory6: { emblem: 'mech', enamel: '#2f6a1e', mark: 'metal', accent: '#c8ff6a', rivets: true },
  allstars6: { emblem: 'stars3', enamel: '#2f6a1e', mark: 'metal', accent: 'metal', points: 8, rays: 'radiant' },
  grass: { emblem: 'tuft', enamel: '#6a5a24', mark: '#e8d48a', accent: '#c98a3a' },
  saltflats: { emblem: 'crystal', enamel: '#4a6a80', mark: '#eef2f2', accent: '#bfe6ff' },
  badlands: { emblem: 'butte', enamel: '#5a2a1a', mark: '#c4603a', accent: '#ffd25a' },
  barrows: { emblem: 'stone', enamel: '#3a4030', mark: '#a8a890', accent: '#7affc8' },
  impact: { emblem: 'crater', enamel: '#1e1a2a', mark: '#7a6a5a', accent: '#b07aff' },
  victory7: { emblem: 'tank', enamel: '#8a6a2a', mark: 'metal', accent: '#e8d48a', rivets: true },
  allstars7: { emblem: 'stars3', enamel: '#8a6a2a', mark: 'metal', accent: 'metal', points: 8, rays: 'radiant' },
  ace: { emblem: 'star', enamel: '#2f3f66', mark: '#f2f2ee', accent: '#f2f2ee', tiers: 2 },
  topace: { emblem: 'star', enamel: '#b8202a', mark: 'metal', accent: 'metal', tiers: 3 },
  giant: { emblem: 'sword', enamel: '#5b2a86', field: '#f2f2ee', mark: '#5b2a86', accent: '#c88c28' },
  untouchable: { emblem: 'shield', enamel: '#5fd4ff', mark: '#f2f2ee', accent: '#1d6596' },
  gunslinger: { emblem: 'reticle', enamel: '#5d3a1a', field: '#f1dcaa', mark: '#b8202a', accent: '#b8202a' },
  catapult: { emblem: 'jet', enamel: '#2a6a3a', mark: '#f2f2ee', accent: '#ffd25a', points: 4 },
  offduty5: { emblem: 'palm', enamel: '#ff9d2e', mark: '#2a1a40', accent: '#fff1b0', points: 6 },
  offduty10: { emblem: 'laurelStar', enamel: '#5b2a86', mark: 'metal', accent: '#ff9d2e' },
  sorties25: { emblem: 'chevronJet', enamel: '#3d4450', mark: 'metal', accent: '#d08a4e', badge: 'shield' },
  sorties100: { emblem: 'helmet', enamel: '#2a2e36', mark: '#dfe5ec', accent: '#1a1a1a', rivets: true },
  triple: { emblem: 'trio', enamel: '#262a31', mark: '#f2f2ee', accent: '#f0584a', badge: 'triangle' },
};
