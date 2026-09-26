import { normalizeTokenInput } from './normalize';

describe('normalizeTokenInput (FR-002)', () => {
  it('trims surrounding whitespace and newlines', () => {
    expect(normalizeTokenInput('  \n\ta.b.c \n')).toBe('a.b.c');
  });

  it.each(['Bearer a.b.c', 'bearer a.b.c', 'BEARER a.b.c', 'Bearer    a.b.c'])(
    'strips a leading Bearer prefix case-insensitively: %j',
    (input) => {
      expect(normalizeTokenInput(input)).toBe('a.b.c');
    },
  );

  it('trims again after removing the prefix', () => {
    expect(normalizeTokenInput('  Bearer \n a.b.c  ')).toBe('a.b.c');
  });

  it('leaves inner content untouched', () => {
    expect(normalizeTokenInput('a.Bearer.c')).toBe('a.Bearer.c');
  });

  it('does not strip a word that only starts with Bearer', () => {
    expect(normalizeTokenInput('Bearerx.y.z')).toBe('Bearerx.y.z');
  });
});
