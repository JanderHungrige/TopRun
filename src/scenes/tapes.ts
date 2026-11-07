import type { Scene } from '../core/scene';
import type { CampaignId } from '../data/types';
import { tapeShelf, type Tape } from '../game/tapes';
import type { GameContext } from '../game/state';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { drawPlate, preloadWorld } from '../render/celebration';
import { BACK_BTN, backButton } from '../render/rooms-chrome';
import { COLORS, text } from '../render/text';
import { hit, type Rect } from '../ui/widgets';

// The hangar TV's tape shelf (doc 63): an old TV showing the picked world, five VHS tapes beside it (doc 72) — a finished
// world's tape plays its celebration (doc 64), a blank one is "not recorded yet". ↑/↓ or ←/→ pick, ENTER / tap plays,
// ESC or the BACK button back to the hangar base.

const WORLD_NAME: Readonly<Record<CampaignId, UiKey>> = { 1: 'map.title', 2: 'map.title2', 3: 'map.title3', 4: 'map.title4', 5: 'map.title5' };
const SLEEVE: Readonly<Record<CampaignId, string>> = { 1: '#b8202a', 2: '#5b2a86', 3: '#3a4a2a', 4: '#0a1630', 5: '#0b5a66' };
const SCREEN: Rect = { x: 160, y: 168, w: 400, h: 225 };

const tapeRect = (i: number, picked: boolean): Rect => ({ x: picked ? 676 : 700, y: 122 + i * 96, w: 470, h: 80 });

export class TapesScene implements Scene {
  private time = 0;
  private pick: number;
  private hoverBack = false;
  private readonly tapes: Tape[];

  constructor(private readonly game: GameContext) {
    this.tapes = tapeShelf(game.save);
    const first = this.tapes.findIndex((tp) => tp.finished);
    this.pick = Math.max(0, first);
    for (const tp of this.tapes) if (tp.finished) preloadWorld(tp.world);
  }

  enter(): void {
    this.game.music.play('menu');
  }

  update(dt: number): void {
    this.time += dt;
    const input = this.game.input;
    this.hoverBack = input.device !== 'touch' && hit(input.pointer, BACK_BTN);
    if (input.pressed('back') || input.taps.some((p) => hit(p, BACK_BTN))) {
      this.game.audio.play('uiBack');
      this.game.go({ to: 'base' });
      return;
    }
    if (input.pressed('up') || input.pressed('left')) this.move(-1);
    if (input.pressed('down') || input.pressed('right')) this.move(1);
    for (const p of input.taps) {
      const i = this.tapes.findIndex((_, k) => hit(p, tapeRect(k, k === this.pick)));
      if (i < 0) continue;
      if (i === this.pick) return this.play();
      this.pick = i;
      this.game.audio.play('uiMove');
    }
    if (input.pressed('confirm')) this.play();
  }

  private move(d: number): void {
    const next = Math.max(0, Math.min(this.tapes.length - 1, this.pick + d));
    if (next !== this.pick) this.game.audio.play('uiMove');
    this.pick = next;
  }

  private play(): void {
    const tape = this.tapes[this.pick];
    if (!tape?.finished) return this.game.audio.play('denied');
    this.game.audio.play('uiSelect');
    this.game.go({ to: 'celebration', world: tape.world, then: { to: 'tapes' } });
  }

  private drawTv(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#6e4527';
    ctx.beginPath();
    ctx.roundRect(120, 128, 560, 310, 18);
    ctx.fill();
    ctx.fillStyle = '#4f301a';
    for (let y = 140; y < 430; y += 14) ctx.fillRect(126, y, 548, 2);
    ctx.fillStyle = '#120b14';
    ctx.fillRect(SCREEN.x - 8, SCREEN.y - 8, SCREEN.w + 16, SCREEN.h + 16);
    const tape = this.tapes[this.pick];
    if (!tape?.finished || !drawPlate(ctx, tape.world, 0, 1, SCREEN)) this.snow(ctx);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let y = SCREEN.y; y < SCREEN.y + SCREEN.h; y += 4) ctx.fillRect(SCREEN.x, y, SCREEN.w, 1);
    for (const dy of [196, 260]) {
      ctx.fillStyle = '#2a3036';
      ctx.beginPath();
      ctx.arc(620, dy, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#120b14';
    ctx.fillRect(140, 446, 520, 30);
    ctx.fillStyle = Math.floor(this.time * 2) % 2 === 0 ? '#80d890' : '#1a4a28';
    ctx.fillRect(560, 456, 40, 8);
  }

  private snow(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#1a2c66';
    ctx.fillRect(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h);
    for (let i = 0; i < 600; i++) {
      const v = Math.sin((i + Math.floor(this.time * 20) * 31) * 12.9898) * 43758.5453;
      const k = v - Math.floor(v);
      ctx.fillStyle = k > 0.5 ? '#c2c8d6' : '#43588f';
      ctx.fillRect(SCREEN.x + Math.floor(k * SCREEN.w), SCREEN.y + Math.floor(((k * 997) % 1) * SCREEN.h), 4, 4);
    }
  }

  private drawTape(ctx: CanvasRenderingContext2D, tape: Tape, i: number): void {
    const on = i === this.pick;
    const r = tapeRect(i, on);
    ctx.fillStyle = tape.finished ? SLEEVE[tape.world] : '#3a3f48';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = tape.finished ? '#f0efea' : '#8a90aa';
    ctx.fillRect(r.x + 120, r.y + 14, r.w - 140, r.h - 28);
    ctx.fillStyle = '#120b14';
    ctx.fillRect(r.x + 16, r.y + 16, 88, 48);
    for (const cx of [r.x + 38, r.x + 82]) {
      ctx.fillStyle = '#f0efea';
      ctx.beginPath();
      ctx.arc(cx, r.y + 40, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    const ink = tape.finished ? '#120b14' : '#3a3f48';
    text(ctx, t('tapes.world', { n: tape.world }), r.x + 136, r.y + 35, { size: 20, display: true, color: ink, maxWidth: r.w - 170 });
    const sub = tape.finished ? t(WORLD_NAME[tape.world]) : t('tapes.blank');
    text(ctx, sub, r.x + 136, r.y + 58, { size: 15, color: ink, maxWidth: r.w - 170 });
    if (on) {
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 4;
      ctx.strokeRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#0e1016';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = '#3e2614';
    ctx.fillRect(0, 590, 1280, 130);
    text(ctx, t('tapes.title'), 640, 72, { size: 34, display: true, italic: true, align: 'center', color: COLORS.gold });
    this.drawTv(ctx);
    this.tapes.forEach((tape, i) => this.drawTape(ctx, tape, i));
    text(ctx, t('tapes.keys'), 640, 680, { size: 15, align: 'center', color: COLORS.dim });
    backButton(ctx, this.hoverBack);
  }
}
