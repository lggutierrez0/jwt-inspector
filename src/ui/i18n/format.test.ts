import { formatAbsolute, formatDuration, formatRelative } from './format';

const NOW = Date.UTC(2026, 8, 26, 12, 0, 0);
const MIN = 60_000;
const H = 60 * MIN;
const D = 24 * H;

describe('formatRelative', () => {
  it.each([
    ['en', NOW + 2 * H, 'in 2 hours'],
    ['en', NOW - 3 * D, '3 days ago'],
    ['en', NOW + 45_000, 'in 45 seconds'],
    ['en', NOW - 10 * MIN, '10 minutes ago'],
    ['es', NOW - 3 * D, 'hace 3 días'],
    ['es', NOW + 2 * H, 'dentro de 2 horas'],
  ] as const)('%s: %d -> %s', (locale, target, expected) => {
    expect(formatRelative(target, NOW, locale)).toBe(expected);
  });
});

describe('formatAbsolute', () => {
  it('shows date, time and the time zone name (FR-013)', () => {
    const text = formatAbsolute(NOW, 'en');

    expect(text).toContain('2026');
    expect(text).toContain('12:00');
    expect(text).toContain('UTC');
  });

  it('localizes the month', () => {
    expect(formatAbsolute(NOW, 'es')).toContain('sept');
  });
});

describe('formatDuration', () => {
  it.each(['en', 'es'] as const)('joins the parts with unit symbols (%s)', (locale) => {
    expect(
      formatDuration(
        [
          { value: 2, unit: 'h' },
          { value: 14, unit: 'min' },
        ],
        locale,
      ),
    ).toBe('2 h 14 min');
  });

  it('groups large numbers per locale', () => {
    expect(formatDuration([{ value: 1200, unit: 'd' }], 'en')).toBe('1,200 d');
  });
});
