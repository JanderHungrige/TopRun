import { formatMoney } from '../../core/math';
import { BOSSES } from '../../data/bosses';
import { atLevel, RADAR_AHEAD } from '../../data/equipment';
import { PLANES } from '../../data/planes';
import { SECONDARIES } from '../../data/weapons';
import type { Device } from '../../core/input';
import { buttonStates, radarContacts, warningLights, type ButtonStates } from '../../game/cockpit';
import { defaultProfile, type JoyAction, type JoyProfile } from '../../game/joystick';
import { canSwitch, slotFor } from '../../game/loadout';
import { objectiveProgress } from '../../game/objectives';
import { bossTitle, missionName, objectiveText, planeSpecialName } from '../../i18n/content';
import { t } from '../../i18n/i18n';
import type { Armed, CockpitLabels, LeftConsoleView, RightConsoleView } from '../../render/cockpit/types';
import type { Player } from './player';
import { hidden } from './projectiles';
import { PF_W, type World } from './world';

// Builds what the cockpit consoles show from the running mission (doc 05).

export function cockpitLabels(): CockpitLabels {
  return {
    radar: t('cockpit.radar'), early: t('cockpit.early'), hull: t('cockpit.hull'), cannon: t('cockpit.cannon'),
    power: t('cockpit.power'), stores: t('cockpit.stores'), noStores: t('mission.noStores'), air: t('cockpit.air'),
    ground: t('cockpit.ground'), switch: t('cockpit.switch'), switchTap: t('cockpit.switchTap'), flare: t('cockpit.flare'), special: t('cockpit.special'), pause: t('cockpit.pause'),
    objective: t('mission.objective'), kills: t('mission.kills'), cash: t('mission.cash'), route: t('mission.route'),
    empty: t('cockpit.empty'), none: t('cockpit.none'), warnMissile: t('cockpit.warnMissile'),
    warnLowHull: t('cockpit.warnLowHull'), warnBoss: t('cockpit.warnBoss'), warnPower: t('cockpit.warnPower'),
    warnEcm: t('cockpit.warnEcm'), warnDmgCtrl: t('cockpit.warnDmgCtrl'),
  };
}

export function cockpitButtons(p: Player): ButtonStates {
  return buttonStates({
    secondaries: p.secondaries, secCooldown: p.secCooldown, flares: p.flares,
    flareCapacity: p.stats.flares, specialCooldown: p.specialCooldown, specialMax: p.stats.plane.specialCooldown,
    specialActive: p.specialActive,
  });
}

function upcomingSpawns(w: World): Array<{ dt: number; x: number }> {
  const out: Array<{ dt: number; x: number }> = [];
  for (let i = w.nextEvent; i < w.timeline.length; i++) {
    const ev = w.timeline[i];
    if (!ev || ev.t - w.t > atLevel(RADAR_AHEAD, RADAR_AHEAD.length - 1)) break;
    out.push({ dt: ev.t - w.t, x: ev.type === 'enemy' ? ev.x : PF_W / 2 });
  }
  return out;
}

/** What a weapon key fires next: short name and ammo, or null when nothing of that role has ammo. */
function armed(p: Player, slot: number): Armed | null {
  const s = p.secondaries[slot];
  return s ? { short: SECONDARIES[s.id].short, ammo: s.ammo } : null;
}

/** The ground-weapon SWITCH line on the STORES screen; null without any ground weapon mounted (doc 05). */
function swapHint(p: Player, labels: CockpitLabels, keys: CockpitKeys): LeftConsoleView['swap'] {
  if (!p.secondaries.some((s) => SECONDARIES[s.id].role === 'ground')) return null;
  const key = keys.switch ? ` [${keys.switch}]` : '';
  return { text: `${keys.tap ? labels.switchTap : labels.switch}${key}`, ready: canSwitch(p.secondaries, 'ground') };
}

export function leftView(w: World, p: Player, callsign: string, labels: CockpitLabels, keys: CockpitKeys): LeftConsoleView {
  const b = cockpitButtons(p);
  const nextAir = slotFor(p.secondaries, 'air');
  const nextGround = slotFor(p.secondaries, 'ground', p.groundPick);
  const boss = w.boss && w.boss.phase !== 'gone' ? { x: w.boss.x, y: w.boss.y } : null;
  return {
    plane: p.stats.plane.id, planeName: PLANES[p.stats.plane.id].name, callsign,
    radar: {
      early: p.stats.earlyWarning,
      jammed: w.jammed,
      contacts: radarContacts({
        player: { x: p.x, y: p.y }, enemies: w.enemies.map((e) => ({ x: e.x, y: e.y, layer: e.layer, dead: e.dead, hidden: hidden(e, p) })),
        boss, jammed: w.jammed,
        missiles: w.missiles.map((m) => ({ x: m.x, y: m.y, enemy: m.kind === 'enemy' })),
        upcoming: upcomingSpawns(w),
      }, p.stats.radarLevel),
    },
    hull: { ratio: p.hullRatio, value: Math.ceil(p.hull), max: p.maxHull },
    cannon: { level: p.gunLevel, level2: p.gun2Level, powered: p.powerTimer > 0, powerRatio: Math.min(1, p.powerTimer / 12) },
    stores: p.secondaries.map((s, i) => ({
      id: s.id, short: SECONDARIES[s.id].short, ammo: s.ammo, role: SECONDARIES[s.id].role, next: i === nextAir || i === nextGround,
    })),
    buttons: { air: b.air, ground: b.ground },
    weapons: { air: armed(p, nextAir), ground: armed(p, nextGround) },
    swap: swapHint(p, labels, keys),
    keys: { air: keys.air, ground: keys.ground, switch: keys.switch },
    labels,
  };
}

export function rightView(w: World, p: Player, labels: CockpitLabels, keys: CockpitKeys): RightConsoleView {
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
    keys: { flare: keys.flare, special: keys.special, pause: keys.pause },
    labels,
  };
}

export interface CockpitKeys {
  air: string;
  ground: string;
  /** SWITCH ground weapon (doc 05). */
  switch: string;
  /** Touch: the STORES screen says "tap" instead of naming a key. */
  tap: boolean;
  flare: string;
  special: string;
  pause: string;
}

/** What to print on the console key caps for the device in use (doc 05). */
export function cockpitKeys(device: Device, joystick: JoyProfile | null): CockpitKeys {
  switch (device) {
    case 'keyboard':
    case 'mouse': return { air: 'R', ground: 'Q', switch: 'X', flare: 'F', special: 'E', pause: 'P', tap: false };
    case 'gamepad': return { air: 'B', ground: 'RB', switch: 'LB', flare: 'X', special: 'Y', pause: '☰', tap: false };
    case 'touch': return { air: '', ground: '', switch: '', flare: '', special: '', pause: '', tap: true };
    case 'joystick': {
      const buttons = (joystick ?? defaultProfile('')).buttons;
      const btn = (a: JoyAction): string => {
        const bind = buttons[a];
        return bind ? `BTN ${bind.index + 1}` : '';
      };
      return {
        air: btn('missile'), ground: btn('switch'), switch: btn('cycle'), flare: btn('flare'), special: btn('special'), pause: btn('pause'),
        tap: false,
      };
    }
    default: throw new Error(`unhandled: ${device satisfies never}`);
  }
}
