import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { TokenRecord } from '@/domain/vault/token-record';

import { expiringIn30s, NOW, valid1h } from '../../../tests/fixtures/tokens';
import { FixedClock } from '../../../tests/support/in-memory-ports';
import { renderWithProviders } from '../../../tests/support/render';
import { ListView } from './list-view';

const record = (id: string, raw: string, label: string): TokenRecord => ({
  id,
  raw,
  kind: 'jws',
  label,
  source: { kind: 'manual' },
  addedAt: 0,
});

function handlers() {
  return { onOpen: vi.fn<(id: string, listScroll: number) => void>() };
}

function show(tokens: readonly TokenRecord[], clock = new FixedClock(NOW)) {
  const props = handlers();
  const view = renderWithProviders(<ListView tokens={tokens} initialScroll={0} {...props} />, {
    clock,
  });
  return { ...view, ...props };
}

describe('ListView (US2)', () => {
  it('keeps the vault order, most recently added first (FR-007)', () => {
    show([record('b', valid1h, 'Newest'), record('a', expiringIn30s, 'Oldest')]);

    const names = within(screen.getByRole('list'))
      .getAllByRole('button')
      .map((button) => button.textContent);
    expect(names[0]).toContain('Newest');
    expect(names[1]).toContain('Oldest');
  });

  it('shows how many tokens are listed', () => {
    show([record('b', valid1h, 'A'), record('a', expiringIn30s, 'B')]);

    expect(screen.getByText('2 tokens')).toBeInTheDocument();
  });

  it('updates time left every second and flips to Expired at exp (FR-010, SC-007)', () => {
    vi.useFakeTimers();
    const clock = new FixedClock(NOW);
    show([record('a', expiringIn30s, 'Soon')], clock);
    expect(screen.getByText('30 s left')).toBeInTheDocument();

    clock.current = NOW + 29_000;
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('1 s left')).toBeInTheDocument();

    clock.current = NOW + 30_000;
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('Expired')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('explains the tool when empty; adding is offered by the persistent command bar (FR-012)', () => {
    show([]);

    expect(screen.getByText(/Paste a JWT to see who issued it/u)).toBeInTheDocument();
  });

  it('opens a token by click or Enter, reporting the scroll position', async () => {
    const user = userEvent.setup();
    const { onOpen } = show([record('a', valid1h, 'Session')]);

    await user.click(screen.getByRole('button', { name: /Session/u }));
    expect(onOpen).toHaveBeenLastCalledWith('a', 0);

    screen.getByRole('button', { name: /Session/u }).focus();
    await user.keyboard('{Enter}');
    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  it('restores the remembered scroll position when shown again', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {
      // jsdom-like environments do not scroll.
    });
    renderWithProviders(
      <ListView tokens={[record('a', valid1h, 'Session')]} initialScroll={240} {...handlers()} />,
    );

    expect(scrollTo).toHaveBeenCalledWith(0, 240);
  });
});
