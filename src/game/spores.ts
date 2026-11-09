// The jungle planet's spore ring (doc 96): spores thrown evenly round a creature, the ring turned by an angle — a rooted
// ring-shooter turns it with its age, so firing again and again it draws a spiral.

/** How far the ring turns per second of the source's age (radians). */
export const RING_SPIN = 0.9;
/** Spores in a ring shot. */
export const RING_SPORES = 8;

/** The headings (0 = up, clockwise) of n spores evenly round the source, the first at `turn`. */
export const ringHeadings = (n: number, turn: number): number[] => Array.from({ length: n }, (_, i) => turn + (i * Math.PI * 2) / n);
