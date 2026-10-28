// Rank Quiz (doc 41): the pixel-art kit for the insignia — colours, a few hand-made sprites (stars, pips, eagle,
// anchor, oak leaf, wreaths, the German loop) and shape helpers. Everything paints into the 32 × 52 art buffer of
// one insignia, one unit = one art pixel; rank-insignia.ts scales it up crisp.

export const ART_W = 32;
export const ART_H = 52;
export const CX = ART_W / 2;

export const C = Object.freeze({
  gold: '#e9b92c', goldDark: '#8e6210', goldLight: '#ffe58a',
  silver: '#dfe3e8', silverDark: '#6f7680',
  navy: '#18213f', navyEdge: '#0a0f22',
  white: '#f4f4f0', red: '#c4262e', shadow: '#05060a',
  green: '#3b4731', greenEdge: '#20271a', khaki: '#e8d9a0', khakiDark: '#6f6236',
  grey: '#6f7276', greyDark: '#4b4e52', piping: '#c4c8ce', bar: '#d6d1c3',
  black: '#17171b', blackEdge: '#050507',
});

export type G = CanvasRenderingContext2D;

export function px(g: G, x: number, y: number, w: number, h: number, c: string): void {
  g.fillStyle = c;
  g.fillRect(x, y, w, h);
}

/** A sprite from rows of '#' (filled) and '.' (clear); its shadow one pixel down-right first. */
export function sprite(g: G, rows: readonly string[], x: number, y: number, c: string, shadow?: string): void {
  const paint = (ox: number, oy: number, color: string): void => {
    g.fillStyle = color;
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) if (row[i] === '#') g.fillRect(ox + i, oy + j, 1, 1);
    });
  };
  if (shadow) paint(x + 1, y + 1, shadow);
  paint(x, y, c);
}

export const spriteW = (rows: readonly string[]): number => rows[0]?.length ?? 0;

/** A slanted band: `len` columns from (x0, y0), each `thick` tall, falling `slope` px per column. */
export function band(g: G, x0: number, y0: number, len: number, thick: number, slope: number, c: string): void {
  for (let i = 0; i < len; i++) px(g, x0 + i, y0 + Math.round(i * slope), 1, thick, c);
}

/** A chevron centred on the art: apex up (^) at `apexY`, or with `down` apex down (V) at `apexY`. */
export function chevron(g: G, apexY: number, half: number, thick: number, c: string, down = false): void {
  for (let i = 0; i < half; i++) {
    const y = down ? apexY - thick + 1 - i : apexY + i;
    px(g, CX - 1 - i, y, 1, thick, c);
    px(g, CX + i, y, 1, thick, c);
  }
}

/** The cloth: a sleeve patch filling the art with a dark edge. */
export function patch(g: G, fill: string, edge: string): void {
  px(g, 2, 2, ART_W - 4, ART_H - 4, edge);
  px(g, 3, 3, ART_W - 6, ART_H - 6, fill);
}

const STRAP = { x0: 5, x1: 27, top: 2, bottom: 50 } as const;

/**
 * A shoulder strap with a rounded top, shrunk by `inset` px all round — the bottom edge by `bottomInset` (an open
 * braid lets the cloth run down to the piping). Filled row by row, so piping, braid and cloth are the same shape
 * drawn at growing insets.
 */
export function strap(g: G, inset: number, c: string, bottomInset = inset): void {
  const r = (STRAP.x1 - STRAP.x0) / 2 - inset;
  const cy = STRAP.top + (STRAP.x1 - STRAP.x0) / 2;
  for (let y = STRAP.top + inset; y < STRAP.bottom - bottomInset; y++) {
    const dy = cy - (y + 0.5);
    const half = dy > 0 ? Math.sqrt(Math.max(0, r * r - dy * dy)) : r;
    if (half < 0.5) continue;
    const x0 = Math.round(CX - half);
    px(g, x0, y, Math.round(CX + half) - x0, 1, c);
  }
}

export const BUTTON = ['.####.', '######', '######', '######', '.####.'];

export const STAR9 = [
  '....#....',
  '....#....',
  '...###...',
  '#########',
  '.#######.',
  '..#####..',
  '..##.##..',
  '.##...##.',
  '##.....##',
];

export const STAR7 = ['...#...', '...#...', '#######', '.#####.', '..###..', '.##.##.', '##...##'];

export const PIP = ['...#...', '..###..', '.#####.', '#######', '.#####.', '..###..', '...#...'];

export const DIAMOND = ['...#...', '..###..', '.#####.', '#######', '#######', '.#####.', '..###..', '...#...'];

export const EAGLE = [
  '##...........##',
  '.##...##....##.',
  '.###.####..###.',
  '..###.####.##..',
  '...#########...',
  '....#######....',
  '.....#####.....',
  '......###......',
  '.....##.##.....',
];

export const ANCHOR = [
  '......###......',
  '.....#...#.....',
  '......###......',
  '.#############.',
  '......###......',
  '......###......',
  '......###......',
  '......###......',
  '......###......',
  '......###......',
  '......###......',
  '......###......',
  '......###......',
  '......###......',
  '......###......',
  '......###......',
  '#.....###.....#',
  '##....###....##',
  '.##...###...##.',
  '..###.###.###..',
  '...#########...',
  '.....#####.....',
  '.......#.......',
];

/** "USN" in a 3 × 5 / 4 × 5 pixel font, 12 wide. */
export const USN = [
  '#.#.###.#..#',
  '#.#.#...##.#',
  '#.#.###.#.##',
  '#.#...#.#..#',
  '###.###.#..#',
];

export const OAK_LEAF = [
  '.....#.....',
  '....###....',
  '..#.###.#..',
  '.###.#.###.',
  '..#######..',
  '.#########.',
  '####.#.####',
  '.#########.',
  '..#######..',
  '.###.#.###.',
  '..#######..',
  '...#####...',
  '....###....',
  '.....#.....',
  '.....#.....',
  '.....#.....',
];

/** The German officers' oak wreath under the pips. */
export const DE_WREATH = [
  '#................#',
  '##..............##',
  '###............###',
  '.###..........###.',
  '.####........####.',
  '..#####....#####..',
  '...############...',
  '.....########.....',
];

/** The US Army command sergeant major's wreath around the star. */
export const US_WREATH = [
  '#.............#',
  '##...........##',
  '#.#.........#.#',
  '##...........##',
  '.##.........##.',
  '..##.......##..',
  '...###...###...',
  '.....#####.....',
];

/** The German senior NCOs' loop ("Kopfwinkel"): a ribbon loop whose lower ends cross into the top chevron. */
export const LOOP = [
  '....####....',
  '...##..##...',
  '..##....##..',
  '.##......##.',
  '..##....##..',
  '...##..##...',
  '....####....',
];
