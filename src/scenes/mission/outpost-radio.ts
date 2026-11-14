import type { AudioEngine } from '../../core/audio';
import type { Input } from '../../core/input';
import { ortegaLine } from '../../game/dialogue-scripts';
import type { Params } from '../../i18n/i18n';
import type { LineKey } from '../../i18n/lines-en';
import { SpeechBox } from '../../ui/speech';
import type { DefenceEvent } from './defence-mission';
import type { Player } from './player';
import type { Radio } from './radio';
import { PF_X, type World } from './world';

const START_DELAY = 1.2;

// Captain Rosa "Bastion" Ortega on the radio in a defence (doc 106): the start, every wave, the last one, the wall under
// fire, the boss, a held outpost. Takes the wingman's place on the radio for the sortie.

export class OutpostRadio implements Radio {
  private readonly box: SpeechBox;
  private started = false;

  constructor(audio: AudioEngine, context: () => Params) {
    this.box = new SpeechBox(audio, {
      portrait: { x: PF_X + 10, y: 10, w: 66, h: 80 },
      bubble: { x: PF_X + 84, y: 14, w: 546, h: 72 },
      fontSize: 15, style: 'radio', persistent: false,
    }, 'ortega', context);
  }

  private say(key: LineKey, params?: Params, interrupt = false): void {
    this.box.say(ortegaLine(key, params), interrupt);
  }

  bossWarning(boss: string): void {
    this.say('ort.boss', { boss }, true);
  }

  special(): void {
    this.say('ort.special');
  }

  victory(): void {
    this.say('ort.victory', undefined, true);
  }

  /** A defence event worth a word: the waves, the wall, the outpost. */
  event(ev: DefenceEvent, wave: number, total: number): void {
    switch (ev) {
      case 'wave': if (wave < total) this.say('ort.wave', { n: wave, total }); return;
      case 'lastWave': this.say('ort.lastWave', undefined, true); return;
      case 'held': if (wave < total) this.say('ort.held'); return;
      case 'half': this.say('ort.half', undefined, true); return;
      case 'quarter': this.say('ort.quarter', undefined, true); return;
      case 'boss': case 'leak': case 'lost': return;
      default: throw new Error(`unhandled: ${ev satisfies never}`);
    }
  }

  update(dt: number, world: World, _p: Player, input: Input): void {
    if (!this.started && world.t >= START_DELAY) {
      this.started = true;
      this.say('ort.start');
    }
    this.box.update(dt, input);
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.box.render(ctx);
  }
}
