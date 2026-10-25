import type { AvatarId } from '../../game/profiles';
import { tone, type PersonLook } from '../people';

// Push-up Challenge figures (doc 12, people kit doc 17). The player's look follows the avatar (skin, hair,
// eyes, flight-suit colour); `torso` picks the clothing per avatar. Owner decision 2026-10-25: in sports
// scenes every pilot is shirtless. The rival is the wingman Lt. "Duke" Carter in navy sports shorts.

const WHITE_TOP = tone('#f3efe4', '#ffffff', '#c9c2b0');
const SNEAKER_DARK = tone('#2c3646', '#56627a', '#1b222d');

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
