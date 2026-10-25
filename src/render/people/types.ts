// People kit (doc 17): the data that describes how a person looks and what their face is doing.

/** A colour with its lit and shaded variants (skin, cloth, hair). */
export interface Tone {
  base: string;
  light: string;
  shadow: string;
}

export interface SkinTone extends Tone {
  /** Darkest crease colour (nostril, ear, lip line). */
  deep: string;
  lip: string;
}

export type HairStyle = 'crew' | 'buzz' | 'bob' | 'long' | 'messy';

export interface HairLook extends Tone {
  style: HairStyle;
  /** Eyebrow colour. */
  brow: string;
}

/** `dressWhites` and `flightSuit` are long-sleeved uniforms (doc 25): `top` colours the tunic or suit,
 *  `trim` the shoulder boards and cuffs (dress whites) or the cuffs (flight suit). */
export type TorsoWear = 'shirtless' | 'tank' | 'sportsTop' | 'tshirt' | 'dressWhites' | 'flightSuit';

/** Long sleeves cover the whole arm down to the wrist. */
export const longSleeved = (w: TorsoWear): boolean => w === 'dressWhites' || w === 'flightSuit';
export type LegWear = 'shorts' | 'trousers';
export type FootWear = 'sneakers' | 'barefoot';

export interface PersonLook {
  skin: SkinTone;
  hair: HairLook;
  /** Iris colour. */
  eyes: string;
  torso: TorsoWear;
  /** Tank / sports top / T-shirt colour (unused when shirtless). */
  top: Tone;
  legs: LegWear;
  /** Shorts / trousers colour. */
  bottom: Tone;
  /** Accent: shorts stripe, waistband, top trim. */
  trim: string;
  /** Flight-suit trousers only: the suit's sleeves knotted round the waist. */
  tied?: boolean;
  feet: FootWear;
  shoe: Tone;
  sole: string;
  /** Blank dog tags on a chain (shown when shirtless). */
  tags?: boolean;
}

export type Expression = 'calm' | 'effort' | 'strain' | 'grin' | 'exhausted' | 'out';

export interface FaceState {
  expression: Expression;
  /** 0 … 1: flushed cheeks, sweat. */
  strain: number;
  /** 0 = open … 1 = shut. */
  blink: number;
  t: number;
}
