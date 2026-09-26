import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { valid1h } from '../../tests/fixtures/tokens';
import { InMemoryVaultRepository } from '../../tests/support/in-memory-ports';
import { renderWithProviders } from '../../tests/support/render';
import { AppShell } from './app-shell';

describe('AppShell', () => {
  it('shows the product name as the main heading', () => {
    renderWithProviders(<AppShell version="1.2.3" />);

    expect(screen.getByRole('heading', { level: 1, name: 'JWT Inspector' })).toBeInTheDocument();
  });

  it('shows the running version so users can report issues precisely (FR-024)', () => {
    renderWithProviders(<AppShell version="1.2.3" />);

    expect(screen.getByText('v1.2.3')).toBeInTheDocument();
  });

  it('shows a skeleton, not a spinner, while the vault loads', () => {
    const repository = new InMemoryVaultRepository();
    vi.spyOn(repository, 'load').mockReturnValue(
      new Promise(() => {
        // Never settles: the vault stays loading for this test.
      }),
    );
    renderWithProviders(<AppShell version="1.2.3" />, { repository });

    expect(screen.getByRole('status', { name: 'Loading tokens' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('explains when the vault cannot be read', async () => {
    const repository = new InMemoryVaultRepository();
    vi.spyOn(repository, 'load').mockRejectedValue(new Error('broken'));
    renderWithProviders(<AppShell version="1.2.3" />, { repository });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent("Saved tokens couldn't be read.");
    });
  });

  it('removes the skeleton once the vault is ready', async () => {
    renderWithProviders(<AppShell version="1.2.3" />);

    await waitFor(() => {
      expect(screen.queryByRole('status', { name: 'Loading tokens' })).not.toBeInTheDocument();
    });
  });

  it('adds a token from the header command and opens its detail', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppShell version="1.2.3" />);

    await user.click(await screen.findByRole('button', { name: 'add token' }));
    await user.click(screen.getByRole('textbox', { name: 'Token' }));
    await user.paste(valid1h);
    await user.keyboard('{Enter}');

    expect(await screen.findByText('1 h left')).toBeInTheDocument();
  });

  it('returns from add and detail with their commands', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppShell version="1.2.3" />);
    await user.click(await screen.findByRole('button', { name: 'add token' }));

    await user.click(screen.getByRole('button', { name: 'cancel' }));
    expect(screen.queryByRole('textbox', { name: 'Token' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'add token' }));
    await user.click(screen.getByRole('textbox', { name: 'Token' }));
    await user.paste(valid1h);
    await user.keyboard('{Enter}');
    await user.click(await screen.findByRole('button', { name: 'back' }));
    expect(screen.queryByRole('region', { name: 'Token summary' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Saved tokens' })).toBeInTheDocument();
  });

  it('leaves a detail whose token another panel removed (FR-022)', async () => {
    const user = userEvent.setup();
    const repository = new InMemoryVaultRepository();
    renderWithProviders(<AppShell version="1.2.3" />, { repository });
    await user.click(await screen.findByRole('button', { name: 'add token' }));
    await user.click(screen.getByRole('textbox', { name: 'Token' }));
    await user.paste(valid1h);
    await user.keyboard('{Enter}');
    await screen.findByText('1 h left');

    act(() => {
      repository.externalWrite({ tokens: [] });
    });

    await waitFor(() => {
      expect(screen.queryByRole('region', { name: 'Token summary' })).not.toBeInTheDocument();
    });
  });

  it('stays on the new token when the storage change event arrives after saving', async () => {
    const user = userEvent.setup();
    const repository = new InMemoryVaultRepository();
    repository.deferNotifications = true;
    renderWithProviders(<AppShell version="1.2.3" />, { repository });
    await user.click(await screen.findByRole('button', { name: 'add token' }));
    await user.click(screen.getByRole('textbox', { name: 'Token' }));
    await user.paste(valid1h);
    await user.keyboard('{Enter}');

    expect(await screen.findByText('1 h left')).toBeInTheDocument();
  });

  it('shows the index of saved tokens once loaded', async () => {
    const repository = new InMemoryVaultRepository({
      tokens: [
        {
          id: 'a',
          raw: valid1h,
          kind: 'jws',
          label: 'Session',
          source: { kind: 'manual' },
          addedAt: 0,
        },
      ],
    });
    renderWithProviders(<AppShell version="1.2.3" />, { repository });

    expect(await screen.findByRole('button', { name: /Session/u })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'add token' })).toBeInTheDocument();
  });

  it('offers adding exactly once when the vault is empty', async () => {
    renderWithProviders(<AppShell version="1.2.3" />);

    await screen.findByText('No tokens yet');
    expect(screen.getAllByRole('button', { name: 'add token' })).toHaveLength(1);
  });

  it('restores the list scroll position after visiting a detail', async () => {
    const user = userEvent.setup();
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {
      // jsdom-like environments do not scroll.
    });
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 180 });
    const repository = new InMemoryVaultRepository({
      tokens: [
        {
          id: 'a',
          raw: valid1h,
          kind: 'jws',
          label: 'Session',
          source: { kind: 'manual' },
          addedAt: 0,
        },
      ],
    });
    renderWithProviders(<AppShell version="1.2.3" />, { repository });

    await user.click(await screen.findByRole('button', { name: /Session/u }));
    await user.click(screen.getByRole('button', { name: 'back' }));

    expect(scrollTo).toHaveBeenLastCalledWith(0, 180);
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  });
});
