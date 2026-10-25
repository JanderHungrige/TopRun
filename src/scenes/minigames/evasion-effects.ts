import type { AudioEngine } from '../../core/audio';
import { clamp } from '../../core/math';
import { headingTo } from '../../game/combat';
import { EVASION_RULES, type EvadeHow, type EvasionEvent, type EvasionState } from '../../game/minigames/evasion';
import { mt } from '../../i18n/minigame-text';
import { EVASION_TEXT, type EvasionKey } from '../../i18n/minigames/evasion';
import { POPUP_LIFE, type Popup } from '../../render/minigames/evasion-hud';
import { Trails } from '../../render/minigames/evasion-ordnance';
import { Launchers } from '../../render/minigames/evasion-world';
import { Particles } from '../../render/particles';
import { COLORS } from '../../render/text';

// Missile Evasion (doc 16): turns the rules' events into sounds, particles, pop-ups and launchers.
// Visual and audible only — nothing here decides an outcome.

const EVADED: Readonly<Record<EvadeHow, { key: EvasionKey; color: string }>> = {
  decoyed: { key: 'decoyed', color: COLORS.green },
  overshoot: { key: 'overshoot', color: COLORS.cyan },
  burnout: { key: 'burnout', color: COLORS.gold },
};

export class EvasionEffects {
  readonly fx = new Particles();
  readonly trails = new Trails();
  readonly launchers = new Launchers();
  popups: Popup[] = [];
  shake = 0;
  hitFlash = 0;
  launchFlash = 0;
  wave = 0;
  waveAge = 99;
  private smokeAcc = 0;
  private streak = 0;

  constructor(private readonly audio: AudioEngine) {}

  private popup(key: EvasionKey, color: string, x: number, y: number, size = 17): void {
    this.popups.push({ text: mt(EVASION_TEXT, key), color, x, y: y - 26, age: 0, size });
  }

  /** Reacts to the events of the last rules step. */
  handle(s: EvasionState, t: number): void {
    for (const e of s.events) this.event(e, s, t);
  }

  private event(e: EvasionEvent, s: EvasionState, t: number): void {
    const a = this.audio;
    const pan = (x: number): number => clamp((x - s.jet.x) / 700, -1, 1);
    switch (e.type) {
      case 'wave':
        this.wave = e.wave;
        this.waveAge = 0;
        return a.play('radioClick', { volume: 0.7 });
      case 'warn':
        this.launchFlash = 1.4;
        return a.play('warning', { volume: 0.5, pan: pan(e.x) });
      case 'launch':
        this.launchers.add(e.kind, e.x, e.y, headingTo(e.x, e.y, s.jet.x, s.jet.y), t, e.id % 2 === 0 ? 1 : -1);
        for (let i = 0; i < 5; i++) this.fx.smoke(e.x, e.y, 10);
        return a.play('enemyMissile', { pan: pan(e.x), volume: 0.8 });
      case 'flare':
        this.fx.sparks(e.x, e.y, 10, '#ffe2a0', 160);
        return a.play('flare');
      case 'break': return a.play('special', { volume: 0.7 });
      case 'evaded': return this.evaded(e.how, e.x, e.y, pan(e.x));
      case 'resisted':
        this.popup('resisted', COLORS.red, e.x, e.y, 14);
        return a.play('denied', { volume: 0.3 });
      case 'hit': return this.hit(e.x, e.y, e.damage);
      case 'pop':
        if (!e.blast) return this.fx.smoke(e.x, e.y, 7);
        this.fx.explosion(e.x, e.y, 'small');
        return a.play('explosionSmall', { volume: 0.4, pan: pan(e.x) });
      case 'over':
        if (e.reason === 'time') return a.play('powerup');
        this.fx.explosion(s.jet.x, s.jet.y, 'huge');
        this.shake = 18;
        return a.play('explosionHuge');
      default: throw new Error(`unhandled: ${e satisfies never}`);
    }
  }

  private evaded(how: EvadeHow, x: number, y: number, pan: number): void {
    const look = EVADED[how];
    this.popup(look.key, look.color, x, y);
    this.streak++;
    this.audio.play('pickup', { volume: 0.55, pan, pitch: 1 + Math.min(8, this.streak) * 0.04 });
  }

  private hit(x: number, y: number, damage: boolean): void {
    this.fx.explosion(x, y, damage ? 'large' : 'small');
    if (!damage) return this.audio.play('explosionSmall', { volume: 0.6 });
    this.shake = 12;
    this.hitFlash = 1;
    this.streak = 0;
    this.popup('hit', COLORS.red, x, y, 22);
    this.audio.play('playerHit');
    this.audio.play('explosionLarge', { volume: 0.7 });
  }

  /** Per tick: particles, trails, pop-ups, damage smoke, flare sparks. */
  step(dt: number, s: EvasionState, t: number): void {
    this.fx.update(dt);
    this.trails.update(s.missiles, t, dt);
    for (const p of this.popups) p.age += dt;
    this.popups = this.popups.filter((p) => p.age < POPUP_LIFE);
    this.shake = Math.max(0, this.shake - dt * 30);
    this.hitFlash = Math.max(0, this.hitFlash - dt * 2.5);
    this.launchFlash = Math.max(0, this.launchFlash - dt);
    this.waveAge += dt;
    for (const f of s.flares) if (Math.random() < 0.35) this.fx.trail(f.x, f.y, 'rgba(255,236,200,1)');
    if (s.over === 'down' || s.hull >= EVASION_RULES.hull) return;
    const j = s.jet;
    this.smokeAcc += dt * (EVASION_RULES.hull - s.hull) * 16;
    for (; this.smokeAcc >= 1; this.smokeAcc--) {
      const bx = j.x - Math.sin(j.heading) * 22;
      const by = j.y + Math.cos(j.heading) * 22;
      this.fx.smoke(bx, by, s.hull === 1 ? 7 : 5);
      if (s.hull === 1 && Math.random() < 0.4) this.fx.add({ kind: 'fire', x: bx, y: by, max: 0.3, size: 4, grow: 6, color: '#ff8a2a' });
    }
  }
}
