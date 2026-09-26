import { installLocale } from '../../../tests/support/i18n';
import { createBrowserI18n } from './i18n-context';

describe('createBrowserI18n', () => {
  it('formats with the same locale the messages come from, not the UI language', async () => {
    await installLocale('es');

    const { t, locale } = createBrowserI18n();

    expect(t('add.submit')).toBe('agregar token');
    expect(locale).toBe('es');
  });

  it('turns Chrome locale codes into BCP 47 tags', async () => {
    await installLocale('en');

    expect(createBrowserI18n().locale).toBe('en');
  });
});
