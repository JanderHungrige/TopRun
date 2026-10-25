import { formatMoney } from '../../core/math';
import { BOSSES } from '../../data/bosses';
import { PLANES } from '../../data/planes';
import { SECONDARIES } from '../../data/weapons';
import { buttonStates, radarContacts, warningLights, type ButtonStates } from '../../game/cockpit';
import { objectiveProgress } from '../../game/objectives';
import { bossTitle, missionName, objectiveText, planeSpecialName } from '../../i18n/content';
import { t } from '../../i18n/i18n';
import type { CockpitLabels, LeftConsoleView, RightConsoleView } from '../../render/cockpit/types';
import type { Player } from './player';
import { PF_W, type World } from './world';

// Builds what the cockpit consoles show from the running mission (doc 05).

export function cockpitLabels(): CockpitLabels {
  return {
    radar: t('cockpit.radar'), early: t('cockpit.early'), hull: t('cockpit.hull'), cannon: t('cockpit.cannon'),
    power: t('cockpit.power'), stores: t('cockpit.stores'), noStores: t('mission.noStores'), missile: t('cockpit.missile'),
    switch: t('cockpit.switch'), flare: t('cockpit.flare'), special: t('cockpit.special'), pause: t('cockpit.pause'),
    objective: t('mission.objective'), kills: t('mission.kills'), cash: t('mission.cash'), route: t('mission.route'),
    empty: t('cockpit.empty'), none: t('cockpit.none'), warnMissile: t('cockpit.warnMissile'),
    warnLowHull: t('cockpit.warnLowHull'), warnBoss: t('cockpit.warnBoss'), warnPower: t('cockpit.warnPower'),
    warnEcm: t('cockpit.warnEcm'), warnDmgCtrl: t('cockpit.warnDmgCtrl'),
  };
}

export function cockpitButtons(p: Player): ButtonStates {
  return buttonStates({
    secondaries: p.secondaries, secIndex: p.secIndex, secCooldown: p.secCooldown, flares: p.flares,
    flareCapacity: p.stats.flares, specialCooldown: p.specialCooldown, specialMax: p.stats.plane.specialCooldown,
    specialActive: p.specialActive,
  });
}

function upcomingSpawns(w: World): Array<{ dt: number; x: number }> {
  const out: Array<{ dt: number; x: number }> = [];
  for (let i = w.nextEvent; i < w.timeline.length; i++) {
    const ev = w.timeline[i];
    if (!ev || ev.t - w.t > 4) break;
    out.push({ dt: ev.t - w.t, x: ev.type === 'enemy' ? ev.x : PF_W / 2 });
  }
  return out;
}

export function leftView(w: World, p: Player, callsign: string, labels: CockpitLabels): LeftConsoleView {
  const b = cockpitButtons(p);
  const boss = w.boss && w.boss.phase !== 'gone' ? { x: w.boss.x, y: w.boss.y } : null;
  return {
    plane: p.stats.plane.id, planeName: PLANES[p.stats.plane.id].name, callsign,
    radar: {
      early: p.stats.earlyWarning,
      contacts: radarContacts({
        player: { x: p.x, y: p.y }, enemies: w.enemies, boss,
        missiles: w.missiles.map((m) => ({ x: m.x, y: m.y, enemy: m.kind === 'enemy' })),
        upcoming: upcomingSpawns(w),
      }, p.stats.earlyWarning),
    },
    hull: { ratio: p.hullRatio, value: Math.ceil(p.hull), max: p.maxHull },
    cannon: { level: p.gunLevel, powered: p.powerTimer > 0, powerRatio: Math.min(1, p.powerTimer / 12) },
    stores: p.secondaries.map((s, i) => ({ id: s.id, short: SECONDARIES[s.id].short, ammo: s.ammo, selected: i === p.secIndex })),
    buttons: { missile: b.missile, switch: b.switch },
    keys: { missile: 'SHIFT', switch: 'Q' },
    labels,
  };
}

export function rightView(w: World, p: Player, labels: CockpitLabels): RightConsoleView {
  const m = w.mission;
  const b = cockpitButtons(p);
  const prog = objectiveProgress(m.objective, w.tally);
  const boss = w.boss && w.boss.phase !== 'gone' ? w.boss : null;
  return {
    missionNumber: m.number, missionName: missionName(m), objective: objectiveText(m.objective),
    progress: prog.required > 0 ? prog : null, kills: w.tally.kills, cash: formatMoney(w.collected),
    route: Math.min(1, w.t / m.length),
    boss: boss ? { name: BOSSES[boss.def.id].name, title: bossTitle(boss.def.id), ratio: boss.hp / boss.maxHp, enraged: boss.enraged } : null,
    warnings: warningLights({
      player: { x: p.x, y: p.y, alive: p.alive }, hullRatio: p.hullRatio,
      missiles: w.missiles.map((x) => ({ x: x.x, y: x.y, enemy: x.kind === 'enemy', decoyed: x.decoy !== null })),
      bossActive: boss !== null, powerTimer: p.powerTimer, ecm: p.stats.ecm,
      damageControl: p.stats.damageControl, damageControlUsed: p.damageControlUsed,
    }),
    flare: { state: b.flare, count: p.flares },
    special: { ...b.special, name: planeSpecialName(p.stats.plane.id) },
    attitude: { bank: p.bank, forward: p.forward },
    keys: { flare: 'F', special: 'E', pause: 'P' },
    labels,
  };
}
