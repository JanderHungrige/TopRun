import type { AvatarId } from '../../game/profiles';
import { SKIN, tone, type PersonLook } from '../people';

// Push-up Challenge figures (doc 12, people kit doc 17). The player's look follows the avatar (skin, hair,
// eyes, flight-suit colour); `torso` picks the clothing per avatar. Owner decision 2026-10-25: in sports
// scenes every pilot is shirtless. The rival is the wingman Lt. "Duke" Carter in navy sports shorts.

const WHITE_TOP = tone('#f3efe4', '#ffffff', '#c9c2b0');
const SNEAKER_DARK = tone('#2c3646', '#56627a', '#1b222d');
const FAIR_SKIN = { base: '#f2c4a0', light: '#fcdcc0', shadow: '#d49e7a', deep: '#9a6044', lip: '#b46056' };

/** A later preset (doc 08) in the shared sports kit: shirtless, flight-suit trousers, sneakers. */
const sporty = (hair: PersonLook['hair'], eyes: string, bottom: PersonLook['bottom'], skin: PersonLook['skin'] = FAIR_SKIN): PersonLook => ({
  skin, hair, eyes, torso: 'shirtless', top: WHITE_TOP, legs: 'trousers', bottom, trim: '#f3efe4', tied: true,
  feet: 'sneakers', shoe: SNEAKER_DARK, sole: '#f2f2ee', tags: true,
});

export const PLAYER_LOOKS: Readonly<Record<AvatarId, PersonLook>> = Object.freeze({
  pilot1: {
    skin: { base: '#f4cba6', light: '#fde2c8', shadow: '#d7a17b', deep: '#9e6446', lip: '#b8645a' },
    hair: { style: 'bob', base: '#e6bd5f', light: '#f8e09c', shadow: '#bb8d36', brow: '#a87a2c' },
    eyes: '#3b2416',
    torso: 'shirtless',
    top: WHITE_TOP,
    legs: 'trousers',
    bottom: tone('#e27a30', '#f29c56', '#b85c1e'),
    trim: '#f3efe4',
    tied: true,
    feet: 'sneakers',
    shoe: SNEAKER_DARK,
    sole: '#f2f2ee',
    tags: true,
  },
  pilot2: {
    skin: { base: '#f2c6a0', light: '#fcdcc0', shadow: '#d49f7a', deep: '#9a6044', lip: '#b46458' },
    hair: { style: 'long', base: '#ecd08a', light: '#fbecbc', shadow: '#c4a258', brow: '#b08646' },
    eyes: '#6d8ea8',
    torso: 'shirtless',
    top: tone('#e8e2d2', '#fbf8f0', '#bfb8a4'),
    legs: 'trousers',
    bottom: tone('#2c3d68', '#43588f', '#1f2b4c'),
    trim: '#e8e2d2',
    tied: true,
    feet: 'sneakers',
    shoe: tone('#b8322c', '#d65a50', '#8a2420'),
    sole: '#f2f2ee',
    tags: true,
  },
  pilot3: {
    skin: { base: '#f3c7a2', light: '#fde0c6', shadow: '#d6a07b', deep: '#9a6044', lip: '#b45e54' },
    hair: { style: 'messy', base: '#cf8f4f', light: '#ecb57c', shadow: '#9e632e', brow: '#91572a' },
    eyes: '#6b4428',
    torso: 'shirtless',
    top: tone('#e9e4d6', '#fbf8f0', '#c0b9a6'),
    legs: 'trousers',
    bottom: tone('#647044', '#7d8a56', '#4a5330'),
    trim: '#e9e4d6',
    tied: true,
    feet: 'sneakers',
    shoe: SNEAKER_DARK,
    sole: '#f2f2ee',
    tags: true,
  },
  /** The grown-up preset (doc 08): curly honey-blond hair, blue-grey eyes, khaki flight-suit trousers. */
  pilot4: {
    skin: { base: '#f0c09c', light: '#fbd8bb', shadow: '#d29878', deep: '#975c42', lip: '#b15c52' },
    hair: { style: 'messy', base: '#c99a4e', light: '#e8c27e', shadow: '#94702f', brow: '#8a6630' },
    eyes: '#5f7f98',
    torso: 'shirtless',
    top: tone('#e6e2d4', '#faf7ee', '#bdb6a2'),
    legs: 'trousers',
    bottom: tone('#7d7150', '#9a8c66', '#5c5339'),
    trim: '#e6e2d4',
    tied: true,
    feet: 'sneakers',
    shoe: SNEAKER_DARK,
    sole: '#f2f2ee',
    tags: true,
  },
  /** Second row (doc 08): the teen with the dark-blond fringe, the grown-up with the strawberry-blond bun, the
   *  freckled girl with the hairband, the grown-up with windswept brown hair, the youngest, platinum blond. */
  pilot5: sporty({ style: 'messy', base: '#b8955c', light: '#d8b882', shadow: '#8a6c3c', brow: '#7d6034' }, '#6a8296',
    tone('#3d4a5c', '#56657c', '#2a3340')),
  pilot6: sporty({ style: 'long', base: '#d2a06e', light: '#ecc296', shadow: '#a4764a', brow: '#b07848' }, '#7aa0c0',
    tone('#7d7150', '#9a8c66', '#5c5339')),
  pilot7: sporty({ style: 'long', base: '#e8c56c', light: '#f8e3a4', shadow: '#bd9a44', brow: '#a8843a' }, '#6d8ea8',
    tone('#2c6a68', '#3f8a86', '#1e4c4a')),
  pilot8: sporty({ style: 'bob', base: '#6b4a32', light: '#8e6a4c', shadow: '#4a3020', brow: '#4e3424' }, '#6a8296',
    tone('#2c3d68', '#43588f', '#1f2b4c')),
  pilot9: sporty({ style: 'crew', base: '#f0dfa8', light: '#fff4d2', shadow: '#c8b47c', brow: '#c4ad78' }, '#4f86c6',
    tone('#b8322c', '#d65a50', '#8a2420')),
  /** Rows 3–4 (doc 08): honey-blond bun, receding brown hair and moustache, dark curls, the curly-haired boy,
   *  platinum hair, sandy crop, ash-blond ponytail, sandy shoulder-length hair, long grey-brown hair. */
  pilot10: sporty({ style: 'long', base: '#c8a46a', light: '#e4c592', shadow: '#9a7a44', brow: '#8e7040' }, '#6d8ea8',
    tone('#2c3d68', '#43588f', '#1f2b4c')),
  pilot11: sporty({ style: 'crew', base: '#6b4a32', light: '#8e6a4c', shadow: '#4a3020', brow: '#4e3424' }, '#6b5030',
    tone('#647044', '#7d8a56', '#4a5330')),
  pilot12: sporty({ style: 'messy', base: '#3a2618', light: '#5a4030', shadow: '#24160c', brow: '#2a1a10' }, '#3b2416',
    tone('#b8322c', '#d65a50', '#8a2420'), SKIN.tan),
  pilot13: sporty({ style: 'messy', base: '#2a1c14', light: '#46322a', shadow: '#160e08', brow: '#1e140c' }, '#3b2416',
    tone('#e27a30', '#f29c56', '#b85c1e'), SKIN.tan),
  pilot14: sporty({ style: 'crew', base: '#ece4cc', light: '#fffaea', shadow: '#c4b898', brow: '#c47a44' }, '#6d8ea8',
    tone('#3d4a5c', '#56657c', '#2a3340')),
  pilot15: sporty({ style: 'crew', base: '#d2aa62', light: '#ecca8c', shadow: '#a4803c', brow: '#a07a3a' }, '#5a88b8',
    tone('#2c6a68', '#3f8a86', '#1e4c4a')),
  pilot16: sporty({ style: 'long', base: '#c8b48a', light: '#e4d4b0', shadow: '#9a8660', brow: '#b88a5c' }, '#7a94a8',
    tone('#7d7150', '#9a8c66', '#5c5339')),
  pilot17: sporty({ style: 'long', base: '#c9a768', light: '#e6c994', shadow: '#9c7c42', brow: '#9a7a48' }, '#6a8296',
    tone('#2c3d68', '#43588f', '#1f2b4c')),
  pilot18: sporty({ style: 'long', base: '#8a7660', light: '#ad9a82', shadow: '#62523e', brow: '#5e4c3a' }, '#5f7f98',
    tone('#647044', '#7d8a56', '#4a5330')),
});

export const RIVAL_LOOK: PersonLook = Object.freeze<PersonLook>({
  skin: { base: '#e6b48e', light: '#f6cfac', shadow: '#c28c66', deep: '#86563a', lip: '#9c5a4c' },
  hair: { style: 'crew', base: '#6b4426', light: '#94683f', shadow: '#4a2e18', brow: '#5e3b20' },
  eyes: '#4f7f5a',
  torso: 'shirtless',
  top: tone('#2f3f66', '#46598a', '#1e2944'),
  legs: 'shorts',
  bottom: tone('#2f3f66', '#46598a', '#1e2944'),
  trim: '#eef0f2',
  feet: 'sneakers',
  shoe: tone('#e4e8ec', '#ffffff', '#aeb6be'),
  sole: '#6f7882',
  tags: true,
});
