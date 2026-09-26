import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { describeClaim, describeHeaderParameter } from '@/domain/claims/claim-catalog';

import { renderWithProviders } from '../../../tests/support/render';
import { ClaimEntry } from './claim-entry';

describe('ClaimEntry (FR-014)', () => {
  it('shows a registered claim with its title, summary, value and citation', () => {
    renderWithProviders(
      <ClaimEntry name="aud" value="api" info={describeClaim('aud')} part="payload" />,
    );

    expect(screen.getByText('"aud"')).toBeInTheDocument();
    expect(screen.getByText('Audience')).toBeInTheDocument();
    expect(screen.getByText('Who the token is meant for.')).toBeInTheDocument();
    expect(screen.getByText('api')).toBeInTheDocument();
    expect(screen.getByText('RFC 7519, Section 4.1.3')).toBeInTheDocument();
  });

  it('explains header parameters with their RFC 7515 citation', () => {
    renderWithProviders(
      <ClaimEntry name="alg" value="HS256" info={describeHeaderParameter('alg')} part="header" />,
    );

    expect(screen.getByText('Algorithm')).toBeInTheDocument();
    expect(screen.getByText('RFC 7515, Section 4.1.1')).toBeInTheDocument();
  });

  it('shows a custom claim with name and value only', () => {
    renderWithProviders(
      <ClaimEntry
        name="roles"
        value={['admin', 'ops']}
        info={describeClaim('roles')}
        part="payload"
      />,
    );

    expect(screen.getByText('"roles"')).toBeInTheDocument();
    expect(screen.getByText('["admin","ops"]')).toBeInTheDocument();
    expect(screen.queryByText(/RFC/u)).not.toBeInTheDocument();
  });

  it.each([
    [null, 'null'],
    [true, 'true'],
    [42.5, '42.5'],
    ['Zoë 李雷 🔐', 'Zoë 李雷 🔐'],
    [{ a: { b: [1] } }, '{"a":{"b":[1]}}'],
  ])('renders %j faithfully', (value, text) => {
    renderWithProviders(
      <ClaimEntry name="x" value={value} info={{ kind: 'custom' }} part="payload" />,
    );

    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('masks a sensitive claim until revealed', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ClaimEntry
        name="email"
        value="maria@example.test"
        info={describeClaim('email')}
        part="payload"
      />,
    );

    expect(screen.queryByText('maria@example.test')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'reveal email' }));
    expect(screen.getByText('maria@example.test')).toBeInTheDocument();
  });

  it('masks only the sensitive members of a nested value', () => {
    renderWithProviders(
      <ClaimEntry
        name="credentials"
        value={{ apiKey: 'k-123', scope: 'read' }}
        info={{ kind: 'custom' }}
        part="payload"
      />,
    );

    expect(screen.queryByText(/k-123/u)).not.toBeInTheDocument();
    expect(screen.getByText(/"scope":"read"/u)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'reveal credentials' })).toBeInTheDocument();
  });
});
