import type { AvatarId } from '../../game/profiles';
import type { PilotLook } from './pushups-pilot';

// Push-up Challenge figures (doc 12): the player's look follows the avatar (hair, skin, flight-suit
// colour), the rival is the wingman Lt. "Duke" Carter in a navy squadron T-shirt.

export const PLAYER_LOOKS: Readonly<Record<AvatarId, PilotLook>> = Object.freeze({
  pilot1: {
    skin: '#f4cba6', skinDark: '#dcab84', hair: '#e6bd5f', hairDark: '#bb8d36', style: 'bob',
    shirt: '#f3efe4', shirtDark: '#c9c2b0', trousers: '#e27a30', trousersDark: '#b85c1e', shoe: '#2c3646', sole: '#f2f2ee',
  },
  pilot2: {
    skin: '#f2c6a0', skinDark: '#d9a580', hair: '#ecd08a', hairDark: '#c4a258', style: 'long',
    shirt: '#e8e2d2', shirtDark: '#bfb8a4', trousers: '#2c3d68', trousersDark: '#1f2b4c', shoe: '#b8322c', sole: '#f2f2ee',
  },
  pilot3: {
    skin: '#f3c7a2', skinDark: '#dba67f', hair: '#cf8f4f', hairDark: '#9e632e', style: 'messy',
    shirt: '#e9e4d6', shirtDark: '#c0b9a6', trousers: '#647044', trousersDark: '#4a5330', shoe: '#2c3646', sole: '#f2f2ee',
  },
});

export const RIVAL_LOOK: PilotLook = Object.freeze({
  skin: '#e6b48e', skinDark: '#c48f6a', hair: '#6b4426', hairDark: '#4a2e18', style: 'crew',
  shirt: '#2f3f66', shirtDark: '#1e2944', trousers: '#5f6b3f', trousersDark: '#454e2c', shoe: '#e4e8ec', sole: '#6f7882',
});
