import type { CockpitSkinId } from '../../game/cockpit';

// The console skins (doc 61): one palette per craft for every colour, corner and fastener the cockpit primitives paint.
// The jets keep the 80s gunmetal (doc 05); the helicopters wear olive drab with amber night-vision screens; the
// spacecraft dark glass with cyan glowing edges and hologram screens. `SK` is the skin being painted right now:
// drawLeftConsole / drawRightConsole set it from the view and put the jet's back afterwards.

export interface CockpitSkin {
  id: CockpitSkinId;
  /** Console gradient, top-left to bottom-right. */
  back: readonly [string, string, string];
  /** Brushed streaks ("r,g,b") and scratch lines. */
  streak: string;
  scratch: string;
  seam: string;
  seamHi: string;
  /** Bevel edges: raised (light, dark) and sunken (light, dark). */
  bevelHi: string;
  bevelLo: string;
  sunkHi: string;
  sunkLo: string;
  plate: string;
  namePlate: string;
  nameInk: string;
  nameHi: string;
  legend: string;
  fastener: 'screw' | 'rivet' | 'none';
  /** Fastener shadow, head and highlight. */
  metal: readonly [string, string, string];
  bezel: readonly [string, string, string];
  bezelRing: string;
  housing: string;
  well: string;
  capDark: string;
  mfd: string;
  screenBg: string;
  /** Screen ink, dimmed ink and the ink as "r,g,b". */
  ink: string;
  inkDim: string;
  inkRgb: string;
  /** Radar scope centre and edge. */
  scope: readonly [string, string];
  lampPanel: string;
  lampOff: string;
  lampLegend: string;
  dialFace: string;
  lcd: string;
  sky: string;
  ground: string;
  horizon: string;
  symbol: string;
  toggle: string;
  corner: 'round' | 'chamfer';
  /** Glowing panel edges ("r,g,b"), or none. */
  edgeGlow: string | null;
}

const JET: CockpitSkin = {
  id: 'jet', back: ['#3b4148', '#2a2f35', '#1b1e22'], streak: '255,255,255', scratch: 'rgba(225,232,240,0.09)',
  seam: '#0a0c0e', seamHi: 'rgba(255,255,255,0.12)', bevelHi: '#5f6871', bevelLo: '#0d0f12', sunkHi: '#5d656d', sunkLo: '#0b0d0f',
  plate: '#30363c', namePlate: '#9ba3aa', nameInk: '#23282c', nameHi: 'rgba(255,255,255,0.55)', legend: '#d8dee3',
  fastener: 'screw', metal: ['#0c0e10', '#7b848c', '#9ea7ae'], bezel: ['#6c757e', '#262a2f', '#0b0c0e'], bezelRing: '#101215',
  housing: '#171a1d', well: '#0b0d0f', capDark: '#1d2226', mfd: '#1c2024', screenBg: '#041409',
  ink: '#62f08a', inkDim: 'rgba(98,240,138,0.45)', inkRgb: '98,240,138', scope: ['#0d2e19', '#03100a'],
  lampPanel: '#14171a', lampOff: '#1b2024', lampLegend: '#475057', dialFace: '#0e1012', lcd: '#071209',
  sky: '#3f78ad', ground: '#6b4a2b', horizon: '#f2f4f6', symbol: '#ff9d2e', toggle: '#2b3036', corner: 'round', edgeGlow: null,
};

const HELI: CockpitSkin = {
  id: 'heli', back: ['#555c3d', '#40462e', '#282c1c'], streak: '235,230,195', scratch: 'rgba(200,198,176,0.16)',
  seam: '#14160d', seamHi: 'rgba(255,250,210,0.1)', bevelHi: '#727a54', bevelLo: '#15170e', sunkHi: '#666d4a', sunkLo: '#11130b',
  plate: '#4b5236', namePlate: '#5e6645', nameInk: '#ecd677', nameHi: 'rgba(0,0,0,0.55)', legend: '#ece5c7',
  fastener: 'rivet', metal: ['#1a1c12', '#6f7653', '#959d75'], bezel: ['#727a54', '#2e3321', '#12140c'], bezelRing: '#181a10',
  housing: '#22261a', well: '#101209', capDark: '#292d20', mfd: '#22261a', screenBg: '#140a02',
  ink: '#ffb347', inkDim: 'rgba(255,179,71,0.45)', inkRgb: '255,179,71', scope: ['#3a2108', '#100702'],
  lampPanel: '#1d2015', lampOff: '#272b1d', lampLegend: '#6d7157', dialFace: '#15170f', lcd: '#140a02',
  sky: '#4f7aa3', ground: '#5c4a2a', horizon: '#f2eedc', symbol: '#ffcc33', toggle: '#363c27', corner: 'round', edgeGlow: null,
};

const SHIP: CockpitSkin = {
  id: 'ship', back: ['#111b2d', '#0a111e', '#05080f'], streak: '120,200,255', scratch: 'rgba(95,227,255,0.06)',
  seam: '#02040a', seamHi: 'rgba(95,227,255,0.55)', bevelHi: '#2b4964', bevelLo: '#03060c', sunkHi: '#26425c', sunkLo: '#02040a',
  plate: '#0d1727', namePlate: '#0b1526', nameInk: '#8ff0ff', nameHi: 'rgba(0,0,0,0.6)', legend: '#a9e9f7',
  fastener: 'none', metal: ['#02040a', '#3a6a8a', '#7fd8ff'], bezel: ['#2b4964', '#0c1422', '#03060c'], bezelRing: '#050a14',
  housing: '#08101c', well: '#03070e', capDark: '#0d1726', mfd: '#0a1322', screenBg: '#021018',
  ink: '#5fe3ff', inkDim: 'rgba(95,227,255,0.45)', inkRgb: '95,227,255', scope: ['#0a3446', '#020c14'],
  lampPanel: '#060c16', lampOff: '#0c1626', lampLegend: '#3e6a80', dialFace: '#050b14', lcd: '#021018',
  sky: '#14406a', ground: '#3a1f5e', horizon: '#9ff4ff', symbol: '#ff7ad9', toggle: '#0d1828', corner: 'chamfer', edgeGlow: '95,227,255',
};

const SUB: CockpitSkin = {
  id: 'sub', back: ['#14484c', '#0d3438', '#072124'], streak: '170,240,230', scratch: 'rgba(200,170,90,0.12)',
  seam: '#041517', seamHi: 'rgba(230,190,100,0.4)', bevelHi: '#c9a24e', bevelLo: '#2a1d08', sunkHi: '#2f6a6c', sunkLo: '#051819',
  plate: '#0f3b3f', namePlate: '#b8913e', nameInk: '#1e1606', nameHi: 'rgba(255,240,200,0.5)', legend: '#f0dca8',
  fastener: 'rivet', metal: ['#2a1d08', '#a8823a', '#e8c878'], bezel: ['#d8b25e', '#7a5a22', '#2a1d08'], bezelRing: '#3a2a0e',
  housing: '#0a2b2e', well: '#041517', capDark: '#123f43', mfd: '#0c3135', screenBg: '#021412',
  ink: '#6ff5d2', inkDim: 'rgba(111,245,210,0.45)', inkRgb: '111,245,210', scope: ['#063a32', '#021210'],
  lampPanel: '#082629', lampOff: '#0f3437', lampLegend: '#5a8a80', dialFace: '#06201f', lcd: '#021412',
  sky: '#1d6f8a', ground: '#2a4a3c', horizon: '#e8fbff', symbol: '#ffcf5a', toggle: '#163f43', corner: 'round', edgeGlow: null,
};

/** The mechs (doc 80): riveted khaki armour plate with hazard stripes, green phosphor screens. */
const MECH: CockpitSkin = {
  id: 'mech', back: ['#5a5236', '#433d26', '#2a2618'], streak: '240,225,170', scratch: 'rgba(230,215,160,0.14)',
  seam: '#15130a', seamHi: 'rgba(255,210,80,0.35)', bevelHi: '#7a7048', bevelLo: '#16140b', sunkHi: '#6a6240', sunkLo: '#100e07',
  plate: '#4e4830', namePlate: '#d8b840', nameInk: '#1a1606', nameHi: 'rgba(255,250,210,0.5)', legend: '#efe6c4',
  fastener: 'rivet', metal: ['#16140b', '#857a50', '#b4a870'], bezel: ['#7a7048', '#33301e', '#12100a'], bezelRing: '#1a180e',
  housing: '#24211a', well: '#100f08', capDark: '#2d2a1c', mfd: '#24211a', screenBg: '#031208',
  ink: '#8cff6a', inkDim: 'rgba(140,255,106,0.45)', inkRgb: '140,255,106', scope: ['#0e3214', '#031006'],
  lampPanel: '#1e1c13', lampOff: '#2a271b', lampLegend: '#7a7458', dialFace: '#141209', lcd: '#031208',
  sky: '#5a8a5a', ground: '#6a4a2a', horizon: '#f2eedc', symbol: '#ffd23a', toggle: '#3a3624', corner: 'chamfer', edgeGlow: null,
};

export const COCKPIT_SKINS: Readonly<Record<CockpitSkinId, CockpitSkin>> = Object.freeze({ jet: JET, heli: HELI, ship: SHIP, sub: SUB, mech: MECH });
export const COCKPIT_SKIN_IDS: readonly CockpitSkinId[] = Object.freeze(['jet', 'heli', 'ship', 'sub', 'mech'] as const);

/** The skin being painted (a live binding: importers always see the current one). */
export let SK: CockpitSkin = JET;

export function useSkin(id: CockpitSkinId): void {
  SK = COCKPIT_SKINS[id];
}
