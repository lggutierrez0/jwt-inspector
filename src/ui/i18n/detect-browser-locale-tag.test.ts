import { installLocale } from '../../../tests/support/i18n';
import { detectBrowserLocaleTag } from './i18n-context';

describe('detectBrowserLocaleTag', () => {
  it('reads the locale the messages were resolved in, not the raw UI language', async () => {
    await installLocale('es');

    expect(detectBrowserLocaleTag()).toBe('es');
  });

  it('falls back to getUILanguage when @@ui_locale is empty (as in the fake browser)', async () => {
    await installLocale('en');
    const { fakeBrowser } = await import('wxt/testing/fake-browser');
    vi.spyOn(fakeBrowser.i18n, 'getMessage').mockReturnValue('');
    vi.spyOn(fakeBrowser.i18n, 'getUILanguage').mockReturnValue('fr-FR');

    expect(detectBrowserLocaleTag()).toBe('fr-FR');
  });
});
