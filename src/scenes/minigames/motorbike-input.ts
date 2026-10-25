import type { Input } from '../../core/input';
import type { Lean } from '../../game/minigames/motorbike-bike';
import type { RideInput } from '../../game/minigames/motorbike';

// Motorbike vs. Jet (doc 22): keys, gamepad, joystick throttle and touch → one RideInput per tick.
// Shift = E / pad Y, or ↑ pressed while another throttle is held, or ↑ re-tapped within RETAP s of letting go.
// Touch: hold the right half = throttle; on the left a short tap shifts, a hold brakes; a sideways swipe leans.

const LEFT = { x: 0, y: 56, w: 640, h: 664 };
const RIGHT = { x: 640, y: 56, w: 640, h: 664 };
const RETAP = 0.35;
const HOLD = 0.25;
const SWIPE = 30;

interface Touch {
  t: number;
  dx: number;
}

export class RideReader {
  private sinceUp = 99;
  private upHeld = false;
  private left: Touch | null = null;
  private right: Touch | null = null;

  private track(input: Input, region: typeof LEFT, prev: Touch | null, dt: number): Touch | null {
    if (!input.touchingIn(region)) return null;
    const t = prev ?? { t: 0, dx: 0 };
    return { t: t.t + dt, dx: t.dx + input.dragDelta(region).x };
  }

  private swipe(): Lean {
    for (const s of [this.left, this.right]) {
      if (s && Math.abs(s.dx) >= SWIPE) return s.dx < 0 ? -1 : 1;
    }
    return 0;
  }

  read(input: Input, dt: number): RideInput {
    const lastLeft = this.left;
    this.left = this.track(input, LEFT, this.left, dt);
    this.right = this.track(input, RIGHT, this.right, dt);
    const tapped = lastLeft !== null && this.left === null && lastLeft.t < HOLD && Math.abs(lastLeft.dx) < SWIPE;
    const touchBrake = this.left !== null && this.left.t >= HOLD && Math.abs(this.left.dx) < SWIPE;
    const lever = input.throttle ?? 0;
    const other = input.held('fire') || lever > 0.1 || this.right !== null;
    const up = input.held('up');
    if (this.upHeld && !up) this.sinceUp = 0;
    const retap = input.pressed('up') && this.sinceUp < RETAP;
    this.sinceUp += dt;
    this.upHeld = up;
    const keys = input.held('fire') || up || this.right !== null ? 1 : 0;
    const mx = input.moveVector().x;
    const lean: Lean = mx < -0.5 ? -1 : mx > 0.5 ? 1 : this.swipe();
    return {
      throttle: Math.max(keys, lever),
      brake: input.held('down') || touchBrake,
      lean,
      shift: input.pressed('special') || (input.pressed('up') && other) || retap || tapped,
    };
  }
}
