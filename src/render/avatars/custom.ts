import type { AvatarLook, Cheeks, EyeColor, Freckles, HairColor, HairStyle, SkinTone, SuitColor } from '../../game/avatar-look';
import { PAL, type Ramp } from '../pixel/palette';
import type { Pix } from '../pixel/raster';
import { D1, D2 } from '../portraits/parts';
import type { Rig } from '../portraits/types';
import { accessory, accessoryFront, glasses, starPatch } from './extras';
import { CROP, BUZZ, PONYTAIL, SIDE_PART } from './hair';
import { BRAIDS, BUN, CURLY } from './hair-more';
import { drawFace, KID_HEAD, type FaceArt } from './head';
import { flightSuit, moods, type AvatarArt, type HairArt } from './kit';
import { BOB } from './pilot1';
import { LONG } from './pilot2';
import { MOP } from './pilot3';
import { SKIES } from './skies';

/**
 * A pilot avatar composed from the builder's parts (doc 29): sky, flight suit in the chosen colour, hair back and
 * front layers, the realistic face (head.ts) with its eyes, brows, nose, mouth, warmth and freckles, glasses and a
 * neck accessory — the same pieces, frame, moods and animation frames as the hand-drawn presets.
 */

const SKIN: Readonly<Record<SkinTone, Ramp>> = {
  pale: PAL.skinPale, light: PAL.skinLight, ruddy: PAL.skinRuddy, tan: PAL.skinTan,
  olive: PAL.skinOlive, brown: PAL.skinBrown, deep: PAL.skinDeep, ebony: PAL.skinEbony,
};
/** A slightly warmer tone of each skin for the cheeks' faint warmth (only replaces the mid tone). */
const WARM: Readonly<Record<SkinTone, number>> = {
  pale: PAL.skinRuddy[4] ?? 0, light: PAL.rose[3] ?? 0, ruddy: PAL.rose[2] ?? 0, tan: PAL.skinRuddy[3] ?? 0,
  olive: PAL.skinRuddy[3] ?? 0, brown: PAL.skinRuddy[2] ?? 0, deep: PAL.skinRuddy[1] ?? 0, ebony: PAL.skinDeep[2] ?? 0,
};
const HAIR: Readonly<Record<HairColor, Ramp>> = {
  black: PAL.hairBlack, darkBrown: PAL.hairDarkBrown, brown: PAL.hairBrown, chestnut: PAL.hairChestnut, auburn: PAL.hairAuburn,
  strawberry: PAL.hairStrawberry, ginger: PAL.hairGinger, golden: PAL.hairGold, blond: PAL.hairBlond, platinum: PAL.hairPlatinum,
  silver: PAL.hairGrey, blue: PAL.hairBlue, pink: PAL.hairPink,
};
const IRIS: Readonly<Record<EyeColor, Ramp>> = {
  dark: PAL.irisDark, brown: PAL.irisBrown, hazel: PAL.irisHazel, green: PAL.irisGreen, blue: PAL.irisBlue, grey: PAL.irisGrey,
};
const SUIT: Readonly<Record<SuitColor, Ramp>> = {
  orange: PAL.orange, navy: PAL.navy, sage: PAL.sage, olive: PAL.olive, grey: PAL.steel, khaki: PAL.khaki, red: PAL.red, blue: PAL.blue,
};
const STYLE: Readonly<Record<HairStyle, HairArt>> = {
  bob: BOB, long: LONG, mop: MOP, crop: CROP, buzz: BUZZ, sidePart: SIDE_PART, ponytail: PONYTAIL, bun: BUN, curly: CURLY, braids: BRAIDS,
};
/** Light hair gets brows a step darker than its shadow tone; dark hair its deep shadow. */
const LIGHT_HAIR: ReadonlySet<HairColor> = new Set(['strawberry', 'ginger', 'golden', 'blond', 'platinum', 'silver']);
const DARK_SKIN: ReadonlySet<SkinTone> = new Set(['brown', 'deep', 'ebony']);

const CHEEK_LEVEL: Readonly<Record<Cheeks, number>> = { none: 0, soft: 0.6, rosy: 1.15 };
const FRECKLE_DENSITY: Readonly<Record<Freckles, number>> = { none: 0, some: 0.1, many: 0.2 };
const MOODS = moods(0.5, { hood: 0.04 });

export const suitRamp = (s: SuitColor): Ramp => SUIT[s];
export const skinRamp = (s: SkinTone): Ramp => SKIN[s];
export const hairRamp = (h: HairColor): Ramp => HAIR[h];
export const eyeRamp = (e: EyeColor): Ramp => IRIS[e];

function lowerLip(skin: SkinTone): number {
  if (DARK_SKIN.has(skin)) return PAL.mouth[3] ?? 0;
  return (skin === 'tan' || skin === 'olive' ? PAL.rose[2] : PAL.rose[3]) ?? 0;
}

/** The face of a look: the shared kid head with the chosen skin, eyes, brows, cheeks and freckles. */
function faceOf(look: AvatarLook): FaceArt {
  const s = SKIN[look.skin];
  const h = HAIR[look.hairColor];
  const dark = DARK_SKIN.has(look.skin);
  return {
    head: KID_HEAD,
    skin: s,
    eye: { x: 7.5, y: 43.6, w: 6.6, h: 2.5, iris: IRIS[look.eyes], lid: (dark ? PAL.hairBlack[1] : PAL.hairBrown[1]) ?? 0 },
    brow: { x0: 3, x1: 11.4, y: 38.6, th: 1.3, color: h[LIGHT_HAIR.has(look.hairColor) ? 2 : 1] ?? 0, attitude: 0.3 },
    nose: { y0: 43.2, tip: 52, w: 2.1 },
    mouth: { y: 58.6, w: 4.8, line: s[D2] ?? 0, upper: s[D1] ?? 0, lower: lowerLip(look.skin), smirk: 0.6 },
    warmth: { tint: WARM[look.skin], level: CHEEK_LEVEL[look.cheeks] },
    freckles: { tones: [s[D1] ?? 0, (dark ? s[D2] : PAL.skinTan[3]) ?? 0], density: FRECKLE_DENSITY[look.freckles] },
  };
}

function head(look: AvatarLook, face: FaceArt, p: Pix, r: Rig): void {
  const style = STYLE[look.hair];
  const h = HAIR[look.hairColor];
  style.back?.(p, h, face.skin);
  drawFace(p, r, face);
  style.front(p, h, face.skin);
  glasses(p, look.glasses, face.eye.x, face.eye.y);
}

function body(look: AvatarLook, p: Pix, r: Rig): void {
  STYLE[look.hair].behind?.(p, HAIR[look.hairColor]);
  flightSuit(p, { ramp: SUIT[look.suit], tee: PAL.white[3] ?? 0 }, SKIN[look.skin]);
  starPatch(p);
  accessory(p, look.accessory, r);
}

/** The bust art of a look (index.ts memoises it by lookKey). */
export function customArt(look: AvatarLook): AvatarArt {
  const front = accessoryFront(look.accessory);
  const face = faceOf(look);
  return {
    sky: SKIES[look.sky],
    moods: MOODS,
    body: (p, r) => body(look, p, r),
    head: (p, r) => head(look, face, p, r),
    front: front ? (p) => front(p) : undefined,
    face,
  };
}
