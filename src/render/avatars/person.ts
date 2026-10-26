import { lookKey, type AvatarLook, type HairColor, type Skin } from '../../game/avatar-look';
import type { AvatarId } from '../../game/profiles';
import { PLAYER_LOOKS } from '../minigames/pushups-looks';
import { SKIN, tone, type HairLook, type PersonLook, type SkinTone, type Tone } from '../people';

/**
 * The player as a people-kit figure (doc 17) in the full-body scenes — push-up duel, volleyball, motorbike, piano
 * bar, medal ceremony, the hangar walker (docs 29, 33): the preset's own look, or one derived from a builder pick
 * (skin, hair colour, a kit hair style from age and length, olive flight-suit trousers). Looks are memoised so
 * object identity (the kit's cache key) stays stable.
 */

/** Who to draw: a preset id or a builder pick (the `PilotFace` of index.ts). */
type Face = AvatarId | AvatarLook;

/** The active pilot's face for the full-body scenes (pilot 1 before any pilot is chosen). */
export const faceOf = (p: { avatar: AvatarId; save: { look: AvatarLook | null } } | null): Face => (p ? p.save.look ?? p.avatar : 'pilot1');

const SKINS: Readonly<Record<Skin, SkinTone>> = { fair: SKIN.fair, olive: SKIN.olive, brown: SKIN.brown, dark: SKIN.deep };
const HAIR: Readonly<Record<HairColor, Tone>> = {
  black: tone('#1d1714', '#3a2e28', '#0e0a08'),
  brown: tone('#5b3d24', '#7f5a38', '#3c2615'),
  blond: tone('#e0bd6e', '#f6dfa2', '#b28f4a'),
  red: tone('#a8562c', '#cc7a48', '#7a3a1c'),
};
const SUIT_TROUSERS = tone('#5f6b3f', '#77844f', '#454e2c');

function kitHair(look: AvatarLook): HairLook['style'] {
  if (look.length === 'long') return 'long';
  return look.age === 'kid' ? 'messy' : 'crew';
}

function fromLook(look: AvatarLook): PersonLook {
  const h = HAIR[look.hair];
  const lightEyes = look.skin === 'fair' && (look.hair === 'blond' || look.hair === 'red');
  return {
    ...PLAYER_LOOKS.pilot1,
    skin: SKINS[look.skin],
    hair: { style: kitHair(look), ...h, brow: h.shadow },
    eyes: lightEyes ? '#4d6f8c' : '#3b2416',
    bottom: SUIT_TROUSERS,
  };
}

const custom = new Map<string, PersonLook>();

/** The player's base figure (shirtless, flight-suit trousers): the scenes restyle it with `restyle`. */
export function playerPerson(face: Face): PersonLook {
  if (typeof face === 'string') return PLAYER_LOOKS[face];
  const key = lookKey(face);
  let look = custom.get(key);
  if (!look) {
    look = fromLook(face);
    custom.set(key, look);
  }
  return look;
}

const restyled = new Map<string, WeakMap<PersonLook, PersonLook>>();

/** A scene's variant of a base look (beach shorts, dress whites, T-shirt …), built once per base and `tag`. */
export function restyle(base: PersonLook, tag: string, make: (b: PersonLook) => PersonLook): PersonLook {
  let byBase = restyled.get(tag);
  if (!byBase) {
    byBase = new WeakMap();
    restyled.set(tag, byBase);
  }
  let look = byBase.get(base);
  if (!look) {
    look = make(base);
    byBase.set(base, look);
  }
  return look;
}
