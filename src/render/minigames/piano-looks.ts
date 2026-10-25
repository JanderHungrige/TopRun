import type { AvatarId } from '../../game/profiles';
import { SKIN, tone, type PersonLook, type SkinTone, type Tone } from '../people';
import { PLAYER_LOOKS, RIVAL_LOOK } from './pushups-looks';

// Piano Bar (doc 23): people-kit looks (doc 17). The player keeps the avatar's colours (skin, hair, eyes,
// flight-suit trousers) in an off-duty white T-shirt; the squadmates are original characters in T-shirts and
// tank tops. Built once so the pixel cache keys (object identity) stay stable.

const WHITE_TEE = tone('#f1ede2', '#ffffff', '#c4bdab');
const SNEAKER = tone('#3a3f4a', '#5d6574', '#22262d');
const JEANS = tone('#3b4f78', '#5670a0', '#283654');
const KHAKI = tone('#9a8a62', '#b8a87e', '#776842');

export const PIANO_PLAYER: Readonly<Record<AvatarId, PersonLook>> = Object.freeze({
  pilot1: { ...PLAYER_LOOKS.pilot1, torso: 'tshirt', top: WHITE_TEE, tied: false, tags: false },
  pilot2: { ...PLAYER_LOOKS.pilot2, torso: 'tshirt', top: WHITE_TEE, tied: false, tags: false },
  pilot3: { ...PLAYER_LOOKS.pilot3, torso: 'tshirt', top: WHITE_TEE, tied: false, tags: false },
});

interface Who { skin: SkinTone; hair: PersonLook['hair']; eyes: string }

function mate(who: Who, torso: PersonLook['torso'], top: Tone, bottom: Tone, shoe: Tone = SNEAKER): PersonLook {
  return {
    ...who, torso, top, legs: 'trousers', bottom, trim: '#e8e4da', feet: 'sneakers', shoe, sole: '#e8e4da', tied: false, tags: false,
  };
}

const RUDDY: SkinTone = { base: '#e2a07c', light: '#f2bd9a', shadow: '#bd7b58', deep: '#80462e', lip: '#a4544a' };
const hair = (style: PersonLook['hair']['style'], base: string, light: string, shadow: string, brow: string): PersonLook['hair'] =>
  ({ style, ...tone(base, light, shadow), brow });

/** The crowd in arrival order: Duke, Shooter, the Chief, three squadmates, the Admiral. */
export const CROWD_LOOKS: readonly PersonLook[] = Object.freeze([
  mate({ skin: RIVAL_LOOK.skin, hair: RIVAL_LOOK.hair, eyes: RIVAL_LOOK.eyes }, 'tshirt', tone('#2f3f66', '#46598a', '#1e2944'), KHAKI),
  mate({ skin: SKIN.olive, hair: hair('long', '#1d1714', '#3a2e28', '#0e0a08', '#16100c'), eyes: '#4a2c18' }, 'tshirt',
    tone('#f2c230', '#ffe07a', '#c2931a'), JEANS),
  mate({ skin: RUDDY, hair: hair('crew', '#a8acb0', '#d4d7da', '#7c8084', '#8e9296'), eyes: '#5a7fa8' }, 'tshirt',
    tone('#6b4a2b', '#8c6640', '#4a321c'), tone('#3c3c3c', '#585858', '#262626')),
  mate({ skin: SKIN.deep, hair: hair('buzz', '#17110d', '#3a2c22', '#0c0806', '#140e0a'), eyes: '#2a1a10' }, 'tank',
    tone('#b8322c', '#d65a50', '#8a2420'), JEANS),
  mate({ skin: SKIN.fair, hair: hair('bob', '#9a4a24', '#c26a3c', '#6e3216', '#7e3c1c'), eyes: '#4d6f8c' }, 'tshirt',
    tone('#2f8f8a', '#4fb3ad', '#1f6662'), KHAKI),
  mate({ skin: SKIN.brown, hair: hair('messy', '#2a1d16', '#4a3528', '#16100b', '#22170f'), eyes: '#3a2416' }, 'tshirt',
    tone('#e6e1d5', '#ffffff', '#bdb6a5'), tone('#55603a', '#6f7c4c', '#3c4428')),
  mate({ skin: SKIN.tan, hair: hair('crew', '#5b3d24', '#7f5a38', '#3c2615', '#4a311c'), eyes: '#3a2a1c' }, 'tshirt',
    tone('#1f2c4d', '#34467a', '#141d33'), KHAKI, tone('#5a3a22', '#7a5434', '#3a2414')),
]);
