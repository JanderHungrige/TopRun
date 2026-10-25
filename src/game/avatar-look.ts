import type { AvatarId } from './profiles';

// Own pilot avatars (doc 29): the parts of the pixel builder, defensive parsing of a stored look, deterministic
// random looks and the cache key of a look. Pure — the art lives in src/render/avatars/.

export const HAIR_STYLES = ['bob', 'long', 'mop', 'crop', 'buzz', 'sidePart', 'ponytail', 'bun', 'curly', 'braids'] as const;
export const HAIR_COLORS = [
  'black', 'darkBrown', 'brown', 'chestnut', 'auburn', 'strawberry', 'ginger', 'golden', 'blond', 'platinum', 'silver', 'blue', 'pink',
] as const;
export const SKIN_TONES = ['pale', 'light', 'ruddy', 'tan', 'olive', 'brown', 'deep', 'ebony'] as const;
export const EYE_COLORS = ['dark', 'brown', 'hazel', 'green', 'blue', 'grey'] as const;
export const FRECKLES = ['none', 'some', 'many'] as const;
export const CHEEKS = ['none', 'soft', 'rosy'] as const;
export const GLASSES = ['none', 'aviators', 'clear'] as const;
export const ACCESSORIES = ['none', 'scarf', 'pendant', 'bandana', 'dogtags', 'helmet'] as const;
export const SUITS = ['orange', 'navy', 'sage', 'olive', 'grey', 'khaki', 'red', 'blue'] as const;
export const SKY_IDS = ['dawn', 'day', 'sunset', 'night'] as const;

export type HairStyle = (typeof HAIR_STYLES)[number];
export type HairColor = (typeof HAIR_COLORS)[number];
export type SkinTone = (typeof SKIN_TONES)[number];
export type EyeColor = (typeof EYE_COLORS)[number];
export type Freckles = (typeof FRECKLES)[number];
export type Cheeks = (typeof CHEEKS)[number];
export type Glasses = (typeof GLASSES)[number];
export type Accessory = (typeof ACCESSORIES)[number];
export type SuitColor = (typeof SUITS)[number];
export type SkyId = (typeof SKY_IDS)[number];

export interface AvatarLook {
  hair: HairStyle;
  hairColor: HairColor;
  skin: SkinTone;
  eyes: EyeColor;
  freckles: Freckles;
  cheeks: Cheeks;
  glasses: Glasses;
  accessory: Accessory;
  suit: SuitColor;
  sky: SkyId;
}

export type LookPart = keyof AvatarLook;
/** The builder's rows, top to bottom. */
export const LOOK_PARTS: readonly LookPart[] = Object.freeze([
  'hair', 'hairColor', 'skin', 'eyes', 'freckles', 'cheeks', 'glasses', 'accessory', 'suit', 'sky',
] as const);

const OPTIONS: { readonly [P in LookPart]: readonly AvatarLook[P][] } = {
  hair: HAIR_STYLES, hairColor: HAIR_COLORS, skin: SKIN_TONES, eyes: EYE_COLORS, freckles: FRECKLES,
  cheeks: CHEEKS, glasses: GLASSES, accessory: ACCESSORIES, suit: SUITS, sky: SKY_IDS,
};

/** Every option of one part, in the builder's order. */
export const lookOptions = <P extends LookPart>(part: P): readonly AvatarLook[P][] => OPTIONS[part];

export const DEFAULT_LOOK: Readonly<AvatarLook> = Object.freeze({
  hair: 'crop', hairColor: 'brown', skin: 'light', eyes: 'brown', freckles: 'none', cheeks: 'soft',
  glasses: 'none', accessory: 'none', suit: 'orange', sky: 'dawn',
});

/** The parts closest to each hand-drawn preset: where a preset pilot's builder starts. */
export const PRESET_LOOKS: Readonly<Record<AvatarId, Readonly<AvatarLook>>> = Object.freeze({
  pilot1: { hair: 'bob', hairColor: 'golden', skin: 'pale', eyes: 'dark', freckles: 'none', cheeks: 'soft', glasses: 'none', accessory: 'pendant', suit: 'orange', sky: 'dawn' },
  pilot2: { hair: 'long', hairColor: 'blond', skin: 'pale', eyes: 'grey', freckles: 'many', cheeks: 'soft', glasses: 'none', accessory: 'helmet', suit: 'navy', sky: 'day' },
  pilot3: { hair: 'mop', hairColor: 'strawberry', skin: 'pale', eyes: 'hazel', freckles: 'none', cheeks: 'rosy', glasses: 'none', accessory: 'scarf', suit: 'sage', sky: 'sunset' },
});

const SUIT_PRESET: Readonly<Partial<Record<SuitColor, AvatarId>>> = { orange: 'pilot1', navy: 'pilot2', sage: 'pilot3' };

/** The preset a custom pilot is filed under (profile.avatar) where no custom art exists: by suit colour. */
export const lookPreset = (look: AvatarLook): AvatarId => SUIT_PRESET[look.suit] ?? 'pilot1';

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function pick<T extends string>(v: unknown, valid: readonly T[], fallback: T): T {
  return valid.find((x) => x === v) ?? fallback;
}

/** Validates an untrusted value into a look: never throws; anything unknown becomes that part's default. */
export function parseLook(raw: unknown): AvatarLook {
  const r = isRecord(raw) ? raw : {};
  const d = DEFAULT_LOOK;
  return {
    hair: pick(r.hair, HAIR_STYLES, d.hair),
    hairColor: pick(r.hairColor, HAIR_COLORS, d.hairColor),
    skin: pick(r.skin, SKIN_TONES, d.skin),
    eyes: pick(r.eyes, EYE_COLORS, d.eyes),
    freckles: pick(r.freckles, FRECKLES, d.freckles),
    cheeks: pick(r.cheeks, CHEEKS, d.cheeks),
    glasses: pick(r.glasses, GLASSES, d.glasses),
    accessory: pick(r.accessory, ACCESSORIES, d.accessory),
    suit: pick(r.suit, SUITS, d.suit),
    sky: pick(r.sky, SKY_IDS, d.sky),
  };
}

function step<T extends string>(options: readonly T[], value: T, dir: number): T {
  const n = options.length;
  const i = options.indexOf(value);
  return options[(((i < 0 ? 0 : i) + dir) % n + n) % n] ?? value;
}

/** The next (dir = 1) or previous (dir = -1) option of one part, wrapping round. */
export function cycleLook(look: AvatarLook, part: LookPart, dir: number): AvatarLook {
  switch (part) {
    case 'hair': return { ...look, hair: step(HAIR_STYLES, look.hair, dir) };
    case 'hairColor': return { ...look, hairColor: step(HAIR_COLORS, look.hairColor, dir) };
    case 'skin': return { ...look, skin: step(SKIN_TONES, look.skin, dir) };
    case 'eyes': return { ...look, eyes: step(EYE_COLORS, look.eyes, dir) };
    case 'freckles': return { ...look, freckles: step(FRECKLES, look.freckles, dir) };
    case 'cheeks': return { ...look, cheeks: step(CHEEKS, look.cheeks, dir) };
    case 'glasses': return { ...look, glasses: step(GLASSES, look.glasses, dir) };
    case 'accessory': return { ...look, accessory: step(ACCESSORIES, look.accessory, dir) };
    case 'suit': return { ...look, suit: step(SUITS, look.suit, dir) };
    case 'sky': return { ...look, sky: step(SKY_IDS, look.sky, dir) };
    default: throw new Error(`unhandled: ${part satisfies never}`);
  }
}

/** mulberry32: a small, fast, deterministic PRNG in [0, 1). */
function rng(seed: number): () => number {
  let a = Math.floor(seed) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NATURAL_HAIR = HAIR_COLORS.filter((c) => c !== 'blue' && c !== 'pink');
const FUN_HAIR: readonly HairColor[] = ['blue', 'pink'];

/** A random but deterministic look: the same seed always gives the same pilot; fun hair colours are rare. */
export function randomLook(seed: number): AvatarLook {
  const next = rng(seed);
  const choose = <T>(list: readonly T[]): T => list[Math.floor(next() * list.length)] ?? (list[0] as T);
  const glassesRoll = next();
  return {
    hair: choose(HAIR_STYLES),
    hairColor: next() < 0.12 ? choose(FUN_HAIR) : choose(NATURAL_HAIR),
    skin: choose(SKIN_TONES),
    eyes: choose(EYE_COLORS),
    freckles: choose(FRECKLES),
    cheeks: choose(CHEEKS),
    glasses: glassesRoll < 0.6 ? 'none' : glassesRoll < 0.8 ? 'aviators' : 'clear',
    accessory: choose(ACCESSORIES),
    suit: choose(SUITS),
    sky: choose(SKY_IDS),
  };
}

/** Stable short key of a look (one base-36 option index per part): the cache key of its rendered bust. */
export function lookKey(look: AvatarLook): string {
  return LOOK_PARTS.map((part) => Math.max(0, (OPTIONS[part] as readonly string[]).indexOf(look[part])).toString(36)).join('');
}

export const sameLook = (a: AvatarLook, b: AvatarLook): boolean => lookKey(a) === lookKey(b);
