import type { AudioEngine } from '../../core/audio';
import type { Action, Input } from '../../core/input';
import { TOWERS, type TowerId } from '../../data/towers';
import { callBonus, sellValue, towerStats, upgradeCost } from '../../game/defence';
import type { Defence } from './defence-mission';
import type { Player } from './player';
import { makeTower } from './tower-fire';
import { PF_X } from './world';

// The controls of a defence (doc 106): on a free pad pick a tower (1–6, or X / the weapon-switch button to cycle) and
// build it (B / LT); on a tower upgrade it (B) or sell it (Delete); call the next wave early (N / RT). With the mouse or a
// finger: tap a pad for a ring of buttons round it, tap one.

const PAD_REACH = 34;
const PICKS: readonly Action[] = ['pick1', 'pick2', 'pick3', 'pick4', 'pick5', 'pick6'];
export const PAD_R = 22;
export const RING = 52;
export const BUTTON_R = 18;

export type RingButton = { kind: 'build'; id: TowerId; x: number; y: number } | { kind: 'upgrade' | 'sell'; x: number; y: number };

/** The pad the vehicle stands on, or −1. */
export function padAt(d: Defence, x: number, y: number, reach = PAD_REACH): number {
  return d.layout.pads.findIndex((p) => Math.hypot(p.x - x, p.y - y) <= reach);
}

/** The buttons round a pad: the towers to build on a free one, UPGRADE and SELL on a tower. */
export function ringButtons(d: Defence, pad: number): RingButton[] {
  const p = d.layout.pads[pad];
  if (!p) return [];
  const at = (a: number): { x: number; y: number } => ({ x: p.x + Math.cos(a) * RING, y: p.y + Math.sin(a) * RING });
  if (d.towers[pad]) return [{ kind: 'upgrade', ...at(-Math.PI / 2) }, { kind: 'sell', ...at(Math.PI / 2) }];
  return d.known.map((id, i) => ({ kind: 'build', id, ...at(-Math.PI / 2 + (i * Math.PI * 2) / d.known.length) }));
}

export function build(d: Defence, pad: number, id: TowerId, audio: AudioEngine): boolean {
  const cost = TOWERS[id].cost[0];
  const at = d.layout.pads[pad];
  if (!at || d.towers[pad] || d.supply < cost) return deny(audio);
  d.supply -= cost;
  d.towers[pad] = makeTower(id, pad, at, d.marks(id));
  d.world.particles.smoke(at.x, at.y, 10, true);
  audio.play('uiSelect');
  return true;
}

export function upgrade(d: Defence, pad: number, audio: AudioEngine): boolean {
  const t = d.towers[pad];
  const cost = t ? upgradeCost(t.id, t.level) : null;
  if (!t || cost === null || d.supply < cost) return deny(audio);
  d.supply -= cost;
  t.level += 1;
  t.stats = towerStats(t.id, t.level, t.mark);
  d.world.particles.sparks(t.x, t.y, 10, '#ffd25a', 120, true);
  audio.play('uiSelect');
  return true;
}

export function sell(d: Defence, pad: number, audio: AudioEngine): boolean {
  const t = d.towers[pad];
  if (!t) return deny(audio);
  d.supply += sellValue(t.id, t.level);
  d.towers[pad] = null;
  audio.play('uiBack');
  return true;
}

function deny(audio: AudioEngine): false {
  audio.play('denied');
  return false;
}

/** One tick of the controls. True when the weapon-switch press went to the tower pick (the weapon stays). */
export function defenceInput(d: Defence, p: Player, input: Input, audio: AudioEngine): boolean {
  const pad = p.alive ? padAt(d, p.x, p.y) : -1;
  PICKS.forEach((a, i) => { if (input.pressed(a) && d.known[i]) d.pick = d.known[i]; });
  let switched = false;
  if (pad >= 0 && !d.towers[pad]) {
    if (input.pressed('weaponSwitch')) {
      d.pick = d.known[(d.known.indexOf(d.pick) + 1) % d.known.length] ?? d.pick;
      switched = true;
    }
    if (input.pressed('build')) build(d, pad, d.pick, audio);
  } else if (pad >= 0) {
    if (input.pressed('build')) upgrade(d, pad, audio);
    if (input.pressed('delete')) sell(d, pad, audio);
  }
  if (input.pressed('nextWave') && d.countdown !== null) d.callNow(callBonus(d.countdown));
  for (const tap of input.taps) tapAt(d, tap.x - PF_X, tap.y, audio);
  return switched;
}

/** A tap in the playfield: a ring button of the open pad, else a pad (opens its ring), else closes the ring. */
function tapAt(d: Defence, x: number, y: number, audio: AudioEngine): void {
  if (x < 0 || x > 640) return;
  if (d.menuPad >= 0) {
    const b = ringButtons(d, d.menuPad).find((r) => Math.hypot(r.x - x, r.y - y) <= BUTTON_R + 4);
    if (b) {
      if (b.kind === 'build') build(d, d.menuPad, b.id, audio);
      else if (b.kind === 'upgrade') upgrade(d, d.menuPad, audio);
      else sell(d, d.menuPad, audio);
      d.menuPad = -1;
      return;
    }
  }
  d.menuPad = padAt(d, x, y, PAD_R + 6);
}
