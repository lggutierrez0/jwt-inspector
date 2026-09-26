import { FixedClock } from '../../../tests/support/in-memory-ports';
import { ClockTicker } from './clock-ticker';

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('ClockTicker (research R5)', () => {
  let clock: FixedClock;
  let ticker: ClockTicker;

  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility('visible');
    clock = new FixedClock(1000);
    ticker = new ClockTicker(clock);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exposes the current time as a snapshot', () => {
    expect(ticker.getSnapshot()).toBe(1000);
  });

  it('publishes every second to every subscriber through one timer', () => {
    const first = vi.fn<() => void>();
    const second = vi.fn<() => void>();
    ticker.subscribe(first);
    ticker.subscribe(second);

    clock.current = 2000;
    vi.advanceTimersByTime(1000);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(ticker.getSnapshot()).toBe(2000);
    expect(vi.getTimerCount()).toBe(1);
  });

  it('pauses while the panel is hidden and publishes immediately when visible again', () => {
    const listener = vi.fn<() => void>();
    ticker.subscribe(listener);

    setVisibility('hidden');
    vi.advanceTimersByTime(5000);
    expect(listener).not.toHaveBeenCalled();

    clock.current = 9000;
    setVisibility('visible');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(ticker.getSnapshot()).toBe(9000);

    vi.advanceTimersByTime(1000);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('stops the timer when the last subscriber leaves', () => {
    const unsubscribeA = ticker.subscribe(vi.fn<() => void>());
    const unsubscribeB = ticker.subscribe(vi.fn<() => void>());

    unsubscribeA();
    expect(vi.getTimerCount()).toBe(1);
    unsubscribeB();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not tick without subscribers', () => {
    expect(vi.getTimerCount()).toBe(0);
  });
});
