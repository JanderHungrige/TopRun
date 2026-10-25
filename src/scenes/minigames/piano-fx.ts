import { approach, clamp } from '../../core/math';
import type { Grade } from '../../game/minigames/piano';
import { CROWD_SLOTS, type CrowdView } from '../../render/minigames/piano-crowd';
import { HWY, LANE_COLORS, laneX } from '../../render/minigames/piano-highway';
import { POP_LIFE, SPARK_LIFE, type Pop, type Spark } from '../../render/minigames/piano-hud';
import { COLORS } from '../../render/text';

// Piano Bar (doc 23): what the round animates from the rules' events — key flashes, pops, sparks, the
// pilot's right hand, the crowd walking in / out, cheering, toasting and wincing, band toasts. Presentation only.

const GRADE_COLOR: Readonly<Record<Grade, string>> = { perfect: COLORS.gold, good: COLORS.cyan };

export class PianoFx {
  readonly press = [0, 0, 0, 0];
  readonly glow = [0, 0, 0, 0];
  readonly wrong = [0, 0, 0, 0];
  readonly presence: number[] = Array.from({ length: CROWD_SLOTS }, (_, i) => (i < 2 ? 1 : 0));
  pops: Pop[] = [];
  sparks: Spark[] = [];
  cheer = 0;
  toast = 0;
  wince = 0;
  strike = 0;
  lane = 1.5;
  bump = 0;
  banner: { text: string; age: number; good: boolean } | null = null;

  pressed(lanes: readonly boolean[]): void {
    lanes.forEach((on, i) => {
      if (on) this.press[i] = 1;
    });
  }

  hit(lane: number, grade: Grade, label: string): void {
    this.glow[lane] = 1;
    this.strike = 1;
    this.lane = lane;
    this.bump = 1;
    this.pop(label, GRADE_COLOR[grade], grade === 'perfect' ? 26 : 22);
    const color = LANE_COLORS[lane] ?? '#fff';
    for (let k = 0; k < (grade === 'perfect' ? 10 : 5); k++) {
      const a = -Math.PI * (0.15 + 0.7 * ((k * 0.618) % 1));
      const v = 140 + ((k * 53) % 120);
      this.sparks.push({ x: laneX(lane), y: HWY.hit - 6, vx: Math.cos(a) * v, vy: Math.sin(a) * v, age: 0, color: k % 3 === 0 ? '#fff6d0' : color });
    }
  }

  miss(lane: number, label: string, broke: number): void {
    this.pop(label, COLORS.red, 22);
    this.wrong[lane] = Math.max(this.wrong[lane] ?? 0, 0.5);
    if (broke >= 8) this.wince = 1;
  }

  wrongKey(lane: number, label: string, broke: number): void {
    this.wrong[lane] = 1;
    this.pop(label, COLORS.red, 18);
    if (broke >= 8) this.wince = 1;
  }

  say(text: string, good: boolean): void {
    this.banner = { text, age: 0, good };
  }

  /** One judgement at a time, centred over the keys; a new one replaces the last. */
  private pop(text: string, color: string, size: number): void {
    this.pops = [{ text, color, x: laneX(1.5), y: HWY.hit - 64, age: 0, size }];
  }

  /** Decays flashes, moves particles, walks the crowd towards `crowd` people, eases the cheer. */
  update(dt: number, crowd: number, cheer: number): void {
    for (const arr of [this.press, this.glow, this.wrong]) {
      arr.forEach((v, i) => {
        arr[i] = Math.max(0, v - dt * (arr === this.press ? 9 : 4));
      });
    }
    this.strike = Math.max(0, this.strike - dt * 7);
    this.bump = Math.max(0, this.bump - dt * 6);
    this.toast = Math.max(0, this.toast - dt * 1.1);
    this.wince = Math.max(0, this.wince - dt * 1.6);
    this.cheer = approach(this.cheer, clamp(cheer, 0, 1), dt * 1.5);
    this.presence.forEach((p, i) => {
      this.presence[i] = approach(p, i < crowd ? 1 : 0, dt * 0.9);
    });
    for (const p of this.pops) p.age += dt;
    this.pops = this.pops.filter((p) => p.age < POP_LIFE);
    for (const s of this.sparks) {
      s.age += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 600 * dt;
    }
    this.sparks = this.sparks.filter((s) => s.age < SPARK_LIFE);
    if (this.banner) {
      this.banner.age += dt;
      if (this.banner.age > 1.8) this.banner = null;
    }
  }

  crowdView(beat: number, groove: number, t: number): CrowdView {
    return { presence: this.presence, cheer: this.cheer, toast: this.toast, wince: this.wince, beat, groove, t };
  }
}
