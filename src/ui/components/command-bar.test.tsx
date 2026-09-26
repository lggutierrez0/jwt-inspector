import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { TokenRecord } from '@/domain/vault/token-record';

import { expired3d, NOW, valid1h } from '../../../tests/fixtures/tokens';
import { FixedClock } from '../../../tests/support/in-memory-ports';
import { renderWithProviders, type I18nOverrides } from '../../../tests/support/render';
import { CommandBar } from './command-bar';

const record = (id: string, raw: string): TokenRecord => ({
  id,
  raw,
  kind: 'jws',
  label: id,
  source: { kind: 'manual' },
  addedAt: 0,
});

type Outcome = { ok: true } | { ok: false; message: string };

function handlers(outcome?: Outcome) {
  const result: Outcome = outcome ?? { ok: true };
  return {
    onAdd: vi.fn<() => void>(),
    onInfo: vi.fn<() => void>(),
    onClearAll: vi.fn<() => Promise<Outcome>>().mockResolvedValue(result),
    onClearExpired: vi.fn<() => Promise<Outcome>>().mockResolvedValue(result),
  };
}

function show(
  tokens: readonly TokenRecord[],
  screenName: 'list' | 'add' | 'detail' | 'info' = 'list',
  outcome?: Outcome,
  i18n?: I18nOverrides,
) {
  const props = handlers(outcome);
  const view = renderWithProviders(
    <CommandBar screen={screenName} tokens={tokens} {...props} />,
    { clock: new FixedClock(NOW) },
    { i18n },
  );
  return { ...view, ...props };
}

describe('CommandBar (FR-027)', () => {
  it('offers add token, no clear commands, and info with an empty vault', () => {
    show([]);

    expect(screen.getByRole('button', { name: 'add token' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'clear expired' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'clear all' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'info' })).toBeInTheDocument();
  });

  it('omits "add token" on the add screen (US5 AS2)', () => {
    show([], 'add');

    expect(screen.queryByRole('button', { name: 'add token' })).not.toBeInTheDocument();
  });

  it('omits "info" on the info screen (US5 AS2)', () => {
    show([], 'info');

    expect(screen.queryByRole('button', { name: 'info' })).not.toBeInTheDocument();
  });

  it('calls onAdd when chosen', async () => {
    const user = userEvent.setup();
    const { onAdd } = show([]);

    await user.click(screen.getByRole('button', { name: 'add token' }));

    expect(onAdd).toHaveBeenCalledOnce();
  });

  it('calls onInfo when chosen', async () => {
    const user = userEvent.setup();
    const { onInfo } = show([], 'list');

    await user.click(screen.getByRole('button', { name: 'info' }));

    expect(onInfo).toHaveBeenCalledOnce();
  });

  it('offers clearing expired tokens only when there are some (FR-023)', () => {
    show([record('a', valid1h)]);

    expect(screen.queryByRole('button', { name: 'clear expired' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'clear all' })).toBeInTheDocument();
  });

  it('clears expired tokens after confirming how many (US4 AS7)', async () => {
    const user = userEvent.setup();
    const { onClearExpired } = show([record('a', valid1h), record('b', expired3d)]);

    await user.click(screen.getByRole('button', { name: 'clear expired' }));
    expect(screen.getByRole('dialog', { name: 'Remove 1 expired token?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'remove' }));

    expect(onClearExpired).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('clears all tokens only after confirming the count (FR-019)', async () => {
    const user = userEvent.setup();
    const { onClearAll } = show([record('a', valid1h), record('b', expired3d)]);

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
    show([record('a', valid1h)], 'list', { ok: false, message: 'Nope.' });

    await user.click(screen.getByRole('button', { name: 'clear all' }));
    await user.click(screen.getByRole('button', { name: 'remove' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Nope.');
  });

  it('shows the current language and its accessible name names the language switched to', () => {
    show([], 'list', undefined, { locale: 'en' });

    expect(screen.getByRole('button', { name: 'Switch to Spanish' })).toHaveTextContent('EN');
  });

  it('switches the language when chosen', async () => {
    const user = userEvent.setup();
    const setLocale = vi.fn<(locale: 'en' | 'es' | null) => void>();
    show([], 'list', undefined, { locale: 'en', setLocale });

    await user.click(screen.getByRole('button', { name: 'Switch to Spanish' }));

    expect(setLocale).toHaveBeenCalledWith('es');
  });
});
