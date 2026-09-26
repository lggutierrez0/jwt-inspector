import { screen, waitFor } from '@testing-library/react';

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
});
