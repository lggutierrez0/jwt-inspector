import type { Clock } from '@/application/ports/clock';

const TICK_MS = 1000;

/**
 * One timer for the whole panel (research R5): publishes `now` every second while the panel is
 * visible, so every countdown agrees and 200 rows cost a single interval.
 */
export class ClockTicker {
  readonly #clock: Clock;
  readonly #listeners = new Set<() => void>();
  #now: number;
  #timer: ReturnType<typeof setInterval> | undefined;

  constructor(clock: Clock) {
    this.#clock = clock;
    this.#now = clock.now();
  }

  readonly getSnapshot = (): number => this.#now;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    if (this.#listeners.size === 1) {
      document.addEventListener('visibilitychange', this.#onVisibilityChange);
      this.#start();
    }
    return () => {
      this.#listeners.delete(listener);
      if (this.#listeners.size === 0) {
        document.removeEventListener('visibilitychange', this.#onVisibilityChange);
        this.#stop();
      }
    };
  };

  readonly #onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this.#stop();
      return;
    }
    this.#publish();
    this.#start();
  };

  #start(): void {
    if (this.#timer !== undefined || document.visibilityState === 'hidden') return;
    this.#timer = setInterval(() => {
      this.#publish();
    }, TICK_MS);
  }

  #stop(): void {
    clearInterval(this.#timer);
    this.#timer = undefined;
  }

  #publish(): void {
    this.#now = this.#clock.now();
    for (const listener of this.#listeners) listener();
  }
}
