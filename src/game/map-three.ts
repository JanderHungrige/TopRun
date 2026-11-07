// Map 3 pays on its own scale (doc 48): its missions restart at the map-1 reward formula and the helicopter kit at
// zero, so the pay is a multiple of that, rising by mission number, set so the helicopter shop is about 1.5 × what
// map 3 pays (doc 43's rule). Map 3 has no extra HP or hit factor: its threat is the difficulty climb. Pure.

export const MAP_THREE = Object.freeze({
  /** The last mission of map 2: map 3's factors start after it. */
  from: 60,
  /** Mission reward, enemy and boss bounties: × pay × (1 + ramp × (mission number − 61)). */
  pay: 6,
  ramp: 0.03,
});

/** Map 4 (doc 56) pays the same way on its own scale, from m91. */
export const MAP_FOUR = Object.freeze({ from: 90, pay: 8, ramp: 0.03 });

export const onMapThree = (missionNumber: number): boolean => missionNumber > MAP_THREE.from;
export const onMapFour = (missionNumber: number): boolean => missionNumber > MAP_FOUR.from;

/** Map 3's pay factor, or map 4's from m91. */
export function mapThreePay(missionNumber: number): number {
  const m = onMapFour(missionNumber) ? MAP_FOUR : MAP_THREE;
  return m.pay * (1 + m.ramp * Math.max(0, missionNumber - m.from - 1));
}
