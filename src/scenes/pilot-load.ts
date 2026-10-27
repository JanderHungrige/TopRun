import { fetchCloudSave, findCloudPilots } from '../core/ladder-api';
import type { Scene } from '../core/scene';
import { CALLSIGN_MAX, filterCallsignInput, validateCallsign } from '../game/callsign';
import type { PilotMatch } from '../game/ladder-cloud';
import type { GameContext } from '../game/state';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { drawSunset } from '../render/backdrop';
import { drawHonour, drawMatchRow } from '../render/pilot-load';
import { COLORS, text } from '../render/text';
import { TextField } from '../ui/text-field';
import { drawButton, drawPanel, hit, type Button, type Rect } from '../ui/widgets';

type Phase = 'idle' | 'searching' | 'results' | 'none' | 'offline' | 'loading' | 'error';

const FIELD: Rect = { x: 390, y: 140, w: 360, h: 54 };
const SEARCH: Button = { id: 'search', label: '', x: 770, y: 140, w: 160, h: 54, primary: true };
const BACK: Button = { id: 'back', label: '', x: 540, y: 640, w: 200, h: 46 };
const ROWS = 5;
const rowRect = (i: number): Rect => ({ x: 300, y: 248 + i * 76, w: 680, h: 68 });
const PANEL: Rect = { x: 320, y: 150, w: 640, h: 400 };
const YES: Button = { id: 'yes', label: '', x: 380, y: 466, w: 300, h: 52, primary: true };
const NO: Button = { id: 'no', label: '', x: 700, y: 466, w: 200, h: 52 };

/** LOAD PILOT (doc 34): find a pilot by callsign, confirm on the pilot's honour, bring it to this device. */
export class PilotLoadScene implements Scene {
  private time = 0;
  private phase: Phase = 'idle';
  private matches: PilotMatch[] = [];
  private focus = 0;
  private confirm: PilotMatch | null = null;
  private searched = '';
  private error: { key: UiKey; callsign: string } | null = null;
  private gone = false;
  private readonly field: TextField;

  constructor(private readonly game: GameContext, private readonly from: 'pilots' | 'newPilot') {
    this.field = new TextField(game.dom.host, game.dom.viewport, FIELD, {
      maxLength: CALLSIGN_MAX, placeholder: t('newPilot.placeholder'), label: t('newPilot.callsign'),
      filter: filterCallsignInput,
      onEnter: () => this.enterKey(),
      onEscape: () => this.back(),
      onArrow: () => undefined,
      onUpDown: (d) => this.move(d),
    });
  }

  enter(): void {
    this.game.music.play('menu');
    this.field.mount();
  }

  exit(): void {
    this.gone = true;
    this.field.unmount();
  }

  private get busy(): boolean {
    return this.phase === 'searching' || this.phase === 'loading';
  }

  private enterKey(): void {
    if (this.confirm) return void this.load(this.confirm);
    const m = this.matches[this.focus];
    if (this.phase === 'results' && m && this.field.value === this.searched) return this.choose(m);
    void this.search();
  }

  private move(d: number): void {
    if (this.phase !== 'results' || this.confirm) return;
    const n = Math.min(ROWS, this.matches.length);
    this.focus = (((this.focus + d) % n) + n) % n;
    this.game.audio.play('uiMove');
  }

  private async search(): Promise<void> {
    const callsign = this.field.value;
    if (this.busy || validateCallsign(callsign, []) !== 'ok') return this.game.audio.play('denied');
    this.game.audio.play('uiSelect');
    this.phase = 'searching';
    this.searched = callsign;
    const found = await findCloudPilots(callsign);
    if (this.gone) return;
    this.matches = found ?? [];
    this.focus = 0;
    this.phase = found === null ? 'offline' : found.length === 0 ? 'none' : 'results';
  }

  private choose(m: PilotMatch): void {
    this.confirm = m;
    this.field.unmount(); // the DOM field would sit on top of the honour check
    this.game.audio.play('warning');
  }

  private closeConfirm(): void {
    this.confirm = null;
    this.field.mount();
    this.game.audio.play('uiBack');
  }

  private async load(m: PilotMatch): Promise<void> {
    if (this.busy) return;
    this.phase = 'loading';
    const save = await fetchCloudSave(m.ref);
    if (this.gone) return;
    const r = save ? this.game.loadCloudPilot(m, save) : null;
    if (r?.ok) {
      this.game.audio.play('buy');
      return this.game.go({ to: 'map' });
    }
    this.confirm = null;
    this.field.mount();
    this.phase = 'error';
    this.error = { key: !r ? 'cloud.failed' : r.reason === 'full' ? 'cloud.full' : 'cloud.taken', callsign: m.callsign };
    this.game.audio.play('denied');
  }

  private back(): void {
    if (this.confirm) return this.closeConfirm();
    this.game.audio.play('uiBack');
    this.game.go({ to: this.from });
  }

  update(dt: number): void {
    this.time += dt;
    const input = this.game.input;
    if (this.confirm) return this.updateConfirm(this.confirm);
    for (const tap of input.taps) {
      if (hit(tap, BACK)) return this.back();
      if (hit(tap, SEARCH)) return void this.search();
      const i = this.matches.slice(0, ROWS).findIndex((_, k) => hit(tap, rowRect(k)));
      const m = this.matches[i];
      if (this.phase === 'results' && m) return this.choose(m);
    }
    if (input.pressed('up')) this.move(-1);
    if (input.pressed('down')) this.move(1);
    if (input.pressed('confirm')) this.enterKey();
    if (input.pressed('back')) this.back();
    if (input.device !== 'touch' && !this.field.focused) this.field.focus();
  }

  private updateConfirm(m: PilotMatch): void {
    const input = this.game.input;
    if (this.busy) return;
    if (input.taps.some((tap) => hit(tap, YES)) || input.pressed('confirm')) return void this.load(m);
    if (input.taps.some((tap) => hit(tap, NO)) || input.pressed('back')) this.closeConfirm();
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawSunset(ctx, this.time);
    ctx.fillStyle = 'rgba(4,8,16,0.6)';
    ctx.fillRect(0, 0, 1280, 720);
    text(ctx, t('cloud.title'), 640, 70, { size: 42, display: true, italic: true, align: 'center', color: COLORS.gold, stroke: '#000', strokeWidth: 6 });
    text(ctx, t('cloud.intro'), 640, 112, { size: 16, align: 'center', color: COLORS.dim, maxWidth: 900 });
    this.field.layout();
    drawPanel(ctx, FIELD, { fill: 'rgba(8,14,24,0.9)', edge: this.field.focused ? COLORS.gold : COLORS.panelEdge, radius: 10 });
    drawButton(ctx, { ...SEARCH, label: t('cloud.search'), enabled: !this.busy }, false, this.time);
    this.renderBody(ctx);
    drawButton(ctx, { ...BACK, label: t('newPilot.back') }, false, this.time);
    text(ctx, t('cloud.hint'), 640, 706, { size: 13, align: 'center', color: COLORS.faint });
    if (this.confirm) this.renderConfirm(ctx, this.confirm);
  }

  private renderBody(ctx: CanvasRenderingContext2D): void {
    const line = (s: string, color: string = COLORS.dim): void =>
      text(ctx, s, 640, 226, { size: 18, type: true, align: 'center', color, maxWidth: 900 });
    switch (this.phase) {
      case 'idle': return;
      case 'searching': return line(t('cloud.searching'));
      case 'loading': return line(t('cloud.loading'));
      case 'offline': return line(t('cloud.offline'), COLORS.red);
      case 'none':
        line(t('cloud.none', { callsign: this.searched }), COLORS.red);
        return void text(ctx, t('cloud.noneHint'), 640, 256, { size: 14, align: 'center', color: COLORS.faint, maxWidth: 900 });
      case 'error': return line(this.error ? t(this.error.key, { callsign: this.error.callsign }) : '', COLORS.red);
      case 'results':
        line(t('cloud.pick'), COLORS.gold);
        this.matches.slice(0, ROWS).forEach((m, i) => drawMatchRow(ctx, m, rowRect(i), i === this.focus, this.time + i));
        return;
      default: throw new Error(`unhandled: ${this.phase satisfies never}`);
    }
  }

  private renderConfirm(ctx: CanvasRenderingContext2D, m: PilotMatch): void {
    drawHonour(ctx, m, PANEL, this.time);
    drawButton(ctx, { ...YES, label: t('cloud.yes'), enabled: !this.busy }, true, this.time);
    drawButton(ctx, { ...NO, label: t('newPilot.back') }, false, this.time);
    if (this.phase === 'loading') text(ctx, t('cloud.loading'), 640, 540, { size: 15, type: true, align: 'center', color: COLORS.dim });
  }
}
