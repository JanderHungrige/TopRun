import type { AudioEngine } from '../core/audio';
import type { Input } from '../core/input';
import { formatMoney } from '../core/math';
import { PLANES } from '../data/planes';
import type { PlaneId } from '../data/types';
import { SECONDARIES } from '../data/weapons';
import { chiefLine } from '../game/dialogue-scripts';
import type { ShopItem } from '../game/economy';
import { newJetsWaiting } from '../game/jets';
import type { SaveData } from '../game/save';
import { equipmentName, secondaryName } from '../i18n/content';
import type { Params } from '../i18n/i18n';
import { SpeechBox } from '../ui/speech';
import type { ItemAction } from './hangar-items';

const IDLE_FIRST = 15;
const IDLE_REPEAT = 25;
const RICH = 20000;
const BROKE = 3000;

/** Chief "Wrench" Kowalski: comments on what the player does in the hangar (doc 06). */
export class HangarChief {
  private readonly box: SpeechBox;
  private idle = 0;
  private nextIdle = IDLE_FIRST;

  constructor(audio: AudioEngine, context: () => Params) {
    this.box = new SpeechBox(audio, {
      portrait: { x: 24, y: 548, w: 120, h: 150 },
      bubble: { x: 158, y: 556, w: 402, h: 134 },
      fontSize: 16, style: 'comic', persistent: true,
    }, 'chief', context);
  }

  greet(save: SaveData): void {
    const ev = newJetsWaiting(save) ? 'helloNewJets' : save.money >= RICH ? 'helloRich' : save.money < BROKE ? 'helloBroke' : 'hello';
    this.box.say(chiefLine(ev));
  }

  bought(item: ShopItem): void {
    switch (item.type) {
      case 'plane': return this.speak(chiefLine('buyPlane', { plane: PLANES[item.id].name }));
      case 'gun':
      case 'gun2': return this.speak(chiefLine('buyGun'));
      case 'secondary': return this.speak(chiefLine('buySecondary', { item: secondaryName(item.id) }));
      case 'equipment': return this.speak(chiefLine('buyEquipment', { item: equipmentName(item.id) }));
      case 'livery': return;
      default: throw new Error(`unhandled: ${item satisfies never}`);
    }
  }

  mounted(id: keyof typeof SECONDARIES): void {
    this.speak(chiefLine('mount', { item: SECONDARIES[id].short }));
  }

  painted(livery: string): void {
    this.speak(chiefLine('painted', { livery }));
  }

  unmounted(): void {
    this.speak(chiefLine('unmount'));
  }

  selected(plane: PlaneId): void {
    this.speak(chiefLine('select', { plane: PLANES[plane].name }));
  }

  refused(a: ItemAction): void {
    if (a.reason === 'funds') this.speak(chiefLine('denied', { amount: formatMoney(a.shortfall) }));
    if (a.reason === 'restricted') this.speak(chiefLine('restricted'));
  }

  /** Any player input resets the idle timer. */
  poke(): void {
    this.idle = 0;
  }

  update(dt: number, input: Input): void {
    this.idle += dt;
    if (!this.box.busy && this.idle >= this.nextIdle) {
      this.box.say(chiefLine('idle'));
      this.nextIdle = this.idle + IDLE_REPEAT;
    }
    this.box.update(dt, input);
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.box.render(ctx);
  }

  private speak(line: ReturnType<typeof chiefLine>): void {
    this.poke();
    this.nextIdle = IDLE_FIRST;
    this.box.say(line, true);
  }
}
