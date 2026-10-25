import type { ArtView, Frame } from '../pixel/bust';
import type { Pix } from '../pixel/raster';

// Talking portraits (doc 06, pixel look doc 20): types shared by the character modules and the avatars.

export type CharacterId = 'admiral' | 'chief' | 'shooter' | 'wingman';
export type Mood = 'neutral' | 'happy' | 'stern' | 'worried';
export type Gesture = 'none' | 'thumbsUp' | 'point' | 'salute' | 'facepalm';
export interface Box { x: number; y: number; w: number; h: number }
export type { Frame };

export interface MoodShape {
  browIn: number; browOut: number; arch: number; // brow inner / outer offset (+ = lower), arch height
  lidTop: number; lidLow: number; pupil: number; // eyelid closure 0..1, pupil scale
  lift: number; curv: number; widen: number; // mouth-corner lift, smile depth, extra half-width
  tilt: number; nod: number; // head roll (rad, unused by pixel art) and drop
}

/** One pixel-art animation state: everything that changes the figure's pixels, quantised to frames. */
export interface Rig {
  mood: Mood;
  m: MoodShape;
  gesture: Gesture;
  /** 0 closed, 1 half open, 2 open. */
  mouth: 0 | 1 | 2;
  /** 0 open, 1 half shut, 2 shut. */
  blink: 0 | 1 | 2;
  /** Sideways glance in whole pixels. */
  look: -1 | 0 | 1;
  /** Slow two-frame idle cycle (dangling mask, pendant, scarf). */
  phase: 0 | 1;
}

export interface CharacterArt {
  background(p: Pix, f: Frame): void;
  ambient?(g: CanvasRenderingContext2D, v: ArtView): void;
  body(p: Pix, r: Rig): void;
  head(p: Pix, r: Rig): void;
  /** Draws r.gesture (never 'none'): salute / facepalm run in head space, the others in body space. */
  gesture(p: Pix, r: Rig): void;
}
