// Image portraits (doc 33): the owner's generated pixel-art portraits in src/assets/portraits/ (240 × 288 indexed
// PNGs). Every file that exists is bundled as a hashed asset; anything not there yet (talk / blink frames, the
// wingman, the builder set) is simply absent and the callers fall back.

/** A character's frames: the base image and, where they exist, the talk and blink frames. */
export interface FrameSet { base: string; talk?: string; half?: string; blink?: string }

const FIXED = import.meta.glob<string>('../../assets/portraits/*.png', { eager: true, query: '?url', import: 'default' });
const CUSTOM = import.meta.glob<string>('../../assets/portraits/custom/*.png', { eager: true, query: '?url', import: 'default' });

const fileName = (path: string): string => path.slice(path.lastIndexOf('/') + 1).replace(/\.png$/, '');

const fixed = new Map(Object.entries(FIXED).map(([path, url]) => [fileName(path), url]));
const custom = new Map(Object.entries(CUSTOM).map(([path, url]) => [fileName(path), url]));

function frames(files: ReadonlyMap<string, string>, name: string): FrameSet | null {
  const base = files.get(name);
  if (!base) return null;
  return { base, talk: files.get(`${name}-talk`), half: files.get(`${name}-half`), blink: files.get(`${name}-blink`) };
}

/** The frames of a fixed character or preset pilot (`admiral`, `pilot2`, …), or null while its image is missing. */
export const fixedFrames = (id: string): FrameSet | null => frames(fixed, id);

/** The builder's portraits that exist, by name (`kid-fair-blond-long`, …). */
export const CUSTOM_KEYS: readonly string[] = Object.freeze([...custom.keys()].filter((k) => !/-(talk|half|blink)$/.test(k)).sort());

/** The frames of one builder portrait, or null when it does not exist. */
export const customFrames = (key: string): FrameSet | null => frames(custom, key);

const urls = (f: FrameSet | null): string[] => (f ? [f.base, f.talk, f.half, f.blink].filter((u): u is string => u !== undefined) : []);

/** Every image of the fixed cast and the presets (preloaded at boot). */
export const fixedUrls = (ids: readonly string[]): string[] => ids.flatMap((id) => urls(fixedFrames(id)));

/** Every builder image (preloaded when the builder opens). */
export const customUrls = (): string[] => CUSTOM_KEYS.flatMap((k) => urls(customFrames(k)));
