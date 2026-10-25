// Pixel pipeline (doc 20): the master palette every pixel character is drawn with, so the cast reads as one
// game. Colours come in hue-shifted ramps from dark to light (shadows lean violet, lights lean warm); the first
// entry of each ramp is its "ink" — the selective outline drawn around anything painted in that ramp.

const RAMPS = {
  ink: ['#120b14', '#241726', '#3a2a3a'],
  // skin
  skinPale: ['#4a2224', '#9a5a4a', '#cf9372', '#f2c3a0', '#fcdcc0', '#fff0e0'],
  skinTan: ['#3e1e18', '#7a4430', '#ae7449', '#d49a68', '#ecbd8e', '#f8d8b0'],
  skinRuddy: ['#441c18', '#8a3e30', '#b8684c', '#dc8e6c', '#f3b496', '#fcd4bc'],
  skinOlive: ['#36190f', '#6e3f28', '#a56b45', '#c88b62', '#e2aa82', '#f2c8a2'],
  skinLight: ['#46221a', '#8e5640', '#c48f6a', '#e6b48e', '#f6cfac', '#fde6cc'],
  // hair
  hairBrown: ['#140a06', '#2a160c', '#3a2214', '#4e2e1a', '#7c4e2c', '#a8703e'],
  hairBlack: ['#0a0606', '#160e0a', '#20140e', '#2e1c14', '#4a3426', '#6a4e3a'],
  hairGrey: ['#2c3034', '#5a6064', '#7b8185', '#a7acaf', '#d3d7d9', '#f0f2f3'],
  hairGold: ['#4a2c10', '#8a5f22', '#bb8d36', '#e6bd5f', '#f8e09c', '#fff4d0'],
  hairBlond: ['#54401c', '#9a7a3e', '#c4a258', '#ecd08a', '#fbecbc', '#fff8e4'],
  hairGinger: ['#3e1a0c', '#743e18', '#9e632e', '#cf8f4f', '#ecb57c', '#f8d4a8'],
  hairChestnut: ['#2a170a', '#4a2e18', '#6b4426', '#8e6238', '#b0824e', '#cca06a'],
  // cloth & kit
  white: ['#262a3e', '#8a90aa', '#c2c8d6', '#f0efea', '#ffffff', '#ffffff'],
  helmet: ['#22272c', '#4e575e', '#6f787e', '#9ba3a9', '#c8ced2', '#eef1f3'],
  gold: ['#3a2406', '#7a5414', '#b08424', '#dcae3a', '#f6d66a', '#fff2b8'],
  jersey: ['#1e1008', '#3a2212', '#4f301a', '#6e4527', '#8e6038', '#ae7c4c'],
  yellow: ['#3e2a06', '#8a6010', '#c99516', '#f2c12e', '#ffe070', '#fff4b8'],
  olive: ['#181c0e', '#2f3620', '#454e2c', '#5f6b3f', '#77844f', '#98a66a'],
  orange: ['#3e1606', '#84380e', '#b85c1e', '#e27a30', '#f29c56', '#fcc08a'],
  navy: ['#0a0e1e', '#151e38', '#1f2b4c', '#2c3d68', '#43588f', '#6a82b8'],
  sage: ['#1a1e0e', '#353c22', '#4a5330', '#647044', '#7d8a56', '#a0ad74'],
  steel: ['#14181c', '#2a3036', '#454d55', '#6c757d', '#9aa3ab', '#c8cfd5', '#eef1f4'],
  red: ['#2a0808', '#5e1414', '#962420', '#c8312a', '#e8604c', '#f89a80'],
  blue: ['#0c1430', '#1a2c66', '#2a4c9c', '#3f78d8', '#6fa8ee', '#b0d4ff'],
  green: ['#0c2414', '#1a4a28', '#2e7d4a', '#49b06a', '#80d890', '#c0f0c4'],
  purple: ['#1e0c22', '#4a1a52', '#7d2a6e', '#a8509a', '#d080c0'],
  violet: ['#1c1030', '#3a2260', '#5e3a96', '#8a55c9', '#b088e8'],
  lens: ['#0e2a34', '#2a5a6a', '#4f94aa', '#86c4d6', '#c4ecf6', '#ffffff'],
  glass: ['#05080c', '#0c1016', '#1a2430', '#2e3e50', '#4e6478', '#7a92a8', '#b4c8d8'],
  leather: ['#1e120a', '#3e2614', '#5a3a24', '#7c5434', '#a07448', '#c8a070'],
  glove: ['#2e2414', '#5e4a2c', '#95794d', '#b89c6c', '#d4bc90', '#ece0c0'],
  cup: ['#141810', '#232a1f', '#353f30', '#4a5843', '#62735a', '#7e9076'],
  // faces
  rose: ['#7a2e2e', '#b85a58', '#e0847a', '#f0a094', '#fac0b4'],
  eye: ['#3a2a2a', '#8c8288', '#c8c0c0', '#f2eee6', '#ffffff'],
  mouth: ['#1a060a', '#3a1018', '#6a2028', '#a8444c', '#d0707a'],
  teeth: ['#5a5048', '#a89c90', '#d6cec2', '#f6f2e8'],
  irisBlue: ['#101c2c', '#1a2e44', '#2e5272', '#3f6f98', '#6a9cc4', '#a8ccea'],
  irisGreen: ['#101c14', '#1c3424', '#36583e', '#4f7f5a', '#78aa80', '#b0d6b4'],
  irisBrown: ['#140a06', '#24140a', '#3e2614', '#5b3a20', '#8a5e38', '#b88c60'],
  irisGrey: ['#141c24', '#2a3a4a', '#4a6278', '#6d8ea8', '#9ab8cc', '#cce0ec'],
  // backgrounds
  night: ['#060a14', '#0a1020', '#0e1a30', '#16284a', '#203a64', '#2c4c7c', '#3e6496', '#5a80b0'],
  sky: ['#123058', '#1e4c84', '#2e6aac', '#4a8ccc', '#78b2e2', '#a8d2f0', '#d6ecf8', '#f4fbff'],
  dusk: ['#1c1440', '#33296a', '#6a3a7c', '#b04f80', '#e07a6a', '#f59a5c', '#ffc884', '#ffe8b8'],
  dawn: ['#2c3a78', '#4c6db2', '#9a8cc0', '#e7a2b6', '#f8c0a8', '#ffd79c', '#fff1c8'],
  wall: ['#121416', '#1e2123', '#2a2d2f', '#3e4244', '#55595c', '#6e7275', '#8a8e90'],
  lamp: ['#5a3a1a', '#8a5a2a', '#c8843e', '#ffb25c', '#ffd8a0', '#fff0d0'],
  sea: ['#0a1a30', '#122a4a', '#1a3e66', '#2f6ea6', '#5c8cc0', '#9cc4e8'],
  seaDawn: ['#1e2848', '#34466e', '#46608c', '#5c7aa6', '#8aa4c8', '#c0d0e8'],
  seaDusk:['#141030', '#241c48', '#342a5e', '#4a3f74', '#6a5a94', '#9a84b8'],
  phosphor: ['#04140e', '#0b2c20', '#16523a', '#2a8a60', '#52c48c', '#9cf0c4', '#e0fff0'],
  // avatar builder (doc 29): more skin tones, hair and eye colours, a khaki suit, a night sea
  skinBrown: ['#2a120a', '#552a18', '#7c4a2e', '#a0693f', '#bd8659', '#d6a676'],
  skinDeep: ['#1c0c06', '#3c1e10', '#5a321c', '#7a4a2c', '#98643e', '#b48056'],
  skinEbony: ['#120804', '#28140a', '#3c2212', '#52321e', '#6c472d', '#8a6044'],
  hairDarkBrown: ['#0c0705', '#1a100a', '#28180f', '#3a2416', '#563a24', '#765236'],
  hairAuburn: ['#260a06', '#4e160c', '#742814', '#9a3c1e', '#bc5a30', '#d8804e'],
  hairStrawberry: ['#341a0e', '#683c22', '#946036', '#bc8652', '#d8a872', '#eccb98'],
  hairPlatinum: ['#4e4636', '#9a8e70', '#c6bc9c', '#e8e0c4', '#f8f3e2', '#fffdf6'],
  hairBlue: ['#0a1230', '#1a2c6a', '#2a48a2', '#4470d0', '#74a0ea', '#aecdf8'],
  hairPink: ['#360a22', '#701c4c', '#a43274', '#d25c9e', '#ec8ec0', '#fac2de'],
  irisDark: ['#050303', '#0c0706', '#160e0a', '#22150e', '#3e2a1e', '#5e4432'],
  irisHazel: ['#140e06', '#2c2010', '#4c3c1c', '#6e5c2e', '#928048', '#b8a672'],
  khaki: ['#1c180c', '#3c321e', '#5a4c2e', '#7c6a42', '#9a885a', '#bca97a'],
  seaNight: ['#03060c', '#060c18', '#0a1426', '#101e36', '#1a2c4c', '#283e64'],
} as const satisfies Readonly<Record<string, readonly string[]>>;

export type RampName = keyof typeof RAMPS;
/** Palette indices of a ramp, dark → light; [0] is the ramp's ink. Index 0 of the palette is transparent. */
export type Ramp = readonly number[];

function rgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const hexes: string[] = ['#000000'];
const inkOf: number[] = [0];
const ramps = {} as Record<RampName, Ramp>;
for (const name of Object.keys(RAMPS) as RampName[]) {
  const first = hexes.length;
  ramps[name] = RAMPS[name].map((h, i) => {
    hexes.push(h);
    inkOf.push(i === 0 ? (name === 'ink' ? first : 1) : first);
    return first + i;
  });
}

/** Every ramp as palette indices. */
export const PAL: Readonly<Record<RampName, Ramp>> = ramps;
export const PALETTE_SIZE = hexes.length;
/** Selective outline colour for each palette index (its ramp's darkest entry). */
export const INK: Uint16Array = Uint16Array.from(inkOf);

/** RGB triples per index, for quantisation and tests. */
export const RGB: readonly (readonly [number, number, number])[] = hexes.map(rgb);

function pack([r, g, b]: readonly [number, number, number], a = 255): number {
  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
}

/** Packed little-endian RGBA per index (ImageData's Uint32 view); index 0 stays fully transparent. */
export const RGBA: Uint32Array = Uint32Array.from(RGB.map((c, i) => (i === 0 ? 0 : pack(c))));

/** The same palette seen through a green radio feed: every colour mapped by luminance onto the phosphor ramp. */
export const RADIO_RGBA: Uint32Array = Uint32Array.from(RGB.map((c, i) => {
  if (i === 0) return 0;
  const lum = (0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]) / 255;
  const steps = RAMPS.phosphor.length;
  const at = Math.min(steps - 1, Math.floor(Math.pow(lum, 0.8) * steps));
  return pack(rgb(RAMPS.phosphor[at] ?? '#000000'));
}));

/** Hex string of a palette index (for canvas fills in compose space). */
export function hexOf(i: number): string {
  return hexes[i] ?? '#000000';
}
