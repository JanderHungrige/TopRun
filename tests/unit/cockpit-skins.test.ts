import { describe, it, expect } from 'vitest';
import { PLANES } from '../../src/data/planes';
import { PLANE_IDS } from '../../src/data/types';
import { cockpitSkin } from '../../src/game/cockpit';
import { COCKPIT_SKINS, COCKPIT_SKIN_IDS } from '../../src/render/cockpit/skin';

// Cockpit skins (docs 61, 67): the consoles keep their layout; jets gunmetal, helicopters olive, the spacecraft holo glass,
// the subs brass and teal.

describe('Cockpit skins (doc 61)', () => {
  it('picks the skin from the craft: jets gunmetal, helicopters olive, the spacecraft holo glass, subs brass', () => {
    expect(cockpitSkin('jet')).toBe('jet');
    expect(cockpitSkin('heli')).toBe('heli');
    expect(cockpitSkin('ship')).toBe('ship');
    expect(cockpitSkin('sub')).toBe('sub');
    for (const id of PLANE_IDS) expect(COCKPIT_SKIN_IDS).toContain(cockpitSkin(PLANES[id].kind));
  });

  it('gives each skin its own screens: green phosphor, amber night vision, cyan hologram, sonar teal', () => {
    expect(COCKPIT_SKINS.jet.ink).toBe('#62f08a');
    expect(COCKPIT_SKINS.heli.ink).toBe('#ffb347');
    expect(COCKPIT_SKINS.ship.ink).toBe('#5fe3ff');
    expect(COCKPIT_SKINS.sub.ink).toBe('#6ff5d2');
    expect(new Set(COCKPIT_SKIN_IDS.map((id) => COCKPIT_SKINS[id].back.join()))).toHaveProperty('size', 6);
  });

  it('cuts the spacecraft panels at an angle and fastens the others: screws on jets, rivets on helicopters', () => {
    expect(COCKPIT_SKINS.ship.corner).toBe('chamfer');
    expect(COCKPIT_SKINS.ship.fastener).toBe('none');
    expect(COCKPIT_SKINS.ship.edgeGlow).not.toBeNull();
    expect(COCKPIT_SKINS.jet).toMatchObject({ corner: 'round', fastener: 'screw', edgeGlow: null });
    expect(COCKPIT_SKINS.heli).toMatchObject({ corner: 'round', fastener: 'rivet' });
    expect(COCKPIT_SKINS.sub).toMatchObject({ corner: 'round', fastener: 'rivet' });
  });
});
