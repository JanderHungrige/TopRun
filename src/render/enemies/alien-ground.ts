import type { Pal, UnitFn } from '../draw-ground-units';
import { detailUnit } from '../detail/unit';
import { LURKER, RHINO, TOAD } from './jungle-beasts';
import { SPIRE, TOTEM } from './jungle-hive';
import { LASHER, SPOREPOD } from './jungle-plants';

// The jungle planet's rooted and heavy aliens in detail (docs 96, 117), heads down (+y): the spore pod breathing on its
// roots and the lasher vine whipping its tendrils round a toothed maw (jungle-plants.ts); the armoured rhino crawler at a
// run, the acid toad with its glowing throat and the swamp lurker's eyes over the water (jungle-beasts.ts); the brood
// spire's vents and larvae and the crystal totem on its carved stone (jungle-hive.ts). Each is a detailed unit (doc 113):
// its static body cached, so flashed, as a shadow or as a wreck it keeps the outline.

type AlienGround = 'sporepod' | 'lasher' | 'rhino' | 'toad' | 'spire' | 'totem' | 'lurker';

export const ALIEN_GROUND: Readonly<Record<AlienGround, UnitFn>> = {
  sporepod: detailUnit('sporepod', SPOREPOD),
  lasher: detailUnit('lasher', LASHER),
  rhino: detailUnit('rhino', RHINO),
  toad: detailUnit('toad', TOAD),
  spire: detailUnit('spire', SPIRE),
  totem: detailUnit('totem', TOTEM),
  lurker: detailUnit('lurker', LURKER),
};

/** Their palettes: body, dark, light, trim, glass (the glow — spores, eyes, crystal, acid); the art reads mono / live. */
export const alienGroundPals = (pal: (body: string, dark: string, light: string, trim: string, glass?: string) => Pal): Readonly<Record<AlienGround, Pal>> => ({
  sporepod: pal('#8a6a9a', '#4a3456', '#c8a8d8', '#d8b0e8', '#e8ff7a'),
  lasher: pal('#5a8a3a', '#2a4a1a', '#a8d080', '#c8312a'),
  rhino: pal('#6a6058', '#3a332e', '#9a9088', '#4a443e', '#ff5a3a'),
  toad: pal('#5a7a3a', '#33461e', '#a8c070', '#d8c040', '#9aff3a'),
  spire: pal('#7a4a6a', '#3e2234', '#c890b0', '#5a3048', '#ff8ad8'),
  totem: pal('#8a8670', '#4e4c3e', '#c8c4a8', '#4ad8ff', '#a8f4ff'),
  lurker: pal('#4a5a48', '#26302a', '#7a8a72', '#5a6a40', '#e8d040'),
});
