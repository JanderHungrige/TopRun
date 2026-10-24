import type { AudioEngine } from '../../core/audio';
import { TAU } from '../../core/math';
import type { DropKind } from '../../game/combat';
import { text } from '../../render/text';
import type { Player } from './player';
import { PF_H, type World } from './world';

const STYLE: Readonly<Record<DropKind, { color: string; label: string }>> = {
  cash: { color: '#3fcf6e', label: '$' },
  repair: { color: '#ff5d5d', label: '+' },
  power: { color: '#ffb52e', label: 'P' },
  ammo: { color: '#5fb8ff', label: 'M' },
};

export function updatePickups(world: World, p: Player, dt: number, audio: AudioEngine): void {
  const reach = p.stats.magnet ? 160 : 46;
  for (const k of world.pickups) {
    k.t += dt;
    k.y += (world.scrollSpeed * 0.6 + 20) * dt;
    if (k.y > PF_H + 30) {
      k.dead = true;
      continue;
    }
    if (!p.alive) continue;
    const dx = p.x - k.x;
    const dy = p.y - k.y;
    const d = Math.hypot(dx, dy);
    if (d < reach && d > 1) {
      const pull = (p.stats.magnet ? 420 : 260) * dt;
      k.x += (dx / d) * pull;
      k.y += (dy / d) * pull;
    }
    if (d < 24) collect(world, p, k.kind, k.value, audio, k.x, k.y);
    if (d < 24) k.dead = true;
  }
}

function collect(world: World, p: Player, kind: DropKind, value: number, audio: AudioEngine, x: number, y: number): void {
  switch (kind) {
    case 'cash':
      world.collected += value;
      world.particles.popup(x, y - 14, `+$${value}`, '#5be37d');
      audio.play('cash');
      return;
    case 'repair':
      p.repair(0.25);
      world.particles.popup(x, y - 14, 'REPAIR', '#ff8080');
      audio.play('pickup');
      return;
    case 'power':
      p.powerTimer = 12;
      world.particles.popup(x, y - 14, 'GUN UP!', '#ffc83d');
      audio.play('powerup');
      return;
    case 'ammo':
      p.reloadAmmo();
      world.particles.popup(x, y - 14, 'RELOAD', '#5fd4ff');
      audio.play('pickup');
      return;
    default:
      throw new Error(`unhandled: ${kind satisfies never}`);
  }
}

export function drawPickups(ctx: CanvasRenderingContext2D, world: World): void {
  for (const k of world.pickups) {
    const s = STYLE[k.kind];
    const pulse = 1 + Math.sin(k.t * 8) * 0.08;
    ctx.beginPath();
    ctx.arc(k.x, k.y, 13 * pulse, 0, TAU);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = s.color;
    ctx.stroke();
    text(ctx, s.label, k.x, k.y + 1, { size: 15, display: true, align: 'center', baseline: 'middle', color: s.color });
  }
}
