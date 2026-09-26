import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { TokenRecord } from '@/domain/vault/token-record';

import { expired3d, expiringIn30s, NOW, valid1h } from '../../../tests/fixtures/tokens';
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

type Outcome = { ok: true } | { ok: false; message: string };

function handlers(outcome?: Outcome) {
  const result: Outcome = outcome ?? { ok: true };
  return {
    onOpen: vi.fn<(id: string, listScroll: number) => void>(),
    onAdd: vi.fn<() => void>(),
    onClearAll: vi.fn<() => Promise<Outcome>>().mockResolvedValue(result),
    onClearExpired: vi.fn<() => Promise<Outcome>>().mockResolvedValue(result),
  };
}

function show(tokens: readonly TokenRecord[], clock = new FixedClock(NOW), outcome?: Outcome) {
  const props = handlers(outcome);
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

  it('explains the tool and offers to add a token when empty (FR-012)', async () => {
    const user = userEvent.setup();
    const { onAdd } = show([]);

    expect(screen.getByText(/Paste a JWT to see who issued it/u)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'add token' }));

    expect(onAdd).toHaveBeenCalledOnce();
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

  describe('toolbar (US4)', () => {
    it('offers clearing expired tokens only when there are some (FR-023)', () => {
      show([record('a', valid1h, 'Live')]);

      expect(screen.queryByRole('button', { name: 'clear expired' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'clear all' })).toBeInTheDocument();
    });

    it('clears expired tokens after confirming how many (US4 AS7)', async () => {
      const user = userEvent.setup();
      const { onClearExpired } = show([
        record('a', valid1h, 'Live'),
        record('b', expired3d, 'Old'),
      ]);

      await user.click(screen.getByRole('button', { name: 'clear expired' }));
      expect(screen.getByRole('dialog', { name: 'Remove 1 expired token?' })).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'remove' }));

      expect(onClearExpired).toHaveBeenCalledOnce();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('clears all tokens only after confirming the count (FR-019)', async () => {
      const user = userEvent.setup();
      const { onClearAll } = show([record('a', valid1h, 'A'), record('b', expired3d, 'B')]);

      await user.click(screen.getByRole('button', { name: 'clear all' }));
      expect(screen.getByRole('dialog', { name: 'Remove 2 tokens?' })).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'cancel' }));
      expect(onClearAll).not.toHaveBeenCalled();

      await user.click(screen.getByRole('button', { name: 'clear all' }));
      await user.click(screen.getByRole('button', { name: 'remove' }));
      expect(onClearAll).toHaveBeenCalledOnce();
    });

    it('explains a storage failure', async () => {
      const user = userEvent.setup();
      show([record('a', valid1h, 'A')], new FixedClock(NOW), { ok: false, message: 'Nope.' });

      await user.click(screen.getByRole('button', { name: 'clear all' }));
      await user.click(screen.getByRole('button', { name: 'remove' }));

      expect(screen.getByRole('alert')).toHaveTextContent('Nope.');
    });
  });
});
