// Map 2 pays and hits harder (wave 3, doc 43): on top of the threat curve, by mission number — not by difficulty, so
// a pilot on a high challenge level doesn't out-earn the doubled shop. Map 1 is untouched. Pure.

export const MAP_TWO = Object.freeze({
  /** The last mission of map 1: the factors grow with `x = mission number − from`. */
  from: 30,
  /** Mission reward, enemy and boss bounties: × (1 + pay x + pay2 x²). */
  pay: 0.08,
  pay2: 0.004,
  /** Enemy and boss HP: × (1 + hp x + hp2 x²). */
  hp: 0.01,
  hp2: 0.0008,
  /** Every enemy hit on the player: × (1 + hit x). */
  hit: 0.02,
});

const past = (missionNumber: number): number => Math.max(0, missionNumber - MAP_TWO.from);

export function payScale(missionNumber: number): number {
  const x = past(missionNumber);
  return 1 + MAP_TWO.pay * x + MAP_TWO.pay2 * x * x;
}

export function mapTwoHp(missionNumber: number): number {
  const x = past(missionNumber);
  return 1 + MAP_TWO.hp * x + MAP_TWO.hp2 * x * x;
}

export const mapTwoHit = (missionNumber: number): number => 1 + MAP_TWO.hit * past(missionNumber);
