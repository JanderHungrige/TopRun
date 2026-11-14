import type { EnemyDef } from '../data/enemies';

// The invasion army's mechanics (doc 105), pure: the tripods' heat ray, what a spawner lets out, the shield bearers'
// cover.

/** The heat ray: six bolts in a line, `gap` px apart, fast and each a light hit. */
export const RAY = Object.freeze({ bolts: 6, gap: 14, speed: 360, damage: 10 });

interface Placed { x: number; y: number; dead: boolean; def: EnemyDef }

/** The share of a hit an enemy at (x, y) takes: halved (the bearer's `share`) while a live shield bearer other than
 *  itself stands within its reach. */
export function shieldShare(target: { x: number; y: number }, others: readonly Placed[]): number {
  for (const o of others) {
    const sh = o.def.shield;
    if (!sh || o.dead || o === target) continue;
    if (Math.hypot(o.x - target.x, o.y - target.y) <= sh.reach) return sh.share;
  }
  return 1;
}

/** Whether a spawner that has lived `age` s lets one out this tick (`dt`): every `every` s, the first after `every`. */
export function spawnDue(def: EnemyDef, age: number, dt: number): boolean {
  const every = def.spawn?.every;
  if (!every) return false;
  return Math.floor(age / every) > Math.floor((age - dt) / every);
}

/** How many a spawner lets loose when it dies, and where (spread round it). */
export function deathBrood(def: EnemyDef, x: number, y: number): Array<{ x: number; y: number }> {
  const n = def.spawn?.count ?? 0;
  return Array.from({ length: n }, (_, k) => {
    const a = (k / Math.max(1, n)) * Math.PI * 2 + 0.4;
    return { x: x + Math.cos(a) * 22, y: y + Math.sin(a) * 18 };
  });
}
