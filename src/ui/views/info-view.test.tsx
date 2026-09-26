import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../tests/support/render';
import { InfoView } from './info-view';

describe('InfoView (US5 AS3, FR-028)', () => {
  it('focuses its heading on open (WCAG 2.4.3)', () => {
    renderWithProviders(<InfoView version="1.2.3" onBack={vi.fn<() => void>()} />);

    expect(screen.getByRole('heading', { level: 2, name: 'About JWT Inspector' })).toHaveFocus();
  });

  it('explains the purpose, what is stored, and what is not', () => {
    renderWithProviders(<InfoView version="1.2.3" onBack={vi.fn<() => void>()} />);

    expect(screen.getByText(/decodes, inspects and helps you manage/u)).toBeInTheDocument();
    expect(
      screen.getByText('Tokens you add and their labels, saved to this browser profile only.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/No network access, no analytics/u)).toBeInTheDocument();
  });

  it('shows the current version', () => {
    renderWithProviders(<InfoView version="1.2.3" onBack={vi.fn<() => void>()} />);

    expect(screen.getByText('Version 1.2.3')).toBeInTheDocument();
  });

  it('summarizes what is built versus planned', () => {
    renderWithProviders(<InfoView version="1.2.3" onBack={vi.fn<() => void>()} />);

    expect(screen.getByText(/^Built:/u)).toBeInTheDocument();
    expect(screen.getByText(/^Planned:/u)).toBeInTheDocument();
  });

  it('calls onBack when back is chosen', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn<() => void>();
    renderWithProviders(<InfoView version="1.2.3" onBack={onBack} />);

    await user.click(screen.getByRole('button', { name: 'back' }));

    expect(onBack).toHaveBeenCalledOnce();
  });
});
