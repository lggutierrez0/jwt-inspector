import { render, screen } from '@testing-library/react';

import { AppShell } from './app-shell';

describe('AppShell', () => {
  it('shows the product name as the main heading', () => {
    render(<AppShell version="1.2.3" />);

    expect(screen.getByRole('heading', { level: 1, name: 'JWT Inspector' })).toBeInTheDocument();
  });

  it('shows the running version so users can report issues precisely', () => {
    render(<AppShell version="1.2.3" />);

    expect(screen.getByText('v1.2.3')).toBeInTheDocument();
  });
});
