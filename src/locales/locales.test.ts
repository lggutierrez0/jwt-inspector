import { readFileSync } from 'node:fs';
import path from 'node:path';

import { parseMessagesFile } from '@wxt-dev/i18n/build';

const LOCALES_DIR = path.resolve(import.meta.dirname);

async function messages(locale: string) {
  const parsed = await parseMessagesFile(path.join(LOCALES_DIR, `${locale}.yml`));
  return new Map(
    parsed.map((message) => [
      message.key.join('.'),
      message.type === 'plural' ? Object.values(message.plurals).join(' | ') : message.message,
    ]),
  );
}

const isBadCopy = ([, text]: [string, string]) =>
  text.trim().length === 0 || /[\u2013\u2014]/u.test(text);

describe('locales (FR-025)', () => {
  it('English and Spanish define exactly the same keys', async () => {
    const [en, es] = await Promise.all([messages('en'), messages('es')]);

    expect([...es.keys()].toSorted()).toEqual([...en.keys()].toSorted());
  });

  it.each(['en', 'es'])(
    '%s has no empty messages and no em or en dashes (copy voice)',
    async (locale) => {
      const offending = [...(await messages(locale))].filter((entry) => isBadCopy(entry));

      expect(offending).toEqual([]);
    },
  );

  it('English is the declared fallback locale', () => {
    const config = readFileSync(path.resolve(LOCALES_DIR, '../../wxt.config.ts'), 'utf8');

    expect(config).toMatch(/default_locale: 'en'/u);
  });
});
