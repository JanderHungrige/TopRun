import type { AudioEngine } from '../../core/audio';
import type { PointReason, VbEvent, VbState } from '../../game/minigames/volleyball';
import type { HitKind } from '../../game/minigames/volleyball-hit';
import type { Team } from '../../game/minigames/volleyball-score';
import type { Params } from '../../i18n/i18n';
import { mt } from '../../i18n/minigame-text';
import { VB_TEXT, type VbKey } from '../../i18n/minigames/volleyball';
import { GROUND_Y, NET_X, sx, sy, type Puff } from '../../render/minigames/volleyball-court';
import { POPUP_LIFE, TEAM_COLOR, type Banner, type Popup } from '../../render/minigames/volleyball-hud';
import { COLORS } from '../../render/text';

// Beach Volleyball (doc 21): what the rules' events look and sound like — hit sounds, quality pop-ups, sand
// puffs, the point banner, the crowd's cheer. Existing SFX only.

export const tx = (k: VbKey, p?: Params): string => mt(VB_TEXT, k, p);

const REASON: Readonly<Record<PointReason, VbKey>> = {
  kill: 'kill', ace: 'ace', block: 'blocked', out: 'out', net: 'net', fault: 'fault', drop: 'down',
};
const BANNER_LIFE = 1.7;
const pan = (x: number): number => Math.max(-0.8, Math.min(0.8, x / 8));

export class VolleyFx {
  puffs: Puff[] = [];
  popups: Popup[] = [];
  banner: Banner | null = null;
  cheer = 0;

  constructor(private readonly audio: AudioEngine) {}

  onEvents(events: readonly VbEvent[], s: VbState): void {
    for (const e of events) this.on(e, s);
  }

  private on(e: VbEvent, s: VbState): void {
    const a = this.audio;
    switch (e.type) {
      case 'serve': a.play('uiSelect', { pitch: 1.9, volume: 0.3 }); this.banner = null; return;
      case 'toss': a.play('uiMove', { pitch: 1.3, volume: 0.2, pan: pan(s.ball.x) }); return;
      case 'catch': a.play('uiMove', { pitch: 0.8, volume: 0.25 }); return;
      case 'swing': return;
      case 'hit': return this.onHit(e.kind, e.who === 'you' ? e.quality : null, e.x, s);
      case 'jump': a.play('uiMove', { pitch: 1.8, volume: 0.12, pan: pan(e.x) }); return this.puff(e.x, 4, 0.6);
      case 'land': return this.puff(e.x, 5, 0.7);
      case 'dive': a.play('splash', { volume: 0.22, pitch: 1.4, pan: pan(e.x) }); return this.puff(e.x, 10, 1.2);
      case 'net': a.play('flare', { pitch: 0.45, volume: 0.3 }); return;
      case 'block':
        a.play('special', { volume: 0.45 });
        return this.popup(tx(e.stuff ? 'stuffed' : 'blocked'), COLORS.gold, NET_X, sy(e.y) - 30, 26);
      case 'bounce': a.play('hit', { pitch: 0.35, volume: 0.45, pan: pan(e.x) }); return this.puff(e.x, 14, 1.6);
      case 'point': return this.onPoint(e.team, e.reason);
      case 'over': return this.onOver(e.winner, s);
      default: throw new Error(`unhandled: ${e satisfies never}`);
    }
  }

  private onHit(kind: HitKind, quality: number | null, x: number, s: VbState): void {
    const opts = { pan: pan(x) };
    switch (kind) {
      case 'spike': this.audio.play('hit', { ...opts, volume: 0.8 }); break;
      case 'serve': this.audio.play('hit', { ...opts, pitch: 0.8, volume: 0.6 }); break;
      case 'tip': this.audio.play('uiMove', { ...opts, pitch: 1.2, volume: 0.4 }); break;
      case 'set': this.audio.play('uiMove', { ...opts, pitch: 0.75, volume: 0.5 }); break;
      case 'pass':
      case 'dig':
      case 'lob': this.audio.play('uiMove', { ...opts, pitch: 0.55, volume: 0.55 }); break;
      case 'block': break;
      default: throw new Error(`unhandled: ${kind satisfies never}`);
    }
    if (quality === null || kind === 'serve') return;
    const you = s.athletes.you;
    const [key, color]: [VbKey, string] = quality >= 0.75 ? ['perfect', COLORS.gold] : quality >= 0.4 ? ['good', COLORS.green] : ['shank', COLORS.red];
    this.popup(tx(key), color, sx(you.x), sy(you.y) - 178, 20);
  }

  private onPoint(team: Team, reason: PointReason): void {
    this.audio.play(team === 'home' ? 'pickup' : 'denied', { volume: 0.6 });
    this.cheer = team === 'home' ? 1 : 0.6;
    this.banner = { title: tx(REASON[reason]), sub: tx(team === 'home' ? 'pointUs' : 'pointThem'), color: TEAM_COLOR[team], age: 0, big: false };
  }

  private onOver(winner: Team, s: VbState): void {
    this.audio.play(winner === 'home' ? 'powerup' : 'denied');
    this.cheer = winner === 'home' ? 1 : 0.4;
    const st = tx('stats', { kills: s.stats.kills, aces: s.stats.aces, blocks: s.stats.blocks });
    this.banner = {
      title: tx(winner === 'home' ? 'win' : 'lose'), sub: `${s.score.home} : ${s.score.away}   ·   ${st}`,
      color: winner === 'home' ? COLORS.gold : COLORS.red, age: 0, big: true,
    };
  }

  private popup(text: string, color: string, x: number, y: number, size: number): void {
    this.popups.push({ text, color, x, y, age: 0, size });
  }

  /** Sand kicked up at world x (metres). */
  puff(x: number, n: number, power: number): void {
    for (let i = 0; i < n; i++) {
      this.puffs.push({
        x: sx(x) + (Math.random() - 0.5) * 24, y: GROUND_Y - 2, vx: (Math.random() - 0.5) * 120 * power,
        vy: -(30 + Math.random() * 70) * power, age: 0, life: 0.35 + Math.random() * 0.4, size: Math.random() < 0.5 ? 2 : 4,
      });
    }
  }

  update(dt: number): void {
    this.cheer = Math.max(0, this.cheer - dt * 0.55);
    for (const p of this.puffs) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
      p.age += dt;
    }
    this.puffs = this.puffs.filter((p) => p.age < p.life);
    for (const p of this.popups) p.age += dt;
    this.popups = this.popups.filter((p) => p.age < POPUP_LIFE);
    if (this.banner) {
      this.banner.age += dt;
      if (!this.banner.big && this.banner.age > BANNER_LIFE) this.banner = null;
    }
  }
}
