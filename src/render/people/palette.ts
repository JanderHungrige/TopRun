import type { SkinTone, Tone } from './types';

// People kit (doc 17): shared colours. Skin presets carry a highlight + shadow pair for the soft shading.

/** Silhouette outline: a thin warm line, never used for muscle definition. */
export const LINE = 'rgba(40,22,14,0.62)';
export const INK = '#24140e';
export const SCLERA = '#f3eee6';
export const TEETH = '#f6f2ea';
export const MOUTH = '#4a1c18';
export const METAL: Tone = { base: '#b9c0c6', light: '#eef2f4', shadow: '#7c858d' };
/** Far limbs are drawn with this veil over them (they sit in the body's shadow). */
export const FAR_VEIL = 'rgba(30,14,8,0.26)';

export const SKIN = {
  fair: { base: '#f4cba6', light: '#fde2c8', shadow: '#d6a17b', deep: '#9e6446', lip: '#bf6a5c' },
  light: { base: '#ecbf98', light: '#f8d8b8', shadow: '#cb9670', deep: '#935a3c', lip: '#b4645a' },
  tan: { base: '#dca67c', light: '#efc39c', shadow: '#b67f57', deep: '#7f4b30', lip: '#a3594b' },
  olive: { base: '#c99068', light: '#dfae86', shadow: '#a26f4b', deep: '#6c412a', lip: '#91504a' },
  brown: { base: '#9c6743', light: '#bb8660', shadow: '#7a4c2f', deep: '#4f2e1b', lip: '#783d34' },
  deep: { base: '#6e4429', light: '#906043', shadow: '#53301b', deep: '#2e190d', lip: '#5c2c24' },
} as const satisfies Readonly<Record<string, SkinTone>>;

export function tone(base: string, light: string, shadow: string): Tone {
  return { base, light, shadow };
}
