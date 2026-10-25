import type { AvatarLook, Cheeks, EyeColor, Freckles, HairColor, HairStyle, SkinTone, SuitColor } from '../../game/avatar-look';
import { PAL, type Ramp } from '../pixel/palette';
import type { Mask, Pix } from '../pixel/raster';
import { brows, eyes, mouth, nose, type Brows, type Eyes, type Mouth } from '../portraits/features';
import { blush, D1, D2, face, type Face } from '../portraits/parts';
import type { Rig } from '../portraits/types';
import { accessory, accessoryFront, glasses, starPatch } from './extras';
import { CROP, BUZZ, PONYTAIL, SIDE_PART } from './hair';
import { BRAIDS, BUN, CURLY } from './hair-more';
import { flightSuit, freckles, moods, type AvatarArt, type HairArt } from './kit';
import { BOB } from './pilot1';
import { LONG } from './pilot2';
import { MOP } from './pilot3';
import { SKIES } from './skies';

/**
 * A pilot avatar composed from the builder's parts (doc 29): sky, flight suit in the chosen colour, hair back and
 * front layers, face, freckles, cheeks, eyes, brows, nose, mouth, glasses and a neck accessory — the same pieces,
 * frame, moods and animation frames as the hand-drawn presets.
 */

const SKIN: Readonly<Record<SkinTone, Ramp>> = {
  pale: PAL.skinPale, light: PAL.skinLight, ruddy: PAL.skinRuddy, tan: PAL.skinTan,
  olive: PAL.skinOlive, brown: PAL.skinBrown, deep: PAL.skinDeep, ebony: PAL.skinEbony,
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

const FACE: Face = { w: 18.4, jaw: 12.6, top: 26, chin: 74.2 };
const EYE_AT = { x: 7.8, y: 52.6 } as const;
const BROW: Omit<Brows, 'color'> = { x0: 3.2, x1: 12.2, y: 45.8, th: 1.7 };
const MOODS = moods(0.5);

export const suitRamp = (s: SuitColor): Ramp => SUIT[s];
export const skinRamp = (s: SkinTone): Ramp => SKIN[s];
export const hairRamp = (h: HairColor): Ramp => HAIR[h];
export const eyeRamp = (e: EyeColor): Ramp => IRIS[e];

/** Cheek tint and dither level per option; darker skins get a deeper rose so it still shows. */
function cheeks(p: Pix, c: Cheeks, skin: SkinTone, clip: Mask): void {
  if (c === 'none') return;
  const deep = DARK_SKIN.has(skin);
  const tint = (deep ? PAL.rose[1] : c === 'rosy' ? PAL.rose[2] : PAL.rose[3]) ?? 0;
  const level = c === 'rosy' ? 0.62 : deep ? 0.3 : 0.4;
  blush(p, 11.4, 60.8, c === 'rosy' ? 4.4 : 3.6, c === 'rosy' ? 2.8 : 2.2, tint, clip, level);
}

const FRECKLE_DENSITY: Readonly<Record<Freckles, number>> = { none: 0, some: 0.14, many: 0.3 };

function lowerLip(skin: SkinTone): number {
  if (DARK_SKIN.has(skin)) return PAL.mouth[3] ?? 0;
  return (skin === 'tan' || skin === 'olive' ? PAL.rose[2] : PAL.rose[3]) ?? 0;
}

function head(look: AvatarLook, p: Pix, r: Rig): void {
  const s = SKIN[look.skin];
  const h = HAIR[look.hairColor];
  const style = STYLE[look.hair];
  style.back?.(p, h, s);
  const fm = face(p, s, FACE, r);
  cheeks(p, look.cheeks, look.skin, fm);
  freckles(p, fm, [s[D1] ?? 0, (DARK_SKIN.has(look.skin) ? s[D2] : PAL.skinTan[3]) ?? 0], FRECKLE_DENSITY[look.freckles]);
  const e: Eyes = { ...EYE_AT, rx: 4.2, ry: 3.2, iris: IRIS[look.eyes], irisW: 0.52 };
  eyes(p, r, e, s);
  nose(p, s, 55.4, 60.6, 2.4);
  const m: Mouth = { y: 66.6, w: 5.4, lower: lowerLip(look.skin) };
  mouth(p, r, m, s);
  style.front(p, h, s);
  glasses(p, look.glasses, EYE_AT.x, EYE_AT.y);
  brows(p, r, { ...BROW, color: h[LIGHT_HAIR.has(look.hairColor) ? 2 : 1] ?? 0 });
}

function body(look: AvatarLook, p: Pix, r: Rig): void {
  const s = SKIN[look.skin];
  STYLE[look.hair].behind?.(p, HAIR[look.hairColor]);
  flightSuit(p, { ramp: SUIT[look.suit], tee: PAL.white[3] ?? 0 }, s);
  starPatch(p);
  accessory(p, look.accessory, r);
}

/** The bust art of a look (index.ts memoises it by lookKey). */
export function customArt(look: AvatarLook): AvatarArt {
  const front = accessoryFront(look.accessory);
  return {
    sky: SKIES[look.sky],
    moods: MOODS,
    body: (p, r) => body(look, p, r),
    head: (p, r) => head(look, p, r),
    front: front ? (p) => front(p) : undefined,
  };
}
