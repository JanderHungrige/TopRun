import type { MedalId } from '../../data/medals';

// Medal art (doc 25): what sits on each medal beyond its data look (ribbon stripes, shape, metal). Original
// designs with generic award shapes — no real decoration's design, no national insignia.

export type EmblemId =
  | 'wave' | 'sun' | 'flake' | 'mesa' | 'trident' | 'star' | 'stars3' | 'jet' | 'palm' | 'sword' | 'reticle'
  | 'shield' | 'laurelStar' | 'helmet' | 'chevronJet' | 'trio';

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
