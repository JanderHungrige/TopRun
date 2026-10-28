import type { AudioEngine } from '../../core/audio';
import type { Input } from '../../core/input';
import { wingmanLine, wingmanStart, type WingmanEvent } from '../../game/dialogue-scripts';
import { objectiveMet } from '../../game/objectives';
import type { Params } from '../../i18n/i18n';
import { SpeechBox } from '../../ui/speech';
import type { Player } from './player';
import { PF_X, type World } from './world';

const START_DELAY = 1.2;
const HULL_LOW = 0.3;

/** Lt. "Duke" Carter on the radio: calls out mission events once each (doc 06). */
export class WingmanRadio {
  private readonly box: SpeechBox;
  private readonly said = new Set<WingmanEvent | 'start'>();

  constructor(audio: AudioEngine, context: () => Params) {
    this.box = new SpeechBox(audio, {
      portrait: { x: PF_X + 10, y: 10, w: 66, h: 80 },
      bubble: { x: PF_X + 84, y: 14, w: 546, h: 72 },
      fontSize: 15, style: 'radio', persistent: false,
    }, 'wingman', context);
  }

  private once(ev: WingmanEvent, interrupt = false): void {
    if (this.said.has(ev)) return;
    this.said.add(ev);
    this.box.say(wingmanLine(ev), interrupt);
  }

  bossWarning(boss: string): void {
    this.said.add('bossWarning');
    this.box.say(wingmanLine('bossWarning', { boss }), true);
  }

  special(): void {
    this.box.say(wingmanLine('special'), true);
  }

  victory(): void {
    this.once('victory', true);
  }

  update(dt: number, world: World, p: Player, input: Input): void {
    const m = world.mission;
    if (!this.said.has('start') && world.t >= START_DELAY) {
      this.said.add('start');
      this.box.say(wingmanStart(m.objective));
    }
    if (m.objective.type !== 'boss' && world.t >= m.length / 2) this.once('halfway');
    const strikeOrIntercept = m.objective.type === 'strike' || m.objective.type === 'intercept';
    if (strikeOrIntercept && p.alive && objectiveMet(m.objective, world.tally, true)) this.once('objectiveDone', true);
    if (p.alive && p.hullRatio < HULL_LOW) this.once('hullLow', true);
    if (world.jammed) this.once('jammer', true);
    if (world.enemies.some((e) => e.def.stealth && !e.dead && e.y > 40)) this.once('stealth');
    this.box.update(dt, input);
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.box.render(ctx);
  }
}
