import type { AvatarId } from './profiles';

// Own pilot portraits (docs 29, 33): the traits a generated portrait is picked by (age, skin, hair colour, hair
// length), defensive parsing that migrates the retired v1/v2 looks, deterministic random picks and the nearest
// available portrait. Pure — the images live in src/assets/portraits/custom/<age>-<skin>-<hair>-<length>.png.

export const AGES = ['kid', 'adult'] as const;
export const SKINS = ['fair', 'olive', 'brown', 'dark'] as const;
export const HAIRS = ['black', 'brown', 'blond', 'red'] as const;
export const LENGTHS = ['short', 'long'] as const;

export type Age = (typeof AGES)[number];
export type Skin = (typeof SKINS)[number];
export type HairColor = (typeof HAIRS)[number];
export type HairLength = (typeof LENGTHS)[number];

/** A pilot's own look: the traits of a generated portrait. */
export interface AvatarLook {
  age: Age;
  skin: Skin;
  hair: HairColor;
  length: HairLength;
}

export type LookPart = keyof AvatarLook;
/** The builder's rows, top to bottom. */
export const LOOK_PARTS: readonly LookPart[] = Object.freeze(['age', 'skin', 'hair', 'length'] as const);

const OPTIONS: { readonly [P in LookPart]: readonly AvatarLook[P][] } = { age: AGES, skin: SKINS, hair: HAIRS, length: LENGTHS };

/** Every option of one part, in the builder's order. */
export const lookOptions = <P extends LookPart>(part: P): readonly AvatarLook[P][] => OPTIONS[part];

export const DEFAULT_LOOK: Readonly<AvatarLook> = Object.freeze({ age: 'kid', skin: 'fair', hair: 'brown', length: 'short' });

/** The traits closest to each preset portrait: where a preset pilot's builder starts. */
export const PRESET_LOOKS: Readonly<Record<AvatarId, Readonly<AvatarLook>>> = Object.freeze({
  pilot1: { age: 'kid', skin: 'fair', hair: 'blond', length: 'long' },
  pilot2: { age: 'kid', skin: 'fair', hair: 'blond', length: 'long' },
  pilot3: { age: 'kid', skin: 'fair', hair: 'red', length: 'short' },
});

/** The preset a custom pilot is filed under (profile.avatar) where only presets exist, e.g. the ladder colour. */
export function lookPreset(look: AvatarLook): AvatarId {
  if (look.hair === 'red') return 'pilot3';
  return look.hair === 'blond' && look.length === 'long' ? 'pilot2' : 'pilot1';
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function pick<T extends string>(v: unknown, valid: readonly T[], fallback: T): T {
  return valid.find((x) => x === v) ?? fallback;
}

/** The retired v1/v2 builder (doc 29): 8 skin tones, 13 hair colours, 10 styles. */
const OLD_SKINS: readonly string[] = ['pale', 'light', 'ruddy', 'tan', 'olive', 'brown', 'deep', 'ebony'];
const OLD_HAIR: Readonly<Record<string, HairColor>> = {
  black: 'black', blue: 'black', darkBrown: 'brown', brown: 'brown', chestnut: 'brown', auburn: 'red', strawberry: 'red',
  ginger: 'red', pink: 'red', golden: 'blond', blond: 'blond', platinum: 'blond', silver: 'blond',
};
const OLD_STYLES: readonly string[] = ['bob', 'long', 'mop', 'crop', 'buzz', 'sidePart', 'ponytail', 'bun', 'curly', 'braids'];
const OLD_LONG: readonly string[] = ['long', 'ponytail', 'braids', 'bob'];

const isOldLook = (r: Record<string, unknown>): boolean => 'hairColor' in r || 'suit' in r || OLD_STYLES.some((s) => s === r.hair);

/** A v1/v2 look → the nearest pick: skin index into 4 buckets, hair colour family, long styles → long, a kid. */
function migrate(r: Record<string, unknown>): AvatarLook {
  const skinAt = OLD_SKINS.findIndex((s) => s === r.skin);
  const hair = typeof r.hairColor === 'string' ? OLD_HAIR[r.hairColor] : undefined;
  return {
    age: 'kid',
    skin: skinAt >= 0 ? SKINS[Math.floor(skinAt / 2)] ?? DEFAULT_LOOK.skin : DEFAULT_LOOK.skin,
    hair: hair ?? DEFAULT_LOOK.hair,
    length: OLD_LONG.some((s) => s === r.hair) ? 'long' : 'short',
  };
}

/** Validates an untrusted value into a pick: never throws; an old v1/v2 look is migrated; anything unknown becomes
 *  that part's default. */
export function parseLook(raw: unknown): AvatarLook {
  if (!isRecord(raw)) return { ...DEFAULT_LOOK };
  if (isOldLook(raw)) return migrate(raw);
  const d = DEFAULT_LOOK;
  return {
    age: pick(raw.age, AGES, d.age),
    skin: pick(raw.skin, SKINS, d.skin),
    hair: pick(raw.hair, HAIRS, d.hair),
    length: pick(raw.length, LENGTHS, d.length),
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
    case 'age': return { ...look, age: step(AGES, look.age, dir) };
    case 'skin': return { ...look, skin: step(SKINS, look.skin, dir) };
    case 'hair': return { ...look, hair: step(HAIRS, look.hair, dir) };
    case 'length': return { ...look, length: step(LENGTHS, look.length, dir) };
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

/** A random but deterministic pick: the same seed always gives the same pilot. */
export function randomLook(seed: number): AvatarLook {
  const next = rng(seed);
  const choose = <T>(list: readonly T[]): T => list[Math.floor(next() * list.length)] ?? (list[0] as T);
  return { age: choose(AGES), skin: choose(SKINS), hair: choose(HAIRS), length: choose(LENGTHS) };
}

/** `<age>-<skin>-<hair>-<length>`: the cache key of a pick and the name of its portrait file. */
export const lookKey = (look: AvatarLook): string => `${look.age}-${look.skin}-${look.hair}-${look.length}`;

export const sameLook = (a: AvatarLook, b: AvatarLook): boolean => lookKey(a) === lookKey(b);

/** A portrait file name → its pick (null for anything that is not `<age>-<skin>-<hair>-<length>`). */
export function lookFromKey(key: string): AvatarLook | null {
  const [age, skin, hair, length, extra] = key.split('-');
  const ok = extra === undefined && AGES.some((x) => x === age) && SKINS.some((x) => x === skin)
    && HAIRS.some((x) => x === hair) && LENGTHS.some((x) => x === length);
  return ok ? parseLook({ age, skin, hair, length }) : null;
}

/** The portrait of exactly this pick, or null while it hasn't been generated (no stand-in face). */
export function portraitKey(want: AvatarLook, available: readonly string[]): string | null {
  const key = lookKey(want);
  return available.includes(key) ? key : null;
}
