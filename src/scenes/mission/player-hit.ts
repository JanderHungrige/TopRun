import type { AudioEngine } from '../../core/audio';
import { hitScale } from '../../game/combat';
import { mapTwoHit } from '../../game/map-two';
import type { Player } from './player';
import type { World } from './world';

/** Every enemy hit on the player lands here; its damage grows with the mission's difficulty (doc 43). Moved out of
 *  mission-scene.ts. */
export function hitPlayer(w: World, p: Player, base: number, audio: AudioEngine): void {
  if (!p.alive || p.invulnerable) return;
  const amount = base * hitScale(w.mission.difficulty) * mapTwoHit(w.mission.number);
  w.perf.damage += amount;
  const died = p.damage(amount);
  w.particles.sparks(p.x, p.y, 8, '#ffb070', 200);
  if (died) {
    w.particles.explosion(p.x, p.y, 'huge');
    audio.play('explosionHuge');
    w.addShake(14);
  } else {
    audio.play('playerHit');
    w.addShake(4);
  }
}
