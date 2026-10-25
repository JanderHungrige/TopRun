import { formatMoney, TAU } from '../../core/math';
import { SECONDARIES } from '../../data/weapons';
import { objectiveProgress } from '../../game/objectives';
import { drawPlaneTop } from '../../render/draw-planes';
import { bossTitle, missionName, objectiveText, planeSpecialName } from '../../i18n/content';
import { t } from '../../i18n/i18n';
import type { UiKey } from '../../i18n/ui-en';
import { COLORS, text } from '../../render/text';
import { drawBar, drawButton, type Button } from '../../ui/widgets';
import type { Player } from './player';
import type { World } from './world';

export type TouchAction = 'secondary' | 'switchWeapon' | 'flare' | 'special' | 'pause';

const TOUCH_LABELS: Readonly<Record<TouchAction, UiKey | null>> = {
  secondary: 'mission.btnMissile', switchWeapon: 'mission.btnSwitch', flare: 'mission.btnFlare', special: 'mission.btnSpecial', pause: null,
};

export const TOUCH_BUTTONS: ReadonlyArray<Button & { id: TouchAction }> = [
  { id: 'secondary', label: '', x: 16, y: 560, w: 140, h: 76 },
  { id: 'switchWeapon', label: '', x: 164, y: 560, w: 140, h: 76 },
  { id: 'flare', label: '', x: 976, y: 560, w: 140, h: 76 },
  { id: 'special', label: '', x: 1124, y: 560, w: 140, h: 76 },
  { id: 'pause', label: 'II', x: 1212, y: 12, w: 56, h: 44 },
];

function drawTouchButton(ctx: CanvasRenderingContext2D, b: Button & { id: TouchAction }, time: number): void {
  const key = TOUCH_LABELS[b.id];
  drawButton(ctx, { ...b, label: key ? t(key) : b.label }, false, time);
}

function panelBg(ctx: CanvasRenderingContext2D, x: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, 720);
  g.addColorStop(0, '#0e1b29');
  g.addColorStop(1, '#060b12');
  ctx.fillStyle = g;
  ctx.fillRect(x, 0, 320, 720);
  ctx.fillStyle = 'rgba(120,160,200,0.25)';
  ctx.fillRect(x === 0 ? 318 : 960, 0, 2, 720);
}

const label = (ctx: CanvasRenderingContext2D, s: string, x: number, y: number): void =>
  text(ctx, s, x, y, { size: 11, color: COLORS.dim, letterSpacing: 1.5 });

function hullColor(r: number): string {
  if (r > 0.6) return COLORS.green;
  if (r > 0.3) return COLORS.amber;
  return COLORS.red;
}

function drawSecondaries(ctx: CanvasRenderingContext2D, p: Player, y: number): void {
  label(ctx, t('mission.stores'), 20, y);
  if (p.secondaries.length === 0) {
    text(ctx, t('mission.noStores'), 20, y + 24, { size: 13, color: COLORS.faint, maxWidth: 284 });
    return;
  }
  p.secondaries.forEach((s, i) => {
    const ry = y + 12 + i * 34;
    const active = i === p.secIndex;
    ctx.beginPath();
    ctx.roundRect(16, ry, 288, 28, 6);
    ctx.fillStyle = active ? 'rgba(255,200,61,0.16)' : 'rgba(255,255,255,0.04)';
    ctx.fill();
    if (active) {
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    text(ctx, SECONDARIES[s.id].short, 28, ry + 19, { size: 14, display: true, color: s.ammo > 0 ? (active ? COLORS.gold : COLORS.ink) : COLORS.faint });
    text(ctx, `×${s.ammo}`, 290, ry + 19, { size: 15, align: 'right', color: s.ammo > 0 ? COLORS.ink : COLORS.red });
  });
}

function drawSpecial(ctx: CanvasRenderingContext2D, p: Player, y: number): void {
  const plane = p.stats.plane;
  label(ctx, t('mission.special', { name: planeSpecialName(plane.id).toUpperCase() }), 20, y);
  const ready = p.specialCooldown <= 0;
  const f = ready ? 1 : 1 - p.specialCooldown / plane.specialCooldown;
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.arc(44, y + 34, 18, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = ready ? COLORS.cyan : COLORS.faint;
  ctx.beginPath();
  ctx.arc(44, y + 34, 18, -Math.PI / 2, -Math.PI / 2 + f * TAU);
  ctx.stroke();
  const status = p.specialActive > 0 ? t('mission.active') : ready ? t('mission.ready') : `${p.specialCooldown.toFixed(1)} s`;
  text(ctx, status, 76, y + 40, { size: 17, display: true, color: p.specialActive > 0 ? COLORS.gold : ready ? COLORS.cyan : COLORS.dim });
}

export function drawLeftHud(ctx: CanvasRenderingContext2D, p: Player, time: number, touch: boolean, callsign: string): void {
  panelBg(ctx, 0);
  drawPlaneTop(ctx, p.stats.plane.id, 50, 62, 0.9, { t: time, throttle: 0.4, sweep: 0.4 });
  text(ctx, p.stats.plane.short, 90, 56, { size: 24, display: true, italic: true });
  text(ctx, p.stats.plane.nickname.toUpperCase(), 92, 78, { size: 12, color: COLORS.dim, letterSpacing: 2 });
  text(ctx, t('mission.pilot', { callsign }), 20, 108, { size: 12, color: COLORS.gold, letterSpacing: 1.5, maxWidth: 284 });
  label(ctx, t('mission.hull'), 20, 132);
  const r = p.hullRatio;
  const blink = r < 0.25 && Math.sin(time * 10) > 0;
  drawBar(ctx, { x: 20, y: 142, w: 280, h: 16 }, r, blink ? '#ffffff' : hullColor(r));
  text(ctx, `${Math.ceil(p.hull)} / ${p.maxHull}`, 300, 132, { size: 12, align: 'right', color: COLORS.ink });
  label(ctx, t('mission.cannon'), 20, 190);
  text(ctx, t('mission.level', { n: p.gunLevel }), 20, 214, { size: 18, display: true, color: p.powerTimer > 0 ? COLORS.gold : COLORS.ink });
  if (p.powerTimer > 0) drawBar(ctx, { x: 130, y: 203, w: 170, h: 8 }, p.powerTimer / 12, COLORS.gold);
  drawSecondaries(ctx, p, 252);
  label(ctx, t('mission.flares'), 20, 448);
  for (let i = 0; i < Math.max(p.flares, 1); i++) {
    ctx.fillStyle = i < p.flares ? COLORS.amber : 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.arc(28 + i * 22, 466, 7, 0, TAU);
    ctx.fill();
  }
  drawSpecial(ctx, p, 496);
  if (touch) TOUCH_BUTTONS.slice(0, 2).forEach((b) => drawTouchButton(ctx, b, time));
  else text(ctx, t('mission.hintLeft'), 20, 700, { size: 12, color: COLORS.faint, maxWidth: 290 });
}

export function drawRightHud(ctx: CanvasRenderingContext2D, world: World, time: number, touch: boolean): void {
  panelBg(ctx, 960);
  const m = world.mission;
  const x = 980;
  text(ctx, t('mission.number', { n: m.number }), x, 40, { size: 12, color: COLORS.dim, letterSpacing: 2 });
  text(ctx, missionName(m).toUpperCase(), x, 66, { size: 20, display: true, italic: true, maxWidth: 220 });
  label(ctx, t('mission.objective'), x, 110);
  text(ctx, objectiveText(m.objective), x, 132, { size: 13, color: COLORS.gold, maxWidth: 280 });
  const prog = objectiveProgress(m.objective, world.tally);
  if (prog.required > 0) {
    const done = prog.current >= prog.required;
    drawBar(ctx, { x, y: 146, w: 220, h: 12 }, prog.current / prog.required, done ? COLORS.green : COLORS.gold);
    text(ctx, `${Math.min(prog.current, prog.required)} / ${prog.required}`, x + 280, 157, { size: 14, align: 'right', color: done ? COLORS.green : COLORS.ink });
  }
  label(ctx, t('mission.cash'), x, 202);
  text(ctx, formatMoney(world.collected), x, 236, { size: 30, display: true, color: COLORS.green });
  label(ctx, t('mission.kills'), x, 276);
  text(ctx, String(world.tally.kills), x, 304, { size: 24, display: true });
  label(ctx, t('mission.route'), x, 346);
  drawBar(ctx, { x, y: 356, w: 280, h: 10 }, Math.min(1, world.t / m.length), COLORS.cyan);
  const boss = world.boss;
  if (boss && boss.phase !== 'gone') {
    label(ctx, `${boss.def.name} · ${bossTitle(boss.def.id).toUpperCase()}`, x, 404);
    drawBar(ctx, { x, y: 414, w: 280, h: 16 }, boss.hp / boss.maxHp, boss.enraged ? COLORS.red : COLORS.amber);
    const alive = boss.parts.filter((q) => q.alive).length;
    text(ctx, t('mission.weaponsActive', { n: alive }), x, 450, { size: 13, color: COLORS.dim });
  }
  if (touch) TOUCH_BUTTONS.slice(2, 4).forEach((b) => drawTouchButton(ctx, b, time));
  else text(ctx, t('mission.hintRight'), x, 700, { size: 12, color: COLORS.faint, maxWidth: 290 });
  const pause = TOUCH_BUTTONS[4];
  if (pause) drawTouchButton(ctx, pause, time);
}
