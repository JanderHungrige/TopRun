/** Fixed-timestep accumulator with a spiral-of-death guard. */
export class FixedStepper {
  readonly step: number;
  readonly maxSteps: number;
  private acc = 0;

  constructor(step = 1 / 60, maxSteps = 5) {
    this.step = step;
    this.maxSteps = maxSteps;
  }

  /** Adds elapsed seconds and returns how many fixed updates to run now. */
  advance(elapsed: number): number {
    this.acc += Math.max(0, elapsed);
    let steps = Math.floor(this.acc / this.step + 1e-9);
    if (steps > this.maxSteps) {
      steps = this.maxSteps;
      this.acc = 0;
      return steps;
    }
    this.acc -= steps * this.step;
    return steps;
  }

  reset(): void {
    this.acc = 0;
  }
}

export interface LoopHandlers {
  update(dt: number): void;
  render(): void;
}

export function startLoop(handlers: LoopHandlers, stepper = new FixedStepper()): void {
  let last = performance.now();
  const frame = (now: number): void => {
    const elapsed = (now - last) / 1000;
    last = now;
    const steps = stepper.advance(elapsed);
    for (let i = 0; i < steps; i++) handlers.update(stepper.step);
    handlers.render();
    requestAnimationFrame(frame);
  };
  document.addEventListener('visibilitychange', () => {
    last = performance.now();
    stepper.reset();
  });
  requestAnimationFrame(frame);
}
