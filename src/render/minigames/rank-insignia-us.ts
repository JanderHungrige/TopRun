import type { ArmyDevice, Stripe, UsOfficerDevice } from '../../data/rank-quiz';
import {
  ANCHOR, ART_H, band, C, chevron, CX, DIAMOND, EAGLE, OAK_LEAF, patch, px, sprite, spriteW, STAR7, STAR9, strap, US_WREATH, USN,
  type G,
} from './rank-sprites';

// Rank Quiz (doc 41): the US insignia in pixel art — Navy group-rate stripes, the petty officers' eagle over
// chevrons, the chiefs' anchor, officers' sleeve stripes under a star (shared with the German Navy); Army chevrons
// and rockers with the senior NCO devices, the specialist shield, and the officers' bars, leaves, eagle and stars on
// a dark shoulder mark.

/** x that centres a sprite on the art. */
const mid = (rows: readonly string[]): number => CX - Math.floor(spriteW(rows) / 2);

export function paintGroupRate(g: G, n: number): void {
  patch(g, C.navy, C.navyEdge);
  const step = 8;
  const thick = 4;
  const rise = 12;
  const base = Math.round(ART_H / 2 - ((n - 1) * step + thick - rise) / 2);
  for (let k = 0; k < n; k++) {
    band(g, 7, base + k * step + 1, 20, thick, -0.6, C.navyEdge);
    band(g, 6, base + k * step, 20, thick, -0.6, C.white);
  }
}

export function paintPettyOfficer(g: G, n: number): void {
  patch(g, C.navy, C.navyEdge);
  sprite(g, EAGLE, mid(EAGLE), 8, C.silver, C.navyEdge);
  for (let k = 0; k < n; k++) {
    chevron(g, 31 + k * 5, 9, 3, C.navyEdge, true);
    chevron(g, 30 + k * 5, 9, 3, C.gold, true);
  }
}

export function paintChief(g: G, stars: number): void {
  patch(g, C.navy, C.navyEdge);
  const top = stars > 0 ? 15 : 12;
  sprite(g, ANCHOR, mid(ANCHOR), top, C.gold, C.navyEdge);
  sprite(g, USN, CX - 6, top + 8, C.silver, C.navyEdge);
  if (stars === 1) sprite(g, STAR7, mid(STAR7), 5, C.silver, C.navyEdge);
  if (stars === 2) [CX - 9, CX + 2].forEach((x) => sprite(g, STAR7, x, 5, C.silver, C.navyEdge));
}

const STRIPE: Readonly<Record<Stripe, number>> = { wide: 6, medium: 3, thin: 1 };

/** Gold sleeve stripes from the cuff up, a star over them (US Navy and German Navy officers). */
export function paintSleeve(g: G, stripes: readonly Stripe[]): void {
  patch(g, C.navy, C.navyEdge);
  let y = 46;
  for (const s of stripes) {
    const h = STRIPE[s];
    y -= h;
    px(g, 3, y, 26, h, C.gold);
    if (h >= 3) {
      px(g, 3, y, 26, 1, C.goldLight);
      px(g, 3, y + h - 1, 26, 1, C.goldDark);
    }
    y -= 2;
  }
  sprite(g, STAR9, mid(STAR9), y - 11, C.gold, C.navyEdge);
}

/** The arch-shaped lower bar of senior army NCOs, hanging between the ends of the lowest chevron. */
function rocker(g: G, yEdge: number, half: number, thick: number, sag: number, c: string): void {
  for (let i = 0; i < half; i++) {
    const t = (i + 0.5) / half;
    const y = yEdge + Math.round(sag * (1 - t * t));
    px(g, CX - 1 - i, y, 1, thick, c);
    px(g, CX + i, y, 1, thick, c);
  }
}

const ARMY = { half: 11, thick: 3, step: 5, sag: 7 } as const;

export function paintArmyChevrons(g: G, chevrons: number, rockers: number, device: ArmyDevice): void {
  patch(g, C.green, C.greenEdge);
  const { half, thick, step, sag } = ARMY;
  const height = (chevrons - 1) * step + half - 1 + (rockers > 0 ? (rockers - 1) * step + sag : 0) + thick;
  const top = Math.round((ART_H - height) / 2);
  const lastApex = top + (chevrons - 1) * step;
  const armEnd = lastApex + half - 1;
  const draw = (dy: number, c: string): void => {
    for (let k = 0; k < chevrons; k++) chevron(g, top + k * step + dy, half, thick, c);
    for (let k = 0; k < rockers; k++) rocker(g, armEnd + k * step + dy, half, thick, sag, c);
  };
  draw(1, C.khakiDark);
  draw(0, C.khaki);
  armyDevice(g, device, lastApex);
}

function armyDevice(g: G, device: ArmyDevice, apex: number): void {
  switch (device) {
    case 'none': return;
    case 'diamond': return sprite(g, DIAMOND, mid(DIAMOND), apex + 7, C.khaki, C.khakiDark);
    case 'star': return sprite(g, STAR7, mid(STAR7), apex + 7, C.khaki, C.khakiDark);
    case 'wreath':
      sprite(g, US_WREATH, mid(US_WREATH), apex + 9, C.khaki, C.khakiDark);
      return sprite(g, STAR7, mid(STAR7), apex + 7, C.khaki, C.khakiDark);
    default: throw new Error(`unhandled: ${device satisfies never}`);
  }
}

/** The specialist's shield: arched top, pointed bottom, an eagle inside. */
export function paintSpecialist(g: G): void {
  patch(g, C.green, C.greenEdge);
  const w = 24;
  const x0 = CX - w / 2;
  const y0 = 16;
  for (let i = 0; i < w; i++) {
    const d = Math.abs(i + 0.5 - w / 2) / (w / 2);
    const top = y0 + Math.round(5 - 5 * Math.sqrt(1 - d * d));
    const bottom = y0 + 11 + Math.round((1 - d) * 8);
    px(g, x0 + i, top + 1, 1, bottom - top, C.khakiDark);
    px(g, x0 + i, top, 1, bottom - top, C.khaki);
    if (i >= 2 && i < w - 2) px(g, x0 + i, top + 2, 1, Math.max(0, bottom - top - 5), C.green);
  }
  sprite(g, EAGLE, mid(EAGLE), y0 + 4, C.khaki);
}

/** A dark shoulder mark with its gold stripe at the bottom. */
function shoulderMark(g: G): void {
  strap(g, 0, C.blackEdge);
  strap(g, 1, C.black);
  px(g, 6, 45, 20, 2, C.gold);
}

function bar(g: G, x: number, light: string, main: string, dark: string): void {
  px(g, x + 1, 15, 5, 22, C.blackEdge);
  px(g, x, 14, 5, 22, main);
  px(g, x, 14, 1, 22, light);
  px(g, x + 4, 14, 1, 22, dark);
}

export function paintUsOfficer(g: G, device: UsOfficerDevice): void {
  shoulderMark(g);
  switch (device) {
    case 'goldBar': return bar(g, CX - 3, C.goldLight, C.gold, C.goldDark);
    case 'silverBar': return bar(g, CX - 3, C.white, C.silver, C.silverDark);
    case 'twoBars':
      bar(g, CX - 6, C.white, C.silver, C.silverDark);
      return bar(g, CX + 1, C.white, C.silver, C.silverDark);
    case 'goldLeaf': return sprite(g, OAK_LEAF, mid(OAK_LEAF), 16, C.gold, C.goldDark);
    case 'silverLeaf': return sprite(g, OAK_LEAF, mid(OAK_LEAF), 16, C.silver, C.silverDark);
    case 'eagle': return sprite(g, EAGLE, mid(EAGLE), 20, C.silver, C.silverDark);
    default: throw new Error(`unhandled: ${device satisfies never}`);
  }
}

export function paintUsGeneral(g: G, stars: number): void {
  shoulderMark(g);
  const total = stars * 7 + (stars - 1) * 2;
  const top = Math.round(26 - total / 2);
  for (let k = 0; k < stars; k++) sprite(g, STAR7, mid(STAR7), top + k * 9, C.silver, C.silverDark);
}
