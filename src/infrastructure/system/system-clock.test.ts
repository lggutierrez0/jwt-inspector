import { SystemClock } from './system-clock';

describe('SystemClock', () => {
  it('reads the current wall-clock time', () => {
    vi.useFakeTimers({ now: 1_790_000_000_000 });

    expect(new SystemClock().now()).toBe(1_790_000_000_000);

    vi.useRealTimers();
  });
});
