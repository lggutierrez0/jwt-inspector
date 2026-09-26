import path from 'node:path';

import { generateChromeMessages, parseMessagesFile } from '@wxt-dev/i18n/build';
import { fakeBrowser } from 'wxt/testing/fake-browser';

export type TestLocale = 'en' | 'es';

const cache = new Map<TestLocale, Record<string, { message: string }>>();

async function loadMessages(locale: TestLocale) {
  const cached = cache.get(locale);
  if (cached) return cached;
  const file = path.resolve(import.meta.dirname, `../../src/locales/${locale}.yml`);
  const messages = generateChromeMessages(await parseMessagesFile(file));
  cache.set(locale, messages);
  return messages;
}

/** Chrome `getMessage` semantics: `$1`–`$9` substitutions, `$$` escapes a dollar sign. */
function substitute(message: string, subs: readonly string[]): string {
  return message.replaceAll(/\$(\$|[1-9])/gu, (_match, token: string) =>
    token === '$' ? '$' : (subs[Number(token) - 1] ?? ''),
  );
}

/**
 * Backs the WXT fake browser's `i18n` with the real locale files, compiled exactly like the
 * build does, so tests exercise the production `createI18n().t` against real copy.
 */
export async function installLocale(locale: TestLocale = 'en'): Promise<void> {
  const messages = await loadMessages(locale);
  vi.spyOn(fakeBrowser.i18n, 'getMessage').mockImplementation(
    (name: string, subs?: string | readonly (string | number)[]) => {
      const entry = messages[name];
      if (entry === undefined) return '';
      const list =
        subs === undefined ? [] : Array.isArray(subs) ? subs.map(String) : [String(subs)];
      return substitute(entry.message, list);
    },
  );
  vi.spyOn(fakeBrowser.i18n, 'getUILanguage').mockReturnValue(locale);
}
