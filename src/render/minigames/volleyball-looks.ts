import type { AvatarLook } from '../../game/avatar-look';
import type { AthleteId } from '../../game/minigames/volleyball-athlete';
import type { AvatarId } from '../../game/profiles';
import { playerPerson, restyle } from '../avatars/person';
import { SKIN, tone, type PersonLook } from '../people';
import { RIVAL_LOOK } from './pushups-looks';

// Beach Volleyball figures (doc 21, people kit doc 17). Owner decision: in sports scenes everyone is shirtless —
// athletic, tasteful. On the sand they play barefoot in shorts. The player keeps the avatar's skin, hair, eyes
// and torso choice with shorts in the avatar's flight-suit colour; Duke is the push-up duel's Duke in his navy
// shorts. Breaker and Riptide are original rival pilots. Looks are built once (the pixel cache keys on them).

const beach = (look: PersonLook, shorts = look.bottom): PersonLook => ({
  ...look, legs: 'shorts', bottom: shorts, tied: false, feet: 'barefoot', tags: false,
});

/** The player on the sand: their own look (preset or custom, doc 29) in shorts. */
const player = (face: AvatarId | AvatarLook): PersonLook => restyle(playerPerson(face), 'beach', (b) => beach(b));

const DUKE: PersonLook = beach(RIVAL_LOOK);

const BREAKER: PersonLook = {
  skin: SKIN.deep,
  hair: { style: 'buzz', ...tone('#16100c', '#33261c', '#0a0705'), brow: '#120c08' },
  eyes: '#2a1a10',
  torso: 'shirtless',
  top: tone('#c8312a', '#e8604c', '#962420'),
  legs: 'shorts',
  bottom: tone('#c8312a', '#e8604c', '#962420'),
  trim: '#f4f1ea',
  feet: 'barefoot',
  shoe: tone('#e4e8ec', '#ffffff', '#aeb6be'),
  sole: '#6f7882',
};

const RIPTIDE: PersonLook = {
  skin: SKIN.tan,
  hair: { style: 'messy', ...tone('#f2e2a8', '#fff6d2', '#c4a258'), brow: '#9a7a3e' },
  eyes: '#3d6a5a',
  torso: 'shirtless',
  top: tone('#2a9a8e', '#4fc3b2', '#1c6e66'),
  legs: 'shorts',
  bottom: tone('#2a9a8e', '#4fc3b2', '#1c6e66'),
  trim: '#f2c94c',
  feet: 'barefoot',
  shoe: tone('#e4e8ec', '#ffffff', '#aeb6be'),
  sole: '#6f7882',
};

export function athleteLook(id: AthleteId, avatar: AvatarId | AvatarLook): PersonLook {
  switch (id) {
    case 'you': return player(avatar);
    case 'duke': return DUKE;
    case 'breaker': return BREAKER;
    case 'riptide': return RIPTIDE;
    default: throw new Error(`unhandled: ${id satisfies never}`);
  }
}

const fan = (skin: PersonLook['skin'], hair: PersonLook['hair'], torso: PersonLook['torso'], top: string, shorts: string): PersonLook => ({
  skin, hair, eyes: '#3a2416', torso, top: tone(top, 'rgba(255,255,255,0.4)', 'rgba(0,0,0,0.3)'), legs: 'shorts',
  bottom: tone(shorts, 'rgba(255,255,255,0.35)', 'rgba(0,0,0,0.35)'), trim: '#f2f2ee', feet: 'barefoot',
  shoe: tone('#e8eaec', '#ffffff', '#b2b8be'), sole: '#5d646c',
});

/** Spectators on the far sand: crew from the base, off duty. */
export const FANS: readonly PersonLook[] = [
  fan(SKIN.light, { style: 'crew', ...tone('#6b4426', '#94683f', '#4a2e18'), brow: '#5e3b20' }, 'shirtless', '#ffffff', '#2f63ad'),
  fan(SKIN.olive, { style: 'long', ...tone('#2a1d16', '#4a3528', '#16100b'), brow: '#22170f' }, 'sportsTop', '#e86d4d', '#2c3d68'),
  fan(SKIN.brown, { style: 'buzz', ...tone('#17110d', '#3a2c22', '#0c0806'), brow: '#140e0a' }, 'tank', '#f2c94c', '#3b4a33'),
  fan(SKIN.fair, { style: 'bob', ...tone('#c4823e', '#e0a868', '#94582a'), brow: '#8a5228' }, 'sportsTop', '#4fb3a8', '#f4ede0'),
  fan(SKIN.tan, { style: 'messy', ...tone('#3a2614', '#5e4228', '#22160a'), brow: '#2a1a0c' }, 'shirtless', '#ffffff', '#c2342c'),
  fan(SKIN.deep, { style: 'crew', ...tone('#1a1410', '#3a2e24', '#0c0a08'), brow: '#120e0a' }, 'tank', '#7d8794', '#2f3d5c'),
];
