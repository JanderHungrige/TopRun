import type { Pal, UnitFn } from '../draw-ground-units';
import { BEAR } from './bear';
import { DRONE } from './drone';
import { HIND } from './hind';
import { JAMMER } from './il22';
import { monoAir } from './kit';
import { staticLayer, type AirArt } from './layer';
import { FISHBED } from './mig21';
import { FOXBAT } from './mig25';
import { FULCRUM } from './mig29';
import { FLANKER } from './su27';
import { FELON } from './su57';
import { BACKFIRE } from './tu22m';

/** Enemy aircraft painters behind the common UnitFn signature (noses point down, +y). */

type AirKind = 'drone' | 'fishbed' | 'fulcrum' | 'flanker' | 'hind' | 'bear' | 'foxbat' | 'felon' | 'jammer' | 'backfire';

/**
 * Aircraft carry their own camouflage; from the unit palette only the silhouette passes (hit flash,
 * shadow sprite) are used, and those are painted as plain vectors.
 */
const unit = (key: AirKind, art: AirArt): UnitFn => (ctx, p: Pal, t) => {
  const a = p.mono ? monoAir(p.body, p.live) : art.pal;
  art.under?.(ctx, a, t);
  if (a.mono) art.body(ctx, a);
  else staticLayer(ctx, key, art);
  art.over?.(ctx, a, t);
};

export const AIR_UNITS: Readonly<Record<AirKind, UnitFn>> = {
  drone: unit('drone', DRONE),
  fishbed: unit('fishbed', FISHBED),
  fulcrum: unit('fulcrum', FULCRUM),
  flanker: unit('flanker', FLANKER),
  hind: unit('hind', HIND),
  bear: unit('bear', BEAR),
  foxbat: unit('foxbat', FOXBAT),
  felon: unit('felon', FELON),
  jammer: unit('jammer', JAMMER),
  backfire: unit('backfire', BACKFIRE),
};
