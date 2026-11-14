import { TOWERS, type TowerId } from '../data/towers';
import { callBonus, OUTPOST_HEALTH, sellValue, upgradeCost } from '../game/defence';
import { OUTPOST_Y } from '../game/defence-layout';
import { t as tr } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { BUTTON_R, padAt, ringButtons, type RingButton } from '../scenes/mission/defence-input';
import type { Defence } from '../scenes/mission/defence-mission';
import type { Player } from '../scenes/mission/player';
import { COLORS, text } from './text';
import { drawTower } from './tower-art';

// The defence's HUD over the playfield (doc 106): the wave and the countdown with the call bonus, the supply and what it
// just gained, the outpost's health bar, the tower picked to build; on the pad the vehicle stands on the build ring with
// the costs (or the tower's UPGRADE / SELL and its range); the ring of buttons a tap opened.

type Ctx = CanvasRenderingContext2D;
const NAME: Readonly<Record<TowerId, UiKey>> = {
  mgnest: 'tower.mgnest', flak: 'tower.flak', mortarpit: 'tower.mortarpit', tesla: 'tower.tesla', jammer: 'tower.jammer', rockets: 'tower.rockets',
};
export const towerName = (id: TowerId): string => tr(NAME[id]);

function panel(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = 'rgba(9,16,26,0.72)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
}

function topBar(ctx: Ctx, d: Defence): void {
  panel(ctx, 8, 96, 300, 44);
  text(ctx, tr('td.wave', { n: Math.max(1, d.wave), total: d.total }), 18, 115, { size: 15, weight: 800, color: COLORS.gold, letterSpacing: 1 });
  const line = d.countdown !== null
    ? `${tr('td.next', { s: Math.ceil(d.countdown) })}  ·  ${tr('td.call', { n: callBonus(d.countdown) })}`
    : tr(d.world.boss?.active ? 'td.boss' : 'td.running');
  text(ctx, line, 18, 133, { size: 12, color: d.countdown !== null ? COLORS.ink : COLORS.dim });
  panel(ctx, 472, 96, 160, 44);
  text(ctx, tr('td.supply'), 482, 113, { size: 11, color: COLORS.dim, letterSpacing: 1.5 });
  text(ctx, String(Math.floor(d.supply)), 482, 133, { size: 18, weight: 800, color: '#ffd76a' });
  if (d.gain.t > 0) text(ctx, `+${d.gain.n}`, 622, 133, { size: 14, weight: 800, color: COLORS.green, align: 'right', alpha: Math.min(1, d.gain.t * 2) });
}

function outpostBar(ctx: Ctx, d: Defence): void {
  const w = 300;
  const x = 320 - w / 2;
  const y = OUTPOST_Y - 16;
  const k = d.health / OUTPOST_HEALTH;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x - 2, y - 2, w + 4, 10);
  ctx.fillStyle = k > 0.5 ? COLORS.green : k > 0.25 ? COLORS.amber : COLORS.red;
  ctx.fillRect(x, y, w * k, 6);
  text(ctx, tr('td.outpost'), x - 8, y + 7, { size: 11, weight: 700, color: COLORS.ink, align: 'right', shadow: true });
}

function ringButton(ctx: Ctx, d: Defence, b: RingButton, picked: boolean, t: number): void {
  ctx.fillStyle = picked ? 'rgba(80,60,10,0.9)' : 'rgba(9,16,26,0.85)';
  ctx.strokeStyle = picked ? '#ffd25a' : 'rgba(200,210,220,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(b.x, b.y, BUTTON_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (b.kind === 'build') {
    drawTower(ctx, b.id, b.x, b.y - 2, { aim: 0, level: 1, heat: 0, t, scale: 0.6 });
    const cost = TOWERS[b.id].cost[0];
    text(ctx, String(cost), b.x, b.y + BUTTON_R + 11, { size: 11, weight: 800, align: 'center', color: d.supply >= cost ? '#ffd76a' : COLORS.red, shadow: true });
    return;
  }
  text(ctx, b.kind === 'upgrade' ? '▲' : '$', b.x, b.y + 6, { size: 16, weight: 800, align: 'center', color: b.kind === 'upgrade' ? COLORS.gold : COLORS.green });
}

/** Standing on a pad: the build ring (keyboard / pad users read the costs and the pick here) or the tower's actions. */
function padHelp(ctx: Ctx, d: Defence, pad: number, t: number): void {
  const p = d.layout.pads[pad];
  const tower = d.towers[pad];
  if (!p) return;
  if (tower) {
    ctx.strokeStyle = 'rgba(255,210,90,0.45)';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, tower.stats.range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    const up = upgradeCost(tower.id, tower.level);
    const help = `${towerName(tower.id)} ${tower.level}/3  ·  ${up === null ? tr('td.max') : tr('td.upgrade', { cost: up })}  ·  ${tr('td.sell', { n: sellValue(tower.id, tower.level) })}`;
    return hint(ctx, help);
  }
  for (const b of ringButtons(d, pad)) ringButton(ctx, d, b, b.kind === 'build' && b.id === d.pick, t);
  hint(ctx, `${tr('td.pick')}  ·  ${tr('td.build', { tower: towerName(d.pick), cost: TOWERS[d.pick].cost[0] })}`);
}

function hint(ctx: Ctx, s: string): void {
  panel(ctx, 20, OUTPOST_Y - 52, 600, 26);
  text(ctx, s, 320, OUTPOST_Y - 34, { size: 13, weight: 700, align: 'center', color: COLORS.ink });
}

export function renderDefenceHud(ctx: Ctx, d: Defence, p: Player, t: number): void {
  topBar(ctx, d);
  outpostBar(ctx, d);
  const pad = p.alive ? padAt(d, p.x, p.y) : -1;
  if (d.menuPad >= 0 && d.menuPad !== pad) for (const b of ringButtons(d, d.menuPad)) ringButton(ctx, d, b, false, t);
  if (pad >= 0) padHelp(ctx, d, pad, t);
}
