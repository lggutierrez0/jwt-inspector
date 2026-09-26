import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../tests/support/render';
import { MaskedValue } from './masked-value';

describe('MaskedValue (FR-015; US3 AS2, AS4)', () => {
  it('starts masked and does not render the secret', () => {
    renderWithProviders(<MaskedValue name="email" revealed="maria@example.test" />);

    expect(screen.getByText('[masked]')).toBeInTheDocument();
    expect(screen.queryByText('maria@example.test')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'reveal email' })).toBeInTheDocument();
  });

  it('reveals only on request and hides again', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MaskedValue name="email" revealed="maria@example.test" />);

    await user.click(screen.getByRole('button', { name: 'reveal email' }));
    expect(screen.getByText('maria@example.test')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('email revealed');

    await user.click(screen.getByRole('button', { name: 'hide email' }));
    expect(screen.queryByText('maria@example.test')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('email hidden');
  });

  it('is masked again after being unmounted and mounted', async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithProviders(
      <MaskedValue name="email" revealed="maria@example.test" />,
    );
    await user.click(screen.getByRole('button', { name: 'reveal email' }));
    unmount();

    renderWithProviders(<MaskedValue name="email" revealed="maria@example.test" />);

    expect(screen.queryByText('maria@example.test')).not.toBeInTheDocument();
  });

  it('can show a partially redacted preview while masked', () => {
    renderWithProviders(
      <MaskedValue name="credentials" revealed="full" concealed={<span>preview</span>} />,
    );

    expect(screen.getByText('preview')).toBeInTheDocument();
    expect(screen.queryByText('full')).not.toBeInTheDocument();
  });
});
