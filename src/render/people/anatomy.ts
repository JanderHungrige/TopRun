import { lazyPart, taper, type PartSpec } from './paths';

// People kit (doc 17): proportions and the side-view body parts. Every part lies along its own +x axis
// from the proximal joint, pointing down the body; −y is the front (anterior), +y the back.

/** An athletic adult, about 7.8 heads tall, in kit units (1 unit = 1 logical px at scale 1). */
export const BODY = {
  height: 328,
  head: 42,
  /** Shoulder joint → hip joint. */
  spine: 96,
  upperArm: 60,
  forearm: 50,
  hand: 34,
  thigh: 80,
  shin: 79,
  /** Ankle joint above the sole (bare foot). */
  ankle: 9,
  foot: 46,
  /** Neck base → head pivot. */
  neck: 13,
  /** Front view: shoulder joint to shoulder joint. */
  shoulders: 84,
  /** Front view: hip joint to hip joint. */
  hips: 34,
} as const;

/** Neck base in the torso frame (shoulder joint at the origin, hip joint at x = spine). */
export const NECK_BASE = { x: -15, y: -2 } as const;

const TORSO: PartSpec = {
  ant: [-18, -7, -14, -10, -8, -16, 2, -22, 14, -25.5, 24, -25, 31, -20, 38, -19, 50, -20, 64, -19.5, 77, -18.5, 90, -17, 101, -14, 109, -9],
  post: [-19, 4, -11, 11, -1, 19, 14, 22, 34, 19, 52, 15, 66, 15, 80, 20, 94, 24, 105, 18, 111, 8],
  defs: [
    taper([25, -24, 31, -17, 31, -9], 3.4), // under the pec
    taper([36, -12, 40, -7], 2.2), // serratus
    taper([43, -13, 47, -8], 2.2),
    taper([50, -14, 53, -9], 2),
    taper([18, 9, 38, 13, 56, 10], 3.2), // lat border
    taper([64, 7, 76, -2, 85, -10, 94, -15], 3.6), // oblique over the hip
    taper([86, 13, 94, 8, 101, 7], 4), // hollow of the hip
    taper([45, -19.5, 47, -15], 1.6), // abs in profile
    taper([58, -19, 60, -15], 1.6),
    taper([71, -18, 73, -14], 1.6),
  ],
};

const UPPER_ARM: PartSpec = {
  ant: [-12, -6, -8, -12, 2, -15, 14, -15, 24, -12, 32, -10.5, 42, -11, 52, -9, 60, -7.5, 66, -5],
  post: [-12, 6, -6, 12, 4, 14.5, 16, 15, 28, 13.5, 38, 12.5, 48, 10.5, 58, 9, 65, 6.5],
  defs: [
    taper([17, -13.5, 27, -5.5, 31, 1, 27, 9, 20, 14], 3.2), // deltoid border
    taper([34, -2, 45, -2.5, 56, -1], 2.4), // biceps / triceps groove
    taper([37, 9, 44, 7, 50, 4], 2), // triceps head
  ],
};

const FOREARM: PartSpec = {
  ant: [-6, -6, 2, -9, 10, -10.5, 20, -9.5, 32, -7, 44, -5.5, 52, -5],
  post: [-7, 5, 0, 8, 10, 9, 22, 8, 34, 6, 44, 5, 52, 4.5],
  defs: [taper([5, -2, 18, -2.5, 34, -1], 2.2)],
};

const THIGH: PartSpec = {
  ant: [-10, -13, 0, -17, 14, -18, 30, -17, 46, -15, 60, -12, 70, -11, 78, -10, 86, -7],
  post: [-10, 13, 0, 17, 16, 18, 34, 16, 52, 13, 66, 10, 76, 9, 86, 6],
  defs: [
    taper([10, 2, 40, 1, 70, 0], 2.6), // iliotibial band
    taper([30, 10, 46, 9, 62, 6], 2), // hamstring border
    taper([62, -10, 68, -8, 74, -5], 2.6), // teardrop above the knee
  ],
};

const SHIN: PartSpec = {
  ant: [-8, -8, 4, -9.5, 20, -9, 40, -7.5, 60, -6, 74, -5.5, 84, -5],
  post: [-8, 8, 6, 11, 18, 15, 30, 14, 44, 10, 58, 7, 72, 5.5, 84, 5],
  defs: [taper([14, 9, 28, 6, 44, 6], 2.6), taper([10, -3, 30, -2.5, 52, -2], 2)],
};

const SLEEVE: PartSpec = {
  ant: [-14, -8, -10, -14.5, 2, -17.5, 16, -17, 28, -15, 33, -14.5],
  post: [-14, 8, -8, 14, 4, 16.5, 18, 16.5, 30, 15, 34, 14.5],
  defs: [taper([6, 6, 18, 9, 30, 10], 2.4)],
};

const SHORTS_LEG: PartSpec = {
  ant: [-14, -17, 0, -20, 16, -21, 30, -20.5, 42, -20],
  post: [-14, 17, 0, 20, 18, 21, 32, 20.5, 43, 20],
  defs: [taper([4, 8, 20, 12, 36, 12], 3), taper([28, -8, 36, -4, 41, 2], 2.4)],
};

const TROUSER_THIGH: PartSpec = {
  ant: [-12, -17, 0, -20, 20, -21, 40, -20, 60, -18, 78, -15, 88, -13],
  post: [-12, 17, 0, 20, 20, 21, 40, 20, 60, 18, 78, 15, 88, 13],
  defs: [taper([70, -10, 78, -3, 84, 6], 3), taper([20, 8, 40, 12, 58, 11], 3)],
};

const TROUSER_SHIN: PartSpec = {
  ant: [-6, -14, 10, -15, 30, -14, 50, -13, 68, -12.5, 82, -12.5],
  post: [-6, 14, 10, 15, 30, 14, 50, 13, 68, 12.5, 82, 12.5],
  defs: [taper([60, -8, 68, 0, 74, 8], 2.6), taper([4, 4, 14, 8, 24, 10], 2.4)],
};

export const PARTS = {
  torso: lazyPart(TORSO),
  upperArm: lazyPart(UPPER_ARM),
  forearm: lazyPart(FOREARM),
  thigh: lazyPart(THIGH),
  shin: lazyPart(SHIN),
  sleeve: lazyPart(SLEEVE),
  shortsLeg: lazyPart(SHORTS_LEG),
  trouserThigh: lazyPart(TROUSER_THIGH),
  trouserShin: lazyPart(TROUSER_SHIN),
} as const;

/** Front contour of the torso (depth in front of the joint line) at x along the spine, for things resting on the chest. */
export function chestFront(x: number): number {
  const a = TORSO.ant;
  for (let i = 2; i < a.length; i += 2) {
    const x1 = a[i] ?? 0;
    if (x1 >= x) {
      const x0 = a[i - 2] ?? 0;
      const u = x1 === x0 ? 0 : (x - x0) / (x1 - x0);
      return -((a[i - 1] ?? 0) + ((a[i + 1] ?? 0) - (a[i - 1] ?? 0)) * u);
    }
  }
  return 9;
}
