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

export const onMapThree = (missionNumber: number): boolean => missionNumber > MAP_THREE.from;

export const mapThreePay = (missionNumber: number): number =>
  MAP_THREE.pay * (1 + MAP_THREE.ramp * Math.max(0, missionNumber - MAP_THREE.from - 1));
