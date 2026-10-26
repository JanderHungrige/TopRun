import type { Scene } from '../core/scene';
import { cardFileName, embedPilotCode, isPng, readPilotCode } from '../game/pilot-card';
import { decodePilotCode, encodePilotCode, type DecodeResult } from '../game/pilot-code';
import { profileSummary, type Profile } from '../game/profiles';
import type { GameContext } from '../game/state';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { pilotCardPng } from '../render/pilot-card';
import { copyText, downloadFile, pickFile } from '../ui/file-io';
import { TextArea } from '../ui/text-area';
import { hit } from '../ui/widgets';
import { pilotCardData } from './pilot-card-data';
import {
  BACKUP_BOX, CONFIRM_BUTTONS, drawPilotCode, MAIN_BUTTONS, RESTORE_BOX, type CodeButtonId, type CodeStatus,
} from './pilot-code-render';

/** An ID card is ~100 KB (a phone may re-save it bigger); anything far beyond is not one. */
const MAX_FILE = 4 * 1024 * 1024;

const DECODE_ERROR: Readonly<Record<Exclude<DecodeResult, { ok: true }>['reason'], UiKey>> = {
  'no-code': 'code.noCode', checksum: 'code.checksum', corrupt: 'code.corrupt', invalid: 'code.invalid',
};

const progressText = (p: Profile): string => {
  const s = profileSummary(p);
  return t('map.progress', { done: s.cleared, stars: s.stars });
};

/** PILOT CODE (doc 08): back up a pilot as a line of text or an ID card picture, restore one on this device. */
export class PilotCodeScene implements Scene {
  private time = 0;
  private sel = 0;
  private code = '';
  /** Guards against a slow encode of a pilot that is no longer selected. */
  private encodeToken = 0;
  private status: CodeStatus | null = null;
  private pending: Profile | null = null;
  private busy = false;
  private readonly backupBox: TextArea;
  private readonly restoreBox: TextArea;

  constructor(private readonly game: GameContext, private readonly from: 'pilots' | 'newPilot') {
    const { host, viewport } = game.dom;
    this.backupBox = new TextArea(host, viewport, BACKUP_BOX, { label: t('code.backup'), readOnly: true });
    this.restoreBox = new TextArea(host, viewport, RESTORE_BOX, { label: t('code.restore'), placeholder: t('code.placeholder'), maxLength: 20_000 });
  }

  enter(): void {
    this.game.music.play('menu');
    this.backupBox.mount();
    this.restoreBox.mount();
    this.refreshCode();
  }

  exit(): void {
    this.backupBox.unmount();
    this.restoreBox.unmount();
  }

  private get pilot(): Profile | null {
    return this.game.profiles[this.sel] ?? null;
  }

  private refreshCode(): void {
    const p = this.pilot;
    const token = ++this.encodeToken;
    this.code = '';
    this.backupBox.value = '';
    if (!p) return;
    void encodePilotCode(p).then((code) => {
      if (token !== this.encodeToken) return;
      this.code = code;
      this.backupBox.value = code;
    });
  }

  private choose(d: number): void {
    const n = this.game.profiles.length;
    if (n < 2) return;
    this.sel = (((this.sel + d) % n) + n) % n;
    this.game.audio.play('uiMove');
    this.refreshCode();
  }

  private say(side: CodeStatus['side'], key: UiKey, error: boolean, params?: Record<string, string>): void {
    this.status = { key, error, params, side };
    this.game.audio.play(error ? 'denied' : 'uiSelect');
  }

  private copy(): void {
    if (!this.code) return;
    void copyText(this.code).then((ok) => {
      if (ok) return this.say('backup', 'code.copied', false);
      this.backupBox.selectAll();
      this.say('backup', 'code.copyManual', false);
    });
  }

  /** SAVE CARD: draws the pilot ID card, puts the code inside the PNG and downloads it. */
  private saveCard(): void {
    const p = this.pilot;
    const code = this.code;
    if (!p || !code || this.busy) return;
    this.busy = true;
    this.status = { key: 'code.making', error: false, side: 'backup' };
    void pilotCardPng(pilotCardData(p)).then((png) => {
      this.busy = false;
      const card = png && embedPilotCode(png, code);
      if (!card) return this.say('backup', 'code.cardFailed', true);
      const name = cardFileName(p.callsign);
      downloadFile(name, card, 'image/png');
      this.say('backup', 'code.savedCard', false, { file: name });
    });
  }

  private load(textIn: string): void {
    if (this.busy) return;
    this.busy = true;
    this.status = { key: 'code.reading', error: false, side: 'restore' };
    void decodePilotCode(textIn).then((r) => {
      this.busy = false;
      if (!r.ok) return this.say('restore', DECODE_ERROR[r.reason], true);
      this.status = null;
      if (this.game.profiles.some((x) => x.id === r.profile.id)) {
        this.pending = r.profile;
        this.game.audio.play('warning');
        return;
      }
      this.restore(r.profile);
    });
  }

  /** OPEN FILE: an ID card (the code inside the PNG) or a text file with a code in it. */
  private open(): void {
    pickFile('image/png,.png,text/plain,.txt', MAX_FILE, (result) => {
      if (result === 'too-big') return this.say('restore', 'code.fileTooBig', true);
      const code = isPng(result) ? readPilotCode(result) : new TextDecoder().decode(result);
      if (code === null) return this.say('restore', 'code.noCardCode', true);
      this.restoreBox.value = code;
      this.load(code);
    });
  }

  private restore(p: Profile): void {
    this.pending = null;
    const r = this.game.importProfile(p);
    if (!r.ok) return this.say('restore', r.reason === 'full' ? 'code.full' : 'code.taken', true, { callsign: p.callsign });
    this.game.audio.play('buy');
    this.game.go({ to: 'pilots' });
  }

  private leave(): void {
    this.game.audio.play('uiBack');
    this.game.go({ to: this.from === 'newPilot' || this.game.profiles.length === 0 ? 'newPilot' : 'pilots' });
  }

  private press(id: CodeButtonId): void {
    switch (id) {
      case 'prev': return this.choose(-1);
      case 'next': return this.choose(1);
      case 'copy': return this.copy();
      case 'card': return this.saveCard();
      case 'load': return this.load(this.restoreBox.value);
      case 'open': return this.open();
      case 'back': return this.leave();
      case 'replace': return this.pending ? this.restore(this.pending) : undefined;
      case 'cancel':
        this.pending = null;
        return this.game.audio.play('uiBack');
      default: throw new Error(`unhandled: ${id satisfies never}`);
    }
  }

  update(dt: number): void {
    this.time += dt;
    const input = this.game.input;
    const buttons = this.pending ? CONFIRM_BUTTONS : MAIN_BUTTONS;
    for (const tap of input.taps) {
      const b = buttons.find((x) => hit(tap, x));
      if (b) return this.press(b.id);
    }
    if (this.pending) {
      if (input.pressed('confirm')) return this.press('replace');
      if (input.pressed('back')) return this.press('cancel');
      return;
    }
    if (input.pressed('left')) this.choose(-1);
    if (input.pressed('right')) this.choose(1);
    if (input.pressed('back')) this.leave();
  }

  render(ctx: CanvasRenderingContext2D): void {
    const p = this.pilot;
    const pending = this.pending;
    // The DOM boxes sit above the canvas: hidden while the confirm is open (and with no pilot to back up).
    this.backupBox.visible = p !== null && !pending;
    this.restoreBox.visible = !pending;
    this.backupBox.layout();
    this.restoreBox.layout();
    const here = pending ? this.game.profiles.find((x) => x.id === pending.id) : undefined;
    drawPilotCode(ctx, {
      t: this.time,
      callsign: p?.callsign ?? null,
      pilots: this.game.profiles.length,
      status: this.status,
      confirm: pending ? { callsign: pending.callsign, here: here ? progressText(here) : '', code: progressText(pending) } : null,
    });
  }
}
