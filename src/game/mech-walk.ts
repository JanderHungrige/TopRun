// How a mech walks in the top-down mission (doc 80): the jungle floor scrolls at a walking pace, the mech eases toward
// the stick a little slower than a helicopter, and its speed surges with every step; the Strider's jump jets end in a
// stomp. Pure.

export const MECH_WALK = Object.freeze({
  /** World scroll on map 6, share of the jets'. */
  scroll: 0.6,
  /** How fast the velocity closes on the stick: share of the gap per second (the helicopter's is 6). */
  accel: 4.5,
  /** Floor distance per step (px). */
  stride: 34,
});

/** Share of top speed at a point of the gait: slowest as a foot comes down, fastest mid-stride. */
export const gaitSpeed = (phase: number): number => 0.75 + 0.25 * Math.abs(Math.sin(phase * Math.PI));

/** The gait's phase after walking `distance` px (one whole number per step). */
export const gaitPhase = (distance: number): number => distance / MECH_WALK.stride;

/** Whether a foot came down between two phases (a footprint, a thud). */
export const footfall = (before: number, after: number): boolean => Math.floor(after) > Math.floor(before);

/** Which foot is stepping at a phase: 0 the left, 1 the right. */
export const steppingFoot = (phase: number): 0 | 1 => (Math.floor(phase) % 2 === 0 ? 0 : 1);

/** The Strider's stomp on landing: the ring's reach (px), how long it takes to get there (s), its damage. */
export const STOMP = Object.freeze({ reach: 130, time: 0.35, damage: 80 });

/** The stomp ring's radius `t` seconds after landing. */
export const stompRadius = (t: number): number => STOMP.reach * Math.min(1, Math.max(0, t) / STOMP.time);

/** How high the mech is during the leap (0 on the ground, 1 at the top) for the share of the leap done. */
export const leapHeight = (done: number): number => Math.sin(Math.min(1, Math.max(0, done)) * Math.PI);
