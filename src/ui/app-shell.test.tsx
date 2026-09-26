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
    expect(screen.queryByText('1 h left')).not.toBeInTheDocument();
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
      expect(screen.queryByText('1 h left')).not.toBeInTheDocument();
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
});
