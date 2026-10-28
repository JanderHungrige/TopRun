import { formatMoney } from '../core/math';
import type { Scene } from '../core/scene';
import { campaignMissions, missionById } from '../data/missions';
import { PLANES } from '../data/planes';
import { THEATERS } from '../data/theaters';
import { enemyName, missionBriefing, missionName, objectiveText, theaterName } from '../i18n/content';
import { t } from '../i18n/i18n';
import type { CampaignId, MissionDef } from '../data/types';
import { SECONDARIES } from '../data/weapons';
import { doubleFirepower, jetGunLevel } from '../game/firepower';
import { campaignComplete, campaignStars, isCleared, isUnlocked, mapTwoOpen, nextMission, nextMissionOn } from '../game/progress';
import type { GameContext } from '../game/state';
import { COLORS, paragraph, text } from '../render/text';
import { drawPilotAvatar, pilotFace } from '../render/avatars';
import { drawButton, drawPanel, hit, type Button } from '../ui/widgets';
import { drawGlobe, drawGlobeLocked, GLOBE } from './map-globe';
import { drawMapBase, drawNode, drawRoute } from './map-render';

const PANEL = { x: 882, y: 76, w: 378, h: 628 };
/** The MENU button top right; BASE moved down next to LAUNCH and HANGAR (owner, 2026-10-28: one place). */
const MENU_BTN = { x: 1150, y: 14, w: 110, h: 44 };
/** Left edge of the callsign and money in the top bar; the avatar sits just left of it. */
const PILOT_X = 860;

export class MapScene implements Scene {
  private t = 0;
  private selected: MissionDef;
  private buttons: Button[] = [];
  /** Seconds left of the "opens after mission 30" note under the closed globe (doc 35). */
  private locked = 0;

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

  /** The globe: to map 2 once mission 30 is cleared, back to map 1 from map 2. */
  private switchMap(): void {
    if (this.campaign === 1 && !mapTwoOpen(this.game.save)) {
      this.locked = 2.2;
      this.game.audio.play('denied');
      return;
    }
    this.selected = nextMissionOn(this.game.save, this.campaign === 1 ? 2 : 1);
    this.game.audio.play('uiSelect');
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
    if (input.pressed('left') || input.pressed('up')) this.step(-1);
    if (input.pressed('right') || input.pressed('down')) this.step(1);
    for (const tap of input.taps) {
      const b = this.buttons.find((x) => x.enabled !== false && hit(tap, x));
      if (b) return this.activate(b.id);
      if (hit(tap, MENU_BTN)) return this.activate('title');
      if (hit(tap, GLOBE)) return this.switchMap();
      const node = this.missions.find((m) => Math.hypot(tap.x - m.map.x, tap.y - m.map.y) < 22);
      if (node) this.select(node);
    }
    if (input.pressed('confirm')) this.activate('launch');
    if (input.pressed('hangar')) this.activate('hangar');
    if (input.pressed('base')) this.activate('base');
    if (input.pressed('globe')) this.switchMap();
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
  }

  private renderTopBar(ctx: CanvasRenderingContext2D): void {
    const s = this.game.save;
    const c = this.campaign;
    text(ctx, t(c === 1 ? 'map.title' : 'map.title2'), 24, 46, { size: 26, display: true, italic: true, color: COLORS.ink, maxWidth: 430 });
    const done = this.missions.filter((m) => isCleared(s, m)).length;
    text(ctx, t('map.progress', { done, stars: campaignStars(s, c) }), 470, 44, { size: 15, color: COLORS.dim, maxWidth: GLOBE.x - 480 });
    drawGlobe(ctx, c, c === 2 || mapTwoOpen(s), this.t);
    if (this.locked > 0) drawGlobeLocked(ctx, this.locked);
    const pilot = this.game.profile;
    if (pilot) {
      drawPilotAvatar(ctx, pilotFace(pilot), { x: PILOT_X - 60, y: 8, w: 50, h: 60 }, { t: this.t, mood: 'happy' });
      text(ctx, pilot.callsign, PILOT_X, 32, { size: 17, display: true, color: COLORS.gold, maxWidth: MENU_BTN.x - PILOT_X - 12 });
    }
    text(ctx, formatMoney(s.money), PILOT_X, 60, { size: 20, display: true, color: COLORS.green, maxWidth: MENU_BTN.x - PILOT_X - 12 });
    drawButton(ctx, { id: 'title', label: t('map.menu'), ...MENU_BTN }, false, this.t);
    if (campaignComplete(s, c)) text(ctx, t(c === 1 ? 'map.campaignComplete' : 'map.campaign2Complete'), 470, 66, { size: 13, color: COLORS.gold, maxWidth: GLOBE.x - 480 });
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
    const threat = Math.ceil((((m.difficulty - 1) % 30) + 1) / 6); // 1–5 on each map (doc 35)
    text(ctx, t('map.threat'), x, PANEL.y + 128, { size: 11, color: COLORS.dim, letterSpacing: 1.5 });
    text(ctx, '▲'.repeat(threat) + '△'.repeat(5 - threat), x + 70, PANEL.y + 129, { size: 14, color: m.campaign === 2 ? '#c27bff' : COLORS.red });
    const cleared = isCleared(s, m);
    text(ctx, t('map.reward'), x + 180, PANEL.y + 128, { size: 11, color: COLORS.dim, letterSpacing: 1.5 });
    text(ctx, formatMoney(cleared ? m.reward * 0.5 : m.reward) + (cleared ? `  ${t('map.replay')}` : ''), x + 244, PANEL.y + 129, { size: 14, color: COLORS.green, maxWidth: PANEL.w - 264 });
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
    text(ctx, t('map.yourJet'), x, y, { size: 11, color: COLORS.dim, letterSpacing: 1.5 });
    const level = s.gun2Level > 0 && doubleFirepower(s.selectedPlane) ? `${jetGunLevel(s.selectedPlane, s.gunLevel)} + ${s.gun2Level}` : String(jetGunLevel(s.selectedPlane, s.gunLevel));
    text(ctx, t('map.gunLevel', { plane: PLANES[s.selectedPlane].name, level }), x, y + 22, { size: 15, color: COLORS.ink, maxWidth: PANEL.w - 40 });
    text(ctx, weapons, x, y + 44, { size: 13, color: COLORS.dim, maxWidth: PANEL.w - 40 });
    // Challenge level / Rookie (doc 38), small under the jet.
    const tag = s.rookie ? t('pilots.rookie') : s.challenge.level > 0 ? t('map.challenge', { level: s.challenge.level }) : '';
    if (tag) text(ctx, tag, x, y + 70, { size: 13, display: true, color: s.rookie ? COLORS.green : COLORS.gold });
  }
}
