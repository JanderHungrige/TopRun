import { formatMoney } from '../core/math';
import type { Scene } from '../core/scene';
import { campaignMissions, missionById } from '../data/missions';
import { PLANES } from '../data/planes';
import { THEATERS } from '../data/theaters';
import { enemyName, missionBriefing, missionName, objectiveText, theaterName } from '../i18n/content';
import { t } from '../i18n/i18n';
import { CAMPAIGN_IDS, type CampaignId, type MissionDef } from '../data/types';
import { SECONDARIES } from '../data/weapons';
import { doubleFirepower, jetGunLevel } from '../game/firepower';
import { payScale } from '../game/map-two';
import { campaignComplete, campaignStars, isCleared, isUnlocked, mapOpen, nextMission, nextMissionOn } from '../game/progress';
import type { GameContext } from '../game/state';
import { drawAdminBadge } from '../render/admin-badge';
import { COLORS, measure, paragraph, text } from '../render/text';
import { drawPilotAvatar, pilotFace } from '../render/avatars';
import { drawButton, drawPanel, hit, type Button } from '../ui/widgets';
import type { UiKey } from '../i18n/ui-en';
import { chipRect, drawGlobe, drawGlobeLocked, drawMapPicker, GLOBE, lockedNote } from './map-globe';
import { drawMapBase, drawNode, drawRoute } from './map-render';

const PANEL = { x: 882, y: 76, w: 378, h: 628 };
/** The MENU button top right; BASE moved down next to LAUNCH and HANGAR (owner, 2026-10-28: one place). */
const MENU_BTN = { x: 1150, y: 14, w: 110, h: 44 };
/** Left edge of the callsign and money in the top bar; the avatar sits just left of it. */
const PILOT_X = 860;
const TITLE: Readonly<Record<CampaignId, UiKey>> = { 1: 'map.title', 2: 'map.title2', 3: 'map.title3' };
const WON: Readonly<Record<CampaignId, UiKey>> = { 1: 'map.campaignComplete', 2: 'map.campaign2Complete', 3: 'map.campaign3Complete' };
/** Threat triangles: red on map 1, violet on map 2 (doc 35), orange on map 3 (doc 48). */
const THREAT_COLOR: Readonly<Record<CampaignId, string>> = { 1: COLORS.red, 2: '#c27bff', 3: '#ff8a3d' };

export class MapScene implements Scene {
  private t = 0;
  private selected: MissionDef;
  private buttons: Button[] = [];
  /** Seconds left of the "opens after mission 30 / 60" note under the globe (docs 35, 48). */
  private locked = 0;
  private note: UiKey = 'map.globeLocked';
  /** The map picker under the globe (doc 48): the focused chip while it is open, else null. */
  private picker: CampaignId | null = null;

  constructor(private readonly game: GameContext, select?: string) {
    this.selected = (select ? missionById(select) : undefined) ?? nextMission(game.save);
  }

  /** The map on screen: the selected mission's (doc 35). */
  private get campaign(): CampaignId {
    return this.selected.campaign;
  }

  private get missions(): readonly MissionDef[] {
    return campaignMissions(this.campaign);
  }

  /** The globe opens or closes the map picker (doc 48). */
  private togglePicker(): void {
    this.picker = this.picker === null ? this.campaign : null;
    this.game.audio.play(this.picker === null ? 'uiBack' : 'uiSelect');
  }

  /** Switches to map `c`, or tells when a closed map opens. */
  private pickMap(c: CampaignId): void {
    this.picker = null;
    if (!mapOpen(this.game.save, c)) {
      this.locked = 2.2;
      this.note = lockedNote(c);
      this.game.audio.play('denied');
      return;
    }
    if (c !== this.campaign) this.selected = nextMissionOn(this.game.save, c);
    this.game.audio.play('uiSelect');
  }

  /** Picker input: ←/→ move, ENTER picks, ESC or G closes, a tap picks a chip or closes it. */
  private updatePicker(focus: CampaignId): void {
    const input = this.game.input;
    const i = CAMPAIGN_IDS.indexOf(focus);
    if (input.pressed('left')) this.picker = CAMPAIGN_IDS[Math.max(0, i - 1)] ?? focus;
    if (input.pressed('right')) this.picker = CAMPAIGN_IDS[Math.min(CAMPAIGN_IDS.length - 1, i + 1)] ?? focus;
    const tap = input.taps[0];
    if (tap) {
      const chip = CAMPAIGN_IDS.find((c) => hit(tap, chipRect(c)));
      return chip ? this.pickMap(chip) : this.togglePicker();
    }
    if (input.pressed('confirm')) this.pickMap(this.picker ?? focus);
    else if (input.pressed('back') || input.pressed('globe')) this.togglePicker();
  }

  enter(): void {
    this.game.music.play('menu');
  }

  private layoutButtons(): void {
    const open = isUnlocked(this.game.save, this.selected);
    const y = PANEL.y + PANEL.h - 64;
    this.buttons = [
      { id: 'launch', label: t('map.launch'), x: PANEL.x + 16, y, w: 118, h: 48, primary: true, enabled: open, hint: 'ENTER' },
      { id: 'hangar', label: t('map.hangar'), x: PANEL.x + 142, y, w: 130, h: 48, hint: 'L' },
      { id: 'base', label: t('map.base'), x: PANEL.x + 280, y, w: 82, h: 48, hint: 'B' },
    ];
  }

  update(dt: number): void {
    this.t += dt;
    this.locked = Math.max(0, this.locked - dt);
    const input = this.game.input;
    this.layoutButtons();
    if (this.picker !== null) return this.updatePicker(this.picker);
    if (input.pressed('left') || input.pressed('up')) this.step(-1);
    if (input.pressed('right') || input.pressed('down')) this.step(1);
    for (const tap of input.taps) {
      const b = this.buttons.find((x) => x.enabled !== false && hit(tap, x));
      if (b) return this.activate(b.id);
      if (hit(tap, MENU_BTN)) return this.activate('title');
      if (hit(tap, GLOBE)) return this.togglePicker();
      const node = this.missions.find((m) => Math.hypot(tap.x - m.map.x, tap.y - m.map.y) < 22);
      if (node) this.select(node);
    }
    if (input.pressed('confirm')) this.activate('launch');
    if (input.pressed('hangar')) this.activate('hangar');
    if (input.pressed('base')) this.activate('base');
    if (input.pressed('globe')) this.togglePicker();
    if (input.pressed('back')) this.activate('title');
  }

  private step(d: number): void {
    const list = this.missions;
    const m = list[list.indexOf(this.selected) + d];
    if (m && isUnlocked(this.game.save, m)) this.select(m);
  }

  private select(m: MissionDef): void {
    if (m.id === this.selected.id) return;
    this.selected = m;
    this.game.audio.play('uiMove');
  }

  private activate(id: string): void {
    if (id === 'launch') {
      if (!isUnlocked(this.game.save, this.selected)) {
        this.game.audio.play('denied');
        return;
      }
      this.game.audio.play('uiSelect');
      this.game.go({ to: 'takeoff', mission: this.selected });
    } else if (id === 'hangar') {
      this.game.audio.play('uiSelect');
      this.game.go({ to: 'hangar' });
    } else if (id === 'base') {
      this.game.audio.play('uiSelect');
      this.game.go({ to: 'base' });
    } else if (id === 'title') {
      this.game.audio.play('uiBack');
      this.game.go({ to: 'title' });
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#071019';
    ctx.fillRect(0, 0, 1280, 720);
    drawMapBase(ctx, this.campaign);
    drawRoute(ctx, this.game.save, this.t, this.campaign);
    for (const m of this.missions) drawNode(ctx, m, this.game.save, m.id === this.selected.id, this.t);
    this.renderTopBar(ctx);
    this.renderBriefing(ctx);
    if (this.picker !== null) drawMapPicker(ctx, this.campaign, this.picker, (c) => mapOpen(this.game.save, c));
  }

  private renderTopBar(ctx: CanvasRenderingContext2D): void {
    const s = this.game.save;
    const c = this.campaign;
    text(ctx, t(TITLE[c]), 24, 46, { size: 26, display: true, italic: true, color: COLORS.ink, maxWidth: 430 });
    const done = this.missions.filter((m) => isCleared(s, m)).length;
    text(ctx, t('map.progress', { done, stars: campaignStars(s, c) }), 470, 44, { size: 15, color: COLORS.dim, maxWidth: GLOBE.x - 480 });
    drawGlobe(ctx, c, CAMPAIGN_IDS.some((x) => x !== c && mapOpen(s, x)), this.t);
    if (this.locked > 0) drawGlobeLocked(ctx, this.locked, this.note);
    const pilot = this.game.profile;
    if (pilot) {
      drawPilotAvatar(ctx, pilotFace(pilot), { x: PILOT_X - 60, y: 8, w: 50, h: 60 }, { t: this.t, mood: 'happy' });
      text(ctx, pilot.callsign, PILOT_X, 32, { size: 17, display: true, color: COLORS.gold, maxWidth: MENU_BTN.x - PILOT_X - 12 });
      if (s.admin) drawAdminBadge(ctx, t('pilots.admin'), PILOT_X + measure(ctx, pilot.callsign, 17, true) + 10, 31);
    }
    text(ctx, formatMoney(s.money), PILOT_X, 60, { size: 20, display: true, color: COLORS.green, maxWidth: MENU_BTN.x - PILOT_X - 12 });
    drawButton(ctx, { id: 'title', label: t('map.menu'), ...MENU_BTN }, false, this.t);
    if (campaignComplete(s, c)) text(ctx, t(WON[c]), 470, 66, { size: 13, color: COLORS.gold, maxWidth: GLOBE.x - 480 });
  }

  private renderBriefing(ctx: CanvasRenderingContext2D): void {
    const m = this.selected;
    const s = this.game.save;
    const th = THEATERS[m.theater];
    const x = PANEL.x + 20;
    drawPanel(ctx, PANEL);
    text(ctx, t('map.missionHeader', { n: String(m.number).padStart(2, '0'), theater: theaterName(m.theater).toUpperCase() }), x, PANEL.y + 32, { size: 12, color: th.palette.accent, letterSpacing: 1.5 });
    text(ctx, missionName(m).toUpperCase(), x, PANEL.y + 66, { size: 26, display: true, italic: true, maxWidth: PANEL.w - 40 });
    text(ctx, objectiveText(m.objective), x, PANEL.y + 96, { size: 15, color: COLORS.gold, maxWidth: PANEL.w - 40 });
    const threat = Math.ceil((((m.number - 1) % 30) + 1) / 6); // 1–5 on each map (docs 35, 48)
    text(ctx, t('map.threat'), x, PANEL.y + 128, { size: 11, color: COLORS.dim, letterSpacing: 1.5 });
    text(ctx, '▲'.repeat(threat) + '△'.repeat(5 - threat), x + 70, PANEL.y + 129, { size: 14, color: THREAT_COLOR[m.campaign] });
    const cleared = isCleared(s, m);
    text(ctx, t('map.reward'), x + 180, PANEL.y + 128, { size: 11, color: COLORS.dim, letterSpacing: 1.5 });
    const reward = Math.round(m.reward * payScale(m.number)); // what the mission pays, map scale included (docs 43, 48)
    text(ctx, formatMoney(cleared ? reward * 0.5 : reward) + (cleared ? `  ${t('map.replay')}` : ''), x + 244, PANEL.y + 129, { size: 14, color: COLORS.green, maxWidth: PANEL.w - 264 });
    const h = paragraph(ctx, missionBriefing(m), x, PANEL.y + 164, PANEL.w - 40, { size: 15, color: COLORS.ink, type: true });
    let y = PANEL.y + 182 + h;
    text(ctx, t('map.contacts'), x, y, { size: 11, color: COLORS.dim, letterSpacing: 1.5 });
    paragraph(ctx, m.pool.map((k) => enemyName(k)).join('  ·  '), x, y + 22, PANEL.w - 40, { size: 13, color: COLORS.cyan });
    y += 76;
    this.renderLoadout(ctx, x, y);
    if (!isUnlocked(s, m)) text(ctx, t('map.locked'), x, PANEL.y + PANEL.h - 82, { size: 13, color: COLORS.red });
    else if (cleared) text(ctx, `${t('map.best')}  ${'★'.repeat(s.progress[m.id]?.stars ?? 0)}`, x, PANEL.y + PANEL.h - 82, { size: 14, color: COLORS.gold });
    for (const b of this.buttons) drawButton(ctx, b, b.id === 'launch' && b.enabled !== false, this.t);
  }

  private renderLoadout(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const s = this.game.save;
    const weapons = s.loadout[s.selectedPlane].map((id) => (id ? SECONDARIES[id].short : '—')).join(' / ');
    text(ctx, t(this.campaign === 3 ? 'map.yourHeli' : 'map.yourJet'), x, y, { size: 11, color: COLORS.dim, letterSpacing: 1.5 });
    const level = s.gun2Level > 0 && doubleFirepower(s.selectedPlane) ? `${jetGunLevel(s.selectedPlane, s.gunLevel)} + ${s.gun2Level}` : String(jetGunLevel(s.selectedPlane, s.gunLevel));
    text(ctx, t('map.gunLevel', { plane: PLANES[s.selectedPlane].name, level }), x, y + 22, { size: 15, color: COLORS.ink, maxWidth: PANEL.w - 40 });
    text(ctx, weapons, x, y + 44, { size: 13, color: COLORS.dim, maxWidth: PANEL.w - 40 });
    // Challenge level / Rookie (doc 38), small under the jet.
    const tag = s.rookie ? t('pilots.rookie') : s.challenge.level > 0 ? t('map.challenge', { level: s.challenge.level }) : '';
    if (tag) text(ctx, tag, x, y + 70, { size: 13, display: true, color: s.rookie ? COLORS.green : COLORS.gold });
  }
}
