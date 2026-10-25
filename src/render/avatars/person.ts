import { lookKey, type AvatarLook, type HairStyle } from '../../game/avatar-look';
import type { AvatarId } from '../../game/profiles';
import { PLAYER_LOOKS } from '../minigames/pushups-looks';
import type { HairLook, PersonLook, SkinTone } from '../people';
import { hexOf, type Ramp } from '../pixel/palette';
import { BASE, D1, D2, L1 } from '../portraits/parts';
import { eyeRamp, hairRamp, skinRamp, suitRamp } from './custom';

/**
 * The player as a people-kit figure (doc 17) in the full-body scenes — push-up duel, volleyball, motorbike, piano
 * bar, medal ceremony (doc 29): the preset's own look, or one derived from a custom look (skin, hair colour and the
 * nearest kit hair style, eyes, suit colour). Looks are memoised so object identity (the kit's cache key) stays
 * stable.
 */

/** Who to draw: a preset id or a custom look (the `PilotFace` of index.ts). */
type Face = AvatarId | AvatarLook;

/** The active pilot's face for the full-body scenes (pilot 1 before any pilot is chosen). */
export const faceOf = (p: { avatar: AvatarId; save: { look: AvatarLook | null } } | null): Face => (p ? p.save.look ?? p.avatar : 'pilot1');

const KIT_HAIR: Readonly<Record<HairStyle, HairLook['style']>> = {
  bob: 'bob', long: 'long', mop: 'messy', crop: 'crew', buzz: 'buzz', sidePart: 'crew', ponytail: 'crew', bun: 'crew', curly: 'messy', braids: 'long',
};

const hex = (r: Ramp, i: number): string => hexOf(r[i] ?? 0);
const tone = (r: Ramp): { base: string; light: string; shadow: string } => ({ base: hex(r, BASE), light: hex(r, L1), shadow: hex(r, D1) });

function skinOf(r: Ramp): SkinTone {
  return { ...tone(r), deep: hex(r, D2), lip: hex(r, D1) };
}

function fromLook(look: AvatarLook): PersonLook {
  const h = hairRamp(look.hairColor);
  return {
    ...PLAYER_LOOKS.pilot1,
    skin: skinOf(skinRamp(look.skin)),
    hair: { style: KIT_HAIR[look.hair], ...tone(h), brow: hex(h, D2) },
    eyes: hex(eyeRamp(look.eyes), BASE),
    bottom: tone(suitRamp(look.suit)),
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
    if (custom.size > 16) {
      const oldest = custom.keys().next();
      if (!oldest.done) custom.delete(oldest.value);
    }
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
