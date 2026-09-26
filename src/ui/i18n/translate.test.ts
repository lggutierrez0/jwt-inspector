import { createTranslator, type LocaleMessages } from './translate';

const messages: LocaleMessages = {
  greeting: { message: 'Hello' },
  withSub: { message: 'Hello $1, you have $2 messages' },
  price: { message: 'Costs $$5' },
  named: { message: 'Hi {name}, welcome to {place}' },
  plural2: { message: '$1 token | $1 tokens' },
  plural3: { message: 'No tokens | 1 token | $1 tokens' },
  dotted_key: { message: 'Found via underscore' },
};

describe('createTranslator (mirrors @wxt-dev/i18n createI18n().t)', () => {
  const t = createTranslator(messages);

  it('returns a plain message unchanged', () => {
    expect(t('greeting')).toBe('Hello');
  });

  it('substitutes positional placeholders from an array', () => {
    expect(t('withSub', ['Ada', '3'])).toBe('Hello Ada, you have 3 messages');
  });

  it('escapes $$ as a literal dollar sign', () => {
    expect(t('price')).toBe('Costs $5');
  });

  it('applies named substitutions', () => {
    expect(t('named', { name: 'Ada', place: 'Berlin' })).toBe('Hi Ada, welcome to Berlin');
  });

  it('resolves a dotted key against the underscore-joined message name', () => {
    expect(t('dotted.key')).toBe('Found via underscore');
  });

  it.each([
    [0, '0 tokens'],
    [1, '1 token'],
    [5, '5 tokens'],
  ])('splits a 2-way (singular/plural) message by count (count=%i)', (count, expected) => {
    expect(t('plural2', count)).toBe(expected);
  });

  it.each([
    [0, 'No tokens'],
    [1, '1 token'],
    [5, '5 tokens'],
  ])('splits a 3-way plural by count (count=%i)', (count, expected) => {
    expect(t('plural3', count)).toBe(expected);
  });

  it('a bare number without an explicit array also substitutes $1', () => {
    expect(t('plural2', 4)).toBe('4 tokens');
  });

  it('returns an empty string and warns on a missing key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {
      /* silence expected warning */
    });
    expect(t('missing')).toBe('');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('missing'));
    warn.mockRestore();
  });
});
