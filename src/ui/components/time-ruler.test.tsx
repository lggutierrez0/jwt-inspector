import { screen } from '@testing-library/react';

import { NOW } from '../../../tests/fixtures/tokens';
import { renderWithProviders } from '../../../tests/support/render';
import { TimeRuler } from './time-ruler';

const H = 3_600_000;
const life = { kind: 'known', start: NOW - 2 * H, end: NOW + H, total: 3 * H } as const;

describe('TimeRuler (DESIGN.md "Time ruler")', () => {
  it('draws a graticule of ten equal divisions', () => {
    const { container } = renderWithProviders(<TimeRuler lifetime={life} now={NOW} />);

    expect(container.querySelectorAll('[data-division]')).toHaveLength(10);
  });

  it('places the now mark at the consumed portion of the lifetime', () => {
    renderWithProviders(<TimeRuler lifetime={life} now={NOW} />);

    const mark = screen.getByTestId('now-mark');
    expect(mark).toHaveStyle({ left: '66.67%' });
    expect(mark).toHaveAttribute('data-position', 'within');
  });

  it('pins the mark to the start before the lifetime begins', () => {
    renderWithProviders(<TimeRuler lifetime={life} now={life.start - H} />);

    expect(screen.getByTestId('now-mark')).toHaveAttribute('data-position', 'before');
    expect(screen.getByTestId('now-mark')).toHaveStyle({ left: '0%' });
  });

  it('pins the mark to the end after expiry', () => {
    renderWithProviders(<TimeRuler lifetime={life} now={life.end + H} />);

    expect(screen.getByTestId('now-mark')).toHaveAttribute('data-position', 'after');
    expect(screen.getByTestId('now-mark')).toHaveStyle({ left: '100%' });
  });

  it('labels both ends with absolute local times and a time zone', () => {
    renderWithProviders(<TimeRuler lifetime={life} now={NOW} />);

    expect(screen.getAllByText(/UTC/u)).toHaveLength(2);
  });

  it('summarizes itself for assistive technology', () => {
    renderWithProviders(<TimeRuler lifetime={life} now={NOW} />);

    expect(
      screen.getByRole('figure', { name: /Lifetime from .+ to .+\. Now at 67 percent\./u }),
    ).toBeInTheDocument();
  });
});
