import type { AudioEngine } from '../../core/audio';
import { pointDefenceInterval, pointDefenceTarget } from '../../game/point-defence';
import type { Player } from './player';
import type { World } from './world';

// Point defence in the mission (doc 60): when ready, the turrets shoot down the nearest enemy missile in range — a
// line of sparks from the ship to it, a flash where it was.

export function updatePointDefence(world: World, p: Player, dt: number, audio: AudioEngine): void {
  const turrets = p.stats.ship?.pointDefence ?? 0;
  if (turrets <= 0) return;
  p.pdTimer = Math.max(0, p.pdTimer - dt);
  if (p.pdTimer > 0) return;
  const m = pointDefenceTarget(world.missiles, p.x, p.y);
  if (!m) return;
  m.dead = true;
  p.pdTimer = pointDefenceInterval(turrets);
  for (let k = 1; k <= 6; k++) world.particles.trail(p.x + ((m.x - p.x) * k) / 6, p.y + ((m.y - p.y) * k) / 6, 'rgba(160,230,255,1)');
  world.particles.sparks(m.x, m.y, 8, '#bfe8ff', 160);
  audio.play('hit', { volume: 0.3 });
}
