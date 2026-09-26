import { createI18n } from '@wxt-dev/i18n';

import { installLocale } from './i18n';

describe('test i18n backing', () => {
  it('serves the real English messages through the production translator', () => {
    expect(createI18n().t('extName')).toBe('JWT Inspector');
  });

  it('switches to Spanish', async () => {
    await installLocale('es');
    expect(createI18n().t('extDescription')).toMatch(/^Detecta/u);
  });
});
