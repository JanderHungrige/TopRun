import type { AvatarLook } from '../game/avatar-look';
import type { AvatarId } from '../game/profiles';
import { playerPerson, restyle } from './avatars/person';
import { PLAYER_LOOKS } from './minigames/pushups-looks';
import { LINE, SKIN, tone, type FrontExtras, type HeadMap, type PersonLook, type Tone } from './people';

// Medal ceremony (doc 25): who stands on deck. People-kit looks (doc 17) in golden-hour colours: the pilot keeps
// the avatar's skin, hair and eyes in dress whites; the admiral in dress whites with gold boards, his swept hair
// and gold aviators; deck crew in coloured jerseys with cranial helmets; two officers in whites. Built once, so
// the pixel cache keys (object identity) stay stable.

const WHITES = tone('#f4eadb', '#fffaf2', '#b9a7b6');
const SHOE = tone('#1e1a26', '#3a3446', '#110e16');
const NAVY_BOARD = '#22305a';
const GOLD_BOARD = '#d9a53a';
const DECK_TROUSERS = tone('#2c3446', '#45506a', '#1c2230');

function inWhites(base: PersonLook, trim: string): PersonLook {
  return {
    ...base, torso: 'dressWhites', top: WHITES, legs: 'trousers', bottom: WHITES, trim, tied: false, tags: false,
    feet: 'sneakers', shoe: SHOE, sole: '#110e16',
  };
}

export const PILOT_LOOKS: Readonly<Record<AvatarId, PersonLook>> = Object.freeze({
  pilot1: inWhites(PLAYER_LOOKS.pilot1, NAVY_BOARD),
  pilot2: inWhites(PLAYER_LOOKS.pilot2, NAVY_BOARD),
  pilot3: inWhites(PLAYER_LOOKS.pilot3, NAVY_BOARD),
  pilot4: inWhites(PLAYER_LOOKS.pilot4, NAVY_BOARD),
  pilot5: inWhites(PLAYER_LOOKS.pilot5, NAVY_BOARD),
  pilot6: inWhites(PLAYER_LOOKS.pilot6, NAVY_BOARD),
  pilot7: inWhites(PLAYER_LOOKS.pilot7, NAVY_BOARD),
  pilot8: inWhites(PLAYER_LOOKS.pilot8, NAVY_BOARD),
  pilot9: inWhites(PLAYER_LOOKS.pilot9, NAVY_BOARD),
});

/** The pilot in dress whites: a preset's table entry, or a custom look's (doc 29), built once per look. */
export function pilotInWhites(face: AvatarId | AvatarLook): PersonLook {
  return typeof face === 'string' ? PILOT_LOOKS[face] : restyle(playerPerson(face), 'whites', (b) => inWhites(b, NAVY_BOARD));
}

const hair = (style: PersonLook['hair']['style'], base: string, light: string, shadow: string): PersonLook['hair'] =>
  ({ style, ...tone(base, light, shadow), brow: shadow });

export const ADMIRAL_LOOK: PersonLook = Object.freeze(inWhites({
  ...PLAYER_LOOKS.pilot1, skin: SKIN.tan, hair: hair('crew', '#4e2e1a', '#7c4e2c', '#2a160c'), eyes: '#3a2416',
}, GOLD_BOARD));

function jersey(skin: PersonLook['skin'], h: PersonLook['hair'], eyes: string, top: Tone): PersonLook {
  return {
    skin, hair: h, eyes, torso: 'flightSuit', top, legs: 'trousers', bottom: DECK_TROUSERS, trim: top.shadow,
    feet: 'sneakers', shoe: tone('#2e2620', '#4a3e34', '#1a1410'), sole: '#1a1410',
  };
}

export interface CrewMember { x: number; look: PersonLook; helmet: string | null; turn: number; phase: number }

const DARK = hair('buzz', '#1d1714', '#3a2e28', '#0e0a08');
const BROWN = hair('crew', '#5b3d24', '#7f5a38', '#3c2615');
const RED = hair('bob', '#9a4a24', '#c26a3c', '#6e3216');

/** The crew at attention behind the pilot: jerseys outside, officers in whites nearest the centre. */
export const CREW: readonly CrewMember[] = Object.freeze([
  { x: 100, look: jersey(SKIN.olive, DARK, '#3a2416', tone('#f2c12e', '#ffe070', '#c99516')), helmet: '#f2c12e', turn: 0.18, phase: 0.3 },
  { x: 180, look: jersey(SKIN.light, BROWN, '#4d6f8c', tone('#49b06a', '#80d890', '#2e7d4a')), helmet: '#49b06a', turn: 0.18, phase: 1.9 },
  { x: 260, look: jersey(SKIN.deep, DARK, '#2a1a10', tone('#c8312a', '#e8604c', '#962420')), helmet: '#c8312a', turn: 0.18, phase: 3.3 },
  { x: 342, look: inWhites({ ...PLAYER_LOOKS.pilot1, skin: SKIN.fair, hair: RED, eyes: '#4d6f8c' }, NAVY_BOARD), helmet: null, turn: 0.18, phase: 2.4 },
  { x: 984, look: inWhites({ ...PLAYER_LOOKS.pilot1, skin: SKIN.brown, hair: BROWN, eyes: '#3a2416' }, NAVY_BOARD), helmet: null, turn: 0.06, phase: 0.9 },
  { x: 1060, look: jersey(SKIN.tan, BROWN, '#3a2a1c', tone('#3f78d8', '#6fa8ee', '#2a4c9c')), helmet: '#3f78d8', turn: 0.06, phase: 2.8 },
  { x: 1134, look: jersey(SKIN.fair, RED, '#5a7fa8', tone('#8a55c9', '#b088e8', '#5e3a96')), helmet: '#8a55c9', turn: 0.06, phase: 1.2 },
  { x: 1208, look: jersey(SKIN.olive, DARK, '#2a1a10', tone('#8e6038', '#ae7c4c', '#6e4527')), helmet: '#8e6038', turn: 0.06, phase: 3.9 },
]);

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string): void {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

/** The admiral's big swept-back hair and gold aviators (his portrait's look, doc 06). */
function admiralHead(ctx: CanvasRenderingContext2D, m: HeadMap): void {
  const h = ADMIRAL_LOOK.hair;
  ctx.beginPath();
  ctx.moveTo(m.fx(-15.5, 0), -29);
  ctx.quadraticCurveTo(m.fx(-13, 6), -50, m.fx(2, 10), -49);
  ctx.quadraticCurveTo(m.fx(17, 6), -48, m.fx(15.5, 0), -30);
  ctx.quadraticCurveTo(m.fx(4, 12), -39, m.fx(-15.5, 0), -29);
  ctx.fillStyle = h.base;
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.stroke();
  ellipse(ctx, m.fx(-3, 11), -44, 7, 2.4, h.light);
  for (const sx of [-6.6, 6.6]) {
    const x = m.fx(sx, 14);
    const rx = 4.9 * (sx > 0 ? 1 - m.s * 0.6 : 1);
    ellipse(ctx, x, -16.5, rx + 1, 4.2, '#e8b440');
    ellipse(ctx, x, -16.3, rx, 3.4, '#22344a');
    ellipse(ctx, x - rx * 0.3, -17.6, rx * 0.35, 1, '#8fb6d0');
  }
  ctx.fillStyle = '#e8b440';
  ctx.fillRect(m.fx(-2, 15), -18, m.fx(2, 15) - m.fx(-2, 15), 1.2);
}

/** A cranial helmet in the jersey colour with goggles pushed up. */
function cranial(color: string): (ctx: CanvasRenderingContext2D, m: HeadMap) => void {
  return (ctx, m) => {
    ctx.beginPath();
    ctx.moveTo(-17.5 - m.s, -21);
    ctx.quadraticCurveTo(-18.5, -48, 2 + 3 * m.s, -48);
    ctx.quadraticCurveTo(18.5 + m.s, -47, 18 + m.s, -21);
    ctx.quadraticCurveTo(0, -26, -17.5 - m.s, -21);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = '#20242c';
    ctx.fillRect(-17, -31, 35, 3.4);
    ellipse(ctx, m.fx(-6, 15), -31, 4.2, 3.2, '#6c7a88');
    ellipse(ctx, m.fx(6, 15), -31, 4.2 * (1 - m.s * 0.6), 3.2, '#6c7a88');
  };
}

export const ADMIRAL_EXTRAS: FrontExtras = { head: admiralHead, key: 'admiral' };

const helmets = new Map<string, FrontExtras>();
/** Head extras for a crew member (cached per helmet colour so the pixel cache key stays put). */
export function crewExtras(helmet: string | null): FrontExtras | undefined {
  if (!helmet) return undefined;
  let e = helmets.get(helmet);
  if (!e) {
    e = { head: cranial(helmet), key: `cranial${helmet}` };
    helmets.set(helmet, e);
  }
  return e;
}
